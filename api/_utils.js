import { createClient } from "@supabase/supabase-js";

export function send(res, status, data) {
  res.status(status).json(data);
}

export async function readJson(req) {
  try {
    if (req.body && typeof req.body === "object") return req.body;
    return JSON.parse(req.body || "{}");
  } catch {
    return {};
  }
}

/**
 * Valida:
 * - token do usuário (Bearer)
 * - se o user.id está na tabela public.admin_users
 * Requer envs NO SERVER (Vercel):
 * SUPABASE_URL
 * SUPABASE_ANON_KEY
 * SUPABASE_SERVICE_ROLE_KEY
 */
export async function requireAdmin(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ANON = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    send(res, 500, { error: "Server env vars not set (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)" });
    return null;
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    send(res, 401, { error: "Missing Bearer token" });
    return null;
  }

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) {
    send(res, 401, { error: "Invalid token" });
    return null;
  }

  const user = userData.user;

  const { data: adminRow, error: adminErr } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminErr) {
    send(res, 500, { error: adminErr.message });
    return null;
  }

  if (!adminRow) {
    send(res, 403, { error: "Not an admin" });
    return null;
  }

  return { supabaseAdmin, user };
}
