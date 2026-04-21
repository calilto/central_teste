import React, { useState, useMemo } from 'react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Bar,
    Line,
    ComposedChart
} from 'recharts';
import { Calculator, TrendingUp, Shield, DollarSign, Download, Sun, Moon, Info, Settings, ArrowLeft } from 'lucide-react';

// Componente de Logo da Eurostock
const EurostockLogo = ({ isMobile, isDark }) => {
    const textColor = isDark ? 'text-white' : 'text-slate-800';
    const pipeColor = isDark ? 'text-slate-600' : 'text-slate-300';
    const borderColor = isDark ? 'border-white' : 'border-slate-800';

    if (isMobile) {
        return (
            <div className="flex items-center gap-1.5 select-none">
                <span className={`${textColor} text-lg font-light tracking-widest lowercase transition-colors`}>eurostock</span>
                <span className={`${pipeColor} font-thin text-xl mb-0.5 transition-colors`}>|</span>
                <div className={`border-[1.5px] ${borderColor} rounded-md px-1.5 py-0.5 flex items-center justify-center transition-colors`}>
                    <span className={`${textColor} font-bold text-[10px] tracking-tighter transition-colors`}>XP</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 select-none mb-1">
            <span className={`${textColor} text-2xl font-light tracking-widest lowercase transition-colors`}>eurostock</span>
            <span className={`${pipeColor} font-thin text-3xl mb-1 transition-colors`}>|</span>
            <div className={`border-[2px] ${borderColor} rounded-lg px-2 py-0.5 flex items-center justify-center transition-colors`}>
                <span className={`${textColor} font-bold text-sm tracking-tighter transition-colors`}>XP</span>
            </div>
        </div>
    );
};

export default function SimuladorSeguroVida({ onClose }) {
    // Estados de Simulação
    const [capitalInicial, setCapitalInicial] = useState("1500000");
    const [ipca, setIpca] = useState("4.35");
    const [taxaFixa, setTaxaFixa] = useState("3.00");
    const [contribuicao, setContribuicao] = useState("24000");
    const [anosPagamento, setAnosPagamento] = useState("10");

    // Estados da Interface
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [mostrarConfigAvancadas, setMostrarConfigAvancadas] = useState(false);
    const [taxasResgate, setTaxasResgate] = useState(["0", "0", "13.21", "17.82", "36.05", "45.80", "54.87", "84.15", "94.96", "96.12"]);

    // Formatação de Moeda
    const formatCurrency = (value) => {
        if (value === null || value === undefined || isNaN(value)) {
            return "R$ 0";
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Formatação para o Eixo Y do Gráfico
    const formatCompactNumber = (number) => {
        if (number === null || number === undefined || isNaN(number)) {
            return "0";
        }
        if (number < 1000) return number.toString();
        if (number >= 1000 && number < 1000000) return "R$ " + (number / 1000).toFixed(0) + "k";
        if (number >= 1000000) return "R$ " + (number / 1000000).toFixed(1) + "M";
        return number.toString();
    };

    const handleTaxaChange = (index, value) => {
        const novasTaxas = [...taxasResgate];
        novasTaxas[index] = value;
        setTaxasResgate(novasTaxas);
    };

    // Motor Principal de Cálculo
    const simulationData = useMemo(() => {
        const data = [];

        const capInicialNum = Number(capitalInicial) || 0;
        const ipcaNum = Number(ipca) || 0;
        const taxaFixaNum = Number(taxaFixa) || 0;
        const contribuicaoNum = Number(contribuicao) || 0;
        const anosPagNum = Number(anosPagamento) || 0;

        let capital = capInicialNum;
        let premioAcumulado = 0;
        let valorResgateIpcaMaisTaxaAnterior = 0;

        const taxaIpcaDecimal = ipcaNum / 100;
        const taxaFixaDecimal = taxaFixaNum / 100;

        for (let ano = 1; ano <= 50; ano++) {
            capital = capital * (1 + taxaIpcaDecimal);

            let premioAnoAtual = 0;
            let percentualResgateAplicado = 1;
            let valorResgate = 0;
            let valorResgateIpcaMaisTaxa = 0;

            if (ano <= anosPagNum) {
                premioAcumulado = (premioAcumulado + contribuicaoNum) * (1 + taxaIpcaDecimal);
                premioAnoAtual = premioAcumulado;

                const taxaNoAno = ano <= taxasResgate.length ? (Number(taxasResgate[ano - 1]) || 0) : 96;
                percentualResgateAplicado = taxaNoAno / 100;

                valorResgate = premioAcumulado * percentualResgateAplicado;
                valorResgateIpcaMaisTaxa = valorResgate * (1 + taxaIpcaDecimal) * (1 + taxaFixaDecimal);
            } else {
                premioAnoAtual = 0;
                percentualResgateAplicado = 1;

                valorResgate = valorResgateIpcaMaisTaxaAnterior;
                valorResgateIpcaMaisTaxa = valorResgate * (1 + taxaIpcaDecimal) * (1 + taxaFixaDecimal);
            }

            const custoSeguro = Math.max(0, premioAnoAtual - valorResgateIpcaMaisTaxa);

            data.push({
                ano: ano,
                capitalSegurado: capital || 0,
                premio: premioAnoAtual || 0,
                percentualResgate: percentualResgateAplicado || 0,
                valorResgate: valorResgate || 0,
                reservaFinal: valorResgateIpcaMaisTaxa || 0,
                custoSeguro: custoSeguro || 0
            });

            valorResgateIpcaMaisTaxaAnterior = valorResgateIpcaMaisTaxa;
        }

        return data;
    }, [capitalInicial, ipca, taxaFixa, contribuicao, anosPagamento, taxasResgate]);

    const exportToCSV = () => {
        try {
            const taxaFixaNum = Number(taxaFixa) || 0;
            const headers = ['Ano', 'Capital Segurado', 'Premio Acumulado', '% Resgate', 'Valor Resgate', `Resgate (IPCA+${taxaFixaNum}%)`, 'Custo Real'];
            const csvContent = [
                headers.join(';'),
                ...simulationData.map(row => [
                    row.ano,
                    row.capitalSegurado.toFixed(2),
                    row.premio.toFixed(2),
                    (row.percentualResgate * 100).toFixed(2),
                    row.valorResgate.toFixed(2),
                    row.reservaFinal.toFixed(2),
                    row.custoSeguro.toFixed(2)
                ].join(';'))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'simulacao_seguro_vida.csv';
            link.click();
        } catch (error) {
            console.error("Falha ao exportar CSV:", error);
        }
    };

    // Cálculos de Resumo
    const anosPagNum = Number(anosPagamento) || 0;

    const breakEvenObj = simulationData.find(d => d.reservaFinal >= d.premio && d.premio > 0);
    const breakEvenYear = breakEvenObj ? breakEvenObj.ano : "N/A";

    let totalPagoEstimado = 0;
    if (anosPagNum > 0 && anosPagNum <= 50 && simulationData[anosPagNum - 1]) {
        totalPagoEstimado = simulationData[anosPagNum - 1].premio;
    }

    const projecao20 = simulationData[19] ? simulationData[19].reservaFinal : 0;

    // Dicionário de Classes do Tema
    const theme = {
        bgMain: isDarkMode ? "bg-[#11131e] text-slate-200" : "bg-slate-50 text-slate-800",
        bgPanel: isDarkMode ? "bg-[#1c2132] border-[#2a3044]" : "bg-white border-slate-200",
        textLabel: isDarkMode ? "text-slate-300" : "text-slate-600",
        textMuted: isDarkMode ? "text-slate-400" : "text-slate-500",
        inputBg: isDarkMode ? "bg-[#252b40] border-[#374151] text-white placeholder-slate-400" : "bg-slate-50 border-slate-300 text-slate-900",
        tableHeaderBase: isDarkMode ? "border-[#2a3044] text-slate-200" : "text-slate-800 border-slate-200",
        tableRow: isDarkMode ? "border-[#2a3044] hover:bg-[#252b40]" : "border-slate-100 hover:bg-slate-50",
        tableRowDecade: isDarkMode ? "bg-[#161a28]" : "bg-slate-100",
        chartGrid: isDarkMode ? "#2a3044" : "#e2e8f0",
        chartText: isDarkMode ? "#94a3b8" : "#64748b",
        chartTooltipBg: isDarkMode ? "#1e293b" : "#ffffff",
        chartTooltipText: isDarkMode ? "#f8fafc" : "#0f172a",
        btnSecondary: isDarkMode ? "bg-[#252b40] hover:bg-[#2d344d] text-slate-200" : "bg-slate-200 hover:bg-slate-300 text-slate-800"
    };

    return (
        <div className={`min-h-screen p-4 md:p-8 font-sans transition-colors duration-300 w-full h-full absolute inset-0 z-50 overflow-y-auto ${theme.bgMain}`}>
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Cabeçalho */}
                <div className={`p-6 rounded-2xl shadow-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 ${theme.bgPanel}`}>
                    <div className="flex items-center gap-4">
                        {onClose && (
                            <button
                                onClick={onClose}
                                className={`p-2 hover:bg-slate-800/20 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer rounded-lg`}
                                title="Voltar ao Hub"
                            >
                                <ArrowLeft size={24} />
                            </button>
                        )}
                        <div className={`p-4 rounded-xl shadow-inner ${isDarkMode ? 'bg-[#252b40] text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                            <Shield size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Simulador de Seguro de Vida</h1>
                            <p className={`text-sm mt-1 ${theme.textMuted}`}>Projeção de Alavancagem, Prêmio e Resgate (Isento de IR)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden lg:block mr-2">
                            <EurostockLogo isDark={isDarkMode} isMobile={false} />
                        </div>
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-md hover:shadow-lg font-medium"
                        >
                            <Download size={18} /> Exportar CSV
                        </button>
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`p-2.5 rounded-xl border transition-all shadow-sm ${theme.inputBg}`}
                            title="Alternar Tema"
                        >
                            {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-blue-600" />}
                        </button>
                    </div>
                </div>

                {/* Resumo de Indicadores */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`p-6 rounded-2xl shadow-lg border flex flex-col ${theme.bgPanel}`}>
                        <span className={`text-sm flex items-center gap-1.5 font-medium ${theme.textMuted}`}><Info size={16} /> Total Prêmio (Fim do Prazo)</span>
                        <span className="text-3xl font-bold text-blue-400 mt-2">{formatCurrency(totalPagoEstimado)}</span>
                        <span className={`text-xs mt-2 ${theme.textMuted}`}>Valor acumulado com IPCA ao fim de {anosPagNum} anos</span>
                    </div>
                    <div className={`p-6 rounded-2xl shadow-lg border flex flex-col ${theme.bgPanel}`}>
                        <span className={`text-sm flex items-center gap-1.5 font-medium ${theme.textMuted}`}><Info size={16} /> Ano de Empate (Break-even)</span>
                        <span className="text-3xl font-bold text-emerald-400 mt-2">{breakEvenYear !== "N/A" ? `Ano ${breakEvenYear}` : "Não atingido"}</span>
                        <span className={`text-xs mt-2 ${theme.textMuted}`}>Quando a reserva financeira supera o prêmio pago</span>
                    </div>
                    <div className={`p-6 rounded-2xl shadow-lg border flex flex-col ${theme.bgPanel}`}>
                        <span className={`text-sm flex items-center gap-1.5 font-medium ${theme.textMuted}`}><Info size={16} /> Projeção Resgate (20 Anos)</span>
                        <span className="text-3xl font-bold text-purple-400 mt-2">{formatCurrency(projecao20)}</span>
                        <span className={`text-xs mt-2 ${theme.textMuted}`}>Reserva final acumulada a IPCA + {Number(taxaFixa) || 0}%</span>
                    </div>
                </div>

                {/* Painel de Controles */}
                <div className={`p-6 rounded-2xl shadow-lg border ${theme.bgPanel}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <div className="space-y-2.5">
                            <label className={`text-sm font-medium flex items-center gap-2 ${theme.textLabel}`}>
                                <Shield size={16} className="text-blue-400" /> Capital Segurado (R$)
                            </label>
                            <input
                                type="number"
                                value={capitalInicial}
                                onChange={(e) => setCapitalInicial(e.target.value)}
                                className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm ${theme.inputBg}`}
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className={`text-sm font-medium flex items-center gap-2 ${theme.textLabel}`}>
                                <TrendingUp size={16} className="text-blue-400" /> IPCA (%)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={ipca}
                                onChange={(e) => setIpca(e.target.value)}
                                className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm ${theme.inputBg}`}
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className={`text-sm font-medium flex items-center gap-2 ${theme.textLabel}`}>
                                <TrendingUp size={16} className="text-emerald-400" /> Taxa Fixa (%)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={taxaFixa}
                                onChange={(e) => setTaxaFixa(e.target.value)}
                                className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm ${theme.inputBg}`}
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className={`text-sm font-medium flex items-center gap-2 ${theme.textLabel}`}>
                                <DollarSign size={16} className="text-amber-400" /> Contribuição Anual
                            </label>
                            <input
                                type="number"
                                value={contribuicao}
                                onChange={(e) => setContribuicao(e.target.value)}
                                className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm ${theme.inputBg}`}
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className={`text-sm font-medium flex items-center gap-2 ${theme.textLabel}`}>
                                <Calculator size={16} className="text-purple-400" /> Prazo Pgto (Anos)
                            </label>
                            <input
                                type="number"
                                value={anosPagamento}
                                onChange={(e) => setAnosPagamento(e.target.value)}
                                className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm ${theme.inputBg}`}
                            />
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-[#2a3044]">
                        <button
                            onClick={() => setMostrarConfigAvancadas(!mostrarConfigAvancadas)}
                            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm ${theme.btnSecondary}`}
                        >
                            <Settings size={16} />
                            {mostrarConfigAvancadas ? "Ocultar Taxas de Resgate" : "Editar Taxas de Resgate (% por Ano)"}
                        </button>

                        {mostrarConfigAvancadas && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-4 bg-black/20 p-5 rounded-xl border border-[#2a3044]">
                                {taxasResgate.map((taxa, index) => (
                                    <div key={index} className="space-y-1.5">
                                        <label className={`text-xs font-semibold ${theme.textMuted}`}>Ano {index + 1} (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={taxa}
                                            onChange={(e) => handleTaxaChange(index, e.target.value)}
                                            className={`w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none ${theme.inputBg}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Gráfico */}
                <div className={`p-6 rounded-2xl shadow-lg border ${theme.bgPanel}`}>
                    <h2 className="text-lg font-bold mb-6 text-center tracking-wide">Evolução: Reserva Final vs Prêmio Acumulado</h2>
                    <div style={{ width: '100%', height: '450px' }}>
                        <ResponsiveContainer>
                            <ComposedChart data={simulationData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chartGrid} />
                                <XAxis dataKey="ano" tick={{ fill: theme.chartText, fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                                <YAxis
                                    tickFormatter={formatCompactNumber}
                                    tick={{ fill: theme.chartText, fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip
                                    formatter={(value, name) => {
                                        const label = name === 'reservaFinal' ? 'Reserva de Resgate' : name === 'capitalSegurado' ? 'Capital Segurado (Morte)' : 'Prêmio Pago (Acumulado)';
                                        return [formatCurrency(value), label];
                                    }}
                                    labelFormatter={(label) => `Ano ${label}`}
                                    contentStyle={{ backgroundColor: theme.chartTooltipBg, color: theme.chartTooltipText, borderRadius: '12px', border: `1px solid ${theme.chartGrid}`, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{ color: theme.chartText, paddingTop: '20px' }} iconType="circle" />
                                <Bar
                                    dataKey="reservaFinal"
                                    name="Reserva de Resgate"
                                    fill="#3b82f6"
                                    radius={[4, 4, 0, 0]}
                                    barSize={20}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="premio"
                                    name="Prêmio Pago (Acumulado)"
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    strokeDasharray="6 6"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="capitalSegurado"
                                    name="Capital Segurado (Morte)"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={false}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tabela de Dados */}
                <div className={`rounded-2xl shadow-lg border overflow-hidden ${theme.bgPanel}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right whitespace-nowrap">
                            <thead className={`font-semibold text-center border-b ${theme.tableHeaderBase}`}>
                                <tr>
                                    <th className={`p-4 border-r ${theme.tableHeaderBase} bg-black/10`}>Ano</th>
                                    <th className={`p-4 border-r ${theme.tableHeaderBase} bg-black/10`}>Capital Segurado<br /><span className="text-xs opacity-75 font-normal">(Corrido IPCA)</span></th>
                                    <th className={`p-4 border-r ${theme.tableHeaderBase} bg-black/10`}>Prêmio<br /><span className="text-xs opacity-75 font-normal">Acumulado</span></th>
                                    <th className={`p-4 border-r ${theme.tableHeaderBase} ${isDarkMode ? 'bg-[#212746] text-blue-200' : 'bg-blue-100 text-blue-800'}`}>% Resgate</th>
                                    <th className={`p-4 border-r ${theme.tableHeaderBase} ${isDarkMode ? 'bg-[#1a3123] text-emerald-200' : 'bg-emerald-100 text-emerald-800'}`}>Valor do<br /><span className="text-xs opacity-75 font-normal">Resgate Nominal</span></th>
                                    <th className={`p-4 border-r ${theme.tableHeaderBase} ${isDarkMode ? 'bg-[#1f3f2b] text-green-200' : 'bg-green-100 text-green-800'}`}>Resgate Final<br /><span className="text-xs opacity-75 font-normal">IPCA + {Number(taxaFixa) || 0}%</span></th>
                                    <th className={`p-4 ${isDarkMode ? 'bg-[#4a2123] text-rose-200' : 'bg-rose-100 text-rose-800'}`}>Custo Real<br /><span className="text-xs opacity-75 font-normal">do Seguro</span></th>
                                </tr>
                            </thead>
                            <tbody className={isDarkMode ? "text-slate-300" : "text-slate-700"}>
                                {simulationData.map((row) => (
                                    <tr
                                        key={row.ano}
                                        className={`border-b transition-colors ${theme.tableRow} ${row.ano % 10 === 0 ? theme.tableRowDecade + ' font-medium' : ''}`}
                                    >
                                        <td className={`p-3 text-center border-r ${theme.tableHeaderBase}`}>{row.ano}</td>
                                        <td className={`p-3 border-r ${theme.tableHeaderBase}`}>{formatCurrency(row.capitalSegurado)}</td>
                                        <td className={`p-3 border-r ${theme.tableHeaderBase} ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                                            {row.premio === 0 ? "R$ 0,00" : formatCurrency(row.premio)}
                                        </td>
                                        <td className={`p-3 border-r ${theme.tableHeaderBase} text-center ${isDarkMode ? 'bg-[#212746]/40' : 'bg-blue-50'}`}>
                                            {(row.percentualResgate * 100).toFixed(2).replace('.', ',')}%
                                        </td>
                                        <td className={`p-3 border-r ${theme.tableHeaderBase} ${isDarkMode ? 'bg-[#1a3123]/40' : 'bg-emerald-50'}`}>
                                            {row.valorResgate === 0 ? "R$ -" : formatCurrency(row.valorResgate)}
                                        </td>
                                        <td className={`p-3 border-r ${theme.tableHeaderBase} font-medium ${isDarkMode ? 'bg-[#1f3f2b]/50 text-emerald-400' : 'bg-green-50 text-green-700'}`}>
                                            {row.reservaFinal === 0 ? "R$ -" : formatCurrency(row.reservaFinal)}
                                        </td>
                                        <td className={`p-3 ${isDarkMode ? 'bg-[#4a2123]/40 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
                                            {row.custoSeguro === 0 ? "R$ 0,00" : formatCurrency(row.custoSeguro)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
