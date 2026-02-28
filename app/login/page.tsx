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
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1e]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
      </div>
    );
  }

  const isLogin = mode === "login";

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12"
      style={{ background: "#0a0f1e" }}
    >
      <div
        className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{
          background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
          animation: "orbFloat1 10s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{
          background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          animation: "orbFloat2 14s ease-in-out infinite",
        }}
      />

      <div className="relative z-10 mb-8 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <span className="text-3xl">🏠</span>
          <span className="text-2xl font-bold tracking-tight text-slate-50">PMS Lite</span>
        </div>
        <p className="text-sm text-slate-400">Manage your properties with ease and clarity</p>
      </div>

      <div
        className="relative z-10 w-full max-w-md rounded-2xl p-8 shadow-2xl"
        style={{
          background: "rgba(15, 23, 42, 0.7)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          boxShadow: "0 0 0 1px rgba(59, 130, 246, 0.15), 0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        <div className="mb-6 flex rounded-full bg-slate-900/80 p-1 text-xs font-medium ring-1 ring-slate-800">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-full px-3 py-2 transition-all duration-200 ${
              isLogin
                ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-full px-3 py-2 transition-all duration-200 ${
              !isLogin
                ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign up
          </button>
        </div>

        <h2 className="mb-1 text-xl font-semibold text-slate-50">
          {isLogin ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mb-6 text-xs text-slate-400">
          {isLogin ? "Sign in to access your dashboard." : "Get started in just a moment."}
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-50 outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-50 outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-all duration-200 hover:from-sky-400 hover:to-blue-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                {isLogin ? "Signing in..." : "Creating account..."}
              </>
            ) : isLogin ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="mt-5 text-[11px] text-slate-500">
          By continuing, you agree to the{" "}
          <span className="cursor-pointer text-slate-400 underline underline-offset-2 hover:text-slate-200">
            Terms
          </span>{" "}
          and{" "}
          <span className="cursor-pointer text-slate-400 underline underline-offset-2 hover:text-slate-200">
            Privacy Policy
          </span>
          .
        </p>
      </div>

      <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3">
        {["🏠 Property Management", "📊 Live Analytics", "🔒 Secure Auth"].map((pill) => (
          <div
            key={pill}
            className="rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1.5 text-xs text-slate-400 backdrop-blur"
          >
            {pill}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes orbFloat1 {
          0%, 100% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.1) translate(0, -20px); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.15) translate(20px, -15px); }
        }
      `}</style>
    </div>
  );
}