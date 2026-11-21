"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/sign-in");
      return;
    }

    let cancelled = false;
    void authClient.organization.list().then(async ({ data, error }) => {
      if (cancelled) return;
      if (error) {
        setNotice(error.message ?? "Could not load organizations.");
        setChecking(false);
        return;
      }
      if (data && data.length > 0) {
        const active = await authClient.organization.setActive({ organizationId: data[0].id });
        if (active.error) {
          setNotice(active.error.message ?? "Could not activate the workspace.");
          setChecking(false);
          return;
        }
        router.replace("/");
        return;
      }
      setChecking(false);
    }).catch((error: unknown) => {
      if (!cancelled) {
        setNotice(error instanceof Error ? error.message : "Could not load organizations.");
        setChecking(false);
      }
    });

    return () => { cancelled = true; };
  }, [isPending, session, router]);

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      const created = await authClient.organization.create({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        keepCurrentActiveOrganization: true,
      });
      if (created.error) throw new Error(created.error.message);
      if (!created.data) throw new Error("Organization creation returned no data.");

      const activated = await authClient.organization.setActive({ organizationId: created.data.id });
      if (activated.error) throw new Error(activated.error.message);
      router.replace("/");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create the workspace.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <section className="main-panel" style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: "2rem" }}>
        <div className="prompt-box" style={{ width: "min(100%, 440px)" }}>
          <p className="eyebrow">COSMOS WORKSPACE SETUP</p>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Create your workspace</h1>
          <p className="intro">Each workspace is an isolated organization. COSMOS uses the verified active organization as the tenant boundary.</p>
          {checking ? <p>Checking your organization memberships…</p> : (
            <form onSubmit={createOrganization} style={{ display: "grid", gap: "0.9rem" }}>
              <label>
                Workspace name
                <input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <label>
                Workspace slug
                <input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" minLength={2} maxLength={48} value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
              </label>
              <button type="submit" disabled={busy}>{busy ? "Creating…" : "Create workspace"}</button>
            </form>
          )}
          {notice && <p className="notice" role="alert">{notice}</p>}
        </div>
      </section>
    </main>
  );
}
