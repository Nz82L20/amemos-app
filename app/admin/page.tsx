"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function createUser() {
    setMsg(null);

    const r = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    // ✅ robusto: non crasha se il server non manda JSON
    const text = await r.text();
    let j: any = null;
    try {
      j = text ? JSON.parse(text) : null;
    } catch {
      j = null;
    }

    if (!r.ok) {
      setMsg(j?.error ? `${j.error} (status ${r.status})` : `Errore server (status ${r.status})`);
      return;
    }

    setMsg("Creato! Questa email può accedere.");
    setEmail("");
  }

  return (
    <div style={{ maxWidth: 520, margin: "60px auto", padding: 16 }}>
      <div style={{ padding: 24, borderRadius: 14, background: "#1c1c1c", border: "1px solid #333" }}>
        <h1 style={{ marginTop: 0 }}>Admin</h1>
        <p>Aggiungi una email che potrà accedere con password unica.</p>

        <input
          placeholder="email@esempio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 12, padding: 12, borderRadius: 10, border: "none" }}
        />

        <button
          onClick={createUser}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "none",
            fontWeight: "bold",
            background: "#60a5fa",
            cursor: "pointer",
          }}
        >
          Crea account
        </button>

        <button
          onClick={() => router.push("/dashboard")}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #555",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
            marginTop: 10,
          }}
        >
          Vai alla Dashboard
        </button>

        {msg && <p style={{ marginTop: 14 }}>{msg}</p>}
      </div>
    </div>
  );
}
