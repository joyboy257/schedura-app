import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsDashboardProps {
  organizationId: string;
}

interface PostAnalytics {
  postId: string;
  content: string;
  platform: string;
  likes: number;
  shares: number;
  comments: number;
  impressions: number;
  reach: number;
  engagement: number;
  publishedTime: string;
}

interface OptimalTimeSlot {
  dayOfWeek: number;
  hourOfDay: number;
  score: number;
  platform: string;
}

export default function AnalyticsDashboard({ organizationId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<PostAnalytics[]>([]);
  const [optimalTimes, setOptimalTimes] = useState<OptimalTimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { getToken } = useAuth();

  useEffect(() => {
    fetchAnalytics();
    fetchOptimalTimes();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/organizations/${organizationId}/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    }
  };

  const fetchOptimalTimes = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/ai/optimal-times/${organizationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setOptimalTimes(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching optimal times:', error);
      toast({
        title: 'Error',
        description: 'Failed to load optimal posting times',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const getEngagementData = () => {
    return analytics.map(post => ({
      name: post.content.substring(0, 20) + '...',
      likes: post.likes,
      shares: post.shares,
      comments: post.comments,
      engagement: post.engagement,
    }));
  };

  const getOptimalTimesData = () => {
    return optimalTimes.map(slot => ({
      time: `${slot.dayOfWeek}-${slot.hourOfDay}`,
      score: slot.score,
      platform: slot.platform,
    }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Post Performance</CardTitle>
          <CardDescription>
            Engagement metrics for your recent posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getEngagementData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="likes" fill="#8884d8" />
                <Bar dataKey="shares" fill="#82ca9d" />
                <Bar dataKey="comments" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Optimal Posting Times</CardTitle>
          <CardDescription>
            Best times to post based on engagement analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getOptimalTimesData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Summary</CardTitle>
          <CardDescription>
            Overview of your social media performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">
                  {analytics.reduce((sum, post) => sum + post.likes, 0)}
                </div>
                <div className="text-sm text-gray-500">Total Likes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">
                  {analytics.reduce((sum, post) => sum + post.shares, 0)}
                </div>
                <div className="text-sm text-gray-500">Total Shares</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">
                  {analytics.reduce((sum, post) => sum + post.comments, 0)}
                </div>
                <div className="text-sm text-gray-500">Total Comments</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">
                  {analytics.reduce((sum, post) => sum + post.impressions, 0)}
                </div>
                <div className="text-sm text-gray-500">Total Impressions</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 