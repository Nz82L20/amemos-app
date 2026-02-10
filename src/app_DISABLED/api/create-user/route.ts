import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminSession";

export async function POST(req: Request) {
  if (!requireAdmin()) return NextResponse.json({ ok: false }, { status: 401 });

  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: false, error: "Email non valida" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: process.env.COMMON_PASSWORD!,
    email_confirm: true,
  });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, userId: data.user.id });
}
