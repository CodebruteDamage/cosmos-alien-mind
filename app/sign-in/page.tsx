"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setNotice("");

    try {
      if (mode === "sign-up") {
        const result = await authClient.signUp.email({ name: name.trim(), email: email.trim(), password });
        if (result.error) throw new Error(result.error.message);
      } else {
        const result = await authClient.signIn.email({ email: email.trim(), password });
        if (result.error) throw new Error(result.error.message);
      }
      router.replace("/onboarding");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <section className="main-panel" style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: "2rem" }}>
        <div className="prompt-box" style={{ width: "min(100%, 440px)" }}>
          <p className="eyebrow">COSMOS IDENTITY</p>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Access your workspace</h1>
          <p className="intro">Sign in or create an account to continue to COSMOS.</p>
          <div style={{ display: "flex", gap: "0.75rem", margin: "1.25rem 0" }}>
            <button type="button" onClick={() => { setMode("sign-in"); setNotice(""); }} disabled={busy}>Sign in</button>
            <button type="button" onClick={() => { setMode("sign-up"); setNotice(""); }} disabled={busy}>Create account</button>
          </div>
          <form onSubmit={submit} style={{ display: "grid", gap: "0.9rem" }}>
            {mode === "sign-up" && (
              <label>
                Name
                <input autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
              </label>
            )}
            <label>
              Email
              <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Password
              <input type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={12} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} />
              {mode === "sign-up" && <small>Use at least 12 characters.</small>}
            </label>
            <button type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}</button>
          </form>
          {notice && <p className="notice" role="alert">{notice}</p>}
          <p className="disclaimer">Use a unique password. Email delivery for verification and account recovery must be configured before production use.</p>
        </div>
      </section>
    </main>
  );
}
