
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { tags } from "@/data/mockData";
import { X, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchQuestions, saveQuestion } from "@/api/questions";

const AskQuestion = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: questions } = useQuery({
    queryKey: ['questions'],
    queryFn: () => fetchQuestions(),
  });

  const mutation = useMutation({
    mutationFn: saveQuestion,
    onSuccess: (newQuestion) => {
      if (newQuestion) {
        queryClient.invalidateQueries({ queryKey: ['questions'] });
        
        toast({
          title: "Question submitted",
          description: "Your question has been posted successfully.",
        });
        
        setTitle("");
        setContent("");
        setSelectedTags([]);
        
        navigate('/');
      }
    },
    onError: (error) => {
      toast({
        title: "Error submitting question",
        description: "There was an error posting your question. Please try again.",
        variant: "destructive",
      });
      console.error("Error saving question:", error);
    }
  });
  
  const filteredTags = tags
    .filter(tag => tag.name.toLowerCase().includes(tagInput.toLowerCase()))
    .filter(tag => !selectedTags.includes(tag.name))
    .slice(0, 5);
  
  const handleAddTag = (tagName: string) => {
    if (selectedTags.length >= 5) {
      toast({
        title: "Tag limit reached",
        description: "You can only add up to 5 tags per question.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
    setTagInput("");
  };
  
  const handleRemoveTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagName));
  };
  
  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (title.trim().length < 15) {
      toast({
        title: "Title too short",
        description: "Your question title must be at least 15 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    if (content.trim().length < 30) {
      toast({
        title: "Question details too short",
        description: "Please provide more details about your question (at least 30 characters).",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedTags.length === 0) {
      toast({
        title: "Tags required",
        description: "Please add at least one tag to your question.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to submit a question.",
        variant: "destructive",
      });
      return;
    }

    const newQuestion = {
      title,
      content,
      votes: 0,
      answerCount: 0,
      views: 0,
      hasBestAnswer: false,
      createdAt: new Date().toISOString(),
      author: {
        id: user.id,
        name: user.user_metadata?.username || 'Anonymous',
        username: user.user_metadata?.username || 'anonymous',
        reputation: 1,
        avatar: null,
        role: 'User',
        joinDate: new Date().toISOString()
      },
      tags: selectedTags.map((tagName, index) => ({
        id: `temp-${index}`,
        name: tagName,
        count: 1
      })),
      answers: []
    };

    mutation.mutate(newQuestion);
  };
  
  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ask a Question</h1>
            <p className="text-gray-600">
              Get help from the community by asking a clear, specific question about a programming or technical issue.
            </p>
          </div>
          
          <form onSubmit={handleSubmitQuestion} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Question Title
                </label>
                <div className="text-xs text-gray-500">
                  {title.length}/150 characters
                </div>
              </div>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 150))}
                placeholder="e.g., How to center a div with Flexbox?"
                className="mb-1"
              />
              <p className="text-xs text-gray-500">
                Be specific and imagine you're asking a question to another person.
              </p>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Question Details
                </label>
                <div className="flex items-center text-xs text-gray-500">
                  <HelpCircle className="h-3 w-3 mr-1" />
                  <span>Markdown supported</span>
                </div>
              </div>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your problem in detail. Include what you've tried and what you're trying to accomplish. For code, use three backticks (```) to create code blocks."
                className="min-h-[200px] mb-1"
              />
              <p className="text-xs text-gray-500">
                Include all relevant information to make it easier for others to help you. Add code snippets if relevant.
              </p>
            </div>
            
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedTags.map(tag => (
                  <Badge key={tag} className="bg-tech-light text-tech-primary flex items-center gap-1 px-3 py-1">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="relative">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g., javascript, react, css"
                  className="mb-1"
                />
                {tagInput && filteredTags.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredTags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        className="w-full text-left px-4 py-2 text-sm hover:bg-tech-light flex items-center justify-between"
                        onClick={() => handleAddTag(tag.name)}
                      >
                        <span className="font-medium">{tag.name}</span>
                        <span className="text-xs text-gray-500">×{tag.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Add up to 5 tags to describe what your question is about. Start typing to see suggestions.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button type="submit" className="bg-tech-primary hover:bg-tech-secondary">
                Post Your Question
              </Button>
              <Link to="/">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AskQuestion;
