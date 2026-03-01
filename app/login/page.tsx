"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const FLOATING_ELEMENTS = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,           // full width — some drift into right side
  y: Math.random() * 100,
  scale: 0.35 + Math.random() * 0.45,
  duration: 90 + i * 25,
  delay: i * 8,
}));

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, loading } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    if (!loading && currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, loading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
      router.replace("/dashboard");
    } catch (err: any) {
      let message = "Something went wrong. Please try again.";
      if (err.code) {
        switch (err.code) {
          case "auth/invalid-email": message = "Invalid email format."; break;
          case "auth/user-not-found":
          case "auth/wrong-password": message = "Incorrect email or password."; break;
          case "auth/email-already-in-use": message = "Email already registered."; break;
          case "auth/weak-password": message = "Password too weak (min 6 chars)."; break;
          default: message = err.message || message;
        }
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="h-14 w-14 rounded-full border-4 border-slate-700 border-t-sky-500"
        />
      </div>
    );
  }

  const isLogin = mode === "login";

  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.07)_0%,transparent_65%)] overflow-hidden flex flex-col lg:flex-row">
      {/* Floating subtle elements across whole page */}
      <div className="absolute inset-0 pointer-events-none">
        {FLOATING_ELEMENTS.map((el) => (
          <motion.div
            key={el.id}
            className="absolute text-8xl sm:text-9xl opacity-[0.014] select-none"
            style={{ left: `${el.x}%`, top: `${el.y}%` }}
            animate={{
              y: ["-30%", "130%"],
              opacity: [0.008, 0.035, 0.008],
            }}
            transition={{
              duration: el.duration,
              repeat: Infinity,
              ease: "linear",
              delay: el.delay,
            }}
          >
            🏠
          </motion.div>
        ))}
      </div>

      {/* Left side – Hero / Value prop */}
      <div className="relative z-10 w-full lg:w-5/12 px-8 py-12 lg:px-16 lg:py-20 flex flex-col justify-between">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <motion.div
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-2xl font-bold shadow-2xl shadow-sky-600/30"
            whileHover={{ scale: 1.12, rotate: 6 }}
          >
            PL
          </motion.div>
          <span className="text-2xl font-bold tracking-tight">PMS Lite</span>
        </div>

        {/* Hero text */}
        <div className="my-16 space-y-8">
          <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            Manage your
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              properties
            </span>
            <br />
            with clarity.
          </h1>
          <p className="text-xl lg:text-2xl text-slate-300 font-light max-w-xl">
            Clean, modern dashboard for teams who value simplicity and control.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { icon: "🏠", title: "Properties", desc: "Organize listings effortlessly" },
            { icon: "📅", title: "Availability", desc: "Instant status overview" },
            { icon: "🔒", title: "Secure", desc: "Protected by Firebase Auth" },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              className="rounded-3xl border border-slate-700/50 bg-slate-900/45 p-7 backdrop-blur-lg shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all duration-300"
            >
              <div className="text-5xl mb-5 opacity-90">{f.icon}</div>
              <h4 className="text-lg font-semibold mb-2">{f.title}</h4>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right side – Form area */}
      <div className="relative z-10 w-full lg:w-7/12 flex items-center justify-center px-6 py-12 lg:px-16 lg:py-20">
        {/* Very faint overlay gradient to soften the black edges */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-950/30 to-slate-950 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-lg relative"
        >
          <div className="rounded-3xl border border-slate-700/40 bg-slate-900/60 p-10 lg:p-12 backdrop-blur-2xl shadow-[0_0_60px_-15px_rgba(59,130,246,0.18),0_25px_50px_-12px_rgba(0,0,0,0.6)] hover:shadow-[0_0_80px_-10px_rgba(59,130,246,0.25),0_30px_60px_-15px_rgba(0,0,0,0.7)] transition-shadow duration-500">
            {/* Mode toggle */}
            <div className="relative flex rounded-2xl bg-slate-950/60 p-1.5 border border-slate-700/50 mb-10 overflow-hidden">
              <motion.div
                layoutId="mode-indicator"
                className="absolute inset-y-0 w-1/2 rounded-xl bg-gradient-to-r from-sky-600/80 to-indigo-600/80"
                animate={{ x: isLogin ? "0%" : "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
              <button
                type="button"
                onClick={() => { setMode("login"); setError(null); }}
                className={`relative flex-1 py-4 text-base font-medium z-10 transition-colors ${isLogin ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(null); }}
                className={`relative flex-1 py-4 text-base font-medium z-10 transition-colors ${!isLogin ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                Sign up
              </button>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight">
                {isLogin ? "Welcome back" : "Create account"}
              </h2>
              <p className="mt-3 text-slate-400">
                {isLogin ? "Sign in to access your dashboard" : "Start managing properties today"}
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="mb-8 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-rose-200 text-center text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-7">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-slate-800/60 border border-slate-700/40 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 text-slate-100 placeholder-slate-500 outline-none transition-all duration-200"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-5 py-4 pr-14 rounded-2xl bg-slate-800/60 border border-slate-700/40 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 text-slate-100 placeholder-slate-500 outline-none transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-300 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 2l20 20M6.712 6.72C3.664 8.126 2 12 2 12s3.182 6 10 6c2.21 0 4.073-.66 5.288-1.712M9.01 9.02a3 3 0 0 0 4.982 4.982M17.288 17.288C19.336 15.874 22 12 22 12s-3.182-6-10-6c-1.38 0-2.58.226-3.588.636" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={submitting}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4.5 rounded-2xl font-semibold text-lg shadow-xl transition-all relative overflow-hidden ${
                  submitting ? "bg-slate-700 cursor-not-allowed" : "bg-gradient-to-r from-sky-600 to-indigo-600 hover:shadow-2xl"
                }`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    {isLogin ? "Signing in..." : "Creating..."}
                  </div>
                ) : isLogin ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
                {!submitting && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent -skew-x-12"
                    initial={{ x: "-120%" }}
                    animate={{ x: "220%" }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
                  />
                )}
              </motion.button>
            </form>

            <p className="mt-10 text-center text-sm text-slate-500">
              By continuing, you agree to our{" "}
              <span className="text-sky-400 hover:underline cursor-pointer">Terms</span> and{" "}
              <span className="text-sky-400 hover:underline cursor-pointer">Privacy Policy</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}