import os

filepath = r'C:\Users\User4\OneDrive\Antigravity\Central_de_Produtos\public\PipeSubalocados\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target = '<a href="../../index.html" class="btn btn-outline-light btn-sm"'
if target in content:
    print("Found old button")
elif 'container-fluid py-4 p-md-5' in content:
    print("Container fluid found")
else:
    print("Let s see the start of body")
    idx = content.find('<body>')
    print(content[idx:idx+500])
