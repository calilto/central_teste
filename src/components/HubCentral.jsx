import React, { useState } from 'react';
import {
    Briefcase,
    TrendingUp,
    ShieldCheck,
    Building2,
    ExternalLink,
    Search,
    Bell,
    Settings,
    Menu,
    LayoutGrid,
    ArrowLeft,
    LogOut,
    ShieldAlert,
    AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

import EurostockSimulador from '../Produtos_Mi/EurostockSimulador';
import EurostockRelatorio from '../Produtos_Mi/EurostockRelatorio';
import SimuladorOpcoes from '../Produtos_Mi/SimuladorOpcoes';
import SimuladorRendaMensal from '../Produtos_Mi/SimuladorRendaMensal';
import SimuladorImobiliario from './SimuladorImobiliario';
import AdminHub from './AdminHub';
import TermoCaixaBtc from '../../app_mesa_rv/Termo_Caixa_BTC/TermoCaixaBtc';
import SimuladorConsorcio from '../../PJ/Consorcio/SimuladorConsorcio';
import SimuladorSeguroVida from '../../Seguros/SimuladorSeguroVida';
import CalculadoraITCMD from './CalculadoraITCMD';
import SimuladorPatrimonial from './SimuladorPatrimonial';
import ComparadorPGBLVGBL from '../../Seguros/ComparadorPGBLVGBL';
import CalculadoraCompromissada from './CalculadoraCompromissada';
import SimuladorCliente from './SimuladorCliente';
import MultiplicadorMilhao from './MultiplicadorMilhao';
import PipelineManager from './PipelineManager';
import { LayoutList } from 'lucide-react';

// --- DADOS DAS FERRAMENTAS (MOCK) ---
const hubData = [
    {
        id: 'produtos',
        title: 'Produtos',
        icon: <Briefcase className="w-4 h-4" />,
        description: 'Ferramentas de prateleira, fundos e captação.',
        tools: [
            { name: 'Comparador de Fundos', desc: 'Análise de lâminas e rentabilidade vs CDI/IBOV.', link: '#', status: 'ativo' },
            { name: 'Simulador Eurostock', desc: 'Análise de troca de posição pré/pós e viabilidade.', link: '#', status: 'novo', toolId: 'eurostock' },
            { name: 'Simuladores', desc: 'Renda Mensal, CDB Equivalente, Multi-Index, Cenários CDI.', link: '#', status: 'novo', toolId: 'eurostock-relatorio' },
            { name: 'Simulador de Renda Mensal', desc: 'Estruturação de carteiras, fluxo de pagamentos e projeção de cupons.', link: '#', status: 'novo', toolId: 'simulador-renda-mensal' },
            { name: 'Multiplicador do Milhão', desc: 'Simulação exponencial de patrimônio, juros compostos e metas reais.', link: '#', status: 'novo', toolId: 'multiplicador-milhao' }
        ]
    },
    {
        id: 'mesa-rv',
        title: 'Mesa de Renda Variável',
        icon: <TrendingUp className="w-4 h-4" />,
        description: 'Estruturação, simuladores e treinamento.',
        tools: [
            { name: 'Pipe subalocados oportunidade', desc: '⚠️ Pipeline focado em geração de grandes receitas (Ouro). Subalocados com alto potencial de conversão.', link: '/PipeSubalocados/index.html', status: 'DESTAQUE', isPremium: true },
            { name: 'Simulador de Opções', desc: 'Precificação e payoff de estruturas.', link: '#', status: 'ativo', toolId: 'mesa-rv-arena' },
            { name: 'Calculadora Long & Short', desc: 'Análise de cointegração e ratio de pares.', link: '#', status: 'manutencao' },
            { name: 'Monitor de Termo', desc: 'Taxas atualizadas e rolagem de posições.', link: '#', status: 'ativo' },
            { name: 'Termo Caixa + BTC', desc: 'Estruturação, custos e viabilidade de trava.', link: '#', status: 'novo', toolId: 'termo-caixa-btc' },
        ]
    },
    {
        id: 'sucessao',
        title: 'Sucessão Patrimonial',
        icon: <ShieldCheck className="w-4 h-4" />,
        description: 'Wealth planning, seguros e offshore.',
        tools: [
            { name: 'Calculadora ITCMD', desc: 'Simulador de custos de inventário por estado.', link: '#', status: 'ativo', toolId: 'calculadora-itcmd' },
            { name: 'Comparador PGBL vs VGBL', desc: 'Descubra qual modalidade de previdência é mais vantajosa para o seu cliente.', link: '#', status: 'novo', toolId: 'comparador-pgbl-vgbl' },
            { name: 'Simulador Offshore', desc: 'Simulação patrimonial Onshore vs Offshore com projeções.', link: '#', status: 'novo', toolId: 'simulador-patrimonial' },
            { name: 'Simulador Seguro de Vida', desc: 'Projeção de alavancagem, prêmio e resgate.', link: '#', status: 'novo', toolId: 'seguro-vida' },
            { name: 'Simulador Cliente', desc: 'Diagnóstico e Fechamento: Impacto financeiro de eventos inesperados.', link: '#', status: 'novo', toolId: 'simulador-cliente' },
        ]
    },
    {
        id: 'pj-banking',
        title: 'PJ & Banking',
        icon: <Building2 className="w-4 h-4" />,
        description: 'Crédito corporativo e serviços bancários.',
        tools: [
            { name: 'Calculadora Compromissada', desc: 'Comparativo de rendimentos: Conta Remunerada vs CDB vs Compromissada.', link: '#', status: 'novo', toolId: 'calculadora-compromissada' },
            { name: 'Simulador Imobiliario', desc: 'Planeje o seu financiamento com seguros e taxas.', link: '#', status: 'ativo', toolId: 'simulador-imobiliario' },
            { name: 'Simulador de Consórcio', desc: 'Dashboard de planejamento financeiro e vendas.', link: '#', status: 'novo', toolId: 'simulador-consorcio' },
        ]
    },
    {
        id: 'pipeline',
        title: 'Pipeline de Vendas',
        icon: <LayoutList className="w-4 h-4" />,
        description: 'Gestão unificada de oportunidades por cliente.',
        tools: [
            { name: 'Meu Pipeline', desc: '⚠️ Dashboard de oportunidades consolidado. RV, Seguros, PJ e Renda Fixa em um só lugar.', link: '#', status: 'DESTAQUE', toolId: 'pipeline-consolidado', isPremium: true },
        ]
    }
];

const allInsights = [
    { color: '#E8B923', text: 'Você não vende produtos, vende projetos de vida e a tranquilidade futura do seu cliente.' },
    { color: '#38BDF8', text: 'O mercado é cíclico, mas o seu relacionamento de confiança deve ser uma linha reta crescente.' },
    { color: '#F87171', text: 'Em momentos de alta volatilidade, o seu papel de educador comportamental fala mais alto que as planilhas.' },
    { color: '#10B981', text: 'Você já pediu uma indicação hoje? Clientes satisfeitos são a sua maior e melhor fonte de captação.' },
    { color: '#F59E0B', text: 'Um cliente bem atendido hoje confia toda a sucessão patrimonial dele a você amanhã.' },
    { color: '#8B5CF6', text: 'Tanto faz se a Selic cai ou sobe: o melhor investimento da sua carreira é na melhoria contínua do seu pitch.' },
    { color: '#EC4899', text: 'Agende pelo menos uma reunião de revisão de portfólio hoje para clientes inativos há mais de 3 meses.' }
];

export default function HubCentral({ session }) {
    const [activeTab, setActiveTab] = useState('produtos');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeApp, setActiveApp] = useState(null);
    const [showInsights, setShowInsights] = useState(false);
    const [currentInsights] = useState(() => {
        const shuffled = [...allInsights].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    });

    const getInitials = () => {
        if (!session?.user?.email) return 'XP';
        const emailPart = session.user.email.split('@')[0];
        const parts = emailPart.split(/[._-]/);
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return emailPart.substring(0, 2).toUpperCase();
    };
    const userInitials = getInitials();

    const activeCategory = hubData.find(cat => cat.id === activeTab);

    const displayedTools = searchQuery
        ? hubData.flatMap(cat => cat.tools.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())))
        : activeCategory?.tools || [];

    if (activeApp === 'eurostock') {
        return <EurostockSimulador onClose={() => setActiveApp(null)} />;
    }

    if (activeApp === 'eurostock-relatorio') {
        return <EurostockRelatorio onClose={() => setActiveApp(null)} />;
    }

    if (activeApp === 'mesa-rv-arena') {
        return <SimuladorOpcoes onClose={() => setActiveApp(null)} />;
    }

    if (activeApp === 'simulador-imobiliario') {
        return <SimuladorImobiliario onClose={() => setActiveApp(null)} />;
    }

    if (activeApp === 'termo-caixa-btc') {
        return <TermoCaixaBtc onClose={() => setActiveApp(null)} />;
    }

    if (activeApp === 'simulador-consorcio') {
        return <SimuladorConsorcio onClose={() => setActiveApp(null)} />;
    }

    if (activeApp === 'seguro-vida') {
        return <SimuladorSeguroVida onClose={() => setActiveApp(null)} />;
    }

    if (activeApp === 'simulador-renda-mensal') {
        return <SimuladorRendaMensal onClose={() => setActiveApp(null)} />;
    }

    if (activeApp === 'calculadora-itcmd') {
        return <CalculadoraITCMD onClose={() => setActiveApp(null)} />;
    }

    if (activeApp === 'simulador-patrimonial') {
        return <SimuladorPatrimonial onClose={() => setActiveApp(null)} />;
    }

    if (activeApp === 'comparador-pgbl-vgbl') {
        return <ComparadorPGBLVGBL onClose={() => setActiveApp(null)} />;
    }

    if (activeApp === 'calculadora-compromissada') {
        return <CalculadoraCompromissada onClose={() => setActiveApp(null)} />;
    }

    if (activeApp === 'simulador-cliente') {
        return <SimuladorCliente onClose={() => setActiveApp(null)} />;
    }

    if (activeApp === 'multiplicador-milhao') {
        return <MultiplicadorMilhao onClose={() => setActiveApp(null)} />;
    }

    if (activeApp === 'pipeline-consolidado') {
        return (
            <div className="flex flex-col h-screen bg-[#0E0F12]">
                <header className="h-[64px] bg-[#0E0F12] border-b border-[#1C1F26] flex items-center justify-between px-4 lg:px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveApp(null)} className="p-1.5 hover:bg-[#1C1F26] text-[#94A3B8] rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-[#E8B923] rounded flex items-center justify-center shadow-[0_0_15px_rgba(232,185,35,0.15)]">
                                <span className="text-[#0E0F12] font-black text-sm">E</span>
                            </div>
                            <div className="flex flex-col justify-center">
                                <h1 className="text-[#E2E8F0] font-bold tracking-widest text-[13px] leading-none mb-1">EUROSTOCK</h1>
                                <p className="text-[9px] text-[#64748B] font-medium tracking-wider leading-none">PIPELINE UNIFICADO</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={async () => await supabase.auth.signOut()} className="flex items-center gap-2 text-[#94A3B8] hover:text-[#F87171] transition-colors text-xs font-medium">
                        <LogOut className="w-4 h-4" /> <span>Sair</span>
                    </button>
                </header>
                <PipelineManager session={session} />
            </div>
        );
    }

    if (activeTab === 'admin' && (session?.user?.email === 'enzo.hejazi@eurostock.com' || session?.user?.email === 'enzo.hejazi@eurostock.com.br')) {
        return (
            <div className="flex flex-col h-screen bg-[#0E0F12]">
                {/* Reutilizando Header com botão de Voltar e Logout */}
                <header className="h-[64px] bg-[#0E0F12] border-b border-[#1C1F26] flex items-center justify-between px-4 lg:px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveTab('produtos')} className="p-1.5 hover:bg-[#1C1F26] text-[#94A3B8] rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-[#E8B923] rounded flex items-center justify-center shadow-[0_0_15px_rgba(232,185,35,0.15)]">
                                <span className="text-[#0E0F12] font-black text-sm">E</span>
                            </div>
                            <div className="flex flex-col justify-center">
                                <h1 className="text-[#E2E8F0] font-bold tracking-widest text-[13px] leading-none mb-1">EUROSTOCK</h1>
                                <p className="text-[9px] text-[#64748B] font-medium tracking-wider leading-none">MODO ADMINISTRADOR</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={async () => await supabase.auth.signOut()} className="flex items-center gap-2 text-[#94A3B8] hover:text-[#F87171] transition-colors text-xs font-medium">
                        <LogOut className="w-4 h-4" /> <span>Sair</span>
                    </button>
                </header>
                <AdminHub />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0E0F12] text-slate-300 font-sans flex flex-col selection:bg-amber-500/30">

            {/* HEADER TOP BAR */}
            <header className="h-[64px] bg-[#0E0F12] border-b border-[#1C1F26] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1.5 hover:bg-[#1C1F26] rounded-lg transition-colors lg:hidden"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-[#E8B923] rounded flex items-center justify-center shadow-[0_0_15px_rgba(232,185,35,0.15)]">
                            <span className="text-[#0E0F12] font-black text-sm">E</span>
                        </div>
                        <div className="flex flex-col justify-center">
                            <h1 className="text-[#E2E8F0] font-bold tracking-widest text-[13px] leading-none mb-1">EUROSTOCK</h1>
                            <p className="text-[9px] text-[#64748B] font-medium tracking-wider leading-none">HUB CENTRAL DE PRODUTOS</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <div className="hidden md:flex items-center bg-[#13151A] border border-[#1C1F26] rounded-md px-3 py-[7px] focus-within:border-[#2D333F] transition-colors">
                        <Search className="w-3.5 h-3.5 text-[#64748B] mr-2" />
                        <input
                            type="text"
                            placeholder="Buscar ferramenta..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-[12px] text-[#E2E8F0] placeholder:text-[#475569] w-[200px]"
                        />
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowInsights(!showInsights)}
                            className="relative p-1 text-[#64748B] hover:text-[#E2E8F0] transition-colors focus:outline-none"
                        >
                            <Bell className="w-[18px] h-[18px]" />
                            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#E8B923] rounded-full shadow-[0_0_5px_rgba(232,185,35,0.5)]"></span>
                        </button>

                        {showInsights && (
                            <div className="absolute right-0 mt-3 w-80 bg-[#1C1F26] border border-[#2D333F] rounded-lg shadow-xl z-50 overflow-hidden animate-fadeIn">
                                <div className="bg-[#15171C] px-4 py-3 border-b border-[#2D333F] flex justify-between items-center">
                                    <h3 className="text-[10px] font-bold text-[#E2E8F0] uppercase tracking-wider">Mindset do Assessor</h3>
                                </div>
                                <div className="p-4 text-xs text-[#94A3B8] leading-relaxed flex flex-col gap-4">
                                    {currentInsights.map((insight, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <div
                                                className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                                                style={{ backgroundColor: insight.color }}
                                            ></div>
                                            <p>{insight.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={async () => await supabase.auth.signOut()}
                        className="flex items-center gap-2 text-[#94A3B8] hover:text-[#F87171] transition-colors mx-2 text-xs font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sair</span>
                    </button>

                    <div className="w-8 h-8 rounded-full bg-[#1C1F26] border border-[#2D333F] flex items-center justify-center cursor-default shrink-0">
                        <span className="text-[10px] font-bold text-[#E2E8F0] tracking-wider">{userInitials}</span>
                    </div>
                </div>
            </header>

            {/* AVISO DO SISTEMA */}
            <div className="bg-[#1C1A14] border-b border-[#2D281D] px-6 py-[6px] flex items-center justify-center gap-2 text-[10px] text-[#E8B923]">
                <AlertTriangle className="w-3 h-3" />
                <span><strong>ATENÇÃO:</strong> Sistema em fase de testes (Beta). Reporte bugs ao time de tech.</span>
            </div>

            <div className="flex flex-1 overflow-hidden relative">

                {/* SIDEBAR */}
                <aside className={`${isSidebarOpen ? 'w-[240px]' : 'w-0'} bg-[#13151A] border-r border-[#1C1F26] flex flex-col shrink-0 transition-all duration-300 overflow-hidden`}>
                    <div className="p-4 pt-6">
                        <p className="text-[9px] font-bold text-[#475569] tracking-widest uppercase mb-5 px-3">Áreas de Negócio</p>
                        <nav className="space-y-1">
                            {hubData.map((category) => {
                                const isActive = activeTab === category.id && !searchQuery;
                                return (
                                    <button
                                        key={category.id}
                                        onClick={() => {
                                            setActiveTab(category.id);
                                            setSearchQuery('');
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-[9px] rounded-lg text-[12px] font-medium transition-all ${isActive
                                            ? 'text-[#E8B923] border border-[#E8B923]/20 bg-transparent'
                                            : 'text-[#94A3B8] hover:text-[#E2E8F0] border border-transparent hover:bg-white/[0.02]'
                                            }`}
                                    >
                                        {React.cloneElement(category.icon, {
                                            className: `w-4 h-4 ${isActive ? 'text-[#E8B923]' : 'text-[#64748B]'}`
                                        })}
                                        {category.title}
                                    </button>
                                );
                            })}

                            {/* Admin Tab (Condicional) */}
                            {(session?.user?.email === 'enzo.hejazi@eurostock.com' || session?.user?.email === 'enzo.hejazi@eurostock.com.br') && (
                                <button
                                    onClick={() => {
                                        setActiveTab('admin');
                                        setSearchQuery('');
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 mt-4 py-[9px] rounded-lg text-[12px] font-bold transition-all ${activeTab === 'admin'
                                        ? 'text-[#F8FAFC] border border-[#F87171]/50 bg-[#F87171]/10'
                                        : 'text-[#F87171] hover:text-[#F8FAFC] border border-[#F87171]/20 hover:bg-[#F87171]/5'
                                        }`}
                                >
                                    <ShieldAlert className="w-4 h-4" />
                                    Gestão Master
                                </button>
                            )}
                        </nav>
                    </div>

                    <div className="mt-auto p-4 border-t border-[#1C1F26]">
                        <button className="w-full flex items-center gap-3 px-3 py-2 text-[12px] text-[#64748B] hover:text-[#94A3B8] transition-colors">
                            <Settings className="w-4 h-4" />
                            Configurações
                        </button>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 overflow-y-auto bg-[#0E0F12]">
                    <div className="max-w-[1000px] p-8 lg:p-10">

                        {!searchQuery ? (
                            <div className="mb-10 pl-1">
                                <div className="flex items-center gap-2.5 mb-2.5">
                                    {React.cloneElement(activeCategory?.icon, { className: 'w-5 h-5 text-[#E8B923]' })}
                                    <h2 className="text-[20px] font-bold text-[#F8FAFC] tracking-tight">{activeCategory?.title}</h2>
                                </div>
                                <p className="text-[12px] text-[#94A3B8] font-medium">{activeCategory?.description}</p>
                            </div>
                        ) : (
                            <div className="mb-10 pl-1">
                                <h2 className="text-[20px] font-bold text-[#F8FAFC] tracking-tight mb-2.5">Resultados para "{searchQuery}"</h2>
                                <p className="text-[12px] text-[#94A3B8] font-medium">Encontradas {displayedTools.length} ferramentas.</p>
                            </div>
                        )}

                        {/* GRID DE FERRAMENTAS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {displayedTools.map((tool, idx) => (
                                <div
                                    key={idx}
                                    className={`group ${tool.isPremium ? 'bg-gradient-to-br from-[#2f2711] to-[#15171C] border-[#E8B923]/60 shadow-[0_0_15px_rgba(232,185,35,0.15)] hover:shadow-[0_0_25px_rgba(232,185,35,0.3)] hover:border-[#E8B923]' : 'bg-[#15171C] border-[#1F232B] hover:border-[#2D333F]'} border rounded-[10px] p-5 transition-all duration-300 flex flex-col h-[185px] relative`}
                                >
                                    {/* Status Badges */}
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        {tool.status === 'novo' && (
                                            <span className="bg-[#2D281D] text-[#E8B923] text-[8px] font-bold px-[6px] py-[3px] rounded-[3px] uppercase tracking-widest border border-[#E8B923]/10">
                                                Novo
                                            </span>
                                        )}
                                        {tool.status === 'DESTAQUE' && (
                                            <span className="bg-[#E8B923] text-[#15171C] text-[9px] font-black px-[8px] py-[4px] rounded shadow-[0_0_10px_rgba(232,185,35,0.4)] uppercase tracking-widest">
                                                Ouro
                                            </span>
                                        )}
                                        {tool.status === 'manutencao' && (
                                            <span className="bg-[#2D1A1A] text-[#F87171] text-[8px] font-bold px-[6px] py-[3px] rounded-[3px] uppercase tracking-widest border border-[#F87171]/10">
                                                Manutenção
                                            </span>
                                        )}
                                    </div>

                                    <div className="mb-3.5">
                                        <Grid2X2 className="w-[18px] h-[18px] text-[#E8B923]" />
                                    </div>

                                    <h3 className="text-[14px] font-bold text-[#F8FAFC] mb-1.5 group-hover:text-[#E8B923] transition-colors leading-tight">
                                        {tool.name}
                                    </h3>

                                    <p className="text-[11px] text-[#94A3B8] leading-[1.6] mb-4 flex-1 pr-2">
                                        {tool.desc}
                                    </p>

                                    {tool.toolId ? (
                                        <button
                                            onClick={() => setActiveApp(tool.toolId)}
                                            className={`mt-auto flex items-center justify-between w-full px-4 py-[10px] rounded-[6px] text-[11px] font-bold transition-all ${tool.status === 'manutencao'
                                                ? 'bg-[#1C1F26] text-[#475569] cursor-not-allowed border border-transparent'
                                                : 'bg-transparent border border-[#E8B923]/30 text-[#E8B923] hover:bg-[#E8B923]/5 hover:border-[#E8B923]/50'
                                                }`}
                                        >
                                            {tool.status === 'manutencao' ? 'Indisponível' : 'Acessar Ferramenta'}
                                            {tool.status !== 'manutencao' && <ExternalLink className="w-3.5 h-3.5 opacity-80" />}
                                        </button>
                                    ) : (
                                        <a
                                            href={tool.link}
                                            className={`mt-auto flex items-center justify-between w-full px-4 py-[10px] rounded-[6px] text-[11px] font-bold transition-all ${tool.status === 'manutencao'
                                                ? 'bg-[#1C1F26] text-[#475569] cursor-not-allowed border border-transparent'
                                                : 'bg-transparent border border-[#E8B923]/30 text-[#E8B923] hover:bg-[#E8B923]/5 hover:border-[#E8B923]/50'
                                                }`}
                                        >
                                            {tool.status === 'manutencao' ? 'Indisponível' : 'Acessar Ferramenta'}
                                            {tool.status !== 'manutencao' && <ExternalLink className="w-3.5 h-3.5 opacity-80" />}
                                        </a>
                                    )}
                                </div>
                            ))}

                            {displayedTools.length === 0 && (
                                <div className="col-span-full py-16 text-center border border-dashed border-[#1C1F26] rounded-[10px] bg-[#13151A]">
                                    <Search className="w-5 h-5 text-[#475569] mx-auto mb-3" />
                                    <p className="text-[12px] text-[#94A3B8]">Nenhuma ferramenta encontrada para sua busca.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

// Custom Grid Icon to match the rounded dots style
function Grid2X2(props) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <rect width="7" height="7" x="3" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="14" rx="1" />
            <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
    );
}
