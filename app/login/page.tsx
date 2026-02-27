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
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
      </div>
    );
  }

  const isLogin = mode === "login";

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <div className="relative hidden w-1/2 flex-col justify-between border-r border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-12 py-10 shadow-2xl lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_55%)]" />
        <div className="relative z-10">
          <div className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-300 shadow-sm backdrop-blur">
            PMS Lite
          </div>
          <h1 className="mt-8 text-4xl font-semibold tracking-tight text-slate-50">
            Manage your properties
            <span className="block bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
              with ease and clarity.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-sm text-slate-300/80">
            A lightweight, modern property management dashboard designed for
            busy teams who care about detail and simplicity.
          </p>
        </div>
        <div className="relative z-10 mt-8 space-y-4 text-sm text-slate-300/80">
          <p className="font-medium text-slate-200">Why PMS Lite?</p>
          <ul className="space-y-1 text-xs text-slate-300/80">
            <li>• Clear overview of availability and bookings</li>
            <li>• Fast, secure access with Firebase Auth</li>
            <li>• Built on modern Next.js and Tailwind</li>
          </ul>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-slate-950 px-6 py-10 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-md rounded-2xl bg-slate-950/60 p-8 shadow-2xl shadow-slate-950/80 ring-1 ring-slate-800/80 backdrop-blur">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Welcome to
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-50">
                PMS Lite
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-slate-700">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Live workspace
            </div>
          </div>

          <div className="mb-6 flex rounded-full bg-slate-900/80 p-1 text-xs font-medium text-slate-300 ring-1 ring-slate-800">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full px-3 py-2 transition ${
                isLogin
                  ? "bg-slate-950 text-slate-50 shadow-sm shadow-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full px-3 py-2 transition ${
                !isLogin
                  ? "bg-slate-950 text-slate-50 shadow-sm shadow-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign up
            </button>
          </div>

          <h2 className="mb-2 text-xl font-semibold text-slate-50">
            {isLogin ? "Sign in to dashboard" : "Create your workspace"}
          </h2>
          <p className="mb-6 text-xs text-slate-400">
            {isLogin
              ? "Enter your credentials to access your properties."
              : "It only takes a moment to get started."}
          </p>

          {error && (
            <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/5 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium text-slate-200"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium text-slate-200"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-sky-500/30 transition hover:from-sky-400 hover:to-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200/60 border-t-transparent" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : isLogin ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 text-[11px] leading-relaxed text-slate-500">
            By continuing, you agree to the{" "}
            <span className="cursor-pointer text-slate-300 underline underline-offset-2">
              Terms
            </span>{" "}
            and{" "}
            <span className="cursor-pointer text-slate-300 underline underline-offset-2">
              Privacy Policy
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

