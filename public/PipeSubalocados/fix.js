const fs = require('fs');
const path = require('path');

const targetPath = "C:/Users/User4/OneDrive/Antigravity/Central_de_Produtos/public/PipeSubalocados/index.html";

try {
    let content = fs.readFileSync(targetPath, 'utf8');

    // Remove old broken injection
    const targetStart = content.indexOf('// --- LOGICA DE BANCO DE DADOS EM NUVEM (SUPABASE) ---');
    const targetEnd = content.indexOf('let supabaseLocalMemory = {};');
    
    if (targetStart !== -1 && targetEnd !== -1) {
        
        let newInjection = `// --- LOGICA DE BANCO DE DADOS EM NUVEM (SUPABASE) ---

            const SUPABASE_URL = "https://yscpojzcxrbjhipnodlk.supabase.co";
            const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzY3BvanpjeHJiamhpcG5vZGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2ODEwMzksImV4cCI6MjA2NTI1NzAzOX0.gviwZ4FO3HmjIZD2tsvDvKR_yhy123T2an8P_uP3Q4w";
            const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            `;

        const newContent = content.substring(0, targetStart) + newInjection + content.substring(targetEnd);
        fs.writeFileSync(targetPath, newContent, 'utf8');
        console.log("Correção aplicada com sucesso!");
        
        // Vamos verificar se a função fetchSupabaseData também precisa de correção
        const correctFetch = `async function fetchSupabaseData() {
                setSyncStatus('loading');
                $('.contact-checkbox, .btn-action-nota').prop('disabled', true); 
                
                try {
                    const { data, error } = await supabaseClient
                        .from('abordagens_clientes')
                        .select('cliente_id, foi_abordado, comentario');
                        
                    if(error) throw error;
                    
                    if(data) {
                        data.forEach(row => {
                            supabaseLocalMemory[row.cliente_id] = {
                                foi_abordado: row.foi_abordado,
                                comentario: row.comentario || ''
                            };
                        });
                        applyDBStatusToUI();
                    }
                    setSyncStatus('ok');
                } catch (e) {
                    console.error('Erro puxando dados do Supabase:', e);
                    setSyncStatus('error');
                    toastr.error('Erro ao conectar ao servidor.');
                } finally {
                    $('.contact-checkbox, .btn-action-nota').prop('disabled', false); 
                }
            }`;

        // Se o powershell corrompeu e o arquivo está com linhas misturadas,
        // vamos substituir a func inteira pelo bloco correto.
        let fStart = fs.readFileSync(targetPath, 'utf8');
        const startIdx = fStart.indexOf('async function fetchSupabaseData() {');
        const endIdx = fStart.indexOf('// Aplica os status visuais em todas as linhas');
        
        if(startIdx !== -1 && endIdx !== -1) {
            let finalContent = fStart.substring(0, startIdx) + correctFetch + "\n\n            " + fStart.substring(endIdx);
            fs.writeFileSync(targetPath, finalContent, 'utf8');
            console.log("Função fetch substituída também.");
        }

    } else {
        console.log("Não encontrado os limites originais para REPLACE.");
    }
} catch (e) {
    console.error(e);
}
