import { createClient } from "@supabase/supabase-js";
import { send, readJson } from "./_utils";

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return send(res, 500, { error: "Missing server env vars" });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Validar Usuário
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return send(res, 401, { error: "Unauthenticated" });

  const { data: userData, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !userData?.user) return send(res, 401, { error: "Invalid session" });

  try {
    const { id, status } = await readJson(req);
    if (!id) throw new Error("ID da oportunidade é obrigatório");

    const isCompleted = status === 'completed';
    
    // 2. Atualizar Status
    const { error: updateErr } = await supabase
      .from("pipeline_opportunities")
      .update({
        status: status || 'completed',
        completed_at: isCompleted ? new Date().toISOString() : null,
        completed_by: isCompleted ? userData.user.id : null
      })
      .eq("id", id);

    if (updateErr) throw updateErr;

    return send(res, 200, { success: true, message: `Oportunidade ${isCompleted ? 'concluída' : 'reaberta'} com sucesso.` });
  } catch (err) {
    return send(res, 500, { error: err.message });
  }
}
