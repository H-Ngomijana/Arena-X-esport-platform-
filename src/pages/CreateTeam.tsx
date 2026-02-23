import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, X, Plus, Shield } from "lucide-react";
import GlowButton from "@/components/GlowButton";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { games } from "@/lib/mock-data";
import { getTeams, saveTeams } from "@/lib/storage";
import { uploadMediaFile } from "@/lib/media-upload";

const CreateTeam = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    tag: "",
    game_id: "",
    members: [] as string[],
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadMediaFile(file, "teams");
      setLogoPreview(url);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadMediaFile(file, "teams");
      setBannerPreview(url);
    }
  };

  const addMember = () => {
    if (emailInput.trim() && !formData.members.includes(emailInput)) {
      setFormData({
        ...formData,
        members: [...formData.members, emailInput],
      });
      setEmailInput("");
    }
  };

  const removeMember = (email: string) => {
    setFormData({
      ...formData,
      members: formData.members.filter((m) => m !== email),
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTeam = {
        id: Date.now().toString(),
        name: formData.name,
        tag: formData.tag,
        members: formData.members,
        captain_id: formData.members?.[0] || "",
        rating: 1500,
        rank_tier: "Bronze",
        wins: 0,
        losses: 0,
        game: games.find((g) => g.id === formData.game_id)?.name || "",
        game_id: formData.game_id,
        logo_url: logoPreview || "",
        banner_url: bannerPreview || "",
        tournaments_won: 0,
        status: "active",
      };

      const existing = getTeams();
      const updated = Array.isArray(existing) ? [...existing, newTeam] : [newTeam];
      saveTeams(updated);
      navigate("/teams");
    } catch (err) {
      console.error("Failed to save team", err);
      navigate("/teams");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-12">
      <div className="container max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-display font-bold mb-2 flex items-center gap-3">
            <Shield className="text-primary" size={32} />
            Create Your Team
          </h1>
          <p className="text-muted-foreground">Build your esports squad and dominate tournaments</p>
        </motion.div>

        <form onSubmit={onSubmit} className="space-y-8">
          {/* Team Info */}
          <Card className="p-6 border-white/10">
            <h2 className="text-xl font-display font-bold mb-6">Team Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="mb-2 block">Team Name</Label>
                <Input
                  id="name"
                  placeholder="Enter team name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-slate-900 border-white/10"
                />
              </div>

              <div>
                <Label htmlFor="tag" className="mb-2 block">Team Tag (3-5 characters)</Label>
                <Input
                  id="tag"
                  placeholder="e.g. APEX"
                  maxLength={5}
                  value={formData.tag.toUpperCase()}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value.toUpperCase() })}
                  required
                  className="bg-slate-900 border-white/10 uppercase"
                />
              </div>

              <div>
                <Label htmlFor="game" className="mb-2 block">Game</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, game_id: value })}>
                  <SelectTrigger className="bg-slate-900 border-white/10">
                    <SelectValue placeholder="Select a game" />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map((game) => (
                      <SelectItem key={game.id} value={game.id}>
                        {game.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Branding */}
          <Card className="p-6 border-white/10">
            <h2 className="text-xl font-display font-bold mb-6">Branding</h2>
            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <Label className="mb-3 block">Team Logo</Label>
                <label className="flex items-center justify-center w-full p-6 border-2 border-dashed border-white/20 rounded-lg hover:border-primary/50 transition-colors cursor-pointer bg-white/5">
                  <div className="text-center">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="mx-auto h-16 w-16 object-cover rounded" />
                    ) : (
                      <>
                        <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload logo</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Banner Upload */}
              <div>
                <Label className="mb-3 block">Team Banner</Label>
                <label className="flex items-center justify-center w-full p-6 border-2 border-dashed border-white/20 rounded-lg hover:border-primary/50 transition-colors cursor-pointer bg-white/5">
                  <div className="text-center w-full">
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="Banner preview" className="mx-auto h-32 w-full object-cover rounded" />
                    ) : (
                      <>
                        <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload banner</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </Card>

          {/* Members */}
          <Card className="p-6 border-white/10">
            <h2 className="text-xl font-display font-bold mb-6">Team Members</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter member email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addMember())}
                  className="bg-slate-900 border-white/10"
                />
                <Button
                  type="button"
                  onClick={addMember}
                  variant="outline"
                  className="gap-2"
                >
                  <Plus size={16} /> Add
                </Button>
              </div>

              {formData.members.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.members.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <span className="text-sm">{email}</span>
                      <button
                        type="button"
                        onClick={() => removeMember(email)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <X size={16} className="text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <GlowButton type="submit" size="lg" className="flex-1">
              Create Team
            </GlowButton>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate("/teams")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeam;
