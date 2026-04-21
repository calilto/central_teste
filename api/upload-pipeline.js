import { createClient } from "@supabase/supabase-js";
import { send, readJson } from "./_utils";

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return send(res, 500, { error: "Missing server env vars" });
  }

  // 1. Criar cliente com Service Role (ignora RLS e permite delete/insert livre)
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 2. Validar o Usuário (Auth Token do Front)
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return send(res, 401, { error: "Unauthenticated" });

  const { data: userData, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !userData?.user) return send(res, 401, { error: "Invalid session" });

  const userEmail = userData.user.email;

  // 3. Validar se é LÍDER autorizado
  const { data: roleData, error: roleErr } = await supabase
    .from("user_roles")
    .select("role")
    .eq("email", userEmail)
    .single();

  if (roleErr || !roleData) {
    return send(res, 403, { error: "Access denied. User is not a registered leader." });
  }

  // 4. Receber dados da planilha
  const { data, category } = await readJson(req);
  if (!data || !Array.isArray(data) || !category) {
    return send(res, 400, { error: "Invalid data or category missing" });
  }

  try {
    // 5. Limpar dados anteriores dessa CATEGORIA (para atualização mensal fresca)
    const { error: delErr } = await supabase
      .from("pipeline_opportunities")
      .delete()
      .eq("category", category);

    if (delErr) throw delErr;

    // 6. Inserir Novos Dados
    // Função auxiliar para datas do Excel
    const cleanDate = (val) => {
      if (!val || val === "-" || val === " - " || String(val).trim() === "") return null;
      if (typeof val === 'number') {
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
      }
      return val;
    };

    // Mapeamos os campos da planilha para o banco
    const rowsToInsert = data.map((item) => {
      const spreadsheetTime = String(item.Time || item["Área"] || "").toUpperCase();
      
      // Mapeamento inteligente para os IDs internos
      let finalCategory = category; // Fallback para a seleção do UI
      if (spreadsheetTime.includes("VARIÁVEL") || spreadsheetTime === "RV") finalCategory = "RV";
      if (spreadsheetTime.includes("FIXA") || spreadsheetTime.includes("FUNDOS")) finalCategory = "FIXA_FUNDOS";
      if (spreadsheetTime.includes("SEGUROS")) finalCategory = "SEGUROS";
      if (spreadsheetTime.includes("PJ") || spreadsheetTime.includes("BANKING")) finalCategory = "PJ";

      return {
        assessor_id: parseInt(item.Assessor?.replace("A", "") || "0"),
        category: finalCategory,
        cliente_nome: item.Cliente,
        cliente_codigo: item["Código Cliente"],
        ativo: item.Ativo,
        ticker: item.Ticker,
        emissor: item.Emissor,
        taxa: item.Taxa,
        data_aplicacao: cleanDate(item["Data de Aplicação"]),
        data_vencimento: cleanDate(item["Data de Vencimento"]),
        data_carencia: cleanDate(item["Data de Carência"]),
        quantidade: parseFloat(item.Quantidade || "0"),
        financeiro: parseFloat(item[" Financeiro "] || "0"),
        tipo_oportunidade: item.Oportunidade,
        time_origem: item.Time,
        upload_by: userData.user.id
      };
    });

    const { error: insErr } = await supabase
      .from("pipeline_opportunities")
      .insert(rowsToInsert);

    if (insErr) throw insErr;

    return send(res, 200, { success: true, count: rowsToInsert.length });
  } catch (err) {
    return send(res, 500, { error: err.message });
  }
}
