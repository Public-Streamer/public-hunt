import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from './RichTextEditor';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import { Loader2, Send } from 'lucide-react';

interface CreateBulletinPostProps {
    eventId: string;
    onPostCreated?: () => void;
}

export const CreateBulletinPost: React.FC<CreateBulletinPostProps> = ({
    eventId,
    onPostCreated
}) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAppContext();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Please provide both a title and content.',
                variant: 'destructive'
            });
            return;
        }

        if (!user) {
            toast({
                title: 'Not Authenticated',
                description: 'You must be logged in to create a post.',
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('bulletin_posts' as any) // Table may not exist in types yet
                .insert({
                    event_id: eventId,
                    author_id: user.id,
                    title: title.trim(),
                    content: content, // HTML content
                });

            if (error) throw error;

            toast({
                title: 'Post Created',
                description: 'Your bulletin post has been published.',
            });

            setTitle('');
            setContent('');
            onPostCreated?.();
        } catch (err) {
            console.error('Error creating bulletin post:', err);
            toast({
                title: 'Error',
                description: 'Failed to create post. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Create Update</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="post-title">Title</Label>
                        <Input
                            id="post-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Update title..."
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Content</Label>
                        <RichTextEditor
                            content={content}
                            onChange={setContent}
                            placeholder="Write your update here..."
                        />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Send className="h-4 w-4 mr-2" />
                        )}
                        Publish Update
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default CreateBulletinPost;
