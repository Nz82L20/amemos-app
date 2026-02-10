"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

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
function monthsAgoDate(n: number) {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - n);
  return d;
}

function formatIT(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function todayLabelIT() {
  const d = new Date();
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function currentMonthLabelIT() {
  const d = new Date();
  const m = d.toLocaleString("it-IT", { month: "long" });
  return m.charAt(0).toUpperCase() + m.slice(1);
}

type SaleRow = {
  created_at: string;
  amount: number;
  user_id: string;
  product_type: string;
  email: string;
};

type SalesFilter = "today" | "month";

export default function DashboardPage() {
  const [amount, setAmount] = useState("");
  const [productType, setProductType] = useState("");

  const [todayTotal, setTodayTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);

  const [msg, setMsg] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  const [lastSales, setLastSales] = useState<SaleRow[]>([]);
  const [salesFilter, setSalesFilter] = useState<SalesFilter>("today");

  const [monthLabels, setMonthLabels] = useState<string[]>([]);
  const [monthTotals, setMonthTotals] = useState<number[]>([]);

  const router = useRouter();

  async function requireSessionAndLoadUser() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.replace("/login");
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    setUserEmail(u.user?.email || "");
  }

  async function refreshTotals() {
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

  async function refreshLastSales(filter: SalesFilter) {
    let fromISO: string;
    let toISO: string;

    if (filter === "today") {
      fromISO = startOfToday().toISOString();
      toISO = startOfTomorrow().toISOString();
    } else {
      fromISO = startOfMonth().toISOString();
      toISO = startOfNextMonth().toISOString();
    }

    const s = await supabase
      .from("sales")
      .select("created_at, amount, user_id, product_type")
      .order("created_at", { ascending: false })
      .gte("created_at", fromISO)
      .lt("created_at", toISO)
      .limit(10);

    if (s.error) return setMsg(s.error.message);

    const rows = s.data || [];
    const userIds = Array.from(new Set(rows.map((r) => r.user_id))).filter(Boolean);

    const p = await supabase.from("profiles").select("id, email").in("id", userIds);
    if (p.error) return setMsg(p.error.message);

    const emailById = new Map<string, string>();
    (p.data || []).forEach((x) => emailById.set(x.id, x.email));

    const merged: SaleRow[] = rows.map((r: any) => ({
      created_at: r.created_at,
      amount: Number(r.amount),
      user_id: r.user_id,
      product_type: r.product_type || "-----",
      email: emailById.get(r.user_id) || "",
    }));

    setLastSales(merged);
  }

  async function refreshMonthlyChart() {
    const from = monthsAgoDate(11).toISOString();

    const s = await supabase
      .from("sales")
      .select("created_at, amount")
      .gte("created_at", from)
      .order("created_at", { ascending: true });

    if (s.error) return setMsg(s.error.message);

    const labels: string[] = [];
    const keys: string[] = [];
    const totals = new Map<string, number>();

    for (let i = 11; i >= 0; i--) {
      const d = monthsAgoDate(i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      keys.push(key);

      const label = d.toLocaleString("it-IT", { month: "long" });
      labels.push(label.charAt(0).toUpperCase() + label.slice(1));
      totals.set(key, 0);
    }

    (s.data || []).forEach((r: any) => {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      totals.set(key, (totals.get(key) || 0) + Number(r.amount));
    });

    setMonthLabels(labels);
    setMonthTotals(keys.map((k) => Math.round(totals.get(k) || 0)));
  }

  useEffect(() => {
    requireSessionAndLoadUser();
    refreshTotals();
    refreshLastSales(salesFilter);
    refreshMonthlyChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshLastSales(salesFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesFilter]);

  async function addSale() {
    setMsg(null);

    const v = Number(amount.replace(",", "."));
    if (!Number.isFinite(v) || v < 0) return setMsg("Inserisci un importo valido");

    const { data } = await supabase.auth.getUser();
    if (!data.user) return setMsg("Non sei loggato");

    const typeToSave = productType.trim() === "" ? "-----" : productType.trim();

    const { error } = await supabase.from("sales").insert({
      amount: v,
      user_id: data.user.id,
      product_type: typeToSave,
    });

    if (error) return setMsg(error.message);

    setAmount("");
    setProductType("");

    await refreshTotals();
    await refreshLastSales(salesFilter);
    await refreshMonthlyChart();

    setMsg("Salvato ✅");
  }

  async function resetToday() {
    const ok = confirm(
      "Vuoi davvero AZZERARE la giornata? Verranno cancellate tutte le vendite di oggi."
    );
    if (!ok) return;

    setMsg(null);
    const r = await fetch("/api/reset-day", { method: "POST" });
    const txt = await r.text();
    let j: any = null;
    try {
      j = txt ? JSON.parse(txt) : null;
    } catch {}

    if (!r.ok) return setMsg(j?.error || "Errore reset (server)");

    await refreshTotals();
    await refreshLastSales(salesFilter);
    await refreshMonthlyChart();

    setMsg("Giornata azzerata ✅");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const chartData = useMemo(() => {
    const darkBlue = "#1d4ed8"; // blu scuro
    return {
      labels: monthLabels,
      datasets: [
        {
          label: "Totale mese (€)",
          data: monthTotals,
          backgroundColor: darkBlue,
          borderRadius: 12,
          borderSkipped: false,
        },
      ],
    };
  }, [monthLabels, monthTotals]);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => `${ctx.parsed.y} €`,
          },
        },
      },
      scales: {
        x: { ticks: { color: "#e5e7eb" }, grid: { color: "#1f2937" } },
        y: { ticks: { color: "#e5e7eb" }, grid: { color: "#1f2937" } },
      },
    } as const;
  }, []);

  const card: React.CSSProperties = {
    padding: 16,
    borderRadius: 16,
    background: "rgba(28,28,28,0.9)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    backdropFilter: "blur(6px)",
  };

  const pillBtn = (activeBg: string, active: boolean): React.CSSProperties => ({
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    cursor: "pointer",
    background: active ? activeBg : "rgba(17,17,17,0.85)",
    color: active ? "#000" : "#fff",
    fontWeight: 800,
  });

  return (
    <div style={{ maxWidth: 820, margin: "18px auto", padding: 16 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, letterSpacing: 0.2 }}>
            Amemos - inserimento vendite
          </h1>
          {userEmail && (
            <p style={{ marginTop: 6, marginBottom: 0, color: "#cbd5e1" }}>
              Ciao, <b>{userEmail}</b>
            </p>
          )}
        </div>

        <button
          onClick={logout}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(17,17,17,0.85)",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Logout
        </button>
      </div>

      {/* Totali */}
      <div
        style={{
          display: "grid",
          gap: 12,
          marginTop: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        {/* Giornata */}
        <div
          style={{
            ...card,
            border: "2px solid rgba(250,204,21,0.85)",
            textAlign: "center",
            minHeight: 140,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 900, color: "#fde68a" }}>
            Totale giornata
          </div>
          <div style={{ fontSize: 34, fontWeight: 900, marginTop: 6 }}>
            {todayTotal.toFixed(2)} €
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: "#cbd5e1", fontStyle: "italic" }}>
            {todayLabelIT()}
          </div>
        </div>

        {/* Mese */}
        <div
          style={{
            ...card,
            border: "2px solid rgba(96,165,250,0.85)",
            textAlign: "center",
            minHeight: 140,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 900, color: "#bfdbfe" }}>
            Totale mese
          </div>
          <div style={{ fontSize: 34, fontWeight: 900, marginTop: 6 }}>
            {monthTotal.toFixed(2)} €
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: "#cbd5e1", fontStyle: "italic" }}>
            {currentMonthLabelIT()}
          </div>
        </div>
      </div>

      {/* Inserimento + Export + Grafico */}
      <div style={{ marginTop: 16, ...card }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Inserisci importo</h3>

        <input
          placeholder="Es: 12,50"
          value={amount}
          inputMode="decimal"
          onChange={(e) => setAmount(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginBottom: 12,
            padding: 14,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            outline: "none",
            background: "rgba(255,255,255,0.95)",
          }}
        />

        <input
          placeholder="Inserisci tipologia di prodotto"
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginBottom: 12,
            padding: 14,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            outline: "none",
            background: "rgba(255,255,255,0.95)",
          }}
        />

        <button
          onClick={addSale}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 14,
            borderRadius: 12,
            border: "none",
            fontWeight: 900,
            background: "linear-gradient(135deg, #4ade80, #22c55e)",
            cursor: "pointer",
          }}
        >
          Salva
        </button>

        <div style={{ marginTop: 12 }}>
          <a href="/api/export" style={{ color: "#93c5fd", fontWeight: 700 }}>
            Esporta Excel
          </a>
        </div>

        <div style={{ marginTop: 14 }}>
          <h3 style={{ marginTop: 0 }}>Totale venduto mese per mese</h3>
          <Bar data={chartData} options={chartOptions} />
        </div>

        {msg && (
          <p style={{ marginTop: 12, color: msg.includes("✅") ? "#86efac" : "#fca5a5" }}>
            {msg}
          </p>
        )}
      </div>

      {/* Ultime 10 vendite */}
      <div style={{ marginTop: 16, ...card }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h3 style={{ marginTop: 0, marginBottom: 0 }}>Ultime 10 vendite</h3>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setSalesFilter("today")}
              style={pillBtn("#facc15", salesFilter === "today")}
            >
              Oggi
            </button>
            <button
              onClick={() => setSalesFilter("month")}
              style={pillBtn("#60a5fa", salesFilter === "month")}
            >
              Mese
            </button>
          </div>
        </div>

        <p style={{ marginTop: 10, color: "#cbd5e1" }}>
          Filtro attivo: <b>{salesFilter === "today" ? "Oggi" : "Mese"}</b>
        </p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                  Data/Ora
                </th>
                <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                  Importo (€)
                </th>
                <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                  Tipologia
                </th>
                <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                  Email utente
                </th>
              </tr>
            </thead>
            <tbody>
              {lastSales.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 10, color: "#cbd5e1" }}>
                    Nessuna vendita trovata per questo filtro.
                  </td>
                </tr>
              ) : (
                lastSales.map((r, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {formatIT(r.created_at)}
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {Number(r.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {r.product_type || "-----"}
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {r.email}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset giornata */}
      <div style={{ marginTop: 16 }}>
        <button
          onClick={resetToday}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 14,
            border: "1px solid rgba(127,29,29,0.6)",
            background: "linear-gradient(135deg, #ef4444, #f97316)",
            color: "#111",
            fontWeight: 900,
            cursor: "pointer",
            boxShadow: "0 10px 26px rgba(239,68,68,0.15)",
          }}
        >
          Reset giornata (azzera vendite di oggi)
        </button>
      </div>

      {/* Logo */}
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
