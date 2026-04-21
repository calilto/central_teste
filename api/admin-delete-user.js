import { requireAdmin, readJson, send } from "./_utils.js";

export default async function handler(req, res) {
    const ctx = await requireAdmin(req, res);
    if (!ctx) return;

    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

    const { supabaseAdmin } = ctx;
    const body = await readJson(req);

    const userId = (body.userId || "").trim();
    if (!userId) return send(res, 400, { error: "userId is required" });

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return send(res, 400, { error: error.message });

    return send(res, 200, { ok: true });
}
