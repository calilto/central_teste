const fs = require('fs');

// 1. Update HubCentral.jsx
const hubFile = 'c:/Users/User4/OneDrive/Antigravity/Central_de_Produtos/src/components/HubCentral.jsx';
let hub = fs.readFileSync(hubFile, 'utf8');

// Add isPremium flag
hub = hub.replace(
    /name: 'Pipe subalocados oportunidade', desc: 'Classificação automatizada de Subalocados em Renda Variável com Banco de Dados e Export\.', link: '\/PipeSubalocados\/index\.html', status: 'novo'/g,
    "name: 'Pipe subalocados oportunidade', desc: '⚠️ Pipeline focado em geração de grandes receitas (Ouro). Subalocados com alto potencial de conversão.', link: '/PipeSubalocados/index.html', status: 'DESTAQUE', isPremium: true"
);

// Update mapping to use isPremium
const genericClass = "className={`group bg-[#15171C] border border-[#1F232B] rounded-[10px] p-5 transition-all duration-300 flex flex-col h-[185px] relative hover:border-[#2D333F]`}";
const currentClass = "className=\"group bg-[#15171C] border border-[#1F232B] rounded-[10px] p-5 transition-all duration-300 flex flex-col h-[185px] relative hover:border-[#2D333F]\"";

const premiumClass = "className={`group ${tool.isPremium ? 'bg-gradient-to-br from-[#2f2711] to-[#15171C] border-[#E8B923]/60 hover:border-[#E8B923] shadow-[0_0_15px_rgba(232,185,35,0.15)] hover:shadow-[0_0_25px_rgba(232,185,35,0.3)]' : 'bg-[#15171C] border-[#1F232B] hover:border-[#2D333F]'} border rounded-[10px] p-5 transition-all duration-300 flex flex-col h-[185px] relative`}";

if (hub.includes(currentClass)) {
    hub = hub.replace(currentClass, premiumClass);
} else if (hub.includes(genericClass)) {
    hub = hub.replace(genericClass, premiumClass);
}

// Handle status badge color for DESTAQUE
if (hub.includes("tool.status === 'novo'")) {
    const novoStatusHTML = "{tool.status === 'novo' && (\n                                            <span className=\"bg-[#2D281D] text-[#E8B923] text-[8px] font-bold px-[6px] py-[3px] rounded-[3px] uppercase tracking-widest border border-[#E8B923]/10\">\n                                                Novo\n                                            </span>\n                                        )}";
    const destaqueStatusHTML = novoStatusHTML + "\n                                        {tool.status === 'DESTAQUE' && (\n                                            <span className=\"bg-[#E8B923] text-[#15171C] text-[9px] font-black px-[8px] py-[4px] rounded shadow-[0_0_10px_rgba(232,185,35,0.4)] uppercase tracking-widest\">\n                                                Ouro\n                                            </span>\n                                        )}";

    if (!hub.includes("tool.status === 'DESTAQUE'")) {
        hub = hub.replace(novoStatusHTML, destaqueStatusHTML);
    }
}

fs.writeFileSync(hubFile, hub);
console.log('Updated HubCentral.jsx');

// 2. Add Back button to index.html
const pipeFile = 'c:/Users/User4/OneDrive/Antigravity/Central_de_Produtos/public/PipeSubalocados/index.html';
let pipe = fs.readFileSync(pipeFile, 'utf8');

if (!pipe.includes('bi-arrow-left')) {
    const titleMatch = /<div class="header-title">\s*<div class="d-flex align-items-center gap-3">/;
    if (titleMatch.test(pipe)) {
        pipe = pipe.replace(titleMatch, `<div class="header-title">\n                    <div class="d-flex align-items-center gap-3">\n                        <a href="/" class="btn btn-warning fw-bold text-dark d-flex align-items-center gap-2 me-2" style="border-radius: 8px; box-shadow: 0 0 10px rgba(234, 179, 8, 0.3);"><i class="bi bi-arrow-left fw-bolder"></i> Voltar ao Hub</a>`);
        fs.writeFileSync(pipeFile, pipe);
        console.log('Updated Pipe index.html with back button');
    } else {
        console.log('Could not find header title in index.html to insert the back button');
    }
} else {
    console.log('Back button already exists');
}
