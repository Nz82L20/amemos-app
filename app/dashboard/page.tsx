"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfTomorrow() {
  const d = startOfToday();
  d.setDate(d.getDate() + 1);
  return d;
}
function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfNextMonth() {
  const d = startOfMonth();
  d.setMonth(d.getMonth() + 1);
  return d;
}

export default function DashboardPage() {
  const [amount, setAmount] = useState("");
  const [todayTotal, setTodayTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function requireSession() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) router.replace("/login");
  }

  async function refreshTotals() {
    setMsg(null);

    const todayFrom = startOfToday().toISOString();
    const todayTo = startOfTomorrow().toISOString();
    const monthFrom = startOfMonth().toISOString();
    const monthTo = startOfNextMonth().toISOString();

    const t = await supabase
      .from("sales")
      .select("amount")
      .gte("created_at", todayFrom)
      .lt("created_at", todayTo);

    const m = await supabase
      .from("sales")
      .select("amount")
      .gte("created_at", monthFrom)
      .lt("created_at", monthTo);

    if (t.error) return setMsg(t.error.message);
    if (m.error) return setMsg(m.error.message);

    setTodayTotal((t.data || []).reduce((s, r) => s + Number(r.amount), 0));
    setMonthTotal((m.data || []).reduce((s, r) => s + Number(r.amount), 0));
  }

  useEffect(() => {
    requireSession();
    refreshTotals();
  }, []);

  async function addSale() {
    setMsg(null);
    const v = Number(amount.replace(",", "."));
    if (!Number.isFinite(v) || v < 0) return setMsg("Inserisci un importo valido");

    const { data } = await supabase.auth.getUser();
    if (!data.user) return setMsg("Non sei loggato");

    const { error } = await supabase.from("sales").insert({
      amount: v,
      user_id: data.user.id,
    });

    if (error) return setMsg(error.message);

    setAmount("");
    await refreshTotals();
    setMsg("Salvato ✅");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div style={{ maxWidth: 760, margin: "20px auto", padding: 16 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap", // ✅ su mobile va a capo
        }}
      >
        <h1 style={{ margin: 0 }}>Amemos - inserimento vendite</h1>

        <button
          onClick={logout}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #444",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* Totali - Responsive */}
      <div
        style={{
          display: "grid",
          gap: 12,
          marginTop: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", // ✅ 1 col su mobile, 2 su PC
        }}
      >
        {/* Oggi - bordo giallo */}
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: "#1c1c1c",
            border: "2px solid #facc15",
            minHeight: 120,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Totale oggi
          </div>
          <div style={{ fontSize: 30 }}>{todayTotal.toFixed(2)} €</div>
        </div>

        {/* Mese - bordo blu */}
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: "#1c1c1c",
            border: "2px solid #60a5fa",
            minHeight: 120,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Totale mese
          </div>
          <div style={{ fontSize: 30 }}>{monthTotal.toFixed(2)} €</div>
        </div>
      </div>

      {/* Inserimento vendita */}
      <div
        style={{
          marginTop: 20,
          padding: 16,
          border: "1px solid #333",
          borderRadius: 12,
          background: "#1c1c1c",
        }}
      >
        <h3>Inserisci vendita</h3>

        <input
          placeholder="Es: 12,50"
          value={amount}
          inputMode="decimal" // ✅ tastiera numerica su mobile
          onChange={(e) => setAmount(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginBottom: 12,
            padding: 12,
            borderRadius: 10,
            border: "none",
          }}
        />

        <button
          onClick={addSale}
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
          Salva vendita
        </button>

        <div style={{ marginTop: 12 }}>
          <a href="/api/export" style={{ color: "#60a5fa" }}>
            Esporta Excel
          </a>
        </div>

        {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      </div>

      {/* LOGO sotto al centro - più piccolo su mobile */}
      <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
        <div style={{ width: "140px" }} className="logoWrap">
          <Image
            src="/logo.jpg"
            alt="Amemos - Italia ODV"
            width={140}
            height={95}
            style={{ objectFit: "contain", width: "100%", height: "auto" }}
            priority
          />
        </div>
      </div>

      {/* Piccolo CSS inline responsive per logo */}
      <style jsx>{`
        @media (min-width: 768px) {
          .logoWrap {
            width: 190px !important;
          }
        }
      `}</style>
    </div>
  );
}
