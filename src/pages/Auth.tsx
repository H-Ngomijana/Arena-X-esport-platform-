import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, KeyRound, UserRound } from "lucide-react";
import { uploadMediaFile } from "@/lib/media-upload";
import {
  markEmailVerified,
  requestPasswordReset,
  resetPasswordWithToken,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/storage";
import { toast } from "sonner";

type Mode = "signup" | "login" | "forgot" | "reset";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = useMemo(() => searchParams.get("redirect") || "/dashboard", [searchParams]);
  const mode = useMemo<Mode>(() => {
    const raw = (searchParams.get("mode") || "login").toLowerCase();
    if (raw === "signup" || raw === "forgot" || raw === "reset") return raw;
    return "login";
  }, [searchParams]);

  const rememberedEmail = localStorage.getItem("arenax_remember_email") || "";

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupHandle, setSignupHandle] = useState("");
  const [signupAvatar, setSignupAvatar] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");

  const [loginEmail, setLoginEmail] = useState(rememberedEmail);
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedEmail));

  const [resetEmail, setResetEmail] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const resetEmailFromLink = searchParams.get("email") || "";
  const resetTokenFromLink = searchParams.get("token") || "";

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = await uploadMediaFile(file, "users");
    setSignupAvatar(url);
    toast.success("Profile image uploaded.");
  };

  const handleSignUp = (event: FormEvent) => {
    event.preventDefault();
    if (signupPassword !== signupConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
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
      if (rememberMe) {
        localStorage.setItem("arenax_remember_email", loginEmail.trim().toLowerCase());
      } else {
        localStorage.removeItem("arenax_remember_email");
      }
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
    signInWithGoogle({
      email: loginEmail,
      full_name: loginEmail.split("@")[0],
    });
    toast.success("Signed in with Google.");
    navigate(redirect);
  };

  const handleForgot = (event: FormEvent) => {
    event.preventDefault();
    try {
      requestPasswordReset(resetEmail);
      toast.success("Verification email sent. Check your email and open the reset link.");
    } catch (error: any) {
      toast.error(error?.message || "Could not send reset message.");
    }
  };

  const handleResetFromEmailLink = (event: FormEvent) => {
    event.preventDefault();
    if (resetNewPassword !== resetConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      resetPasswordWithToken(resetEmailFromLink, resetTokenFromLink, resetNewPassword);
      toast.success("Password reset complete.");
      navigate(`/auth?mode=login&redirect=${encodeURIComponent(redirect)}`);
    } catch (error: any) {
      toast.error(error?.message || "Reset failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_20%,#1b2d5b_0%,#12163d_42%,#090b1d_100%)] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0b1024]/90 backdrop-blur-xl shadow-[0_20px_70px_rgba(0,0,0,0.45)] p-6 sm:p-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1 text-xs uppercase tracking-widest text-white/50 hover:text-white/80"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="rounded-2xl border border-fuchsia-300/20 bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
            {mode === "signup" ? "Create Account" : mode === "forgot" ? "Reset Password" : "Sign In"}
          </h1>
          <p className="text-white/90 text-sm mt-1">
            {mode === "signup"
              ? "Build your profile and start competing."
              : mode === "forgot"
              ? "Request reset and verify from your email."
              : "Continue to your ArenaX account."}
          </p>
        </div>

        {mode === "signup" ? (
          <form className="space-y-3" onSubmit={handleSignUp}>
            <input className="w-full h-11 rounded-xl border border-white/20 bg-white/5 px-4 placeholder:text-white/40 focus:outline-none focus:border-cyan-300/60" placeholder="Full names" value={signupName} onChange={(e) => setSignupName(e.target.value)} required />
            <input className="w-full h-11 rounded-xl border border-white/20 bg-white/5 px-4 placeholder:text-white/40 focus:outline-none focus:border-cyan-300/60" placeholder="Email" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
            <input className="w-full h-11 rounded-xl border border-white/20 bg-white/5 px-4 placeholder:text-white/40 focus:outline-none focus:border-cyan-300/60" placeholder="Nickname (optional)" value={signupHandle} onChange={(e) => setSignupHandle(e.target.value)} />
            <input className="w-full h-11 rounded-xl border border-white/20 bg-white/5 px-4 placeholder:text-white/40 focus:outline-none focus:border-cyan-300/60" placeholder="Password" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required />
            <input className="w-full h-11 rounded-xl border border-white/20 bg-white/5 px-4 placeholder:text-white/40 focus:outline-none focus:border-cyan-300/60" placeholder="Confirm password" type="password" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} required />
            <label className="flex items-center justify-between w-full h-11 rounded-xl border border-white/20 bg-white/5 px-4 cursor-pointer text-sm text-white/70">
              <span>{signupAvatar ? "Profile image selected" : "Upload profile picture"}</span>
              <UserRound size={16} />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
            {signupAvatar ? (
              <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 p-2">
                <img src={signupAvatar} alt="profile preview" className="w-10 h-10 rounded-full object-cover border border-white/30" />
                <p className="text-xs text-white/70">This picture will appear on your account menu.</p>
              </div>
            ) : null}
            <button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 font-bold uppercase tracking-wide">
              Register
            </button>
            {pendingVerificationEmail ? (
              <button type="button" onClick={handleVerify} className="w-full h-11 rounded-xl border border-cyan-300/35 bg-cyan-400/10 text-cyan-200 font-semibold">
                Verify Email and Continue
              </button>
            ) : null}
            <p className="text-center text-sm text-white/60 pt-1">
              Already have an account?
              <Link className="text-fuchsia-300 ml-1" to={`/auth?mode=login&redirect=${encodeURIComponent(redirect)}`}>
                Sign in
              </Link>
            </p>
          </form>
        ) : mode === "forgot" ? (
          <>
            <form className="space-y-3" onSubmit={handleForgot}>
              <input className="w-full h-11 rounded-xl border border-white/20 bg-white/5 px-4 placeholder:text-white/40 focus:outline-none focus:border-cyan-300/60" placeholder="Registered email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
              <button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 font-bold uppercase tracking-wide">
                Verify Email
              </button>
            </form>
            <p className="mt-4 text-sm text-white/65">
              After verification, open the reset link from your email and set the new password.
            </p>
            <p className="text-center text-sm text-white/60 pt-3">
              Back to
              <Link className="text-fuchsia-300 ml-1" to={`/auth?mode=login&redirect=${encodeURIComponent(redirect)}`}>
                Sign in
              </Link>
            </p>
          </>
        ) : mode === "reset" ? (
          <>
            <div className="rounded-xl border border-cyan-300/25 bg-cyan-400/10 p-3 text-xs text-cyan-200 mb-4">
              Email verified. Set your new password.
            </div>
            <form className="space-y-3" onSubmit={handleResetFromEmailLink}>
              <input
                className="w-full h-11 rounded-xl border border-white/20 bg-white/5 px-4 placeholder:text-white/40 focus:outline-none focus:border-cyan-300/60"
                placeholder="New password"
                type="password"
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                required
              />
              <input
                className="w-full h-11 rounded-xl border border-white/20 bg-white/5 px-4 placeholder:text-white/40 focus:outline-none focus:border-cyan-300/60"
                placeholder="Confirm new password"
                type="password"
                value={resetConfirmPassword}
                onChange={(e) => setResetConfirmPassword(e.target.value)}
                required
              />
              <button type="submit" className="w-full h-11 rounded-xl border border-white/25 bg-white/10 font-semibold inline-flex items-center justify-center gap-2">
                <KeyRound size={15} /> Reset Password
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 mb-4">
              <button type="button" onClick={handleGoogle} className="h-10 rounded-xl border border-white/20 bg-white/5 text-white/80 hover:bg-white/10">
                Continue with Google
              </button>
            </div>
            <form className="space-y-3" onSubmit={handleLogin}>
              <input className="w-full h-11 rounded-xl border border-white/20 bg-white/5 px-4 placeholder:text-white/40 focus:outline-none focus:border-cyan-300/60" placeholder="Email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
              <input className="w-full h-11 rounded-xl border border-white/20 bg-white/5 px-4 placeholder:text-white/40 focus:outline-none focus:border-cyan-300/60" placeholder="Current password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
              <label className="inline-flex items-center gap-2 text-sm text-white/60">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                remember me
              </label>
              <button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 font-bold uppercase tracking-wide">
                Sign In
              </button>
            </form>
            <div className="text-center mt-4 text-sm">
              <Link className="text-fuchsia-300" to={`/auth?mode=forgot&redirect=${encodeURIComponent(redirect)}`}>
                Forgot password?
              </Link>
            </div>
            <p className="text-center mt-2 text-sm text-white/60">
              Don't have an account?
              <Link className="text-fuchsia-300 ml-1" to={`/auth?mode=signup&redirect=${encodeURIComponent(redirect)}`}>
                Sign up
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
