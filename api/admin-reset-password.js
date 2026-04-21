import { requireAdmin, readJson, send } from "./_utils.js";

export default async function handler(req, res) {
    const ctx = await requireAdmin(req, res);
    if (!ctx) return;

    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

    const { supabaseAdmin } = ctx;
    const body = await readJson(req);

    const email = (body.email || "").trim();
    const redirectTo = (body.redirectTo || "").trim(); // opcional

    if (!email) return send(res, 400, { error: "email is required" });

    // Gera link de recuperação (você pode optar por enviar por e-mail ou mostrar no painel)
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: redirectTo ? { redirectTo } : undefined,
    });

    if (error) return send(res, 400, { error: error.message });

    // Retorna o link para o painel (seguro pois só admin chama)
    return send(res, 200, { ok: true, action_link: data?.properties?.action_link || null });
}
