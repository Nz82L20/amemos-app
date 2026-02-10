import { NextResponse } from "next/server";
import crypto from "crypto";

function sign(payload: string) {
  const secret = process.env.ADMIN_SESSION_SECRET!;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function POST(req: Request) {
  const { password } = await req.json();

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const payload = `admin:${Date.now()}`;
  const token = `${payload}.${sign(payload)}`;

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2,
  });

  return res;
}
