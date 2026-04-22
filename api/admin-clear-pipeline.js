import { createClient } from "@supabase/supabase-js";
import { send } from "./_utils";

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

  // 1. Validar Usuário (Admin)
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return send(res, 401, { error: "Unauthenticated" });

  const { data: userData, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !userData?.user) return send(res, 401, { error: `Invalid session: ${authErr?.message || 'No user'}` });

  // 2. Verificar se é ADMIN
  const { data: roleData, error: roleErr } = await supabase
    .from("user_roles")
    .select("role")
    .eq("email", userData.user.email)
    .single();

  if (roleErr || roleData?.role !== 'admin') {
    return send(res, 403, { error: "Apenas administradores podem limpar o pipeline." });
  }

  try {
    console.log(`[CLEAR] Tentando limpar pipeline...`);
    // 3. Deletar TUDO
    // Usar filtro por UUID inexistente para garantir que todos os registros sejam deletados
    const { data: delResult, error: delErr } = await supabase
      .from("pipeline_opportunities")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (delErr) {
        console.error("[CLEAR] Erro na deleção:", delErr);
        throw delErr;
    }

    console.log("[CLEAR] Sucesso ao limpar pipeline!");
    return send(res, 200, { success: true, message: "Pipeline limpo com sucesso." });
  } catch (err) {
    return send(res, 500, { error: err.message });
  }
}
