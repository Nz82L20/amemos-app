import crypto from "crypto";
import { cookies } from "next/headers";

function sign(payload: string) {
  const secret = process.env.ADMIN_SESSION_SECRET!;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function requireAdmin() {
  const c = cookies().get("admin_session")?.value;
  if (!c) return false;
  const [payload, sig] = c.split(".");
  if (!payload || !sig) return false;
  return sign(payload) === sig && payload.startsWith("admin:");
}
