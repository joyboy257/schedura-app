import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth';
import { ImageIcon, VideoIcon, FileIcon } from 'lucide-react';

interface MediaLibraryProps {
  organizationId: string;
}

interface MediaAsset {
  id: string;
  url: string;
  type: 'image' | 'video' | 'gif';
  filename: string;
  size: number;
  createdAt: string;
}

export default function MediaLibrary({ organizationId }: MediaLibraryProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { getToken } = useAuth();

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/organizations/${organizationId}/media`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setAssets(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching media assets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load media assets',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const token = await getToken();
      const response = await fetch(`/api/organizations/${organizationId}/media/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const newAssets = await response.json();
      setAssets(prev => [...prev, ...newAssets]);
      toast({
        title: 'Success',
        description: 'Files uploaded successfully',
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload files',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    try {
      const token = await getToken();
      await fetch(`/api/organizations/${organizationId}/media/${assetId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAssets(prev => prev.filter(asset => asset.id !== assetId));
      toast({
        title: 'Success',
        description: 'Asset deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete asset',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-6 h-6" />;
      case 'video':
        return <VideoIcon className="w-6 h-6" />;
      default:
        return <FileIcon className="w-6 h-6" />;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Media Library</CardTitle>
        <CardDescription>
          Manage your media assets for social media posts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                variant="outline"
                className="w-full"
                disabled={uploading}
                asChild
              >
                <span>
                  {uploading ? 'Uploading...' : 'Upload Media Files'}
                </span>
              </Button>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map(asset => (
              <Card key={asset.id} className="p-4">
                <div className="flex items-start space-x-4">
                  {getAssetIcon(asset.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {asset.filename}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(asset.size)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(asset.id)}
                  >
                    Delete
                  </Button>
                </div>
                {asset.type === 'image' && (
                  <div className="mt-2">
                    <img
                      src={asset.url}
                      alt={asset.filename}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 