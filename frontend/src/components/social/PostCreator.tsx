'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

interface PostCreatorProps {
  organizationId: string;
}

interface PostForm {
  content: string;
  scheduledTime: Date | undefined;
  platforms: string[];
  mediaUrls: string[];
}

export default function PostCreator({ organizationId }: PostCreatorProps) {
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [sentiment, setSentiment] = useState<number | null>(null);
  const { toast } = useToast();
  const { getToken } = useAuth();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PostForm>({
    defaultValues: {
      scheduledTime: undefined,
      platforms: [],
      mediaUrls: [],
    }
  });

  useEffect(() => {
    fetchConnectedPlatforms();
  }, []);

  const fetchConnectedPlatforms = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/organizations/${organizationId}/social-accounts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setConnectedPlatforms(data.map((account: any) => account.platform));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching platforms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load connected platforms',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const getAiSuggestion = async (content: string) => {
    try {
      const token = await getToken();
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationId,
          content,
          platforms: connectedPlatforms,
        }),
      });
      const data = await response.json();
      setAiSuggestion(data.content);
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI suggestions',
        variant: 'destructive',
      });
    }
  };

  const analyzeSentiment = async (content: string) => {
    try {
      const token = await getToken();
      const response = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: content }),
      });
      const score = await response.json();
      setSentiment(score);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze sentiment',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: PostForm) => {
    try {
      const token = await getToken();
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          organizationId,
          scheduledTime: data.scheduledTime || new Date(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      toast({
        title: 'Success',
        description: 'Post scheduled successfully',
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule post',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const scheduledTime = watch('scheduledTime');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Post</CardTitle>
        <CardDescription>
          Create and schedule your social media post
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Content
            </label>
            <Textarea
              {...register('content', { required: true })}
              className="min-h-[100px]"
              placeholder="Write your post content here..."
              onChange={(e) => {
                setValue('content', e.target.value);
                if (e.target.value.length > 10) {
                  analyzeSentiment(e.target.value);
                }
              }}
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">Content is required</p>
            )}
            {sentiment !== null && (
              <div className="mt-2">
                <p className="text-sm">
                  Sentiment Score: {sentiment}
                  <span className="ml-2">
                    {sentiment > 0.3 ? '😊' : sentiment < -0.3 ? '😟' : '😐'}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Schedule Time
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !scheduledTime && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledTime ? format(scheduledTime, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={scheduledTime}
                  onSelect={(date) => setValue('scheduledTime', date)}
                  initialFocus
                  disabled={{ before: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Platforms
            </label>
            <div className="space-y-2">
              {connectedPlatforms.map((platform) => (
                <label key={platform} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('platforms')}
                    value={platform}
                  />
                  <span>{platform}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Media URLs
            </label>
            <Input
              type="text"
              placeholder="Add comma-separated media URLs"
              onChange={(e) =>
                setValue(
                  'mediaUrls',
                  e.target.value.split(',').map((url) => url.trim())
                )
              }
            />
          </div>

          <Button type="submit">Schedule Post</Button>
        </form>
      </CardContent>
    </Card>
  );
} 