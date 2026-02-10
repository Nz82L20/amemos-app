"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
    <div style={{ maxWidth: 460, margin: "70px auto", padding: 16 }}>
      <div
        style={{
          padding: 26,
          borderRadius: 16,
          background: "#1c1c1c",
          border: "1px solid #333",
        }}
      >
        <h1 style={{ textAlign: "center", marginTop: 0, marginBottom: 18 }}>
          Amemos - Italia ODV
        </h1>

        {/* EMAIL (stesso stile di "Admin") */}
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Email</h3>
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
            marginBottom: 12,
          }}
        />

        <button
          onClick={doLogin}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 12,
            borderRadius: 10,
            border: "none",
            fontWeight: "bold",
            background: "#4ade80",
            cursor: "pointer",
          }}
        >
          Accedi
        </button>

        <hr style={{ margin: "18px 0", borderColor: "#333" }} />

        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Admin</h3>
        <input
          placeholder="Password admin"
          type="password"
          value={adminPass}
          onChange={(e) => setAdminPass(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 12,
            borderRadius: 10,
            border: "none",
            marginBottom: 12,
          }}
        />

        <button
          onClick={adminLogin}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #555",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Aggiungi nuovi account
        </button>

        {msg && <p style={{ marginTop: 14, color: "#f87171" }}>{msg}</p>}

        {/* LOGO in basso al centro */}
        <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
          <Image
            src="/logo.jpg"
            alt="Amemos - Italia ODV"
            width={160}
            height={120}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
      </div>
    </div>
  );
}
