import { FormEvent, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { markEmailVerified, signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/storage";
import { uploadMediaFile } from "@/lib/media-upload";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = useMemo(() => searchParams.get("redirect") || "/dashboard", [searchParams]);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupHandle, setSignupHandle] = useState("");
  const [signupAvatar, setSignupAvatar] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = await uploadMediaFile(file, "users");
    setSignupAvatar(url);
    toast.success("Profile picture uploaded.");
  };

  const handleSignUp = (event: FormEvent) => {
    event.preventDefault();
    try {
      const created = signUpWithEmail({
        full_name: signupName,
        email: signupEmail,
        password: signupPassword,
        handle: signupHandle || undefined,
        avatar_url: signupAvatar || undefined,
      });
      setPendingVerificationEmail(created.email);
      toast.success("Account created. Verify email to continue.");
    } catch (error: any) {
      toast.error(error?.message || "Could not create account.");
    }
  };

  const handleVerify = () => {
    if (!pendingVerificationEmail) return;
    markEmailVerified(pendingVerificationEmail);
    toast.success("Email verified.");
    navigate(redirect);
  };

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    try {
      signInWithEmail(loginEmail, loginPassword);
      toast.success("Signed in.");
      navigate(redirect);
    } catch (error: any) {
      toast.error(error?.message || "Sign in failed.");
    }
  };

  const handleGoogle = () => {
    if (!loginEmail.trim()) {
      toast.error("Enter your Google email first.");
      return;
    }
    const fallbackName = loginEmail.split("@")[0];
    signInWithGoogle({
      email: loginEmail,
      full_name: fallbackName,
    });
    toast.success("Signed in with Google.");
    navigate(redirect);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-xl p-6 border-white/10 bg-[#0a0a12]">
        <h1 className="text-2xl font-black mb-2">ArenaX Account Access</h1>
        <p className="text-sm text-white/60 mb-6">
          Browse freely, but joining tournaments requires a verified account.
        </p>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-white/5 border border-white/10">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  className="bg-slate-900 border-white/10 mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className="bg-slate-900 border-white/10 mt-1"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold">
                Sign In
              </Button>
              <Button type="button" variant="outline" className="w-full border-white/20" onClick={handleGoogle}>
                Continue with Google
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <form className="space-y-4" onSubmit={handleSignUp}>
              <div>
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  value={signupName}
                  onChange={(event) => setSignupName(event.target.value)}
                  className="bg-slate-900 border-white/10 mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="signup-handle">Gaming Handle (Optional)</Label>
                <Input
                  id="signup-handle"
                  value={signupHandle}
                  onChange={(event) => setSignupHandle(event.target.value)}
                  className="bg-slate-900 border-white/10 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  value={signupEmail}
                  onChange={(event) => setSignupEmail(event.target.value)}
                  className="bg-slate-900 border-white/10 mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={signupPassword}
                  onChange={(event) => setSignupPassword(event.target.value)}
                  className="bg-slate-900 border-white/10 mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="signup-avatar">Profile Picture</Label>
                <Input id="signup-avatar" type="file" accept="image/*" onChange={handleAvatarUpload} className="mt-1" />
              </div>
              <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold">
                Create Account
              </Button>
              {pendingVerificationEmail ? (
                <Button type="button" onClick={handleVerify} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
                  Verify Email and Continue
                </Button>
              ) : null}
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
