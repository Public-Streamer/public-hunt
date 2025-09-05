import React, { useState, useEffect } from 'react';
import { ThumbsUp, User, Calendar, Loader2, Bot, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface BlogPost {
  id: number;
  question: string;
  author: string;
  created_at: string;
  likes: number;
  blog_answers: BlogAnswer[];
}

interface BlogAnswer {
  id: number;
  post_id: number;
  author: string;
  content: string;
  likes: number;
  created_at: string;
  is_ai_generated?: boolean;
}

const EnhancedQABlog = () => {
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBlogPosts();
    // Check for AI responses every 60 seconds
    const interval = setInterval(checkForAIResponses, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchBlogPosts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('blog-posts', {
        body: { action: 'GET_POSTS' },
      });

      if (error) throw error;
      setBlogPosts(data || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load blog posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkForAIResponses = async () => {
    // Find posts without AI answers
    const postsNeedingAI = blogPosts.filter(
      (post) => !post.blog_answers?.some((answer) => answer.is_ai_generated)
    );

    for (const post of postsNeedingAI.slice(0, 2)) {
      // Limit to 2 at a time
      try {
        const { data } = await supabase.functions.invoke('ai-agent', {
          body: {
            action: 'AUTO_ANSWER',
            data: { question: post.question, postId: post.id },
          },
        });

        if (data?.answer) {
          await supabase.functions.invoke('blog-posts', {
            body: {
              action: 'CREATE_ANSWER',
              data: {
                post_id: post.id,
                author: 'AI Assistant',
                content: data.answer,
                is_ai_generated: true,
              },
            },
          });
        }
      } catch (error) {
        console.error('AI response error:', error);
      }
    }

    // Refresh posts after AI responses
    if (postsNeedingAI.length > 0) {
      fetchBlogPosts();
    }
  };

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim()) return;

    setSubmitting(true);
    try {
      await supabase.functions.invoke('blog-posts', {
        body: {
          action: 'CREATE_POST',
          data: {
            question: newQuestion.trim(),
            author: 'Anonymous User',
          },
        },
      });

      setNewQuestion('');
      await fetchBlogPosts();
      toast({
        title: 'Success',
        description: 'Question posted! AI will respond shortly.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post question',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnswer = async (postId: number) => {
    if (!newAnswer.trim()) return;

    setSubmitting(true);
    try {
      await supabase.functions.invoke('blog-posts', {
        body: {
          action: 'CREATE_ANSWER',
          data: {
            post_id: postId,
            author: 'Anonymous User',
            content: newAnswer.trim(),
          },
        },
      });

      setNewAnswer('');
      setSelectedPost(null);
      await fetchBlogPosts();
      toast({
        title: 'Success',
        description: 'Answer posted successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post answer',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (
    table: string,
    id: number,
    currentLikes: number
  ) => {
    try {
      await supabase.functions.invoke('blog-posts', {
        body: {
          action: 'UPDATE_LIKES',
          data: { table, id, likes: currentLikes + 1 },
        },
      });
      await fetchBlogPosts();
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Ask a Question
            <Badge variant="outline" className="ml-auto">
              <Bot className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="What would you like to know about Public Streamer? Our AI assistant will help answer your question!"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="min-h-[100px]"
          />
          <Button
            onClick={handleSubmitQuestion}
            className="w-full"
            disabled={submitting || !newQuestion.trim()}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              'Post Question'
            )}
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {blogPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {post.question}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {post.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.created_at).toLocaleDateString()}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleLike('blog_posts', post.id, post.likes)
                        }
                        className="flex items-center gap-1 h-auto p-1"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        {post.likes}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {post.blog_answers?.map((answer) => (
                    <div
                      key={answer.id}
                      className={`border-l-2 pl-4 py-2 ${
                        answer.is_ai_generated
                          ? 'border-purple-200 bg-purple-50/50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {answer.is_ai_generated ? (
                          <Bot className="h-4 w-4 text-purple-600" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                        <span className="font-medium flex items-center gap-1">
                          {answer.author}
                          {answer.is_ai_generated && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="h-2 w-2 mr-1" />
                              AI
                            </Badge>
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleLike('blog_answers', answer.id, answer.likes)
                          }
                          className="flex items-center gap-1 h-auto p-1 text-sm text-muted-foreground"
                        >
                          <ThumbsUp className="h-3 w-3" />
                          {answer.likes}
                        </Button>
                      </div>
                      <p className="text-sm">{answer.content}</p>
                    </div>
                  ))}

                  {selectedPost === post.id ? (
                    <div className="space-y-2 mt-4">
                      <Textarea
                        placeholder="Write your answer..."
                        value={newAnswer}
                        onChange={(e) => setNewAnswer(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSubmitAnswer(post.id)}
                          disabled={submitting}
                        >
                          {submitting ? 'Submitting...' : 'Submit Answer'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPost(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedPost(post.id)}
                      className="mt-2"
                    >
                      Answer Question
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedQABlog;
