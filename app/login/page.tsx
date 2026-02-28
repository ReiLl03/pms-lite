"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.replace("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#080d1a" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />
      </div>
    );
  }

  const isLogin = mode === "login";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden" style={{ background: "#080d1a" }}>

      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Blue glow top */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)", animation: "glow1 8s ease-in-out infinite" }}
      />

      {/* Purple glow bottom right */}
      <div
        className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)", animation: "glow2 12s ease-in-out infinite" }}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-[10px] font-bold text-white shadow-lg shadow-sky-500/30">
            PL
          </div>
          <span className="text-sm font-semibold text-slate-300">PMS Lite</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-[11px] text-slate-400 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Live workspace
        </div>
      </div>

      {/* Center content */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-4">

        {/* Heading */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center">
            <span className="text-4xl">🏠</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">
            {isLogin ? "Welcome back" : "Create account"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isLogin ? "Sign in to manage your properties" : "Start managing your properties today"}
          </p>
        </div>

        {/* Card */}
        <div
          className="w-full rounded-2xl p-6"
          style={{
            background: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(148, 163, 184, 0.08)",
            boxShadow: "0 0 0 1px rgba(59,130,246,0.08), 0 32px 64px rgba(0,0,0,0.6)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Toggle */}
          <div className="mb-6 flex rounded-xl bg-slate-900/80 p-1 ring-1 ring-slate-800/60">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-200 ${
                isLogin
                  ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); }}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-200 ${
                !isLogin
                  ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Sign up
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-[11px] text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-slate-800/80 focus:ring-2 focus:ring-blue-500/15"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-slate-800/80 focus:ring-2 focus:ring-blue-500/15"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all duration-200 hover:from-sky-400 hover:to-blue-500 hover:shadow-sky-400/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : isLogin ? (
                <>
                  Sign in
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              ) : (
                <>
                  Create account
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] text-slate-600">
            By continuing you agree to our{" "}
            <span className="cursor-pointer text-slate-500 underline underline-offset-2 hover:text-slate-300 transition-colors">Terms</span>
            {" "}and{" "}
            <span className="cursor-pointer text-slate-500 underline underline-offset-2 hover:text-slate-300 transition-colors">Privacy Policy</span>
          </p>
        </div>

        {/* Feature pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {[
            { icon: "🏠", label: "Property Management" },
            { icon: "📊", label: "Live Analytics" },
            { icon: "🔒", label: "Secure Auth" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-1.5 rounded-full border border-slate-800/80 bg-slate-900/40 px-3 py-1.5 text-[11px] text-slate-500 backdrop-blur transition-colors hover:border-slate-700 hover:text-slate-400"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes glow1 {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.2; }
          50% { transform: translateX(-50%) scale(1.2); opacity: 0.3; }
        }
        @keyframes glow2 {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.3); opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}
