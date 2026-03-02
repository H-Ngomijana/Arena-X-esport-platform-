import { ChangeEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadMediaFile } from "@/lib/media-upload";
import { getCurrentUser, updateAccountProfile } from "@/lib/storage";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const AccountSettings = () => {
  const navigate = useNavigate();
  const currentUser = useMemo(() => getCurrentUser(), []);

  const [fullName, setFullName] = useState(currentUser.name || "");
  const [handle, setHandle] = useState(currentUser.handle || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || "");
  const [saving, setSaving] = useState(false);

  if (currentUser.is_guest) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 border-white/10 max-w-md w-full text-center">
          <p className="text-white/70 mb-4">Login required to edit account settings.</p>
          <Button onClick={() => navigate(`/auth?mode=login&redirect=${encodeURIComponent("/account-settings")}`)}>
            Sign in
          </Button>
        </Card>
      </div>
    );
  }

  const onUploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = await uploadMediaFile(file, "users");
    setAvatarUrl(url);
    toast.success("Profile image uploaded.");
  };

  const onSave = async () => {
    setSaving(true);
    try {
      updateAccountProfile(currentUser.email, {
        full_name: fullName,
        handle,
        avatar_url: avatarUrl || undefined,
      });
      toast.success("Account settings updated.");
      navigate("/profile");
    } catch (error: any) {
      toast.error(error?.message || "Could not update account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white pt-20 pb-10">
      <div className="container max-w-xl">
        <Card className="p-6 border-white/10 bg-[#0a0a12] space-y-4">
          <h1 className="text-2xl font-black">Account Settings</h1>
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-14 h-14 rounded-full object-cover border border-white/20" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">{fullName?.[0] || "U"}</div>
            )}
            <label className="text-sm cursor-pointer rounded-lg border border-white/15 px-3 py-2 hover:bg-white/5">
              Change profile image
              <input type="file" accept="image/*" className="hidden" onChange={onUploadAvatar} />
            </label>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-white/60 uppercase tracking-wider">Full name</p>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-slate-900 border-white/10" />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-white/60 uppercase tracking-wider">Username / nickname</p>
            <Input value={handle} onChange={(e) => setHandle(e.target.value)} className="bg-slate-900 border-white/10" />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-white/60 uppercase tracking-wider">Email</p>
            <Input value={currentUser.email} disabled className="bg-slate-900 border-white/10 opacity-70" />
          </div>
          <Button onClick={onSave} disabled={saving} className="w-full bg-fuchsia-600 hover:bg-fuchsia-500">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default AccountSettings;
