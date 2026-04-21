const fs = require('fs');

const targetPath = "C:/Users/User4/OneDrive/Antigravity/Central_de_Produtos/public/PipeSubalocados/index.html";
let content = fs.readFileSync(targetPath, 'utf8');

// The file might have multiple injections of `const SUPABASE_URL` because of powershell replace
// Let's find the true beginning of the block
const startMarker = "// --- LOGICA DE BANCO DE DADOS EM NUVEM (SUPABASE) ---";
const endMarker = "let supabaseLocalMemory = {};";

let startIdx = content.indexOf(startMarker);
let endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    let cleanCode = `// --- LOGICA DE BANCO DE DADOS EM NUVEM (SUPABASE) ---

            const SUPABASE_URL = "https://yscpojzcxrbjhipnodlk.supabase.co";
            const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzY3BvanpjeHJiamhpcG5vZGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2ODEwMzksImV4cCI6MjA2NTI1NzAzOX0.gviwZ4FO3HmjIZD2tsvDvKR_yhy123T2an8P_uP3Q4w";
            const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            `;

    // Replace the corrupted header
    content = content.substring(0, startIdx) + cleanCode + content.substring(endIdx);
}

// Now let's fix the broken fetchSupabaseData function that powershell broke by merging lines 
const funcStart = "async function fetchSupabaseData() {";
const nextFuncIndicator = "// Aplica os status visuais";

let funcIdx1 = content.indexOf(funcStart);
let funcIdx2 = content.indexOf(nextFuncIndicator);

if (funcIdx1 !== -1 && funcIdx2 !== -1) {
    let correctFetch = `    async function fetchSupabaseData() {
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
            }
            
            `;

    content = content.substring(0, funcIdx1) + correctFetch + content.substring(funcIdx2);
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log("Correção aplicada com sucesso.");
