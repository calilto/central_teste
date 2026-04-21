import React, { useState, useMemo } from 'react';
import {
    Calculator, TrendingUp, DollarSign, Percent, Calendar, ShieldAlert, CheckCircle2,
    LayoutDashboard, Settings2, ArrowRight, RefreshCcw, Briefcase, Info, ArrowDownToLine, ArrowUpFromLine, ArrowLeft
} from 'lucide-react';

// Base de Deságios B3
const desagiosB3 = {
    'PETR4': { aceito: true, desagio: 0.15 },
    'VALE3': { aceito: true, desagio: 0.18 },
    'WEGE3': { aceito: true, desagio: 0.25 },
    'ITUB4': { aceito: true, desagio: 0.15 },
    'BBDC4': { aceito: true, desagio: 0.16 },
    'BBAS3': { aceito: true, desagio: 0.18 },
    'MGLU3': { aceito: true, desagio: 0.40 },
    'TECK11': { aceito: true, desagio: 0.20 },
    'WHRL3': { aceito: false, desagio: 0.80 },
    'WEST3': { aceito: false, desagio: 0.45 },
};

export default function TermoCaixaBtc({ onClose }) {
    // Navegação de Abas
    const [activeTab, setActiveTab] = useState('operacional'); // Iniciando na operacional para auditoria

    // --- GRUPO 1: DADOS PRINCIPAIS ---
    const [ativo, setAtivo] = useState('TECK11');
    const [preco, setPreco] = useState(117.22);
    const [volumeFinanceiro, setVolumeFinanceiro] = useState(81500);

    const [diasCorridos, setDiasCorridos] = useState(365);
    const [diasUteis, setDiasUteis] = useState(259);

    // --- GRUPO 2: TAXAS E CUSTOS (D+2 - Venda à Vista) ---
    const [txJurosTermo, setTxJurosTermo] = useState(14.90);
    const [corretagemTermoPct, setCorretagemTermoPct] = useState(0.53725);
    const [taxaFixaTermo, setTaxaFixaTermo] = useState(25.21);
    const [corretagemBtcPct, setCorretagemBtcPct] = useState(0.50);
    const [emolumentosB3Pct, setEmolumentosB3Pct] = useState(0.104685);
    const [impostosPct, setImpostosPct] = useState(0.183475);

    // --- GRUPO 3: TAXAS TOMADOR BTC ---
    const [taxaPapelBtc, setTaxaPapelBtc] = useState(0.25);
    const [emolumentosBtcPct, setEmolumentosBtcPct] = useState(0.077374);
    const [taxaIntermediacaoBtc, setTaxaIntermediacaoBtc] = useState(0.25);

    // --- GRUPO 4: TAXAS ENCERRAMENTO (D+N - Compra a Termo) ---
    const [corretagemEncPct, setCorretagemEncPct] = useState(0.25);
    const [emolumentosB3EncPct, setEmolumentosB3EncPct] = useState(0.03);
    const [impostosEncPct, setImpostosEncPct] = useState(0.010965);

    // --- CÁLCULOS RIGOROSOS DE AUDITORIA ---
    const resultados = useMemo(() => {
        const quantidade = volumeFinanceiro / preco;

        // 1. Liquidação Up-Front (D+2)
        const corretagemTermo = (volumeFinanceiro * (corretagemTermoPct / 100)) + taxaFixaTermo;
        const corretagemBtc = volumeFinanceiro * (corretagemBtcPct / 100);
        const emolumentosB3 = volumeFinanceiro * (emolumentosB3Pct / 100);
        const impostos = volumeFinanceiro * (impostosPct / 100);

        const totalCustosD2 = corretagemTermo + corretagemBtc + emolumentosB3 + impostos;
        const totalLiquidoD2 = volumeFinanceiro - totalCustosD2;

        // 2. Calculadora Custo Tomador (BTC)
        const debitoRemuneracaoBtc = volumeFinanceiro * (taxaPapelBtc / 100) * (diasUteis / 252);
        const emolumentosBtc = volumeFinanceiro * (emolumentosBtcPct / 100);
        const intermediacaoBtc = volumeFinanceiro * (taxaIntermediacaoBtc / 100);
        const custoTotalBtc = debitoRemuneracaoBtc + emolumentosBtc + intermediacaoBtc;

        // 3. Termo Caixa (D+N) - Obrigação Final Replicada
        const jurosTermoPeriodo = volumeFinanceiro * (txJurosTermo / 100);
        const volumeTermoBase = volumeFinanceiro + jurosTermoPeriodo; // 93.643,50

        // Custos que incidem sobre o volume futuro no encerramento
        const corretagemEnc = volumeTermoBase * (corretagemEncPct / 100); // 234,11
        const emolumentosB3Enc = volumeTermoBase * (emolumentosB3EncPct / 100); // 28,09
        const impostosEnc = volumeTermoBase * (impostosEncPct / 100); // 10,27

        const volumeTermoFuturo = volumeTermoBase + corretagemEnc + emolumentosB3Enc + impostosEnc; // 93.915,97

        // 4. Garantias (Deságio B3)
        const tickerUpper = ativo.toUpperCase();
        const infoGarantia = desagiosB3[tickerUpper] || { aceito: true, desagio: 0.30 };
        const margemExigida = volumeFinanceiro * infoGarantia.desagio;

        // 5. Métricas Comerciais
        const custoEstruturaTotal = totalCustosD2 + custoTotalBtc + jurosTermoPeriodo + corretagemEnc + emolumentosB3Enc + impostosEnc;
        const taxaEfetivaOperacao = (custoEstruturaTotal / volumeFinanceiro) * 100;

        return {
            quantidade,
            upfront: {
                volumeBruto: volumeFinanceiro,
                totalCustos: totalCustosD2,
                corretagemTermo,
                corretagemBtc,
                emolumentosB3,
                impostos,
                liquido: totalLiquidoD2
            },
            btc: {
                remuneracao: debitoRemuneracaoBtc,
                emolumentos: emolumentosBtc,
                intermediacao: intermediacaoBtc,
                total: custoTotalBtc
            },
            termo: {
                juros: jurosTermoPeriodo,
                volumeBase: volumeTermoBase,
                corretagem: corretagemEnc,
                emolumentos: emolumentosB3Enc,
                impostos: impostosEnc,
                volumeFuturo: volumeTermoFuturo
            },
            garantia: {
                info: infoGarantia,
                margem: margemExigida
            },
            comercial: {
                custoTotal: custoEstruturaTotal,
                taxaEfetiva: taxaEfetivaOperacao
            }
        };
    }, [
        ativo, preco, volumeFinanceiro, diasUteis, txJurosTermo,
        corretagemTermoPct, taxaFixaTermo, corretagemBtcPct, emolumentosB3Pct, impostosPct,
        taxaPapelBtc, emolumentosBtcPct, taxaIntermediacaoBtc,
        corretagemEncPct, emolumentosB3EncPct, impostosEncPct
    ]);

    const formatMoney = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    };

    // --- COMPONENTE: VISÃO COMERCIAL ---
    const VisaoComercial = () => (
        <div className="space-y-6 animate-in fade-in duration-500">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-950 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 text-emerald-500/10">
                        <ArrowDownToLine className="w-32 h-32" />
                    </div>
                    <p className="text-emerald-400 font-bold uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Caixa Líquido Liberado (D+2)
                    </p>
                    <h2 className="text-4xl font-black text-white drop-shadow-md">{formatMoney(resultados.upfront.liquido)}</h2>
                    <p className="text-sm text-slate-400 mt-2">Valor depositado na conta após descontos operacionais.</p>
                </div>

                <div className="bg-gradient-to-br from-rose-900/40 to-rose-950 border border-rose-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 text-rose-500/10">
                        <ArrowUpFromLine className="w-32 h-32" />
                    </div>
                    <p className="text-rose-400 font-bold uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Obrigação no Vencimento (D+{diasCorridos})
                    </p>
                    {/* Mostrando negativo conforme solicitado comercialmente / visualmente indicando débito */}
                    <h2 className="text-3xl font-black text-white drop-shadow-md">-{formatMoney(resultados.termo.volumeFuturo).replace('R$', 'R$ ')}</h2>
                    <p className="text-sm text-slate-400 mt-2">Valor a pagar para encerrar a operação a Termo.</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-center">
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-4">Resumo da Estrutura</p>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                            <span className="text-sm text-slate-300">Prazo da Operação</span>
                            <span className="text-white font-bold">{diasCorridos} dias corridos</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                            <span className="text-sm text-slate-300">Volume Base (Venda)</span>
                            <span className="text-white font-bold">{formatMoney(resultados.upfront.volumeBruto)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">Custo Total Efetivo</span>
                            <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                                {resultados.comercial.taxaEfetiva.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
                    <RefreshCcw className="w-5 h-5 text-amber-500" />
                    Como funciona o Termo Caixa (Fluxo da Estrutura)
                </h3>

                <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 md:gap-2">
                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-5 relative">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold absolute -top-4 -left-2 shadow-lg">1</div>
                        <h4 className="text-blue-400 font-bold mb-2">Tomada de BTC</h4>
                        <p className="text-sm text-slate-300 mb-3">Aluguel de <strong className="text-white">{resultados.quantidade.toFixed(0)} ações</strong> de {ativo} para possibilitar a venda a descoberto.</p>
                        <div className="text-xs text-slate-500 bg-slate-900 p-2 rounded">
                            Custo BTC: {formatMoney(resultados.btc.total)}
                        </div>
                    </div>

                    <div className="hidden md:flex items-center justify-center px-2 text-slate-600">
                        <ArrowRight className="w-6 h-6" />
                    </div>

                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-5 relative">
                        <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold absolute -top-4 -left-2 shadow-lg">2</div>
                        <h4 className="text-emerald-400 font-bold mb-2">Venda à Vista (D+2)</h4>
                        <p className="text-sm text-slate-300 mb-3">Venda das ações alugadas gerando um caixa bruto de <strong className="text-white">{formatMoney(resultados.upfront.volumeBruto)}</strong>.</p>
                        <div className="text-xs text-slate-500 bg-slate-900 p-2 rounded flex justify-between">
                            <span>Custos D+2:</span>
                            <span className="text-rose-400">-{formatMoney(resultados.upfront.totalCustos)}</span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center justify-center px-2 text-slate-600">
                        <ArrowRight className="w-6 h-6" />
                    </div>

                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-5 relative">
                        <div className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold absolute -top-4 -left-2 shadow-lg">3</div>
                        <h4 className="text-rose-400 font-bold mb-2">Compra a Termo</h4>
                        <p className="text-sm text-slate-300 mb-3">Compra a termo do mesmo ativo para devolução do aluguel. Os custos incidem sobre o volume no vencimento (D+{diasCorridos}).</p>
                        <div className="text-xs text-slate-500 bg-slate-900 p-2 rounded flex justify-between font-bold">
                            <span>Obrigação:</span>
                            <span className="text-rose-400">-{formatMoney(resultados.termo.volumeFuturo)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                    <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-blue-100 font-medium">Margem de Garantia</p>
                        <p className="text-sm text-blue-200/70 mt-1">
                            Para montar essa estrutura, a B3 exige uma margem de garantia de aproximadamente <strong>{formatMoney(resultados.garantia.margem)}</strong> ({(resultados.garantia.info.desagio * 100).toFixed(0)}% de deságio). Essa garantia pode ser coberta com ações da sua carteira, tesouro direto ou CDBs.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans selection:bg-amber-500/30 pb-20 overflow-y-auto">

            <div className="max-w-7xl mx-auto mb-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative">

                    <div className="flex items-center gap-3">
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-800 text-slate-400 rounded-lg transition-colors cursor-pointer mr-2 md:absolute md:-left-12 opacity-80 hover:opacity-100"
                                title="Voltar ao Hub"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                            <TrendingUp className="text-amber-500 w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Termo Caixa + BTC</h1>
                            <p className="text-slate-400 text-sm">Estruturação e Geração de Liquidez</p>
                        </div>
                    </div>

                    <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                        <button
                            onClick={() => setActiveTab('comercial')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'comercial' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                            <LayoutDashboard className="w-4 h-4" /> Visão Comercial
                        </button>
                        <button
                            onClick={() => setActiveTab('operacional')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'operacional' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Settings2 className="w-4 h-4" /> Visão Operacional (Auditoria)
                        </button>
                    </div>
                </header>
            </div>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* ==========================================
            PAINEL ESQUERDO: INPUTS UNIFICADOS
            ========================================== */}
                <div className="lg:col-span-4 space-y-4">

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                            <Calculator className="w-4 h-4 text-amber-500" /> Dados Principais
                        </h2>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1 uppercase">Ativo</label>
                                    <input type="text" value={ativo} onChange={(e) => setAtivo(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 transition-colors uppercase font-medium text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1 uppercase">Volume Fin. (R$)</label>
                                    <input type="number" step="0.01" value={volumeFinanceiro} onChange={(e) => setVolumeFinanceiro(Number(e.target.value))} className="w-full bg-slate-950 border border-amber-500/50 rounded px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 transition-colors text-right font-bold text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1 uppercase">Preço Ativo (R$)</label>
                                    <input type="number" step="0.01" value={preco} onChange={(e) => setPreco(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 transition-colors text-right text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1 uppercase">Prazo (Dias Corridos)</label>
                                    <input type="number" value={diasCorridos} onChange={(e) => setDiasCorridos(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 transition-colors text-right text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1 uppercase">Juros Termo (%)</label>
                                    <input type="number" step="0.00001" value={txJurosTermo} onChange={(e) => setTxJurosTermo(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 transition-colors text-right text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-amber-500/80 mb-1 uppercase">Dias Úteis (P/ BTC)</label>
                                    <input type="number" value={diasUteis} onChange={(e) => setDiasUteis(Number(e.target.value))} className="w-full bg-slate-950 border border-amber-500/30 rounded px-3 py-1.5 text-amber-100 focus:outline-none focus:border-amber-500 transition-colors text-right text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {activeTab === 'operacional' && (
                        <>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg animate-in fade-in duration-300">
                                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                                    <Percent className="w-4 h-4 text-amber-500" /> Custos de Liquidação (D+2)
                                </h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-medium text-slate-400 mb-1">CORRETAGEM TERMO (%)</label>
                                        <input type="number" step="0.00001" value={corretagemTermoPct} onChange={(e) => setCorretagemTermoPct(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 text-right text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-slate-400 mb-1 flex items-center gap-1">TAXA FIXA TERMO (R$)</label>
                                        <input type="number" step="0.01" value={taxaFixaTermo} onChange={(e) => setTaxaFixaTermo(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-amber-400 focus:outline-none focus:border-amber-500 text-right text-sm font-bold bg-amber-500/5" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-slate-400 mb-1">CORRETAGEM BTC (%)</label>
                                        <input type="number" step="0.00001" value={corretagemBtcPct} onChange={(e) => setCorretagemBtcPct(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 text-right text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-slate-400 mb-1">EMOLUMENTOS B³ (%)</label>
                                        <input type="number" step="0.00001" value={emolumentosB3Pct} onChange={(e) => setEmolumentosB3Pct(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 text-right text-sm" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-medium text-slate-400 mb-1">IMPOSTOS/OUTROS (%)</label>
                                        <input type="number" step="0.00001" value={impostosPct} onChange={(e) => setImpostosPct(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 text-right text-sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg animate-in fade-in duration-300">
                                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                                    <Percent className="w-4 h-4 text-amber-500" /> Custos Tomador BTC
                                </h2>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-medium text-slate-400 mb-1">TAXA DO PAPEL (A.A.)</label>
                                        <input type="number" step="0.00001" value={taxaPapelBtc} onChange={(e) => setTaxaPapelBtc(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 text-right text-sm" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-medium text-slate-400 mb-1">EMOLUMENTOS BTC (%)</label>
                                            <input type="number" step="0.00001" value={emolumentosBtcPct} onChange={(e) => setEmolumentosBtcPct(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 text-right text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-medium text-slate-400 mb-1">INTERMEDIAÇÃO (%)</label>
                                            <input type="number" step="0.00001" value={taxaIntermediacaoBtc} onChange={(e) => setTaxaIntermediacaoBtc(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 text-right text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BLOCO NOVO: Custos do Encerramento Termo */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg animate-in fade-in duration-300">
                                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                                    <Percent className="w-4 h-4 text-rose-500" /> Custos de Encerramento (D+N)
                                </h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-medium text-slate-400 mb-1">CORRETAGEM COMPRA (%)</label>
                                        <input type="number" step="0.00001" value={corretagemEncPct} onChange={(e) => setCorretagemEncPct(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-rose-500 text-right text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-slate-400 mb-1">EMOLUMENTOS B³ (%)</label>
                                        <input type="number" step="0.00001" value={emolumentosB3EncPct} onChange={(e) => setEmolumentosB3EncPct(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-rose-500 text-right text-sm" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-medium text-slate-400 mb-1">IMPOSTOS/OUTROS (%)</label>
                                        <input type="number" step="0.00001" value={impostosEncPct} onChange={(e) => setImpostosEncPct(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-rose-500 text-right text-sm" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                </div>

                {/* ==========================================
            PAINEL DIREITO: RENDERIZAÇÃO DA ABA ATIVA
            ========================================== */}
                <div className="lg:col-span-8">
                    {activeTab === 'comercial' ? (
                        <VisaoComercial />
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
                                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2 border-b border-slate-700 pb-3">
                                    <DollarSign className="w-5 h-5 text-emerald-400" /> Planilha de Liquidação Up-Front (D+2)
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center text-emerald-400 font-medium bg-emerald-500/10 p-2 rounded">
                                        <span>VENDA A VISTA {ativo}</span>
                                        <span>{formatMoney(resultados.upfront.volumeBruto)}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-rose-400 px-2 py-1 bg-slate-900/50 rounded border border-rose-900/30">
                                        <span className="flex flex-col">
                                            <span>CORRETAGEM TERMO CAIXA</span>
                                            <span className="text-[10px] text-slate-500 mt-0.5">
                                                Cálculo: (Vol × {corretagemTermoPct}%) + {formatMoney(taxaFixaTermo)}
                                            </span>
                                        </span>
                                        <span className="font-medium">-{formatMoney(resultados.upfront.corretagemTermo)}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-rose-400 px-2">
                                        <span>CORRETAGEM BTC</span>
                                        <span>-{formatMoney(resultados.upfront.corretagemBtc)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-rose-400 px-2">
                                        <span>EMOLUMENTOS B³</span>
                                        <span>-{formatMoney(resultados.upfront.emolumentosB3)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-rose-400 px-2">
                                        <span>IMPOSTOS + I.R.R.F + OUTROS*</span>
                                        <span>-{formatMoney(resultados.upfront.impostos)}</span>
                                    </div>
                                    <div className="pt-4 mt-2 border-t border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <span className="text-lg text-slate-300 font-bold uppercase tracking-wider">Total Líquido</span>
                                        <span className="text-4xl font-black text-emerald-400 drop-shadow-sm">{formatMoney(resultados.upfront.liquido)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
                                    <h3 className="text-sm font-bold text-white mb-4 border-b border-slate-800 pb-2 uppercase tracking-wide text-slate-300">
                                        Calculadora Custo Tomador (BTC)
                                    </h3>
                                    <div className="space-y-3 text-sm flex-1">
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span>Débito Ref. Tx Remuneração:</span>
                                            <span className="text-slate-200">{formatMoney(resultados.btc.remuneracao)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span>Emolumentos B3:</span>
                                            <span className="text-slate-200">{formatMoney(resultados.btc.emolumentos)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span>Taxa Intermediação Tomador:</span>
                                            <span className="text-slate-200">{formatMoney(resultados.btc.intermediacao)}</span>
                                        </div>
                                        <div className="pt-3 border-t border-slate-800 flex justify-between items-center mt-auto">
                                            <span className="text-white font-bold">Custo Total:</span>
                                            <span className="text-rose-400 font-bold">{formatMoney(resultados.btc.total)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
                                    <h3 className="text-sm font-bold text-white mb-4 border-b border-slate-800 pb-2 uppercase tracking-wide text-slate-300">
                                        Obrigação Termo (Encerramento D+N)
                                    </h3>
                                    <div className="space-y-3 text-sm flex-1 flex flex-col">
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span className="flex flex-col">
                                                <span>Volume a Termo (Base):</span>
                                                <span className="text-[10px] text-slate-500">Vol + ({txJurosTermo}% de Juros)</span>
                                            </span>
                                            <span className="text-slate-200">{formatMoney(resultados.termo.volumeBase)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-rose-400 px-2 py-1 bg-slate-900/50 rounded border border-rose-900/30">
                                            <span className="flex flex-col">
                                                <span>Corretagem (Compra)</span>
                                                <span className="text-[10px] text-slate-500 mt-0.5">Vol Base × {corretagemEncPct}%</span>
                                            </span>
                                            <span className="font-medium">+{formatMoney(resultados.termo.corretagem)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-rose-400 px-2">
                                            <span>Emolumentos B3 (Compra)</span>
                                            <span>+{formatMoney(resultados.termo.emolumentos)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-rose-400 px-2">
                                            <span>Impostos/Outros (Compra)</span>
                                            <span>+{formatMoney(resultados.termo.impostos)}</span>
                                        </div>
                                        <div className="pt-3 border-t border-slate-800 flex justify-between items-center mt-auto">
                                            <span className="text-white font-bold">Obrigação Final:</span>
                                            {/* Formatação exigida explicitamente na demanda: valor exato negativo */}
                                            <span className="text-rose-500 font-black text-lg">-{formatMoney(resultados.termo.volumeFuturo).replace('R$', 'R$ ')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`border rounded-2xl p-5 flex items-center justify-between ${resultados.garantia.info.aceito ? 'bg-slate-900 border-slate-800' : 'bg-red-950/20 border-red-900/50'}`}>
                                <div>
                                    <p className="text-sm text-slate-400 font-bold mb-1 flex items-center gap-2 uppercase tracking-wide">
                                        Controle de Garantias B3
                                        {resultados.garantia.info.aceito ?
                                            <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> ACEITO</span> :
                                            <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> NÃO ACEITO</span>
                                        }
                                    </p>
                                    <p className="text-2xl font-black text-white">{formatMoney(resultados.garantia.margem)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Deságio Aplicado</p>
                                    <p className="text-xl font-bold text-amber-500">{(resultados.garantia.info.desagio * 100).toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
