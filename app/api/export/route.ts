export const runtime = "nodejs";

import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // 1) Prendo tutte le vendite (inclusa tipologia)
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("created_at, amount, user_id, product_type")
      .order("created_at", { ascending: false });

    if (salesError) {
      return NextResponse.json({ ok: false, where: "sales", error: salesError.message }, { status: 500 });
    }

    const userIds = Array.from(new Set((sales || []).map((s) => s.user_id))).filter(Boolean);

    // 2) Prendo le email dai profili
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

    if (profilesError) {
      return NextResponse.json({ ok: false, where: "profiles", error: profilesError.message }, { status: 500 });
    }

    const emailById = new Map<string, string>();
    (profiles || []).forEach((p) => emailById.set(p.id, p.email));

    // 3) Creo Excel
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Vendite");

    ws.columns = [
      { header: "Data/Ora", key: "created_at", width: 25 },
      { header: "Importo (€)", key: "amount", width: 15 },
      { header: "Tipologia", key: "product_type", width: 25 },
      { header: "Email utente", key: "email", width: 30 },
    ];

    (sales || []).forEach((r: any) => {
      ws.addRow({
        created_at: r.created_at,
        amount: Number(r.amount),
        product_type: r.product_type || "-----",
        email: emailById.get(r.user_id) || "",
      });
    });

    const buf = await wb.xlsx.writeBuffer();

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="amemos_vendite.xlsx"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Errore sconosciuto" }, { status: 500 });
  }
}
