import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Assuming installed
import { Loader2, Upload, MapPin, Music, Rocket } from "lucide-react";
import { compressImage } from "@/lib/image-compression";
import { Switch } from "@/components/ui/switch";

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: { lat: number; lng: number } | null;
  onSuccess: () => void;
  initialData?: any; // Using any for flexibility, but ideally this matches the Memory interface
}

export function AddMemoryModal({
  isOpen,
  onClose,
  location,
  onSuccess,
  initialData
}: AddMemoryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(initialData?.location_name || "");
  const [description, setDescription] = useState(initialData?.content || "");
  const [spotifyUrl, setSpotifyUrl] = useState(initialData?.spotify_url || "");
  const [date, setDate] = useState(
    initialData?.memory_date ? new Date(initialData.memory_date).toISOString().split('T')[0] : ""
  );
  const [unlockDate, setUnlockDate] = useState(
    initialData?.unlock_date ? new Date(initialData.unlock_date).toISOString().slice(0, 16) : ""
  );
  const [isPublic, setIsPublic] = useState(initialData?.is_public || false);
  
  // Use initial image URL for preview if editing
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.media_url || null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);



  // Update state when initialData changes
  useEffect(() => {
     if (initialData) {
         setTitle(initialData.location_name);
         setDescription(initialData.content);
         setSpotifyUrl(initialData.spotify_url || "");
         setDate(initialData.memory_date ? new Date(initialData.memory_date).toISOString().split('T')[0] : "");
         setUnlockDate(initialData.unlock_date ? new Date(initialData.unlock_date).toISOString().slice(0, 16) : "");
         setImagePreview(initialData.media_url);
         setIsPublic(initialData.is_public || false);
     } else {
        // Reset if no initial data (switching to add mode)
        setTitle("");
        setDescription("");
        setSpotifyUrl("");
        setDate("");
        setUnlockDate("");
        setImagePreview(null);
        setImageFile(null);
        setIsPublic(false);
     }
  }, [initialData]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        
        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);

        // Compress
        try {
            const compressed = await compressImage(file);
            setImageFile(compressed);
        } catch (error) {
            console.error("Compression failed", error);
            setImageFile(file); // Fallback to original
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // For editing, location might be null if we just pass initialData, so fallback to initialData coords
    const lat = location?.lat || initialData?.latitude;
    const lng = location?.lng || initialData?.longitude;

    if (!lat || !lng) return;
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let mediaUrl = initialData?.media_url || null;

      // 1. Upload new Image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('memories')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
            .from('memories')
            .getPublicUrl(fileName);
        
        mediaUrl = publicUrl;
      }

      // 2. Insert or Update Record
      const memoryData = {
        user_id: user.id,
        content: description,
        location_name: title,
        latitude: lat,
        longitude: lng,
        memory_date: date ? new Date(date).toISOString() : new Date().toISOString(),
        media_url: mediaUrl,
        media_type: 'image',
        spotify_url: spotifyUrl || null,
        unlock_date: unlockDate ? new Date(unlockDate).toISOString() : null,
        is_public: isPublic
      };

      let error;
      if (initialData) {
        // Update
        const response = await supabase
            .from('memories')
            .update(memoryData)
            .eq('id', initialData.id);
        error = response.error;
      } else {
        // Insert
        const response = await supabase
            .from('memories')
            .insert(memoryData);
        error = response.error;
      }

      if (error) throw error;

      toast.success(initialData ? "Memory updated." : "Memory pinned forever.");
      onSuccess();
      onClose();
      
      // Reset form if creating new
      if (!initialData) {
          setTitle("");
          setDescription("");
          setSpotifyUrl("");
          setDate("");
          setUnlockDate("");
          setImageFile(null);
          setImagePreview(null);
          setIsPublic(false);
      }

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-white p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-zinc-400" />
            {initialData ? "Edit Memory" : "Pin a Memory"}
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : (initialData ? `${initialData.latitude.toFixed(4)}, ${initialData.longitude.toFixed(4)}` : "Select a location")}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          
          {/* Image Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative aspect-video rounded-lg border-2 border-dashed border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors cursor-pointer flex flex-col items-center justify-center overflow-hidden"
          >
            {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
                <>
                    <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                    <span className="text-sm text-zinc-500">Click to upload photo (Optional)</span>
                </>
            )}
            <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageSelect}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Title / Location Name</Label>
            <Input
              id="title"
              placeholder="e.g. Our First Date"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="date">Date of Memory</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="unlockDate" className="flex items-center gap-2 text-yellow-500">
                <Loader2 className="w-4 h-4" /> {/* Using Loader as temp icon for Time Capsule */}
                Time Capsule: Unlock Date (Optional)
            </Label>
            <Input
              id="unlockDate"
              type="datetime-local"
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white"
            />
            <p className="text-xs text-zinc-500">This memory will be locked until this date.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="spotify" className="flex items-center gap-2">
                <Music className="w-4 h-4 text-green-500" />
                Spotify Song Link (Optional)
            </Label>
            <Input
              id="spotify"
              placeholder="e.g. https://open.spotify.com/track/..."
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="desc">Story (Optional)</Label>
            <Textarea
              id="desc"
              placeholder="What do you remember from this moment?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white resize-none h-24"
            />
          </div>

          <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-purple-500/20 text-purple-400">
                    <Rocket className="w-5 h-5" />
                </div>
                <div>
                    <Label htmlFor="public-mode" className="font-semibold text-zinc-200">Launch to Universe</Label>
                    <p className="text-xs text-zinc-500">Allow others to find this memory in the galaxy.</p>
                </div>
            </div>
            <Switch
                id="public-mode"
                checked={isPublic}
                onCheckedChange={setIsPublic}
            />
          </div>

          <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-[2] bg-white text-black hover:bg-gray-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {initialData ? "Save Changes" : "Save Memory"}
              </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
