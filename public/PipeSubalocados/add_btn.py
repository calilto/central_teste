import os

filepath = r'C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target = '<div class="page-header">'

injection = '''<!-- Botão de Voltar Centralizado/Topo -->
    <div style="margin-bottom: 20px;">
        <a href="../../index.html" class="btn btn-outline-light btn-sm" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 500;">
            <i class="bi bi-house-door-fill"></i> Voltar para Home
        </a>
    </div>

    '''

if target in content:
    content = content.replace(target, injection + target, 1)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Injected button successfully.")
else:
    print("Could not find the target div.")
