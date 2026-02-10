"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function doLogin() {
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: "amemos2026",
    });
    if (error) return setMsg(error.message);
    router.push("/dashboard");
  }

  async function adminLogin() {
    setMsg(null);
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: adminPass }),
    });
    if (!r.ok) return setMsg("Password admin errata");
    router.push("/admin");
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 16 }}>
      <div style={{ padding: 24, borderRadius: 14, background: "#1c1c1c", border: "1px solid #333" }}>
        <h1 style={{ textAlign: "center", marginTop: 0 }}>Amemos</h1>

        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginTop: 6, marginBottom: 12, padding: 12, borderRadius: 10, border: "none" }}
        />

        <button
          onClick={doLogin}
          style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", fontWeight: "bold", background: "#4ade80", cursor: "pointer" }}
        >
          Accedi
        </button>

        <hr style={{ margin: "18px 0", borderColor: "#333" }} />

        <h3 style={{ marginTop: 0 }}>Admin</h3>
        <input
          placeholder="Password admin"
          type="password"
          value={adminPass}
          onChange={(e) => setAdminPass(e.target.value)}
          style={{ width: "100%", marginBottom: 12, padding: 12, borderRadius: 10, border: "none" }}
        />

        <button
          onClick={adminLogin}
          style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #555", background: "#111", color: "#fff", cursor: "pointer" }}
        >
          Aggiungi nuovi account
        </button>

        {msg && <p style={{ marginTop: 14, color: "#f87171" }}>{msg}</p>}
      </div>
    </div>
  );
}
