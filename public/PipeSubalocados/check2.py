import os

filepath = r'C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('<body>')
print(content[idx:idx+800])
