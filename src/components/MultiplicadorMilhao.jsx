import React, { useState, useEffect, useMemo } from 'react';
import { 
    ChartLineUp, 
    Target, 
    Lightning, 
    Quotes, 
    Lightbulb, 
    CheckCircle,
    TrendUp,
    ArrowUpRight,
    X
} from '@phosphor-icons/react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const MultiplicadorMilhao = ({ onClose }) => {
    // Parâmetros de Entrada
    const [initialCapital, setInitialCapital] = useState(10000);
    const [monthlyDeposit, setMonthlyDeposit] = useState(1500);
    const [annualRate, setAnnualRate] = useState(12);
    const [years, setYears] = useState(30);
    const [annualInflation, setAnnualInflation] = useState(4.5);
    const [annualSalaryGrowth, setAnnualSalaryGrowth] = useState(3);
    
    // Flags
    const [adjustPatrimonyByInflation, setAdjustPatrimonyByInflation] = useState(true);
    const [adjustDepositsByInflation, setAdjustDepositsByInflation] = useState(true);
    const [adjustDepositsBySalary, setAdjustDepositsBySalary] = useState(true);
    const [applyIR, setApplyIR] = useState(true);

    // Formatação BRL
    const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

    // Simulação
    const simulation = useMemo(() => {
        const monthsTotal = years * 12;
        const monthlyRate = Math.pow(1 + (annualRate / 100), 1 / 12) - 1;
        const monthlyInflation = Math.pow(1 + (annualInflation / 100), 1 / 12) - 1;
        const monthlySalaryGrowth = Math.pow(1 + (annualSalaryGrowth / 100), 1 / 12) - 1;

        let data = [];
        let currentCapital = initialCapital;
        let totalInvested = initialCapital;
        let totalInterest = 0;
        let yearToMillion = null;
        let yearToInflexion = null;

        for (let m = 0; m <= monthsTotal; m++) {
            const currentYear = Math.floor(m / 12);
            
            if (m > 0) {
                let depositThisMonth = monthlyDeposit;
                if (adjustDepositsByInflation) depositThisMonth *= Math.pow(1 + (annualInflation / 100), currentYear);
                if (adjustDepositsBySalary) depositThisMonth *= Math.pow(1 + (annualSalaryGrowth / 100), currentYear);
                
                currentCapital += depositThisMonth;
                totalInvested += depositThisMonth;
                
                const interestThisMonth = currentCapital * monthlyRate;
                let netInterest = applyIR ? interestThisMonth * 0.85 : interestThisMonth;
                
                currentCapital += netInterest;
                totalInterest += netInterest;

                if (netInterest > depositThisMonth && yearToInflexion === null) yearToInflexion = currentYear;
            }

            let displayedCapital = adjustPatrimonyByInflation 
                ? currentCapital / Math.pow(1 + (annualInflation / 100), currentYear)
                : currentCapital;

            if (displayedCapital >= 1000000 && yearToMillion === null) yearToMillion = currentYear;

            if (m % 12 === 0) {
                data.push({
                    year: currentYear,
                    nominal: currentCapital,
                    real: currentCapital / Math.pow(1 + (annualInflation / 100), currentYear),
                });
            }
        }

        return { data, yearToMillion, yearToInflexion, finalNominal: currentCapital, finalReal: data[data.length-1].real, totalInterest };
    }, [initialCapital, monthlyDeposit, annualRate, years, annualInflation, annualSalaryGrowth, adjustPatrimonyByInflation, adjustDepositsByInflation, adjustDepositsBySalary, applyIR]);

    const chartData = {
        labels: simulation.data.map(d => `Ano ${d.year}`),
        datasets: [
            {
                label: 'Nominal',
                data: simulation.data.map(d => d.nominal),
                borderColor: '#00F0FF',
                backgroundColor: 'rgba(0, 240, 255, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0
            },
            {
                label: 'Real',
                data: simulation.data.map(d => d.real),
                borderColor: '#E8B923',
                borderDash: [5, 5],
                fill: false,
                tension: 0.4,
                pointRadius: 0
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { mode: 'index', intersect: false }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 9 } } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#475569', font: { size: 9 }, callback: v => 'R$ ' + (v/1000000).toFixed(1) + 'M' } }
        }
    };

    const Checkbox = ({ label, active, onChange }) => (
        <div onClick={() => onChange(!active)} className="flex items-center justify-between cursor-pointer group">
            <span className={`text-[11px] font-medium transition-colors ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{label}</span>
            <div className={`w-10 h-5 rounded-full relative transition-all p-1 ${active ? 'bg-[#00F0FF]/80' : 'bg-slate-800'}`}>
                <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-all ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-[#070B14] text-slate-300 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-full lg:w-80 border-r border-slate-800 bg-[#070B14]/90 overflow-y-auto p-6 flex flex-col gap-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[#E8B923] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(232,185,35,0.2)]">
                        <ChartLineUp size={24} weight="bold" className="text-[#070B14]" />
                    </div>
                    <div>
                        <h1 className="text-white font-black text-xl tracking-tighter">EUROSTOCK</h1>
                        <p className="text-[10px] text-[#00F0FF] uppercase tracking-widest font-bold">Multiplicador</p>
                    </div>
                </div>

                <div className="bg-[#0F172A]/50 border border-slate-800/50 rounded-3xl p-6 space-y-6">
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-black mb-3 block">Configuração Inicial</label>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-slate-400 mb-1">Capital Inicial</p>
                                <input type="number" value={initialCapital} onChange={e => setInitialCapital(Number(e.target.value))} className="w-full bg-[#0F172A] border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-[#00F0FF] outline-none transition-all" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 mb-1">Aporte Mensal</p>
                                <input type="number" value={monthlyDeposit} onChange={e => setMonthlyDeposit(Number(e.target.value))} className="w-full bg-[#0F172A] border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-[#00F0FF] outline-none transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-800/50">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Taxa Anual</span>
                                <span className="text-xs font-bold text-[#00F0FF]">{annualRate}%</span>
                            </div>
                            <input type="range" min="1" max="25" step="0.5" value={annualRate} onChange={e => setAnnualRate(Number(e.target.value))} className="w-full accent-[#00F0FF]" />
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Anos</span>
                                <span className="text-xs font-bold text-[#E8B923]">{years}a</span>
                            </div>
                            <input type="range" min="1" max="50" value={years} onChange={e => setYears(Number(e.target.value))} className="w-full accent-[#E8B923]" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/50 space-y-4">
                        <Checkbox label="Deflacionar Gráfico" active={adjustPatrimonyByInflation} onChange={setAdjustPatrimonyByInflation} />
                        <Checkbox label="Corrigir Aporte (Inflação)" active={adjustDepositsByInflation} onChange={setAdjustDepositsByInflation} />
                        <Checkbox label="Corrigir Aporte (Salário)" active={adjustDepositsBySalary} onChange={setAdjustDepositsBySalary} />
                        <Checkbox label="Aplicar IR (15%)" active={applyIR} onChange={setApplyIR} />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto relative">
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>

                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Header Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#0F172A]/80 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#00F0FF]/5 rounded-full blur-2xl group-hover:bg-[#00F0FF]/10 transition-all"></div>
                            <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Patrimônio Real Final</p>
                            <h2 className="text-4xl font-bold text-white tracking-tighter">{formatBRL(simulation.finalReal)}</h2>
                            <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase">
                                <ArrowUpRight size={14} weight="bold" />
                                <span>Poder de compra preservado</span>
                            </div>
                        </div>
                        <div className="bg-[#0F172A]/80 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
                            <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Primeiro Milhão</p>
                            <h2 className="text-4xl font-bold text-white tracking-tighter">{simulation.yearToMillion || '--'} <span className="text-sm font-light uppercase opacity-40 italic">Anos</span></h2>
                            <div className="mt-4 flex items-center gap-2 text-[10px] text-[#E8B923] font-bold uppercase">
                                <Target size={14} weight="bold" />
                                <span>Meta Eurostock</span>
                            </div>
                        </div>
                        <div className="bg-[#0F172A]/80 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
                            <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Liberdade em</p>
                            <h2 className="text-4xl font-bold text-white tracking-tighter">{simulation.yearToInflexion || '--'} <span className="text-sm font-light uppercase opacity-40 italic">Anos</span></h2>
                            <div className="mt-4 flex items-center gap-2 text-[10px] text-[#00F0FF] font-bold uppercase">
                                <Lightning size={14} weight="bold" />
                                <span>Juros maior que o aporte</span>
                            </div>
                        </div>
                    </div>

                    {/* Evolutionary Chart */}
                    <div className="bg-[#0F172A]/80 border border-slate-800 rounded-[40px] p-10 flex flex-col min-h-[500px]">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-4">
                            <div>
                                <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Evolução Exponencial</h3>
                                <p className="text-sm text-slate-500">Curva de crescimento real vs projeção nominal acumulada.</p>
                            </div>
                            <div className="flex gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full border-2 border-[#00F0FF]"></div>
                                    <span className="text-[10px] uppercase font-black text-slate-400">Nominal</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#E8B923]"></div>
                                    <span className="text-[10px] uppercase font-black text-slate-400">Real</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Insights Footer */}
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 flex gap-4">
                            <Quotes size={32} weight="bold" className="text-[#00F0FF] opacity-30 shrink-0" />
                            <p className="text-xs text-slate-400 leading-relaxed italic">
                                "O multiplicador do milhão não é sobre quanto você ganha, mas sobre quanto tempo o seu dinheiro fica exposto aos juros compostos."
                            </p>
                        </div>
                        <div className="flex-1 bg-[#E8B923]/5 border border-[#E8B923]/10 rounded-2xl p-6 flex gap-4">
                            <Lightbulb size={32} weight="bold" className="text-[#E8B923] opacity-30 shrink-0" />
                            <p className="text-xs text-slate-400 leading-relaxed italic">
                                Dica: Aumentar seu aporte em 10% hoje pode reduzir o tempo para o primeiro milhão em mais de 3 anos.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MultiplicadorMilhao;
