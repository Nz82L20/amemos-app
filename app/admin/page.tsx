"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

    const text = await r.text();
    let j: any = null;
    try {
      j = text ? JSON.parse(text) : null;
    } catch {}

    if (!r.ok) {
      setMsg(j?.error || "Errore durante la creazione");
      return;
    }

    setMsg("Account creato correttamente ✅");
    setEmail("");
  }

  return (
    <div style={{ maxWidth: 460, margin: "70px auto", padding: 16 }}>
      <div
        style={{
          padding: 26,
          borderRadius: 16,
          background: "#1c1c1c",
          border: "1px solid #333",
        }}
      >
        <h1 style={{ textAlign: "center", marginTop: 0 }}>Admin</h1>

        <p style={{ textAlign: "center", color: "#cbd5e1", marginBottom: 18 }}>
          Aggiungi una email che potrà accedere con password unica.
        </p>

        {/* CAMPO EMAIL */}
        <input
          placeholder="email@esempio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 12,
            borderRadius: 10,
            border: "none",
            marginBottom: 14,
            fontSize: 15,
          }}
        />

        {/* CREA ACCOUNT – GIALLO */}
        <button
          onClick={createUser}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 12,
            borderRadius: 10,
            border: "none",
            fontWeight: "bold",
            background: "#facc15",
            color: "#000",
            cursor: "pointer",
            marginBottom: 10,
          }}
        >
          Crea account
        </button>

        {/* DASHBOARD – AZZURRO */}
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 12,
            borderRadius: 10,
            border: "none",
            background: "#60a5fa",
            color: "#000",
            cursor: "pointer",
          }}
        >
          Vai alla Dashboard
        </button>

        {msg && (
          <p style={{ marginTop: 14, textAlign: "center", color: "#e5e7eb" }}>
            {msg}
          </p>
        )}

        {/* LOGO SOTTO */}
        <div style={{ marginTop: 22, display: "flex", justifyContent: "center" }}>
          <Image
            src="/logo.jpg"
            alt="Amemos - Italia ODV"
            width={160}
            height={110}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
      </div>
    </div>
  );
}
