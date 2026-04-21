import React, { useState, useMemo, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp, ShieldCheck, Landmark, ArrowRight, Wallet,
    Home, Calculator, MapPin, Sparkles, ArrowLeft
} from 'lucide-react';

// Componente para animar os números (Count Up)
const AnimatedNumber = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = displayValue;
        const end = value;
        const duration = 800;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const easeOutExpo = 1 - Math.pow(2, -10 * progress);
            const currentNumber = Math.floor(start + (end - start) * easeOutExpo);

            setDisplayValue(currentNumber);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value]);

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0
    }).format(displayValue);
};

const ITCMD_RATES = {
    'AC': 0.04, 'AL': 0.04, 'AP': 0.04, 'AM': 0.02, 'BA': 0.08,
    'CE': 0.08, 'DF': 0.04, 'ES': 0.04, 'GO': 0.08, 'MA': 0.07,
    'MT': 0.08, 'MS': 0.06, 'MG': 0.05, 'PA': 0.04, 'PB': 0.06,
    'PR': 0.04, 'PE': 0.08, 'PI': 0.04, 'RJ': 0.08, 'RN': 0.06,
    'RS': 0.06, 'RO': 0.04, 'RR': 0.04, 'SC': 0.08, 'SP': 0.04,
    'SE': 0.08, 'TO': 0.08
};

