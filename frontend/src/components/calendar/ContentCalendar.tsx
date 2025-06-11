import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth';
import { format } from 'date-fns';

interface ContentCalendarProps {
  organizationId: string;
}

interface ScheduledPost {
  id: string;
  content: string;
  scheduledTime: string;
  platform: string;
  status: string;
}

export default function ContentCalendar({ organizationId }: ContentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { getToken } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, [selectedDate]);

  const fetchPosts = async () => {
    try {
      const token = await getToken();
      const response = await fetch(
        `/api/organizations/${organizationId}/posts?date=${format(selectedDate, 'yyyy-MM-dd')}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setPosts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scheduled posts',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const getPostsByHour = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map(hour => {
      const hourPosts = posts.filter(post => {
        const postHour = new Date(post.scheduledTime).getHours();
        return postHour === hour;
      });
      return {
        hour,
        posts: hourPosts,
      };
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Calendar</CardTitle>
          <CardDescription>
            View and manage your scheduled posts
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-auto">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </div>
          <div className="flex-1 space-y-4">
            <h3 className="font-medium">
              Scheduled Posts for {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            <div className="space-y-2">
              {getPostsByHour().map(({ hour, posts }) => (
                <div key={hour} className="relative">
                  <div className="sticky top-0 bg-white z-10 py-1">
                    <span className="text-sm font-medium">
                      {format(new Date().setHours(hour), 'h:00 a')}
                    </span>
                  </div>
                  {posts.length > 0 ? (
                    <div className="pl-4 space-y-2">
                      {posts.map(post => (
                        <Card key={post.id} className="p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {format(new Date(post.scheduledTime), 'h:mm a')}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {post.content.substring(0, 100)}
                                {post.content.length > 100 ? '...' : ''}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                                {post.platform}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  post.status === 'published'
                                    ? 'bg-green-100 text-green-800'
                                    : post.status === 'failed'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {post.status}
                              </span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="pl-4 py-2">
                      <p className="text-sm text-gray-500">No posts scheduled</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 