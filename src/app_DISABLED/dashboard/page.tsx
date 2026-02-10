"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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

export default function Dashboard() {
  const [amount, setAmount] = useState("");
  const [todayTotal, setTodayTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  async function refreshTotals() {
    const todayFrom = startOfToday().toISOString();
    const todayTo = startOfTomorrow().toISOString();
    const monthFrom = startOfMonth().toISOString();
    const monthTo = startOfNextMonth().toISOString();

    const t = await supabase.from("sales").select("amount").gte("created_at", todayFrom).lt("created_at", todayTo);
    const m = await supabase.from("sales").select("amount").gte("created_at", monthFrom).lt("created_at", monthTo);

    if (t.error) setMsg(t.error.message);
    if (m.error) setMsg(m.error.message);

    setTodayTotal((t.data || []).reduce((s, r) => s + Number(r.amount), 0));
    setMonthTotal((m.data || []).reduce((s, r) => s + Number(r.amount), 0));
  }

  useEffect(() => {
    refreshTotals();
  }, []);

  async function addSale() {
    setMsg(null);
    const v = Number(amount.replace(",", "."));
    if (!Number.isFinite(v) || v < 0) return setMsg("Inserisci un importo valido");

    const { data } = await supabase.auth.getUser();
    if (!data.user) return setMsg("Non sei loggato");

    const { error } = await supabase.from("sales").insert({ amount: v, user_id: data.user.id });
    if (error) return setMsg(error.message);

    setAmount("");
    await refreshTotals();
    setMsg("Salvato ✅");
  }

  return (
    <div style={{ maxWidth: 680, margin: "20px auto", padding: 16 }}>
      <h1>Dashboard</h1>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h3>Totale oggi</h3>
          <div style={{ fontSize: 28 }}>{todayTotal.toFixed(2)} €</div>
        </div>
        <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h3>Totale mese</h3>
          <div style={{ fontSize: 28 }}>{monthTotal.toFixed(2)} €</div>
        </div>
      </div>

      <div style={{ marginTop: 20, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <h3>Inserisci vendita</h3>
        <input
          placeholder="Es: 12,50"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: "100%", marginBottom: 12, fontSize: 18, padding: 10 }}
        />
        <button onClick={addSale} style={{ width: "100%", padding: 12, fontSize: 16 }}>
          Salva vendita
        </button>

        <div style={{ marginTop: 12 }}>
          <a href="/api/export" style={{ display: "inline-block", marginTop: 10 }}>
            Esporta Excel
          </a>
        </div>

        {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      </div>
    </div>
  );
}