export default function SimuladorPatrimonial({ onClose }) {
    const [valorLiquido, setValorLiquido] = useState(7000000);
    const [valorImobilizado, setValorImobilizado] = useState(3000000);
    const [anos, setAnos] = useState(10);
    const [taxaRetorno, setTaxaRetorno] = useState(8);
    const [estado, setEstado] = useState('SP');

    const ALIQUOTA_PF_MEDIA = 0.15;
    const CUSTO_MANUTENCAO_ANUAL = 45000;
    const HONORARIOS_INVENTARIO = 0.05;

    const resultados = useMemo(() => {
        const patrimonioTotal = valorLiquido + valorImobilizado;
        const aliquotaItcmd = ITCMD_RATES[estado] || 0.04;

        let saldoOnshore = valorLiquido;
        let saldoOffshore = valorLiquido;
        const projecao = [];

        for (let i = 1; i <= anos; i++) {
            const ganhoBrutoOn = saldoOnshore * (taxaRetorno / 100);
            const impostoOn = ganhoBrutoOn * ALIQUOTA_PF_MEDIA;
            saldoOnshore = saldoOnshore + ganhoBrutoOn - impostoOn;

            const ganhoBrutoOff = saldoOffshore * (taxaRetorno / 100);
            saldoOffshore = saldoOffshore + ganhoBrutoOff - CUSTO_MANUTENCAO_ANUAL;

            projecao.push({
                ano: `Ano ${i}`,
                Onshore: Math.round(saldoOnshore),
                Offshore: Math.round(saldoOffshore),
            });
        }

        const economiaTributaria = saldoOffshore - saldoOnshore;
        const custoSucessaoOnshore = (saldoOnshore + valorImobilizado) * (aliquotaItcmd + HONORARIOS_INVENTARIO);
        const custoSucessaoOffshore = (saldoOffshore * 0.01) + (valorImobilizado * (aliquotaItcmd + 0.02));

        const economiaSucessoria = custoSucessaoOnshore - custoSucessaoOffshore;

        return {
            projecao,
            economiaTributaria,
            economiaSucessoria,
            totalEconomia: economiaTributaria + economiaSucessoria,
            valorLiquidoFinal: saldoOffshore,
            valorImobilizado,
            patrimonioTotal: saldoOffshore + valorImobilizado
        };
    }, [valorLiquido, valorImobilizado, anos, taxaRetorno, estado]);

    const pieData = [
        { name: 'Liquidez Offshore', value: resultados.valorLiquidoFinal },
        { name: 'Patrimônio Imobilizado', value: resultados.valorImobilizado },
    ];

    const COLORS = ['#D4AF37', '#1a1a1a'];

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 p-4 md:p-8 font-sans selection:bg-yellow-500/30">
            {onClose && (
                <button
                    onClick={onClose}
                    className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-xl text-zinc-300 hover:text-amber-400 hover:border-amber-500/50 transition-all text-sm"
                >
                    <ArrowLeft size={16} />
                    Voltar ao Hub
                </button>
            )}
            <header className="max-w-7xl mx-auto flex justify-between items-center mb-10 border-b border-white/10 pb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#AA8A2E] rounded flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                        <Landmark className="text-black" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter text-white">EUROSTOCK</h1>
                        <p className="text-[10px] text-[#D4AF37] tracking-[0.3em] uppercase font-bold italic">Private Family Office</p>
                    </div>
                </div>
                <div className="hidden md:block text-right">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Simulação Patrimonial Global</p>
                    <div className="flex gap-2 justify-end mt-1 text-yellow-500 font-black text-[11px]">
                        TOTAL CONSOLIDADO: {formatCurrency(valorLiquido + valorImobilizado)}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Painel de Controle */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5 space-y-8 shadow-inner">
                        <div className="flex items-center gap-3 text-[#D4AF37]">
                            <Calculator size={18} />
                            <h2 className="text-xs font-black uppercase tracking-widest text-white">Parâmetros de Análise</h2>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] uppercase text-gray-500 font-bold flex items-center gap-2 tracking-widest">
                                <MapPin size={12} className="text-[#D4AF37]" /> Jurisdição de Residência
                            </label>
                            <select
                                value={estado}
                                onChange={(e) => setEstado(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-xl p-3.5 text-white text-sm focus:border-[#D4AF37] outline-none hover:border-white/20 transition-all cursor-pointer appearance-none"
                            >
                                {Object.keys(ITCMD_RATES).map(uf => (
                                    <option key={uf} value={uf}>{uf} - Alíquota Sucessória {ITCMD_RATES[uf] * 100}%</option>
                                ))}
                            </select>
                        </div>

                        {/* Input: Patrimônio Líquido */}
                        <div className="space-y-5">
                            <div className="flex justify-between items-end">
                                <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest flex items-center gap-2">
                                    <Wallet size={12} className="text-[#D4AF37]" /> Patrimônio Líquido
                                </label>
                                <span className="text-sm font-black text-white">{formatCurrency(valorLiquido)}</span>
                            </div>
                            <input
                                type="range" min="0" max="100000000" step="1000000"
                                value={valorLiquido} onChange={(e) => setValorLiquido(Number(e.target.value))}
                                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                            />
                            <p className="text-[9px] text-gray-600 uppercase">Investimentos, stocks, cash, bonds</p>
                        </div>

                        {/* Input: Patrimônio Imobilizado */}
                        <div className="space-y-5 border-t border-white/5 pt-5">
                            <div className="flex justify-between items-end">
                                <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest flex items-center gap-2">
                                    <Home size={12} className="text-[#D4AF37]" /> Patrimônio Imobilizado
                                </label>
                                <span className="text-sm font-black text-white">{formatCurrency(valorImobilizado)}</span>
                            </div>
                            <input
                                type="range" min="0" max="100000000" step="1000000"
                                value={valorImobilizado} onChange={(e) => setValorImobilizado(Number(e.target.value))}
                                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-gray-600"
                            />
                            <p className="text-[9px] text-gray-600 uppercase">Imóveis, participações societárias locais</p>
                        </div>
                    </div>

                    <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5 space-y-4">
                        <div className="flex items-center gap-3 text-yellow-500">
                            <Sparkles size={18} />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Exclusividade Offshore</h3>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed italic border-l border-yellow-600/30 pl-4">
                            A estruturação remove a liquidez do <span className="text-white font-bold">Risco-Brasil</span>, enquanto o imobilizado pode ser integrado a uma holding para otimização sucessória.
                        </p>
                    </div>
                </div>

                {/* Visualização de Resultados */}
                <div className="lg:col-span-8 space-y-6">

                    <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-8 text-center">Evolução da Liquidez: Brasil vs Eurostock</h3>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={resultados.projecao}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                                    <XAxis dataKey="ano" stroke="#444" fontSize={9} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#444" fontSize={9} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tickLine={false} axisLine={false} />
                                    <RechartTooltip
                                        cursor={{ fill: 'rgba(212,175,55,0.05)' }}
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px' }}
                                        formatter={(v) => formatCurrency(v)}
                                    />
                                    <Bar name="Brasil" dataKey="Onshore" fill="#222" radius={[2, 2, 0, 0]} barSize={20} />
                                    <Bar name="Offshore" dataKey="Offshore" fill="#D4AF37" radius={[2, 2, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* BANNER INTERATIVO */}
                    <div className="relative group transition-all duration-500">
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600/20 to-yellow-900/40 rounded-[2.5rem] blur-2xl opacity-30 group-hover:opacity-60 transition duration-1000"></div>

                        <div className="relative bg-[#0a0a0a] border border-white/10 p-8 md:p-14 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row items-center gap-12 backdrop-blur-xl">

                            <div className="flex-1 text-center md:text-left z-10">
                                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 shadow-lg shadow-yellow-600/20">
                                    <TrendingUp size={14} /> Vantagem Patrimonial Consolidada
                                </div>

                                <div className="text-white text-5xl md:text-7xl font-black tracking-tighter leading-none mb-4 drop-shadow-2xl">
                                    <AnimatedNumber value={resultados.totalEconomia} />
                                </div>

                                <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mb-10 flex items-center justify-center md:justify-start gap-2">
                                    <span>Simulação Global</span>
                                    <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                                    <span>Impacto Sucessório em {estado}</span>
                                </p>

                                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                    <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/10 transition-colors cursor-help group/item relative">
                                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-tighter mb-1">Ganho em Liquidez</p>
                                        <p className="text-sm font-bold text-[#D4AF37]">{formatCurrency(resultados.economiaTributaria)}</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/10 transition-colors cursor-help group/item relative">
                                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-tighter mb-1">Proteção Sucessória</p>
                                        <p className="text-sm font-bold text-[#D4AF37]">{formatCurrency(resultados.economiaSucessoria)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-6 z-10 w-full md:w-auto">
                                <button className="relative w-full md:w-auto group/btn overflow-hidden bg-white text-black px-12 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        Blindar Patrimônio
                                        <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform duration-300" />
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                                </button>
                                <div className="flex items-center gap-2 text-[9px] text-gray-500 font-black uppercase tracking-widest opacity-60">
                                    <ShieldCheck size={14} className="text-yellow-600" /> Secure Financial Vault
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Seção de Alocação */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5 flex items-center gap-8 shadow-inner">
                            <div className="w-20 h-20">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} innerRadius={28} outerRadius={38} paddingAngle={4} dataKey="value" stroke="none">
                                            {pieData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-gray-500 font-black mb-1 tracking-widest">Mix Patrimonial</p>
                                <p className="text-xs text-white font-medium flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span> Liquidez: {Math.round(valorLiquido / (valorLiquido + valorImobilizado) * 100)}%
                                </p>
                                <p className="text-xs text-gray-500 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/10"></span> Imobilizado: {Math.round(valorImobilizado / (valorLiquido + valorImobilizado) * 100)}%
                                </p>
                            </div>
                        </div>
                        <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5 flex items-center gap-4 text-gray-500 uppercase text-[9px] font-black tracking-widest leading-tight">
                            Estratégia personalizada para ativos locais e internacionais.
                        </div>
                    </div>
                </div>
            </main>

            <footer className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 text-center">
                <p className="text-gray-600 text-[9px] uppercase tracking-[0.6em] font-medium opacity-50">
                    EUROSTOCK ADVISORY • GLOBAL ASSET MANAGEMENT
                </p>
            </footer>
        </div>
    );
}
