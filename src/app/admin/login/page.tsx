"use client";

import React, { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLogin(): React.ReactElement {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleEmailChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
    setError(""); // Clear error when user types
  }, []);

  const handlePasswordChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value);
    setError(""); // Clear error when user types
  }, []);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();
      setIsLoading(true);
      setError("");

      try {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("Invalid email or password");
        } else {
          // Check session to ensure authentication worked
          const session = await getSession();
          if (session) {
            router.push("/admin");
            router.refresh();
          } else {
            setError("Authentication failed");
          }
        }
      } catch (err) {
        console.error("Login error:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, router],
  );

  return (
    <div className="bg-background min-h-screen">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-6">
        <div className="w-full space-y-8">
          <div className="text-center">
            <h1 className="text-foreground text-3xl font-bold">Admin Login</h1>
            <p className="mt-2 text-neutral-600">Sign in to access the admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="text-foreground block text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                className="border-border bg-surface text-foreground focus:border-primary focus:ring-primary focus:ring-opacity-50 mt-1 block min-h-[44px] w-full rounded-lg border px-3 py-3 placeholder-neutral-400 focus:ring-2 focus:outline-none"
                placeholder="Enter your email"
                disabled={isLoading}
                aria-describedby={error ? "email-error" : undefined}
              />
            </div>

            <div>
              <label htmlFor="password" className="text-foreground block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={handlePasswordChange}
                className="border-border bg-surface text-foreground focus:border-primary focus:ring-primary focus:ring-opacity-50 mt-1 block min-h-[44px] w-full rounded-lg border px-3 py-3 placeholder-neutral-400 focus:ring-2 focus:outline-none"
                placeholder="Enter your password"
                disabled={isLoading}
                aria-describedby={error ? "password-error" : undefined}
              />
            </div>

            {error && (
              <div
                id="login-error"
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password.trim()}
              className="bg-primary hover:bg-primary-dark focus:ring-primary flex min-h-[44px] w-full items-center justify-center rounded-lg px-4 py-3 font-semibold text-white shadow-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              aria-describedby="login-button-status"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>

            <div id="login-button-status" className="sr-only" aria-live="polite">
              {isLoading ? "Signing in, please wait" : "Ready to sign in"}
            </div>
          </form>

          <div className="text-center">
            <p className="text-sm text-neutral-600">
              Need access? Contact your system administrator.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
