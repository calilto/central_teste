import React, { useState, useMemo } from 'react';
import { Calculator, Calendar, PieChart, TrendingDown, LayoutDashboard, CreditCard, ArrowLeft } from 'lucide-react';

export default function SimuladorConsorcio({ onClose }) {
    // --- Estados (Entradas do Usuário) ---
    const [valorCredito, setValorCredito] = useState(1000000); // Começando com 1 Milhão para impacto visual
    const [prazoMeses, setPrazoMeses] = useState(180);
    const [taxaAdmTotal, setTaxaAdmTotal] = useState(18); // % Total da taxa no período
    const [fundoReservaTotal, setFundoReservaTotal] = useState(2); // % Total do fundo reserva

    // Lógica da Antecipação
    const [taxaAntecipadaPercent, setTaxaAntecipadaPercent] = useState(1); // % Do crédito a ser antecipado
    const [mesesAntecipacao, setMesesAntecipacao] = useState(15); // Diluir em quantos meses (Max 24)

    // --- Cálculos ---
    const dadosCalculados = useMemo(() => {
        // Valores Totais
        const valorTaxaAdmTotal = valorCredito * (taxaAdmTotal / 100);
        const valorFundoReservaTotal = valorCredito * (fundoReservaTotal / 100);
        const valorTotalPagar = valorCredito + valorTaxaAdmTotal + valorFundoReservaTotal;

        // Parcelas Base (Comum + Fundo Reserva)
        const parcelaFundoComum = valorCredito / prazoMeses;
        const parcelaFundoReserva = valorFundoReservaTotal / prazoMeses;

        // Lógica da Taxa de Administração
        const valorAntecipacao = valorCredito * (taxaAntecipadaPercent / 100);
        const valorAdmRestante = valorTaxaAdmTotal - valorAntecipacao;

        // Taxa Adm mensal padrão distribuída no prazo total
        const parcelaAdmPadrao = valorAdmRestante / prazoMeses;

        // Adicional da Antecipação
        const mesesDiluicao = Math.min(Math.max(1, mesesAntecipacao), 24); // Limite entre 1 e 24
        const parcelaAdicionalAntecipacao = valorAntecipacao / mesesDiluicao;

        // Parcela Cheia (Fase 1: Com antecipação)
        const parcelaFase1 = parcelaFundoComum + parcelaFundoReserva + parcelaAdmPadrao + parcelaAdicionalAntecipacao;

        // Parcela Normal (Fase 2: Após antecipação)
        const parcelaFase2 = parcelaFundoComum + parcelaFundoReserva + parcelaAdmPadrao;

        return {
            valorTaxaAdmTotal,
            valorFundoReservaTotal,
            valorTotalPagar,
            valorAntecipacao,
            parcelaFase1,
            parcelaFase2,
            mesesDiluicao,
            parcelaAdicionalAntecipacao, // <-- Correção: Adicionado o retorno desta variável
            custoEfetivoTotal: ((valorTotalPagar - valorCredito) / valorCredito) * 100
        };
    }, [valorCredito, prazoMeses, taxaAdmTotal, fundoReservaTotal, taxaAntecipadaPercent, mesesAntecipacao]);

    // --- Formatadores ---
    const formatMoney = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatPercent = (value) => {
        // A função Intl NumberFormat já multiplica o valor por 100 para adicionar o '%'
        return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(value / 100);
    };

    // --- Variáveis do Gráfico Customizado ---
    const maxBarValue = Math.max(dadosCalculados.parcelaFase1, dadosCalculados.parcelaFase2);
    const bar1Height = (dadosCalculados.parcelaFase1 / maxBarValue) * 100;
    const bar2Height = (dadosCalculados.parcelaFase2 / maxBarValue) * 100;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans selection:bg-emerald-500 selection:text-white w-full h-full absolute inset-0 z-50 overflow-y-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 text-slate-400 rounded-lg transition-colors mr-2 cursor-pointer"
                            title="Voltar ao Hub"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    )}
                    <div className="p-3 bg-emerald-600 rounded-lg shadow-lg shadow-emerald-900/20">
                        <LayoutDashboard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Simulador de Consórcio</h1>
                        <p className="text-slate-400 text-sm">Dashboard de Planejamento Financeiro e Vendas</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Coluna da Esquerda: Inputs */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-emerald-400" />
                            Parâmetros do Plano
                        </h2>

                        <div className="space-y-5">
                            {/* Valor do Crédito */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Valor da Carta de Crédito</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-slate-500 font-medium">R$</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={valorCredito}
                                        onChange={(e) => setValorCredito(Number(e.target.value))}
                                        className="block w-full pl-10 bg-slate-800 border-slate-700 rounded-lg text-white font-medium focus:ring-emerald-500 focus:border-emerald-500 p-3 transition-colors outline-none"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="50000"
                                    max="2000000"
                                    step="10000"
                                    value={valorCredito}
                                    onChange={(e) => setValorCredito(Number(e.target.value))}
                                    className="w-full mt-3 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                            </div>

                            {/* Prazo */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Prazo (Meses)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <input
                                        type="number"
                                        value={prazoMeses}
                                        onChange={(e) => setPrazoMeses(Number(e.target.value))}
                                        className="block w-full pl-10 bg-slate-800 border-slate-700 rounded-lg text-white font-medium focus:ring-emerald-500 focus:border-emerald-500 p-3 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Taxas Gerais */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Taxa Adm. Total (%)</label>
                                    <input
                                        type="number"
                                        value={taxaAdmTotal}
                                        onChange={(e) => setTaxaAdmTotal(Number(e.target.value))}
                                        className="block w-full bg-slate-800 border-slate-700 rounded-lg text-white focus:ring-emerald-500 focus:border-emerald-500 p-2.5 text-center outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Fundo Reserva (%)</label>
                                    <input
                                        type="number"
                                        value={fundoReservaTotal}
                                        onChange={(e) => setFundoReservaTotal(Number(e.target.value))}
                                        className="block w-full bg-slate-800 border-slate-700 rounded-lg text-white focus:ring-emerald-500 focus:border-emerald-500 p-2.5 text-center outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card Antecipação */}
                    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 pointer-events-none"></div>
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 relative z-10">
                            <TrendingDown className="w-5 h-5 text-emerald-400" />
                            Diluição da Taxa
                        </h2>

                        <div className="space-y-5 relative z-10">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    % da Taxa a Antecipar
                                    <span className="text-xs text-slate-500 ml-2">(Geralmente 1%)</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={taxaAntecipadaPercent}
                                        onChange={(e) => setTaxaAntecipadaPercent(Number(e.target.value))}
                                        className="block w-full bg-slate-800 border-slate-700 rounded-lg text-white focus:ring-emerald-500 focus:border-emerald-500 p-3 outline-none"
                                    />
                                    <span className="text-slate-400 font-bold px-2">%</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Dividir Antecipação em (Meses)
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="24"
                                        value={mesesAntecipacao}
                                        onChange={(e) => setMesesAntecipacao(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                    <span className="bg-emerald-900/50 text-emerald-300 border border-emerald-800/50 px-3 py-1.5 rounded-md font-mono font-bold min-w-[3.5rem] text-center">
                                        {mesesAntecipacao}x
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Limite máximo de 24 meses para diluição.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coluna da Direita: Resultados */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Cards de Destaque */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-emerald-600 rounded-xl p-5 shadow-lg shadow-emerald-900/20 transform hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full pointer-events-none"></div>
                            <p className="text-emerald-100 text-sm font-medium mb-1 relative z-10">Parcela Inicial ({dadosCalculados.mesesDiluicao}x)</p>
                            <h3 className="text-2xl lg:text-3xl font-bold text-white relative z-10 tracking-tight">{formatMoney(dadosCalculados.parcelaFase1)}</h3>
                            <p className="text-xs text-emerald-100 mt-2 opacity-90 relative z-10">Com antecipação diluída</p>
                        </div>

                        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-lg flex flex-col justify-center">
                            <p className="text-slate-400 text-sm font-medium mb-1">Demais Parcelas ({prazoMeses - dadosCalculados.mesesDiluicao}x)</p>
                            <h3 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{formatMoney(dadosCalculados.parcelaFase2)}</h3>
                            <p className="text-xs text-slate-500 mt-2">Valor padrão após diluição</p>
                        </div>

                        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-lg flex flex-col justify-center">
                            <p className="text-slate-400 text-sm font-medium mb-1">Custo Total do Plano</p>
                            <h3 className="text-2xl lg:text-3xl font-bold text-emerald-400 tracking-tight">{formatMoney(dadosCalculados.valorTotalPagar)}</h3>
                            <p className="text-xs text-slate-500 mt-2">Custo adm: {formatMoney(dadosCalculados.valorTaxaAdmTotal)}</p>
                        </div>
                    </div>

                    {/* Gráfico e Detalhamento */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

                        {/* Gráfico Customizado em HTML/Tailwind (Alturas flexíveis) */}
                        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl flex flex-col h-full min-h-[22rem]">
                            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                                <PieChart className="w-4 h-4 text-emerald-400" />
                                Comparativo de Parcelas
                            </h3>

                            <div className="flex-1 relative flex items-end justify-center gap-12 pb-8 mt-4 border-b border-dashed border-slate-700">
                                {/* Linhas de grade horizontais decorativas */}
                                <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between opacity-30">
                                    <div className="border-b border-dashed border-slate-600 w-full"></div>
                                    <div className="border-b border-dashed border-slate-600 w-full"></div>
                                    <div className="border-b border-dashed border-slate-600 w-full"></div>
                                </div>

                                {/* Barra 1: Antecipação */}
                                <div className="relative group w-24 lg:w-32 flex flex-col items-center justify-end h-full z-10">
                                    <div
                                        className="w-full bg-emerald-500 rounded-t-sm transition-all duration-700 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:bg-emerald-400 cursor-pointer"
                                        style={{ height: `${Math.max(bar1Height, 5)}%` }} // Minimum height so it's always visible
                                    >
                                        {/* Tooltip */}
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1.5 px-3 rounded shadow-xl whitespace-nowrap transition-opacity pointer-events-none border border-slate-700 z-20">
                                            {formatMoney(dadosCalculados.parcelaFase1)}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-7 text-xs text-slate-400 text-center whitespace-nowrap">
                                        1ª a {dadosCalculados.mesesDiluicao}ª Parc
                                    </div>
                                </div>

                                {/* Barra 2: Normal */}
                                <div className="relative group w-24 lg:w-32 flex flex-col items-center justify-end h-full z-10">
                                    <div
                                        className="w-full bg-slate-500 rounded-t-sm transition-all duration-700 group-hover:bg-slate-400 cursor-pointer"
                                        style={{ height: `${Math.max(bar2Height, 5)}%` }}
                                    >
                                        {/* Tooltip */}
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1.5 px-3 rounded shadow-xl whitespace-nowrap transition-opacity pointer-events-none border border-slate-700 z-20">
                                            {formatMoney(dadosCalculados.parcelaFase2)}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-7 text-xs text-slate-400 text-center whitespace-nowrap">
                                        {dadosCalculados.mesesDiluicao + 1}ª a {prazoMeses}ª Parc
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Resumo Numérico (Alturas flexíveis) */}
                        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between h-full min-h-[22rem]">
                            <div>
                                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-emerald-400" />
                                    Detalhamento da Taxa
                                </h3>
                                <div className="space-y-3 mt-4">
                                    <div className="flex justify-between items-center py-2.5 border-b border-slate-800">
                                        <span className="text-slate-400 text-sm">Valor Antecipado ({formatPercent(taxaAntecipadaPercent)})</span>
                                        <span className="text-white font-medium">{formatMoney(dadosCalculados.valorAntecipacao)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2.5 border-b border-slate-800 bg-emerald-500/5 -mx-4 px-4 rounded-sm">
                                        <span className="text-slate-300 text-sm">Adicional por Parcela ({dadosCalculados.mesesDiluicao}x)</span>
                                        <span className="text-emerald-400 font-bold">+{formatMoney(dadosCalculados.parcelaAdicionalAntecipacao)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2.5 border-b border-slate-800">
                                        <span className="text-slate-400 text-sm">Taxa Adm. Total</span>
                                        <span className="text-white font-medium">{formatMoney(dadosCalculados.valorTaxaAdmTotal)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-slate-950 rounded-lg border border-slate-800 relative overflow-hidden">
                                <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500"></div>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end pl-2 gap-3">
                                    <div>
                                        <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-semibold">Total a Pagar</span>
                                        <span className="text-2xl font-bold text-white break-words">{formatMoney(dadosCalculados.valorTotalPagar)}</span>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <span className="inline-block text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded">
                                            Taxa {formatPercent(dadosCalculados.custoEfetivoTotal)} a.p.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabela de Evolução Simplificada */}
                    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
                        <div className="p-4 bg-slate-800/80 border-b border-slate-800">
                            <h3 className="text-white font-semibold">Cronograma de Pagamento</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-950/80">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold tracking-wider">Período</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider">Descrição</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider">Fundo Comum</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider">Taxas (Adm + FR)</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider text-right">Valor Parcela</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    <tr className="bg-emerald-900/10 hover:bg-slate-800/80 transition-colors">
                                        <td className="px-6 py-4 font-medium text-emerald-400">1º ao {dadosCalculados.mesesDiluicao}º mês</td>
                                        <td className="px-6 py-4 text-slate-300">Fase de Antecipação</td>
                                        <td className="px-6 py-4 text-slate-400">{formatMoney(valorCredito / prazoMeses)}</td>
                                        <td className="px-6 py-4 text-slate-400">{formatMoney(dadosCalculados.parcelaFase1 - (valorCredito / prazoMeses))}</td>
                                        <td className="px-6 py-4 text-right font-bold text-white text-base">{formatMoney(dadosCalculados.parcelaFase1)}</td>
                                    </tr>
                                    <tr className="bg-slate-900/40 hover:bg-slate-800/80 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-400">{dadosCalculados.mesesDiluicao + 1}º ao {prazoMeses}º mês</td>
                                        <td className="px-6 py-4 text-slate-300">Parcelas Regulares</td>
                                        <td className="px-6 py-4 text-slate-400">{formatMoney(valorCredito / prazoMeses)}</td>
                                        <td className="px-6 py-4 text-slate-400">{formatMoney(dadosCalculados.parcelaFase2 - (valorCredito / prazoMeses))}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-200 text-base">{formatMoney(dadosCalculados.parcelaFase2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
