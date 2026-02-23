import { useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createSoloProfile, getCurrentUser } from "@/lib/storage";
import { useGames } from "@/context/GamesContext";
import { uploadMediaFile } from "@/lib/media-upload";

const countries = ["Rwanda", "Kenya", "Uganda", "Tanzania", "Nigeria", "Ghana", "South Africa", "United States"];

interface CreateSoloProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string;
  onCreated?: () => void;
}

const CreateSoloProfileDialog = ({ open, onOpenChange, gameId, onCreated }: CreateSoloProfileDialogProps) => {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const { getGameById } = useGames();
  const game = getGameById(gameId);

  const [inGameName, setInGameName] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadMediaFile(file, "avatars");
    setAvatarPreview(url);
  };

  const handleSave = () => {
    if (!inGameName.trim()) {
      toast.error("In-game name is required");
      return;
    }
    createSoloProfile({
      user_email: currentUser.email,
      user_name: currentUser.name,
      game_id: gameId,
      game_name: game?.name || "",
      in_game_name: inGameName.trim(),
      country: country || undefined,
      bio: bio.trim() || undefined,
      avatar_url: avatarPreview || undefined,
    });
    toast.success("Solo profile created! You can now join tournaments.");
    setInGameName("");
    setCountry("");
    setBio("");
    setAvatarPreview("");
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/10 bg-slate-900">
        <DialogHeader>
          <DialogTitle>Create Solo Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">In-Game Name *</Label>
            <Input
              value={inGameName}
              onChange={(e) => setInGameName(e.target.value)}
              placeholder="Enter your in-game name"
              className="bg-slate-950 border-white/10"
            />
          </div>
          <div>
            <Label className="mb-2 block">Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="bg-slate-950 border-white/10">
                <SelectValue placeholder="Select country (optional)" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((entry) => (
                  <SelectItem value={entry} key={entry}>
                    {entry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write a short bio (optional)"
              className="bg-slate-950 border-white/10 min-h-20"
            />
          </div>
          <div>
            <Label className="mb-2 block">Avatar Upload</Label>
            <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5 p-4 cursor-pointer">
              <Upload size={16} />
              <span className="text-sm text-muted-foreground">Choose image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </label>
            {avatarPreview && (
              <img src={avatarPreview} alt="Avatar preview" className="mt-3 h-20 w-20 rounded-lg object-cover" />
            )}
          </div>
          <Button onClick={handleSave} className="w-full">
            Save Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSoloProfileDialog;
