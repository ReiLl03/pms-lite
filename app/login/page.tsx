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

const HOUSES = Array.from({ length: 4 }, (_, i) => ({
  id: i,
  x: 10 + Math.random() * 80,
  y: 10 + Math.random() * 80,
  scale: 0.5 + Math.random() * 0.4,
  duration: 60 + i * 15,
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-4 border-slate-700 border-t-sky-500"
        />
      </div>
    );
  }

  const isLogin = mode === "login";

  return (
    <div className="relative flex min-h-screen flex-col md:flex-row bg-slate-950 overflow-hidden">
      {/* Background houses (very subtle) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {HOUSES.map((h) => (
          <motion.div
            key={h.id}
            className="absolute text-7xl opacity-[0.025] pointer-events-none select-none"
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
            animate={{
              y: ["-50%", "150%"],
              opacity: [0.015, 0.045, 0.015],
            }}
            transition={{
              duration: h.duration,
              repeat: Infinity,
              ease: "linear",
              delay: h.delay,
            }}
          >
            🏠
          </motion.div>
        ))}
      </div>

      {/* Left side – Marketing / Value prop (~1/3 on desktop) */}
      <div className="relative z-10 flex w-full flex-col justify-between bg-gradient-to-br from-slate-950 via-indigo-950/10 to-slate-950 p-8 md:w-5/12 md:min-h-screen md:p-12 lg:p-16">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-lg font-bold text-white shadow-lg shadow-sky-600/30"
            whileHover={{ scale: 1.1, rotate: 8 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            PL
          </motion.div>
          <span className="text-xl font-semibold text-white">PMS Lite</span>
        </div>

        {/* Hero text */}
        <div className="my-12 md:my-0">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            Manage your properties
            <br />
            <span className="text-sky-400">with ease and clarity.</span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-md">
            A lightweight, modern property management dashboard built for busy teams who value detail and simplicity.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-4">
          {[
            {
              icon: "🏠",
              title: "Manage properties",
              desc: "Add, edit, and organize listings effortlessly",
            },
            {
              icon: "📅",
              title: "Track availability",
              desc: "See what's available or booked at a glance",
            },
            {
              icon: "🔒",
              title: "Secure access",
              desc: "Firebase Auth keeps your data safe",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.15 }}
              className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5 backdrop-blur-sm"
            >
              <div className="text-2xl mb-3">{item.icon}</div>
              <h4 className="font-medium text-white">{item.title}</h4>
              <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right side – Login form (~2/3 on desktop) */}
      <div className="relative z-10 flex w-full items-center justify-center bg-slate-950/80 p-6 md:w-7/12 md:p-12 lg:p-16">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="rounded-3xl border border-slate-700/50 bg-slate-900/70 p-8 md:p-10 backdrop-blur-xl shadow-2xl">
            {/* Mode toggle */}
            <div className="mb-8 flex rounded-2xl bg-slate-950/60 p-1.5 ring-1 ring-slate-800/60">
              <motion.button
                type="button"
                onClick={() => { setMode("login"); setError(null); }}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${
                  isLogin
                    ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/25"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                whileTap={{ scale: 0.97 }}
              >
                Log in
              </motion.button>
              <motion.button
                type="button"
                onClick={() => { setMode("signup"); setError(null); }}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${
                  !isLogin
                    ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/25"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                whileTap={{ scale: 0.97 }}
              >
                Sign up
              </motion.button>
            </div>

            {/* Heading */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-white">
                {isLogin ? "Sign in to dashboard" : "Create account"}
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                {isLogin
                  ? "Enter your credentials to access your properties."
                  : "Get started with your property dashboard."}
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-200"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <motion.label
                  htmlFor="email"
                  animate={{
                    y: email || emailFocused ? -6 : 0,
                    scale: email || emailFocused ? 0.85 : 1,
                    color: emailFocused ? "#38bdf8" : "#94a3b8",
                  }}
                  transition={{ duration: 0.2 }}
                  className="block origin-left text-sm font-medium text-slate-400"
                >
                  Email
                </motion.label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 px-5 py-3.5 text-slate-100 placeholder:text-slate-500 focus:border-sky-500/60 focus:bg-slate-800 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <motion.label
                  htmlFor="password"
                  animate={{
                    y: password || passwordFocused ? -6 : 0,
                    scale: password || passwordFocused ? 0.85 : 1,
                    color: passwordFocused ? "#38bdf8" : "#94a3b8",
                  }}
                  transition={{ duration: 0.2 }}
                  className="block origin-left text-sm font-medium text-slate-400"
                >
                  Password
                </motion.label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 px-5 py-3.5 pr-12 text-slate-100 placeholder:text-slate-500 focus:border-sky-500/60 focus:bg-slate-800 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-300 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 2l20 20M6.712 6.72C3.664 8.126 2 12 2 12s3.182 6 10 6c2.21 0 4.073-.66 5.288-1.712M9.01 9.02a3 3 0 0 0 4.982 4.982M17.288 17.288C19.336 15.874 22 12 22 12s-3.182-6-10-6c-1.38 0-2.58.226-3.588.636" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-700/25 transition-all hover:shadow-indigo-600/40 disabled:opacity-60"
                whileTap={{ scale: 0.98 }}
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                    />
                    {isLogin ? "Signing in…" : "Creating account…"}
                  </div>
                ) : isLogin ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}

                {/* Subtle shimmer */}
                {!submitting && (
                  <motion.div
                    className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: "-120%" }}
                    animate={{ x: "220%" }}
                    transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
                  />
                )}
              </motion.button>
            </form>

            <p className="mt-8 text-center text-xs text-slate-500">
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