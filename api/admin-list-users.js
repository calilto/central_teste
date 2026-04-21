import { requireAdmin, readJson, send } from "./_utils.js";

export default async function handler(req, res) {
    const ctx = await requireAdmin(req, res);
    if (!ctx) return;

    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

    const { supabaseAdmin } = ctx;
    const body = await readJson(req);

    const page = Math.max(1, Number(body.page || 1));
    const perPage = Math.min(200, Math.max(1, Number(body.perPage || 50)));
    const q = (body.q || "").trim().toLowerCase();

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) return send(res, 400, { error: error.message });

    let users = (data?.users || []).map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
    }));

    if (q) users = users.filter(u => (u.email || "").toLowerCase().includes(q));

    return send(res, 200, { ok: true, users });
}
