import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useLoginMutation, useLazyMeQuery } from "./authApi";
import { setCredentials, setUser } from "./authSlice";
import { useAppDispatch } from "../../store/hooks";

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [login, { isLoading }] = useLoginMutation();
  const [fetchMe] = useLazyMeQuery();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // 1. Authentication: only this step decides whether credentials are invalid.
    let tokens;
    try {
      tokens = await login({ email, password }).unwrap();
    } catch {
      setErrorMsg("Invalid credentials. Check your email and password.");
      return;
    }

    dispatch(
      setCredentials({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      })
    );

    // 2. Load user data. This is not required to enter because auth already succeeded.
    try {
      const me = await fetchMe().unwrap();
      dispatch(setUser(me));
    } catch {
      // If /auth/me fails, still navigate; the app will retry during rendering.
    }

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Task Manager</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue</p>
        </div>

        {/* Card */}
        <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-1.5"
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
                placeholder="admin@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                           placeholder:text-muted-foreground transition"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                           placeholder:text-muted-foreground transition"
              />
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="rounded-lg bg-error px-4 py-3 text-sm text-error-foreground">
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:opacity-90 disabled:opacity-50
                         text-primary-foreground font-semibold py-2.5 rounded-lg text-sm
                         transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
