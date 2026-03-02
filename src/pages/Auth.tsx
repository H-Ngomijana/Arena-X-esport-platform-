import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

type Mode = "signup" | "login" | "forgot";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = useMemo(() => searchParams.get("redirect") || "/dashboard", [searchParams]);
  const mode = useMemo<Mode>(() => {
    const raw = (searchParams.get("mode") || "login").toLowerCase();
    if (raw === "signup" || raw === "forgot") return raw;
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
  const [resetToken, setResetToken] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = await uploadMediaFile(file, "users");
    setSignupAvatar(url);
    toast.success("Profile picture uploaded.");
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
    const fallbackName = loginEmail.split("@")[0];
    signInWithGoogle({
      email: loginEmail,
      full_name: fallbackName,
    });
    toast.success("Signed in with Google.");
    navigate(redirect);
  };

  const handleForgot = (event: FormEvent) => {
    event.preventDefault();
    try {
      requestPasswordReset(resetEmail);
      toast.success("Reset message sent to your registered email.");
    } catch (error: any) {
      toast.error(error?.message || "Could not send reset message.");
    }
  };

  const handleResetByToken = (event: FormEvent) => {
    event.preventDefault();
    try {
      resetPasswordWithToken(resetEmail, resetToken, resetNewPassword);
      toast.success("Password reset complete. You can sign in now.");
      navigate(`/auth?mode=login&redirect=${encodeURIComponent(redirect)}`);
    } catch (error: any) {
      toast.error(error?.message || "Reset failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#1c1f4a] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-[24px] bg-[#e6e6e6] p-6 shadow-2xl">
        {mode === "signup" ? (
          <>
            <div className="h-20 rounded-2xl bg-[#ec1f6a] text-white text-3xl font-semibold flex items-center justify-center mb-6">
              REGISTER
            </div>
            <form className="space-y-4" onSubmit={handleSignUp}>
              <input className="w-full h-11 rounded-lg border border-black/40 px-4 bg-transparent" placeholder="Full names" value={signupName} onChange={(e) => setSignupName(e.target.value)} required />
              <input className="w-full h-11 rounded-lg border border-black/40 px-4 bg-transparent" placeholder="Email" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
              <input className="w-full h-11 rounded-lg border border-black/40 px-4 bg-transparent" placeholder="Nickname (optional)" value={signupHandle} onChange={(e) => setSignupHandle(e.target.value)} />
              <input className="w-full h-11 rounded-lg border border-black/40 px-4 bg-transparent" placeholder="Password" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required />
              <input className="w-full h-11 rounded-lg border border-black/40 px-4 bg-transparent" placeholder="Confirm password" type="password" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} required />
              <label className="block w-full h-11 rounded-lg border border-black/40 px-4 bg-transparent leading-[2.75rem] cursor-pointer text-black/65">
                {signupAvatar ? "Profile photo selected" : "Choose profile picture"}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
              <button type="submit" className="w-full h-12 rounded-lg bg-[#ec1f6a] text-white text-xl font-semibold">
                REGISTER
              </button>
              {pendingVerificationEmail ? (
                <button type="button" onClick={handleVerify} className="w-full h-11 rounded-lg bg-black text-white font-semibold">
                  VERIFY EMAIL
                </button>
              ) : null}
            </form>
            <p className="text-center mt-5 text-lg">
              have an account?
              <Link className="text-[#ec1f6a] ml-1" to={`/auth?mode=login&redirect=${encodeURIComponent(redirect)}`}>
                log in
              </Link>
            </p>
          </>
        ) : mode === "forgot" ? (
          <>
            <div className="h-20 rounded-2xl bg-[#ec1f6a] text-white text-3xl font-semibold flex items-center justify-center mb-6">
              RESET PASSWORD
            </div>
            <form className="space-y-4" onSubmit={handleForgot}>
              <input className="w-full h-11 rounded-lg border border-black/40 px-4 bg-transparent" placeholder="Registered email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
              <button type="submit" className="w-full h-12 rounded-lg bg-[#ec1f6a] text-white text-lg font-semibold">
                SEND RESET EMAIL
              </button>
            </form>
            <form className="space-y-4 mt-4" onSubmit={handleResetByToken}>
              <input className="w-full h-11 rounded-lg border border-black/40 px-4 bg-transparent" placeholder="Reset token from email" value={resetToken} onChange={(e) => setResetToken(e.target.value)} required />
              <input className="w-full h-11 rounded-lg border border-black/40 px-4 bg-transparent" placeholder="New password" type="password" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} required />
              <button type="submit" className="w-full h-12 rounded-lg bg-black text-white text-lg font-semibold">
                RESET NOW
              </button>
            </form>
            <p className="text-center mt-5 text-lg">
              back to
              <Link className="text-[#ec1f6a] ml-1" to={`/auth?mode=login&redirect=${encodeURIComponent(redirect)}`}>
                sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="h-20 rounded-2xl bg-[#ec1f6a] text-white text-3xl font-semibold flex items-center justify-center mb-6">
              SIGN IN
            </div>
            <div className="flex items-center justify-center gap-8 mb-5 text-3xl">
              <button type="button" onClick={handleGoogle} aria-label="Google sign in">G</button>
              <button type="button" aria-label="Github sign in">G</button>
              <button type="button" aria-label="Facebook sign in">f</button>
            </div>
            <form className="space-y-4" onSubmit={handleLogin}>
              <input className="w-full h-11 rounded-lg border border-black/40 px-4 bg-transparent" placeholder="Email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
              <input className="w-full h-11 rounded-lg border border-black/40 px-4 bg-transparent" placeholder="Current password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
              <label className="inline-flex items-center gap-2 text-black/55">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                remember me
              </label>
              <button type="submit" className="w-full h-12 rounded-lg bg-[#ec1f6a] text-white text-xl font-semibold">
                SIGN IN
              </button>
            </form>
            <div className="text-center mt-4 text-lg">
              <Link className="text-[#ec1f6a]" to={`/auth?mode=forgot&redirect=${encodeURIComponent(redirect)}`}>
                forgot password?
              </Link>
            </div>
            <p className="text-center mt-3 text-lg">
              Don't have an account?
              <Link className="text-[#ec1f6a] ml-1" to={`/auth?mode=signup&redirect=${encodeURIComponent(redirect)}`}>
                sign up
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
