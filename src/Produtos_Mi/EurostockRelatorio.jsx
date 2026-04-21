import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine, Legend, BarChart, Bar
} from 'recharts';
import {
    Calculator, DollarSign, TrendingUp, Calendar, PieChart,
    Share2, FileText, Check, Sliders, Monitor, Printer, RefreshCw,
    ArrowRight, Info, Copy, ArrowLeft
} from 'lucide-react';

/**
 * UTILS & MATH
 */
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatPercent = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100);
};

// Conversão Taxa Anual -> Mensal: (1 + taxa)^(1/12) - 1
const getMonthlyRate = (annualRate) => {
    return (Math.pow(1 + annualRate / 100, 1 / 12) - 1) * 100;
};

// Alíquota IR Regressivo (baseado na regra Brasil)
const getIRRate = (months) => {
    if (months <= 6) return 22.5;
    if (months < 12) return 20.0;
    if (months <= 24) return 17.5;
    return 15.0; // Acima de 24 meses
};

// Gera cores para o gráfico (THEME: EuroStock / Dark)
const COLORS = {
    primary: '#FACC15', // Yellow-400 (Gold)
    secondary: '#10B981', // Emerald-500
    accent: '#fbbf24', // Amber-400
    dark: '#000000', // Black
    grid: '#404040', // Neutral-700
    text: '#e5e5e5', // Neutral-200
    red: '#ef4444',   // Red-500
};

/**
 * COMPONENT: UI ELEMENTS
 */
