import { createClient } from "@supabase/supabase-js";
import { send, readJson } from "./_utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return send(res, 500, { error: "Server env vars not set" });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return send(res, 401, { error: "Unauthenticated" });

  const { data: userData, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !userData?.user) return send(res, 401, { error: "Invalid session" });

  const body = await readJson(req);
  const { codigo, nome } = body;

  if (!codigo || !nome) {
    return send(res, 400, { error: "Código e Nome são obrigatórios" });
  }

  const { data, error } = await supabase
    .from('client_directory')
    .upsert(
      { codigo, nome, updated_by: userData.user.email, updated_at: new Date().toISOString() },
      { onConflict: 'codigo' }
    );

  if (error) {
    return send(res, 500, { error: error.message });
  }

  return send(res, 200, { success: true });
}
