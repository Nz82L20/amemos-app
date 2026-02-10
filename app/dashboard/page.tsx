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

type SaleRow = {
  created_at: string;
  amount: number;
  user_id: string;
  product_type: string;
  email: string;
};

export default function DashboardPage() {
  const [amount, setAmount] = useState("");
  const [productType, setProductType] = useState("");
  const [todayTotal, setTodayTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [lastSales, setLastSales] = useState<SaleRow[]>([]);
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

  async function refreshLastSales() {
    // 1) ultime 10 vendite (con tipologia)
    const s = await supabase
      .from("sales")
      .select("created_at, amount, user_id, product_type")
      .order("created_at", { ascending: false })
      .limit(10);

    if (s.error) {
      setMsg(s.error.message);
      return;
    }

    const rows = s.data || [];
    const userIds = Array.from(new Set(rows.map((r) => r.user_id))).filter(Boolean);

    // 2) email utenti da profiles
    const p = await supabase.from("profiles").select("id, email").in("id", userIds);

    if (p.error) {
      setMsg(p.error.message);
      return;
    }

    const emailById = new Map<string, string>();
    (p.data || []).forEach((x) => emailById.set(x.id, x.email));

    const merged: SaleRow[] = rows.map((r) => ({
      created_at: r.created_at,
      amount: Number(r.amount),
      user_id: r.user_id,
      product_type: (r as any).product_type || "-----",
      email: emailById.get(r.user_id) || "",
    }));

    setLastSales(merged);
  }

  useEffect(() => {
    requireSessionAndLoadUser();
    refreshTotals();
    refreshLastSales();
  }, []);

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
    await refreshLastSales();
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
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Amemos - inserimento vendite</h1>
          {userEmail && (
            <p style={{ marginTop: 6, marginBottom: 0, color: "#cbd5e1" }}>
              Ciao, <b>{userEmail}</b>
            </p>
          )}
        </div>

        <button
          onClick={logout}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #444",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
            height: 40,
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
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
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
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Totale oggi</div>
          <div style={{ fontSize: 30 }}>{todayTotal.toFixed(2)} €</div>
        </div>

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
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Totale mese</div>
          <div style={{ fontSize: 30 }}>{monthTotal.toFixed(2)} €</div>
        </div>
      </div>

      {/* Inserimento */}
      <div
        style={{
          marginTop: 20,
          padding: 16,
          border: "1px solid #333",
          borderRadius: 12,
          background: "#1c1c1c",
        }}
      >
        <h3>Inserisci importo</h3>

        <input
          placeholder="Es: 12,50"
          value={amount}
          inputMode="decimal"
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

        <input
          placeholder="Inserisci tipologia di prodotto"
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
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
          Salva
        </button>

        <div style={{ marginTop: 12 }}>
          <a href="/api/export" style={{ color: "#60a5fa" }}>
            Esporta Excel
          </a>
        </div>

        {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      </div>

      {/* Ultime 10 vendite */}
      <div
        style={{
          marginTop: 16,
          padding: 16,
          border: "1px solid #333",
          borderRadius: 12,
          background: "#1c1c1c",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Ultime 10 vendite</h3>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #333" }}>
                  Data/Ora
                </th>
                <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #333" }}>
                  Importo (€)
                </th>
                <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #333" }}>
                  Tipologia
                </th>
                <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #333" }}>
                  Email utente
                </th>
              </tr>
            </thead>
            <tbody>
              {lastSales.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 10, color: "#cbd5e1" }}>
                    Nessuna vendita registrata.
                  </td>
                </tr>
              ) : (
                lastSales.map((r, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #2a2a2a" }}>
                      {formatIT(r.created_at)}
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #2a2a2a" }}>
                      {Number(r.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #2a2a2a" }}>
                      {r.product_type || "-----"}
                    </td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #2a2a2a" }}>
                      {r.email}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOGO sotto */}
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
