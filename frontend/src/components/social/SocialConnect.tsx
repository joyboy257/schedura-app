import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth';

interface SocialPlatform {
  name: string;
  icon: string;
  connected: boolean;
}

export default function SocialConnect({ organizationId }: { organizationId: string }) {
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { getToken } = useAuth();

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/social/platforms', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      // Transform the data into our platform format
      const platformsData = data.map((name: string) => ({
        name,
        icon: `/icons/${name.toLowerCase()}.svg`,
        connected: false, // We'll update this in the next step
      }));

      // Fetch connected accounts
      const accountsResponse = await fetch(`/api/organizations/${organizationId}/social-accounts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const accountsData = await accountsResponse.json();

      // Update connected status
      const updatedPlatforms = platformsData.map((platform: SocialPlatform) => ({
        ...platform,
        connected: accountsData.some((account: any) => 
          account.platform.toLowerCase() === platform.name.toLowerCase()
        ),
      }));

      setPlatforms(updatedPlatforms);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching platforms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load social media platforms',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/social/${platform}/auth-url?organizationId=${organizationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error connecting platform:', error);
      toast({
        title: 'Error',
        description: `Failed to connect to ${platform}`,
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = async (platform: string) => {
    try {
      const token = await getToken();
      await fetch(`/api/social/${platform}/disconnect?organizationId=${organizationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Update platforms state
      setPlatforms(platforms.map(p => 
        p.name === platform ? { ...p, connected: false } : p
      ));

      toast({
        title: 'Success',
        description: `Disconnected from ${platform}`,
      });
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      toast({
        title: 'Error',
        description: `Failed to disconnect from ${platform}`,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media Accounts</CardTitle>
        <CardDescription>
          Connect your social media accounts to start scheduling posts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform) => (
            <Card key={platform.name} className="p-4">
              <div className="flex items-center space-x-4">
                <img
                  src={platform.icon}
                  alt={platform.name}
                  className="w-8 h-8"
                />
                <div className="flex-1">
                  <h3 className="font-medium">{platform.name}</h3>
                  <p className="text-sm text-gray-500">
                    {platform.connected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
                <Button
                  variant={platform.connected ? 'destructive' : 'default'}
                  onClick={() =>
                    platform.connected
                      ? handleDisconnect(platform.name)
                      : handleConnect(platform.name)
                  }
                >
                  {platform.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 