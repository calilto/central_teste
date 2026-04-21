import os

filepath = r'C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '// --- LOGICA DE BANCO DE DADOS EM NUVEM (SUPABASE) ---'
end_marker = 'let notaModalRef = new bootstrap.Modal(document.getElementById(\'notaModal\'));'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_code = '''// --- LOGICA DE BANCO DE DADOS EM NUVEM (SUPABASE) ---

            const SUPABASE_URL = "https://yscpojzcxrbjhipnodlk.supabase.co";
            const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzY3BvanpjeHJiamhpcG5vZGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2ODEwMzksImV4cCI6MjA2NTI1NzAzOX0.gviwZ4FO3HmjIZD2tsvDvKR_yhy123T2an8P_uP3Q4w";
            const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            let supabaseLocalMemory = {};
            
            function setSyncStatus(status) {
                let el = C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados('#syncStatus');
                if(status === 'loading') {
                    el.html('<i class="bi bi-arrow-repeat spin"></i> Sincronizando com nuvem...').removeClass('sync-error').addClass('syncing');
                } else if(status === 'error') {
                    el.html('<i class="bi bi-exclamation-triangle-fill"></i> Erro de Conexão.').removeClass('syncing').addClass('sync-error');
                } else {
                    el.html('<i class="bi bi-cloud-check-fill"></i> Nuvem atualizada.').removeClass('syncing sync-error');
                }
            }
            
            async function fetchSupabaseData() {
                setSyncStatus('loading');
                C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados('.contact-checkbox, .btn-action-nota').prop('disabled', true); 
                
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
                    C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados('.contact-checkbox, .btn-action-nota').prop('disabled', false); 
                }
            }

            // Aplica os status visuais em todas as linhas
            function applyDBStatusToUI() {
                let count = 0;
                Object.values(supabaseLocalMemory).forEach(v => { if(v.foi_abordado) count++ });
                C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados('#abordadosCount').text(count);
                
                C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados('.contact-checkbox').each(function() {
                    var clientId = C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados(this).attr('data-client');
                    var tr = C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados(this).closest('tr');
                    var dbState = supabaseLocalMemory[clientId];
                    
                    if(dbState && dbState.foi_abordado) {
                        C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados(this).prop('checked', true);
                        tr.addClass('row-contacted');
                    } else {
                        C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados(this).prop('checked', false);
                        tr.removeClass('row-contacted');
                    }
                    
                    var btnNota = C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados(tr).find('.btn-action-nota i');
                    if(dbState && dbState.comentario && dbState.comentario.trim() !== '') {
                        btnNota.removeClass('bi-pencil-square').addClass('bi-file-text-fill').css('color', '#eab308');
                    } else {
                        btnNota.removeClass('bi-file-text-fill').addClass('bi-pencil-square').css('color', '#a1a1aa');
                    }
                });
            }
            
            // Reaplica status ao paginar Table
            table.on('draw', function() {
                applyDBStatusToUI();
            });
            
            // Checkbox Clique e Nuvem
            C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados(document).on('change', '.contact-checkbox', async function() {
                var clientId = C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados(this).attr('data-client');
                var assessorId = C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados(this).attr('data-assessor');
                var isChecked = C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados(this).is(':checked');
                var tr = C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados(this).closest('tr');
                
                if(!supabaseLocalMemory[clientId]) supabaseLocalMemory[clientId] = {};
                supabaseLocalMemory[clientId].foi_abordado = isChecked;
                
                if(isChecked) tr.addClass('row-contacted'); else tr.removeClass('row-contacted');
                
                let c = 0; Object.values(supabaseLocalMemory).forEach(v => { if(v.foi_abordado) c++ }); C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados('#abordadosCount').text(c);
                setSyncStatus('loading');
                
                try {
                    const { data, error } = await supabaseClient
                        .from('abordagens_clientes')
                        .upsert([{  
                            cliente_id: clientId, 
                            foi_abordado: isChecked, 
                            assessor_id: assessorId,
                            comentario: supabaseLocalMemory[clientId].comentario || null
                        }], { onConflict: 'cliente_id' });
                        
                    if(error) throw error;
                    setSyncStatus('ok');
                    if(isChecked) toastr.success('Abordado marcado!');
                } catch (e) {
                    console.error("Erro no supabase check:", e); toastr.error('Erro DB: ' + (e.message || JSON.stringify(e)));
                    setSyncStatus('error');
                    C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados(this).prop('checked', !isChecked); 
                    if(!isChecked) tr.addClass('row-contacted'); else tr.removeClass('row-contacted');
                    supabaseLocalMemory[clientId].foi_abordado = !isChecked;
                }
            });

            // Resolvendo o Botao do Modal Bootstrap (estava com o id possivelmente nao referenciado)
            '''
    
    new_code = new_code.replace('C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados', '$')
    new_content = content[:start_idx] + new_code + content[end_idx:]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success")
else:
    print("Markers not found.")
