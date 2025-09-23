import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Camera, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface PhotoUploadStepProps {
  data: any;
  updateData: (field: string, value: any) => void;
}

export const PhotoUploadStep: React.FC<PhotoUploadStepProps> = ({ data, updateData }) => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      updateData('profile_photo_url', publicUrl);
      
      toast({
        title: "Photo uploaded!",
        description: "Your profile photo has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Add a profile photo</h2>
        <p className="text-muted-foreground">
          Help others recognize you at events (optional)
        </p>
      </div>
      
      <div className="flex flex-col items-center space-y-6">
        <Avatar className="h-32 w-32 border-4 border-border">
          <AvatarImage src={data.profile_photo_url} />
          <AvatarFallback className="text-2xl bg-peach-gold/20 text-peach-gold">
            {data.profile_photo_url ? <User className="h-12 w-12" /> : getInitials()}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="photo-upload"
            disabled={uploading}
          />
          
          <label htmlFor="photo-upload">
            <Button
              asChild
              disabled={uploading}
              className="bg-sage-green hover:bg-sage-green/90 cursor-pointer"
            >
              <span>
                {uploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2 flex" />
                    {data.profile_photo_url ? 'Change Photo' : 'Upload Photo'}
                  </>
                )}
              </span>
            </Button>
          </label>

          {data.profile_photo_url && (
            <Button
              variant="outline"
              onClick={() => updateData('profile_photo_url', '')}
              className="w-full"
            >
              Remove Photo
            </Button>
          )}
        </div>

        <Card className="w-full border-border bg-muted/20">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Camera className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Photo Tips:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Use a clear, recent photo of yourself</li>
                  <li>• Make sure your face is visible</li>
                  <li>• Avoid group photos or heavily filtered images</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};