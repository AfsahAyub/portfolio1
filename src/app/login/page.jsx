
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B1026] px-5">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl border border-[#E9C99B]/20 bg-[#151B35] p-8 shadow-2xl"
      >
        <h1 className="mb-2 text-center font-serif text-3xl font-bold text-[#E9C99B]">
          Admin Login
        </h1>

        <p className="mb-8 text-center text-sm text-white/60">
          Sign in to manage your portfolio
        </p>

        <label className="mb-2 block text-sm text-white">
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          className="mb-5 w-full rounded-lg border border-white/20 bg-[#0B1026] px-4 py-3 text-white outline-none focus:border-[#E9C99B]"
        />

        <label className="mb-2 block text-sm text-white">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="mb-5 w-full rounded-lg border border-white/20 bg-[#0B1026] px-4 py-3 text-white outline-none focus:border-[#E9C99B]"
        />

        {error && (
          <p className="mb-4 text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#E9C99B] px-4 py-3 font-semibold text-[#0B1026] transition hover:bg-[#f3d9b5] disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-4 w-full text-sm text-white/60 hover:text-white"
        >
          Back to Portfolio
        </button>
      </form>
    </main>
  );
}