const Card = ({ title, value, subtext, icon: Icon, highlight = false, meetingMode }) => (
    <div className={`p-4 rounded-xl border transition-all duration-200 ${highlight
        ? 'bg-neutral-800 text-white border-yellow-500 shadow-lg shadow-yellow-900/20'
        : 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-sm hover:border-neutral-700'
        }`}>
        <div className="flex justify-between items-start mb-2">
            <span className={`text-sm font-medium ${highlight ? 'text-neutral-300' : 'text-neutral-400'}`}>{title}</span>
            {Icon && <Icon size={18} className={highlight ? 'text-yellow-400' : 'text-neutral-600'} />}
        </div>
        <div className={`font-bold tracking-tight ${meetingMode ? 'text-4xl' : 'text-2xl'} ${highlight ? 'text-yellow-400' : 'text-white'}`}>
            {value}
        </div>
        {subtext && (
            <div className={`mt-1 text-xs ${highlight ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {subtext}
            </div>
        )}
    </div>
);

const InputField = ({ label, value, onChange, suffix, type = "number", step = "0.01" }) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{label}</label>
        <div className="relative group">
            <input
                type={type}
                step={step}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-2.5 bg-black border border-neutral-800 rounded-lg text-white font-medium focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all group-hover:border-neutral-700"
            />
            {suffix && (
                <span className="absolute right-3 top-2.5 text-neutral-500 text-sm font-medium pointer-events-none">
                    {suffix}
                </span>
            )}
        </div>
    </div>
);

const Toggle = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${active
            ? 'bg-neutral-800 text-yellow-400 ring-1 ring-yellow-500/50'
            : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 border border-neutral-800'
            }`}
    >
        {active ? <Check size={14} /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-neutral-600" />}
        {label}
    </button>
);

/**
 * TABS IMPLEMENTATION
 */

// --- TAB 1: CDB MENSAL (FLUXO DE CAIXA / RENDA) ---
const TabCDB = ({ meetingMode }) => {
    const [principal, setPrincipal] = useState(100000);
    const [annualRate, setAnnualRate] = useState(12.5);
    const [periodMonths, setPeriodMonths] = useState(24);
    const [showCopied, setShowCopied] = useState(false);

    const numPrincipal = Number(principal) || 0;
    const numAnnualRate = Number(annualRate) || 0;
    const numPeriodMonths = Math.max(1, Number(periodMonths) || 1);

    const adjustRate = (delta) => setAnnualRate(prev => Math.max(0, Number((Number(prev) + delta).toFixed(2))));

    const monthlyRate = getMonthlyRate(numAnnualRate);

    // Simulação de Renda Mensal (Sem juros compostos no montante principal)
    const simulationData = useMemo(() => {
        let data = [];
        const grossMonthlyYield = numPrincipal * (monthlyRate / 100);

        let totalGross = 0;
        let totalNet = 0;

        for (let m = 1; m <= numPeriodMonths; m++) {
            const irRate = getIRRate(m);
            const tax = grossMonthlyYield * (irRate / 100);
            const netMonthlyYield = grossMonthlyYield - tax;

            totalGross += grossMonthlyYield;
            totalNet += netMonthlyYield;

            data.push({
                month: m,
                grossYield: grossMonthlyYield,
                tax: tax,
                netYield: netMonthlyYield, // O que cai na conta todo mês
                irRate: irRate,
                accumulatedNet: totalNet
            });
        }
        return { dailyData: data, totalGross, totalNet };
    }, [numPrincipal, monthlyRate, numPeriodMonths]);

    const { dailyData, totalNet } = simulationData;
    const lastMonth = dailyData[dailyData.length - 1];
    const firstMonth = dailyData[0];

    const copyPitch = () => {
        const text = `💰 *Simulação EuroStock - Renda Mensal CDB*\n\nInvestimento: ${formatCurrency(numPrincipal)}\nTaxa: ${numAnnualRate}% a.a.\nPrazo: ${numPeriodMonths} meses\n\n📊 *Fluxo Mensal Estimado:*\nMês 1 (Líquido): ${formatCurrency(firstMonth.netYield)}\nMês 25+ (Líquido): ${formatCurrency(dailyData.find(d => d.month >= 25)?.netYield || lastMonth.netYield)}\n\n*Total Líquido no Bolso:* ${formatCurrency(totalNet)}`;

        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
        } catch (err) {
            console.error('Erro ao copiar', err);
        }
        document.body.removeChild(textArea);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-start gap-3">
                <div className="p-2 bg-neutral-800 rounded-full text-yellow-500 mt-1 border border-neutral-700">
                    <Info size={16} />
                </div>
                <div>
                    <h4 className="font-bold text-white">Simulador de Renda Mensal (Fluxo)</h4>
                    <p className="text-sm text-neutral-400">Esta simulação considera o resgate dos juros todo mês ("viver de renda"), mantendo o principal investido. A renda líquida aumenta conforme a alíquota de IR cai.</p>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-neutral-900 p-5 rounded-xl shadow-sm border border-neutral-800">
                <InputField label="Valor Aplicado" value={principal} onChange={setPrincipal} suffix="R$" />
                <InputField label="Taxa Anual (CDB)" value={annualRate} onChange={setAnnualRate} suffix="%" />
                <InputField label="Prazo (Fluxo)" value={periodMonths} onChange={setPeriodMonths} suffix="Meses" />

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ajuste Taxa</label>
                    <div className="flex gap-2 h-[42px]">
                        <button onClick={() => adjustRate(-0.5)} className="flex-1 bg-black hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg font-medium text-sm transition-colors">-0.5%</button>
                        <button onClick={() => adjustRate(0.5)} className="flex-1 bg-black hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg font-medium text-sm transition-colors">+0.5%</button>
                    </div>
                </div>
            </div>

            {/* Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card title="Renda Bruta (Mensal Fixa)" value={formatCurrency(lastMonth.grossYield)} icon={TrendingUp} meetingMode={meetingMode} />
                <Card title="Renda Líquida (1º Mês)" value={formatCurrency(firstMonth.netYield)} subtext={`IR: ${firstMonth.irRate}%`} icon={DollarSign} meetingMode={meetingMode} />
                <Card title="Renda Líquida (Último)" value={formatCurrency(lastMonth.netYield)} subtext={`IR: ${lastMonth.irRate}%`} icon={DollarSign} highlight meetingMode={meetingMode} />
                <Card title="Total Recebido (Período)" value={formatCurrency(totalNet)} icon={Check} meetingMode={meetingMode} />
            </div>

            {/* Chart - Flow over time */}
            <div className="bg-neutral-900 p-6 rounded-xl shadow-sm border border-neutral-800">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Fluxo de Pagamento Mensal (Líquido)</h3>
                    {meetingMode && <span className="text-sm text-neutral-500">Observe os degraus de aumento na renda conforme IR cai</span>}
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: COLORS.text }} tickLine={false} axisLine={false} />
                            <YAxis tickFormatter={(v) => `R$ ${(v).toFixed(0)}`} tick={{ fontSize: 12, fill: COLORS.text }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                            <Tooltip
                                formatter={(value) => formatCurrency(value)}
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ backgroundColor: '#171717', borderRadius: '8px', border: '1px solid #404040', color: '#fff' }}
                                itemStyle={{ color: '#e5e5e5' }}
                                labelStyle={{ color: '#a3a3a3' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar dataKey="netYield" name="Renda Líquida Mensal" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <button
                    onClick={copyPitch}
                    className="flex items-center gap-2 text-yellow-500 font-medium hover:bg-yellow-500/10 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-yellow-500/20"
                >
                    {showCopied ? <Check size={18} /> : <Copy size={18} />}
                    {showCopied ? "Copiado!" : "Copiar Resumo Comercial"}
                </button>
            </div>

            {!meetingMode && (
                <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-black text-neutral-400 font-semibold border-b border-neutral-800">
                            <tr>
                                <th className="p-4">Mês</th>
                                <th className="p-4">Rendimento Bruto</th>
                                <th className="p-4">Alíquota IR</th>
                                <th className="p-4">Desconto IR</th>
                                <th className="p-4 text-right">Líquido na Conta</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                            {dailyData.map((row) => {
                                // Show first few, transition points (6, 7, 12, 13, 24, 25), and last
                                const show = row.month <= 3 || row.month === 6 || row.month === 7 || row.month === 12 || row.month === 13 || row.month === 24 || row.month === 25 || row.month === numPeriodMonths;
                                if (!show) return null;

                                return (
                                    <tr key={row.month} className={`hover:bg-neutral-800/50 text-neutral-300 ${row.month === 7 || row.month === 13 || row.month === 25 ? 'bg-yellow-500/5' : ''}`}>
                                        <td className="p-4 font-medium text-neutral-400">{row.month}º Mês</td>
                                        <td className="p-4 text-neutral-300">{formatCurrency(row.grossYield)}</td>
                                        <td className="p-4 text-yellow-500 font-bold">{row.irRate}%</td>
                                        <td className="p-4 text-red-400">-{formatCurrency(row.tax)}</td>
                                        <td className="p-4 text-right font-bold text-white">{formatCurrency(row.netYield)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="p-3 text-center text-xs text-neutral-600 bg-black border-t border-neutral-800">
                        * Exibindo meses chave (mudança de alíquota) e extremidades.
                    </div>
                </div>
            )}
        </div>
    );
};

// --- TAB 2: ISENTO (LCI/LCA) COM EQUIVALÊNCIA PRECISA ---
const TabIsento = ({ meetingMode }) => {
    const [principal, setPrincipal] = useState(100000);
    const [annualRate, setAnnualRate] = useState(10.5);
    const [periodMonths, setPeriodMonths] = useState(12);
    const [isAutoIr, setIsAutoIr] = useState(true);
    const [customIrRate, setCustomIrRate] = useState(17.5);

    const numPrincipal = Number(principal) || 0;
    const numAnnualRate = Number(annualRate) || 0;
    const numPeriodMonths = Math.max(1, Number(periodMonths) || 1);

    const monthlyRate = getMonthlyRate(numAnnualRate);
    const finalAmount = numPrincipal * Math.pow(1 + monthlyRate / 100, numPeriodMonths);
    const totalYield = finalAmount - numPrincipal;

    // Atualiza automaticamente o IR quando no modo auto e o prazo muda
    useEffect(() => {
        if (isAutoIr) {
            setCustomIrRate(getIRRate(numPeriodMonths));
        }
    }, [numPeriodMonths, isAutoIr]);

    // Cálculo de Equivalência
    const irRateForPeriod = Number(customIrRate) || 0;
    const equivalentCdbRate = numAnnualRate / (1 - irRateForPeriod / 100);

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-start gap-3">
                <div className="p-2 bg-neutral-800 rounded-full text-yellow-500 mt-1 border border-neutral-700">
                    <Check size={16} />
                </div>
                <div>
                    <h4 className="font-bold text-white">Simulador Isento vs Tributado</h4>
                    <p className="text-sm text-neutral-400">Comparando LCI/LCA com CDB considerando a alíquota de <strong>{irRateForPeriod}%</strong> {isAutoIr ? '(Automática)' : '(Manual)'}.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-neutral-900 p-5 rounded-xl shadow-sm border border-neutral-800">
                <InputField label="Valor Aplicado" value={principal} onChange={setPrincipal} suffix="R$" />
                <InputField label="Taxa LCI/LCA (a.a.)" value={annualRate} onChange={setAnnualRate} suffix="%" />
                <InputField label="Prazo do Investimento" value={periodMonths} onChange={setPeriodMonths} suffix="Meses" />

                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center mb-0.5">
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Alíquota IR</label>
                        <button
                            onClick={() => setIsAutoIr(!isAutoIr)}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isAutoIr ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' : 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}
                        >
                            {isAutoIr ? 'AUTO' : 'MANUAL'}
                        </button>
                    </div>
                    <div className="relative group">
                        <input
                            type="number"
                            step="0.1"
                            value={customIrRate}
                            onChange={(e) => { setIsAutoIr(false); setCustomIrRate(e.target.value); }}
                            className={`w-full p-2.5 border rounded-lg text-white font-medium focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all group-hover:border-neutral-700 ${isAutoIr ? 'bg-neutral-900 border-neutral-800 opacity-80 cursor-not-allowed' : 'bg-black border-yellow-500/50'}`}
                            readOnly={isAutoIr}
                        />
                        <span className="absolute right-3 top-2.5 text-neutral-500 text-sm font-medium pointer-events-none">%</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card title="Taxa Mensal Isenta" value={`${monthlyRate.toFixed(2)}%`} icon={TrendingUp} meetingMode={meetingMode} />
                <Card title="Rendimento Total" value={formatCurrency(totalYield)} icon={TrendingUp} subtext="Líquido (Isento)" meetingMode={meetingMode} />
                <Card title="CDB Equivalente (Gross Up)" value={`${equivalentCdbRate.toFixed(2)}%`} subtext={`Para bater essa LCI em ${numPeriodMonths} meses`} icon={RefreshCw} highlight meetingMode={meetingMode} />
            </div>

            <div className="bg-neutral-900 p-6 rounded-xl shadow-sm border border-neutral-800">
                <h3 className="text-lg font-bold text-white mb-4">Análise de Equivalência</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Visual Bar */}
                    <div className="relative pt-6 pb-2">
                        <div className="flex items-center gap-4 mb-3">
                            <span className="w-24 text-sm font-bold text-neutral-400 text-right">LCI/LCA</span>
                            <div className="flex-1 h-10 bg-neutral-800 rounded-r-lg relative group overflow-hidden border border-neutral-700">
                                <div className="absolute top-0 left-0 h-full bg-yellow-500" style={{ width: '70%' }}></div>
                                <span className="absolute left-3 top-2.5 text-sm font-bold text-black">{numAnnualRate}% a.a.</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="w-24 text-sm font-bold text-neutral-400 text-right">CDB Necessário</span>
                            <div className="flex-1 h-10 bg-neutral-800 rounded-r-lg relative group overflow-hidden border border-neutral-700">
                                <div className="absolute top-0 left-0 h-full bg-neutral-600 opacity-50" style={{ width: '90%' }}></div>
                                <span className="absolute left-3 top-2.5 text-sm font-bold text-white">{equivalentCdbRate.toFixed(2)}% a.a.</span>
                            </div>
                        </div>
                    </div>

                    {/* Explainer Box */}
                    <div className="bg-black p-4 rounded-lg border border-neutral-800 text-sm space-y-2">
                        <div className="flex justify-between border-b border-neutral-800 pb-2">
                            <span className="text-neutral-500">Prazo Selecionado</span>
                            <span className="text-white font-medium">{numPeriodMonths} meses</span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-800 pb-2">
                            <span className="text-neutral-500">Alíquota IR do Período</span>
                            <span className="text-red-400 font-bold">{irRateForPeriod}%</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span className="text-neutral-500">Fator de Divisão</span>
                            <span className="text-neutral-300 font-mono">1 - {irRateForPeriod / 100} = {(1 - irRateForPeriod / 100).toFixed(4)}</span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2 italic">
                            * Cálculo: Taxa Isenta / (1 - Alíquota IR)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- TAB 3: SIMULADOR COMPOSTO (Multi-Index) ---
const TabComposto = ({ meetingMode }) => {
    const [mode, setMode] = useState('cdi');
    const [principal, setPrincipal] = useState(50000);
    const [months, setMonths] = useState(36);

    const [cdiRate, setCdiRate] = useState(11.25);
    const [percentCdi, setPercentCdi] = useState(110);
    const [preRate, setPreRate] = useState(13.5);
    const [ipcaRate, setIpcaRate] = useState(4.5);
    const [ipcaSpread, setIpcaSpread] = useState(6.0);

    const numPrincipal = Number(principal) || 0;
    const numMonths = Math.max(1, Number(months) || 1);

    const getEffectiveAnnualRate = () => {
        if (mode === 'pre') return Number(preRate) || 0;
        if (mode === 'cdi') return (Number(cdiRate) || 0) * ((Number(percentCdi) || 0) / 100);
        if (mode === 'ipca') {
            const txIpca = (Number(ipcaRate) || 0) / 100;
            const txSpread = (Number(ipcaSpread) || 0) / 100;
            return (((1 + txIpca) * (1 + txSpread)) - 1) * 100;
        }
        return 0;
    };

    const effectiveAnnual = getEffectiveAnnualRate();
    const monthly = getMonthlyRate(effectiveAnnual);
    const finalAmount = numPrincipal * Math.pow(1 + monthly / 100, numMonths);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Mode Selector */}
            <div className="flex justify-center mb-4">
                <div className="bg-neutral-900 p-1 rounded-lg flex gap-1 border border-neutral-800">
                    {['cdi', 'pre', 'ipca'].map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`px-6 py-2 rounded-md text-sm font-bold uppercase transition-all ${mode === m ? 'bg-neutral-800 text-yellow-500 shadow-sm border border-neutral-700' : 'text-neutral-500 hover:text-neutral-300'
                                }`}
                        >
                            {m === 'cdi' ? '% do CDI' : m === 'pre' ? 'Pré-Fixado' : 'IPCA +'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-900 p-5 rounded-xl shadow-sm border border-neutral-800">
                <InputField label="Valor Investido" value={principal} onChange={setPrincipal} suffix="R$" />
                <InputField label="Prazo" value={months} onChange={setMonths} suffix="Meses" />

                {mode === 'cdi' && (
                    <div className="space-y-3">
                        <InputField label="CDI Atual (a.a.)" value={cdiRate} onChange={setCdiRate} suffix="%" />
                        <div className="pt-1">
                            <InputField label="% do CDI" value={percentCdi} onChange={setPercentCdi} suffix="%" />
                        </div>
                    </div>
                )}
                {mode === 'pre' && (
                    <InputField label="Taxa Pré (a.a.)" value={preRate} onChange={setPreRate} suffix="%" />
                )}
                {mode === 'ipca' && (
                    <div className="space-y-3">
                        <InputField label="IPCA Projetado (a.a.)" value={ipcaRate} onChange={setIpcaRate} suffix="%" />
                        <div className="pt-1">
                            <InputField label="Juro Real (Spread)" value={ipcaSpread} onChange={setIpcaSpread} suffix="%" />
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-neutral-800 text-white p-6 rounded-xl shadow-lg border border-neutral-700 flex flex-col md:flex-row justify-between items-center">
                <div>
                    <h3 className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-1">Rentabilidade Efetiva</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">{effectiveAnnual.toFixed(2)}%</span>
                        <span className="text-neutral-500">ao ano</span>
                    </div>
                    <div className="text-neutral-400 text-sm mt-1">
                        Equivalente a {monthly.toFixed(2)}% ao mês
                    </div>
                </div>
                <div className="h-12 w-[1px] bg-neutral-700 hidden md:block mx-6"></div>
                <div className="mt-4 md:mt-0 text-right">
                    <h3 className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-1">Acumulado no Período</h3>
                    <div className="text-4xl font-bold text-yellow-400">{formatCurrency(finalAmount)}</div>
                    <div className="text-yellow-500/80 text-sm mt-1">
                        Rentabilidade: {formatCurrency(finalAmount - numPrincipal)}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- TAB 4: CONVERSOR & CENÁRIOS CDI ---
const TabCenarioCDI = ({ meetingMode }) => {
    const [cdiCurrent, setCdiCurrent] = useState(11.25);
    const [cdiProjected, setCdiProjected] = useState(9.50);
    const [spread, setSpread] = useState(0);
    const [amount, setAmount] = useState(100000);

    const numSpread = Number(spread) || 0;
    const numAmount = Number(amount) || 0;
    const numCdiCurrent = Number(cdiCurrent) || 0;
    const numCdiProjected = Number(cdiProjected) || 0;

    const calculateScenario = (rateNum) => {
        const effective = rateNum + numSpread;
        const monthly = getMonthlyRate(effective);
        const yr1 = numAmount * Math.pow(1 + monthly / 100, 12);
        const yr2 = numAmount * Math.pow(1 + monthly / 100, 24);
        return { effective, monthly, yr1, yr2 };
    };

    const cenarioA = calculateScenario(numCdiCurrent);
    const cenarioB = calculateScenario(numCdiProjected);

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-neutral-900 p-5 rounded-xl shadow-sm border border-neutral-800">
                <InputField label="Valor Base" value={amount} onChange={setAmount} suffix="R$" />
                <InputField label="CDI Hoje (Cenário A)" value={cdiCurrent} onChange={setCdiCurrent} suffix="%" />
                <InputField label="CDI Projetado (Cenário B)" value={cdiProjected} onChange={setCdiProjected} suffix="%" />
                <InputField label="Spread Adicional (ex: CDI + 2%)" value={spread} onChange={setSpread} suffix="%" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Scenario A Card */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                    <div className="bg-black p-4 border-b border-neutral-800 flex justify-between items-center">
                        <h3 className="font-bold text-neutral-300">Cenário A: Manutenção</h3>
                        <span className="bg-neutral-800 text-neutral-300 text-xs px-2 py-1 rounded font-mono border border-neutral-700">CDI {numCdiCurrent}%</span>
                    </div>
                    <div className="p-6">
                        <div className="flex justify-between mb-4">
                            <span className="text-neutral-500">Taxa Mensal</span>
                            <span className="font-bold text-white">{cenarioA.monthly.toFixed(2)}%</span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="text-xs text-neutral-500 mb-1">Acumulado 1 Ano</div>
                                <div className="text-2xl font-bold text-white">{formatCurrency(cenarioA.yr1)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-neutral-500 mb-1">Acumulado 2 Anos</div>
                                <div className="text-2xl font-bold text-white">{formatCurrency(cenarioA.yr2)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scenario B Card */}
                <div className="bg-neutral-900 border-2 border-yellow-500/30 rounded-xl overflow-hidden shadow-lg shadow-yellow-900/10">
                    <div className="bg-yellow-500/10 p-4 border-b border-yellow-500/20 flex justify-between items-center">
                        <h3 className="font-bold text-yellow-500">Cenário B: Projeção</h3>
                        <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-1 rounded font-mono border border-yellow-500/30">CDI {numCdiProjected}%</span>
                    </div>
                    <div className="p-6">
                        <div className="flex justify-between mb-4">
                            <span className="text-neutral-400">Taxa Mensal</span>
                            <span className="font-bold text-yellow-400">{cenarioB.monthly.toFixed(2)}%</span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="text-xs text-neutral-500 mb-1">Acumulado 1 Ano</div>
                                <div className="text-2xl font-bold text-white">{formatCurrency(cenarioB.yr1)}</div>
                                <div className={`text-xs mt-1 ${cenarioB.yr1 > cenarioA.yr1 ? 'text-emerald-500' : 'text-red-400'}`}>
                                    {cenarioB.yr1 > cenarioA.yr1 ? '+' : ''}{formatCurrency(cenarioB.yr1 - cenarioA.yr1)} vs A
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-neutral-500 mb-1">Acumulado 2 Anos</div>
                                <div className="text-2xl font-bold text-white">{formatCurrency(cenarioB.yr2)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-black p-4 rounded-lg border border-neutral-800 text-sm text-neutral-400">
                <Info size={16} className="inline mr-2 mb-0.5 text-yellow-500" />
                <strong>Impacto do Spread:</strong> Adicionar um spread de {spread}% ao CDI ajuda a mitigar a queda da Selic. No Cenário B, o retorno efetivo seria de <strong>{(numCdiProjected + numSpread).toFixed(2)}% a.a.</strong>
            </div>
        </div>
    );
};

// --- MAIN APP ---
const EurostockRelatorio = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [meetingMode, setMeetingMode] = useState(false);

    const tabs = [
        { id: 0, label: "Renda Mensal (CDB)", icon: FileText, component: TabCDB },
        { id: 1, label: "Isentos (LCI/LCA)", icon: Check, component: TabIsento },
        { id: 2, label: "Simulador Multi", icon: Sliders, component: TabComposto },
        { id: 3, label: "Cenários CDI", icon: RefreshCw, component: TabCenarioCDI },
    ];

    const handlePrint = () => {
        window.print();
    };

    const ActiveComponent = tabs[activeTab].component;

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-yellow-500 selection:text-black pb-20 print:bg-white print:text-black print:pb-0 h-full overflow-y-auto">

            {/* HEADER */}
            <header className="bg-black border-b border-neutral-800 sticky top-0 z-10 print:static print:border-none">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {onClose && (
                            <button onClick={onClose} className="p-1.5 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors mr-2">
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        <div className="bg-yellow-500 p-1.5 rounded-lg flex items-center justify-center">
                            <TrendingUp className="text-black" size={20} />
                        </div>
                        <h1 className="font-bold text-xl tracking-tight text-white hidden md:block">
                            Euro<span className="text-yellow-500">Stock</span> <span className="text-neutral-500 font-normal text-sm ml-2">| Simulador e Relatórios</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4 print:hidden">
                        <Toggle
                            active={meetingMode}
                            onClick={() => setMeetingMode(!meetingMode)}
                            label={meetingMode ? "Modo Reunião" : "Modo Edição"}
                        />
                    </div>
                </div>

                {/* TAB NAVIGATION */}
                <div className="max-w-6xl mx-auto px-4 mt-2 print:hidden w-full overflow-x-auto">
                    <div className="flex gap-1 no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                                    ? 'border-yellow-500 text-yellow-500'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                {meetingMode && (
                    <div className="mb-6 p-3 bg-neutral-900 border border-yellow-500/20 rounded-lg text-yellow-500 text-sm flex items-center justify-center animate-pulse print:hidden">
                        <Monitor size={16} className="mr-2" />
                        Modo apresentação ativo. Detalhes técnicos ocultados para clareza visual.
                    </div>
                )}

                <div className="bg-transparent print:w-full">
                    <div className="print:block hidden mb-8 text-center border-b pb-4">
                        <h2 className="text-2xl font-bold text-black">Relatório de Simulação de Investimentos</h2>
                        <p className="text-gray-500">Gerado em {new Date().toLocaleDateString()}</p>
                    </div>

                    <ActiveComponent meetingMode={meetingMode} />

                    <div className="mt-12 text-center text-xs text-neutral-600 print:mt-20 print:text-gray-400">
                        <p>Simulação para fins educativos. Rentabilidade passada não garante rentabilidade futura.</p>
                        <p className="mt-1">Imposto de Renda segue tabela regressiva vigente.</p>
                    </div>
                </div>
            </main>

            {/* Global CSS for Print & Animations */}
            <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:static { position: static !important; }
          .print\\:border-none { border: none !important; }
          .print\\:w-full { width: 100% !important; }
          .print\\:text-black { color: black !important; }
          .shadow-sm, .shadow-md, .shadow-lg { box-shadow: none !important; border: 1px solid #ddd !important; }
          /* Override dark mode colors for print */
          .bg-neutral-900, .bg-black, .bg-neutral-950 { background-color: white !important; color: black !important; border-color: #ddd !important; }
          .text-white, .text-neutral-200, .text-neutral-300 { color: black !important; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
        </div>
    );
};

export default EurostockRelatorio;
