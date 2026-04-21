import { requireAdmin, readJson, send } from "./_utils.js";

export default async function handler(req, res) {
    const ctx = await requireAdmin(req, res);
    if (!ctx) return;

    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

    const { supabaseAdmin } = ctx;
    const body = await readJson(req);

    const email = (body.email || "").trim();
    const password = (body.password || "").trim(); // opcional
    const emailConfirm = body.emailConfirm ?? true;

    if (!email) return send(res, 400, { error: "email is required" });

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: password || undefined,
        email_confirm: emailConfirm,
    });

    if (error) return send(res, 400, { error: error.message });

    return send(res, 200, { ok: true, user: { id: data.user.id, email: data.user.email, created_at: data.user.created_at } });
}
