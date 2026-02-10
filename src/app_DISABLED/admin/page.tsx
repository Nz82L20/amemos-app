"use client";

import { useState } from "react";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function createUser() {
    setMsg(null);
    const r = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const j = await r.json();
    if (!r.ok) return setMsg(j.error || "Errore");
    setMsg("Creato! Ora questa email può accedere.");
    setEmail("");
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1>Admin - Aggiungi account</h1>
      <input
        placeholder="email@esempio.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", marginBottom: 12, padding: 10 }}
      />
      <button onClick={createUser} style={{ width: "100%", padding: 10 }}>
        Crea account
      </button>
      {msg && <p style={{ marginTop: 16 }}>{msg}</p>}
    </div>
  );
}
