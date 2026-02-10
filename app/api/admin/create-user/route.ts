import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import crypto from "crypto";

function verifyAdminCookie(req: NextRequest): boolean {
  const cookie = req.cookies.get("admin_session")?.value;
  if (!cookie) return false;

  const [payload, sig] = cookie.split(".");
  if (!payload || !sig) return false;

  const secret = process.env.ADMIN_SESSION_SECRET!;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return sig === expected && payload.startsWith("admin:");
}

export async function POST(req: NextRequest) {
  try {
    // ✅ controllo admin SENZA cookies()
    if (!verifyAdminCookie(req)) {
      return NextResponse.json(
        { ok: false, error: "Non autorizzato" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const email = body?.email;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { ok: false, error: "Email non valida" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: process.env.COMMON_PASSWORD!,
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, userId: data.user.id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Errore interno" },
      { status: 500 }
    );
  }
}
