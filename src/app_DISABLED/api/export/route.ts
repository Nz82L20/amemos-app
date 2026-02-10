import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Join: sales -> profiles (email)
  const { data, error } = await supabase
    .from("sales")
    .select("created_at, amount, user_id, profiles(email)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Vendite");

  ws.columns = [
    { header: "Data/Ora", key: "created_at", width: 25 },
    { header: "Importo (€)", key: "amount", width: 15 },
    { header: "Email utente", key: "email", width: 30 },
  ];

  (data || []).forEach((r: any) => {
    ws.addRow({
      created_at: r.created_at,
      amount: Number(r.amount),
      email: r.profiles?.email || "",
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
}
