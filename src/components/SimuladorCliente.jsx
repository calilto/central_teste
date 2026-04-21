import React, { useState, useEffect, useMemo } from 'react';
import { 
    TerminalWindow, 
    Database, 
    WarningCircle, 
    Info, 
    UserCircle, 
    ChartPieSlice, 
    ShieldCheck, 
    Power, 
    CheckCircle, 
    Star,
    Quotes,
    Lightbulb,
    ArrowUpRight,
    Target,
    Lightning
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
import { ArrowLeft, X } from 'lucide-react';

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

const SimuladorCliente = ({ onClose }) => {
    // Estados do Formulário (Valores padrão baseados no case 'Vitorio')
    const [nome, setNome] = useState('Vitorio L. A. Fava');
    const [idade, setIdade] = useState(29);
    const [aposentadoria, setAposentadoria] = useState(60);
    const [expectativa, setExpectativa] = useState(100);
    const [liquido, setLiquido] = useState(802452);
    const [imoveis, setImoveis] = useState(1080000);
    const [aporte, setAporte] = useState(8404);
    const [renda, setRenda] = useState(12000);
    const [rentabilidade, setRentabilidade] = useState(4.8);
    const [idadeEvento, setIdadeEvento] = useState(45);
    const [riscoDg, setRiscoDg] = useState(20);
    const [riscoSuc, setRiscoSuc] = useState(16);
    const [isInsuranceActive, setIsInsuranceActive] = useState(false);

    // Formatação BRL
    const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

    // Cálculos Derivados
    const simulationData = useMemo(() => {
        const taxaJurosRealAnual = rentabilidade / 100;
        const taxaMensal = Math.pow(1 + taxaJurosRealAnual, 1 / 12) - 1;
        const patrimonioTotal = liquido + imoveis;
        const custoSucessorio = patrimonioTotal * (riscoSuc / 100);

        let labels = [], dataBase = [], dataDoenca = [], dataFalta = [];
        let saldoBase = liquido, saldoDoenca = liquido, saldoFalta = liquido;
        let esgotamentoBase = null, esgotamentoDoenca = null;
        let moneyEndedBase = false, moneyEndedDoenca = false;
        let patAposentadoriaBase = 0, patAposentadoriaDoenca = 0;
        let resgateForcadoDG = 0;

        for (let i = idade; i <= expectativa; i++) {
            labels.push(`${i}`);

            if (i === idadeEvento) {
                resgateForcadoDG = saldoDoenca * (riscoDg / 100);
                if (!isInsuranceActive) {
                    saldoDoenca -= resgateForcadoDG;
                    saldoFalta -= custoSucessorio;
                }
            }

            dataBase.push(saldoBase > 0 ? saldoBase : 0);
            dataDoenca.push(saldoDoenca > 0 ? saldoDoenca : 0);
            dataFalta.push(saldoFalta > 0 ? saldoFalta : 0);

            if (i === aposentadoria) {
                patAposentadoriaBase = saldoBase > 0 ? saldoBase : 0;
                patAposentadoriaDoenca = saldoDoenca > 0 ? saldoDoenca : 0;
            }

            if (saldoBase <= 0 && !moneyEndedBase) { esgotamentoBase = i; moneyEndedBase = true; }
            if (saldoDoenca <= 0 && !moneyEndedDoenca) { esgotamentoDoenca = i; moneyEndedDoenca = true; }

            if (i < aposentadoria) {
                for (let m = 0; m < 12; m++) {
                    saldoBase = (saldoBase * (1 + taxaMensal)) + aporte;
                    saldoDoenca = (saldoDoenca * (1 + taxaMensal)) + aporte;
                    if (saldoFalta > 0) saldoFalta = (saldoFalta * (1 + taxaMensal)) + aporte;
                }
            } else {
                for (let m = 0; m < 12; m++) {
                    if (saldoBase > 0) saldoBase = (saldoBase * (1 + taxaMensal)) - renda;
                    if (saldoDoenca > 0) saldoDoenca = (saldoDoenca * (1 + taxaMensal)) - renda;
                    if (saldoFalta > 0) saldoFalta = (saldoFalta * (1 + taxaMensal)) - renda;
                }
            }
        }

        esgotamentoBase = esgotamentoBase || expectativa;
        esgotamentoDoenca = esgotamentoDoenca || expectativa;
        
        const perdaJuros = patAposentadoriaBase - patAposentadoriaDoenca;
        const impactoTotalDg = resgateForcadoDG + perdaJuros;
        const capitalRenda = renda * 12;
        const capitalRecomendado = custoSucessorio + impactoTotalDg + capitalRenda;

        return {
            labels,
            dataBase,
            dataDoenca,
            dataFalta,
            patrimonioTotal,
            custoSucessorio,
            resgateForcadoDG,
            perdaJuros,
            impactoTotalDg,
            capitalRecomendado,
            esgotamentoBase,
            esgotamentoDoenca,
            gapBase: expectativa - esgotamentoBase,
            gapDoenca: expectativa - esgotamentoDoenca,
            capitalRenda
        };
    }, [nome, idade, aposentadoria, expectativa, liquido, imoveis, aporte, renda, rentabilidade, idadeEvento, riscoDg, riscoSuc, isInsuranceActive]);

    const chartData = {
        labels: simulationData.labels,
        datasets: [
            {
                label: 'IDEAL',
                data: simulationData.dataBase,
                borderColor: '#00F0FF',
                backgroundColor: 'rgba(0, 240, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0,
                pointRadius: 0
            },
            {
                label: 'DOENÇA',
                data: simulationData.dataDoenca,
                borderColor: '#FF003C',
                borderWidth: 2,
                borderDash: [4, 4],
                fill: false,
                tension: 0,
                pointRadius: 0,
                hidden: isInsuranceActive
            },
            {
                label: 'FALTA',
                data: simulationData.dataFalta,
                borderColor: '#F59E0B',
                borderWidth: 2,
                borderDash: [2, 6],
                fill: false,
                tension: 0,
                pointRadius: 0,
                hidden: isInsuranceActive
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                display: true, 
                position: 'top', 
                align: 'end',
                labels: {
                    color: '#94a3b8',
                    font: { size: 10, weight: 'bold' },
                    usePointStyle: true,
                    pointStyle: 'rect'
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(7, 11, 20, 0.95)',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
                borderColor: '#334155',
                borderWidth: 1,
                callbacks: {
                    label: (context) => `${context.dataset.label}: ${formatBRL(context.parsed.y)}`
                }
            }
        },
        scales: {
            x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } },
            y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b', font: { size: 10 }, callback: (val) => val === 0 ? 'R$ 0' : 'R$ ' + (val / 1000) + 'k' } }
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-[#070B14] text-[#E5E7EB] overflow-hidden font-sans">
            <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'linear-gradient(#00F0FF 1px, transparent 1px), linear-gradient(90deg, #00F0FF 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
            
            {/* Sidebar de Parâmetros */}
            <aside className="w-full lg:w-80 border-r border-[#00F0FF]/20 bg-[#070B14]/90 overflow-y-auto p-6 flex-shrink-0 flex flex-col gap-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-white text-2xl font-bold tracking-widest uppercase" style={{ textShadow: '0 0 10px rgba(245,158,11,0.5)' }}>
                        EURO<span className="text-[#F59E0B] font-light">STOCK</span>
                    </div>
                </div>

                {/* PARÂMETROS */}
                <div className="space-y-4">
                    <h2 className="text-[10px] font-bold text-[#00F0FF] uppercase tracking-widest flex items-center gap-2 mb-4">
                        <TerminalWindow size={16} weight="bold" /> PARÂMETROS
                    </h2>
                    
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">ID CLIENTE</label>
                        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-[#0F172A] border border-gray-700 rounded p-2 text-sm text-[#00F0FF] focus:border-[#00F0FF] outline-none font-mono" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">IDADE BASE</label>
                            <input type="number" value={idade} onChange={(e) => setIdade(Number(e.target.value))} className="w-full bg-[#0F172A] border border-gray-700 rounded p-2 text-sm text-white outline-none font-mono" />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">REFORMA</label>
                            <input type="number" value={aposentadoria} onChange={(e) => setAposentadoria(Number(e.target.value))} className="w-full bg-[#0F172A] border border-gray-700 rounded p-2 text-sm text-white outline-none font-mono" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">ESPERANÇA DE VIDA</label>
                        <input type="number" value={expectativa} onChange={(e) => setExpectativa(Number(e.target.value))} className="w-full bg-[#0F172A] border border-gray-700 rounded p-2 text-sm text-white outline-none font-mono" />
                    </div>
                </div>

                {/* PATRIMÔNIO BASE */}
                <div className="pt-4 border-t border-gray-800/50 space-y-4">
                    <h3 className="text-[10px] font-bold text-[#00F0FF] uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Database size={16} weight="bold" /> PATRIMÔNIO BASE
                    </h3>
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">LÍQUIDO / INVESTIDO (R$)</label>
                        <input type="number" value={liquido} onChange={(e) => setLiquido(Number(e.target.value))} className="w-full bg-[#0F172A] border border-gray-700 rounded p-2 text-sm text-[#00F0FF] outline-none font-mono" />
                    </div>
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">IMOBILIZADO / BENS (R$)</label>
                        <input type="number" value={imoveis} onChange={(e) => setImoveis(Number(e.target.value))} className="w-full bg-[#0F172A] border border-gray-700 rounded p-2 text-sm text-white outline-none font-mono" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] text-[#00FF66] uppercase tracking-widest mb-1">APORTE/MÊS</label>
                            <input type="number" value={aporte} onChange={(e) => setAporte(Number(e.target.value))} className="w-full bg-[#0F172A] border border-gray-700 rounded p-2 text-sm text-[#00FF66] outline-none font-mono" />
                        </div>
                        <div>
                            <label className="block text-[10px] text-[#F59E0B] uppercase tracking-widest mb-1">SAQUE/MÊS</label>
                            <input type="number" value={renda} onChange={(e) => setRenda(Number(e.target.value))} className="w-full bg-[#0F172A] border border-gray-700 rounded p-2 text-sm text-[#F59E0B] outline-none font-mono" />
                        </div>
                    </div>
                </div>

                {/* FATORES DE STRESS */}
                <div className="pt-4 border-t border-gray-800/50 space-y-4">
                    <h3 className="text-[10px] font-bold text-[#00F0FF] uppercase tracking-widest flex items-center gap-2 mb-4">
                        <WarningCircle size={16} weight="bold" /> FATORES DE STRESS
                    </h3>
                    
                    <div className="space-y-5">
                        <div className="group relative">
                            <div className="flex justify-between items-center text-[10px] text-[#00FF66] uppercase tracking-widest mb-1">
                                <span className="flex items-center gap-1 cursor-help">RENTABILIDADE (%/A.A.) <Info size={12} className="text-gray-500" /></span>
                                <span className="font-mono">{rentabilidade}%</span>
                            </div>
                            <input type="range" min="1" max="15" step="0.1" value={rentabilidade} onChange={(e) => setRentabilidade(Number(e.target.value))} className="w-full accent-[#00FF66] cursor-pointer" />
                        </div>

                        <div className="group relative">
                            <div className="flex justify-between items-center text-[10px] text-[#FF003C] uppercase tracking-widest mb-1">
                                <span className="flex items-center gap-1 cursor-help">IDADE DO EVENTO (ALVO) <Info size={12} className="text-gray-500" /></span>
                                <span className="font-mono">{idadeEvento}A</span>
                            </div>
                            <input type="range" min={idade + 1} max={aposentadoria - 1} value={idadeEvento} onChange={(e) => setIdadeEvento(Number(e.target.value))} className="w-full accent-[#FF003C] cursor-pointer" />
                        </div>

                        <div className="group relative">
                            <div className="flex justify-between items-center text-[10px] text-[#FF003C] uppercase tracking-widest mb-1">
                                <span className="flex items-center gap-1 cursor-help">IMPACTO DOENÇA (%) <Info size={12} className="text-gray-500" /></span>
                                <span className="font-mono">{riscoDg}%</span>
                            </div>
                            <input type="range" min="1" max="100" step="1" value={riscoDg} onChange={(e) => setRiscoDg(Number(e.target.value))} className="w-full accent-[#FF003C] cursor-pointer" />
                        </div>

                        <div className="group relative">
                            <div className="flex justify-between items-center text-[10px] text-[#F59E0B] uppercase tracking-widest mb-1">
                                <span className="flex items-center gap-1 cursor-help">TAXA SUCESSÓRIA <Info size={12} className="text-gray-500" /></span>
                                <span className="font-mono">{riscoSuc}%</span>
                            </div>
                            <input type="range" min="1" max="40" step="1" value={riscoSuc} onChange={(e) => setRiscoSuc(Number(e.target.value))} className="w-full accent-[#F59E0B] cursor-pointer" />
                        </div>
                    </div>
                </div>
            </aside>

            {/* Conteúdo Principal */}
            <main className="flex-1 p-8 overflow-y-auto relative z-10">
                <button onClick={onClose} className="fixed top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors z-50">
                    <X size={24} />
                </button>

                {/* header */}
                <header className="mb-10 border-b border-[#00F0FF]/20 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <span className="text-[10px] font-bold text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-1 rounded border border-[#00F0FF]/20 mb-3 inline-block">1️⃣ Construção de Patrimônio</span>
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 uppercase tracking-tight">
                            <UserCircle size={32} className="text-[#00F0FF]" /> SIMULAÇÃO DE {nome}
                        </h1>
                        <p className="text-[10px] text-[#00F0FF]/70 font-mono mt-2 uppercase tracking-widest">
                            IDADE: <span className="text-white">{idade}</span> | REFORMA: <span className="text-white">{aposentadoria}</span> | ESP. VIDA: <span className="text-white">{expectativa}</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-[#F59E0B] uppercase tracking-widest mb-1">Patrimônio Atual (Total)</p>
                        <h2 className="text-3xl md:text-4xl font-bold font-mono text-white" style={{ textShadow: '0 0 15px rgba(255,255,255,0.2)' }}>{formatBRL(simulationData.patrimonioTotal)}</h2>
                        <div className="flex gap-2 justify-end mt-2 opacity-80">
                            <span className="text-[10px] font-mono text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded border border-[#00F0FF]/20">Financeiro: <b>{formatBRL(liquido)}</b></span>
                            <span className="text-[10px] font-mono text-gray-300 bg-gray-800/50 px-2 py-0.5 rounded border border-gray-700">Imobiliário: <b>{formatBRL(imoveis)}</b></span>
                        </div>
                    </div>
                </header>

                <div className="mb-6">
                    <span className="text-[10px] font-bold text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-1 rounded border border-[#00F0FF]/20 inline-block uppercase tracking-widest">2️⃣ Eventos Inesperados & Diagnóstico</span>
                </div>

                {/* Cards de Diagnóstico */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {/* Sucessão */}
                    <div className="bg-[#0F172A]/70 backdrop-blur-xl p-6 rounded-2xl border-t-2 border-[#F59E0B]/50 relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F59E0B] group-hover:shadow-[0_0_15px_rgba(245,158,11,0.8)] transition-all"></div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-white">🖤 Falta Precoce</span>
                            <span className="text-[10px] font-mono bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 px-2 py-1 rounded">T={idadeEvento}a</span>
                        </div>
                        <div className="bg-[#070B14]/60 p-3 rounded-lg border border-gray-800/50 mb-4">
                            <p className="text-[9px] text-gray-400 uppercase mb-2">CUSTO DE INVENTÁRIO</p>
                            <p className="text-xs font-bold text-[#F59E0B] font-mono flex items-center gap-1">
                                <ChartPieSlice size={14} weight="fill" /> {riscoSuc}% do patrimônio
                            </p>
                        </div>
                        <h3 className="text-2xl font-bold text-[#F59E0B] font-mono tracking-tighter">{formatBRL(simulationData.custoSucessorio)}</h3>
                    </div>

                    {/* Doença */}
                    <div className="bg-[#0F172A]/70 backdrop-blur-xl p-6 rounded-2xl border-t-2 border-[#FF003C]/50 relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF003C] group-hover:shadow-[0_0_15px_rgba(255,0,60,0.8)] transition-all"></div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-white">❤️ Se ficar doente</span>
                            <span className="text-[10px] font-mono bg-[#FF003C]/10 text-[#FF003C] border border-[#FF003C]/30 px-2 py-1 rounded">Aos {idadeEvento}a</span>
                        </div>
                        <div className="bg-[#070B14]/60 p-3 rounded-lg border border-gray-800/50 mb-4 space-y-1">
                            <div className="flex justify-between text-[9px] font-mono">
                                <span className="text-gray-400 uppercase">RESGATE (LIQUIDEZ):</span>
                                <span className="text-white">{formatBRL(simulationData.resgateForcadoDG)}</span>
                            </div>
                            <div className="flex justify-between text-[9px] font-mono">
                                <span className="text-gray-400 uppercase">JUROS PERDIDOS:</span>
                                <span className="text-[#FF003C]">{formatBRL(simulationData.perdaJuros)}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Impacto Total 📉</p>
                                <h3 className={`text-2xl font-bold font-mono tracking-tighter ${isInsuranceActive ? 'text-[#00FF66] drop-shadow-[0_0_8px_rgba(0,255,102,0.4)]' : 'text-[#FF003C] drop-shadow-[0_0_8px_rgba(255,0,60,0.4)]'}`}>
                                    {isInsuranceActive ? 'R$ 0 (Segurado)' : `- ${formatBRL(simulationData.impactoTotalDg)}`}
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* Morte Financeira */}
                    <div className="bg-[#0F172A]/70 backdrop-blur-xl p-6 rounded-2xl border-t-2 border-[#00F0FF]/50 relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00F0FF] group-hover:shadow-[0_0_15px_rgba(0,240,255,0.8)] transition-all"></div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-white">💀 Quando o dinheiro acaba</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mb-6 uppercase tracking-wider leading-relaxed">MOMENTO EM QUE O PATRIMÔNIO NÃO SUSTENTA MAIS A RENDA DESEJADA.</p>
                        <div className="bg-[#070B14]/60 p-4 rounded-xl border border-gray-800/50 text-center">
                            <p className="text-[9px] text-gray-500 uppercase font-mono mb-1">TEMPO PARA RUÍNA (CENÁRIO DOENÇA)</p>
                            <p className="text-sm text-white font-mono">DINHEIRO DURA ATÉ: <span className={`font-bold ${simulationData.gapDoenca > 0 ? 'text-[#FF003C]' : 'text-[#00FF66]'}`}>{simulationData.esgotamentoDoenca}a</span></p>
                            {simulationData.gapDoenca > 0 ? (
                                <div className="text-[10px] text-[#FF003C] mt-1 uppercase font-bold bg-[#FF003C]/10 py-1 px-2 rounded-lg border border-[#FF003C]/30 inline-block">⚠️ {simulationData.gapDoenca} ANOS DESCOBERTOS</div>
                            ) : (
                                <div className="text-[10px] text-[#00FF66] mt-1 uppercase font-bold bg-[#00FF66]/10 py-1 px-2 rounded-lg border border-[#00FF66]/30 inline-block">Sustentável</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Gráfico e Fechamento */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 bg-[#0F172A]/70 backdrop-blur-2xl p-8 rounded-3xl border border-[#00F0FF]/10 flex flex-col min-h-[500px]">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-4">
                            <h3 className="text-[10px] text-[#00F0FF] font-bold uppercase tracking-widest flex items-center gap-2">
                                <span className="bg-[#00F0FF]/10 px-2 py-0.5 rounded border border-[#00F0FF]/20">3️⃣ O Impacto Financeiro</span> Evolução (3 Riscos)
                            </h3>
                        </div>
                        <div className="flex-1 min-h-[350px]">
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    </div>

                    <div className="bg-[#0F172A]/70 backdrop-blur-2xl rounded-3xl border-t-4 border-t-[#00F0FF] overflow-hidden flex flex-col">
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <h3 className="text-[10px] text-[#00F0FF] font-bold uppercase tracking-widest mb-6 py-1 px-2 bg-[#00F0FF]/10 rounded border border-[#00F0FF]/20 inline-block">
                                4️⃣ SOLUÇÃO E FECHAMENTO
                            </h3>

                            {/* Semáforos */}
                            <div className="mb-6 pb-6 border-b border-gray-800/50">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">RISCO PATRIMONIAL</p>
                                    <span className={`text-xs font-mono font-bold ${simulationData.gapDoenca > 0 ? 'text-[#FF003C]' : 'text-[#00FF66]'}`}>
                                        {simulationData.gapDoenca > 0 ? '⚠️ RISCO ALTO' : '🛡️ SEGURO'}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                        <span className="text-gray-400 uppercase">INVENTÁRIO:</span>
                                        <span className="flex items-center gap-1.5 text-white">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]"></span> baixo
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                        <span className="text-gray-400 uppercase">DOENÇA GRAVE:</span>
                                        <span className="flex items-center gap-1.5 text-white">
                                            <span className={`w-1.5 h-1.5 rounded-full ${isInsuranceActive ? 'bg-[#00FF66]' : 'bg-[#FF003C]'}`}></span> 
                                            {isInsuranceActive ? 'baixo' : 'alto'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                        <span className="text-gray-400 uppercase">APOSENTADORIA:</span>
                                        <span className="flex items-center gap-1.5 text-white">
                                            <span className={`w-1.5 h-1.5 rounded-full ${simulationData.gapDoenca > 0 ? 'bg-[#FF003C]' : 'bg-[#00FF66]'}`}></span>
                                            {simulationData.gapDoenca > 0 ? 'alto' : 'baixo'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-[#070B14] p-3 rounded-xl border border-gray-800/50">
                                    <p className="text-[8px] text-gray-500 uppercase font-mono mb-1">SEM PROTEÇÃO</p>
                                    <p className="text-[8px] text-gray-400 mb-2 uppercase">PERDA POTENCIAL:</p>
                                    <p className="text-xs font-bold text-[#FF003C] font-mono">💸 - {formatBRL(Math.max(simulationData.impactoTotalDg, simulationData.custoSucessorio))}</p>
                                </div>
                                <div className="bg-[#00F0FF]/10 p-3 rounded-xl border border-[#00F0FF]/30">
                                    <p className="text-[8px] text-[#00F0FF]/70 uppercase font-mono mb-1">COM PROTEÇÃO</p>
                                    <p className="text-[8px] text-[#00F0FF]/50 mb-2 uppercase">SEGURO PAGA:</p>
                                    <p className="text-xs font-bold text-[#00F0FF] font-mono">🛡️ + {formatBRL(simulationData.capitalRecomendado)}</p>
                                </div>
                            </div>

                            <div className="bg-[#070B14] p-4 rounded-2xl border border-[#F59E0B]/30 mb-6">
                                <p className="text-[9px] text-[#F59E0B] uppercase font-black flex items-center gap-1 mb-4">
                                    <Star size={12} weight="fill" /> CAPITAL RECOMENDADO
                                </p>
                                <div className="space-y-2 text-[10px] font-mono">
                                    <div className="flex justify-between opacity-60">
                                        <span className="uppercase">INVENTÁRIO:</span><span>{formatBRL(simulationData.custoSucessorio)}</span>
                                    </div>
                                    <div className="flex justify-between opacity-60">
                                        <span className="uppercase">DOENÇA GRAVE:</span><span>{formatBRL(simulationData.impactoTotalDg)}</span>
                                    </div>
                                    <div className="flex justify-between opacity-60">
                                        <span className="uppercase">RENDA (12M):</span><span>{formatBRL(simulationData.capitalRenda)}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-800 pt-3 mt-1 font-bold text-white text-xs">
                                        <span className="uppercase">TOTAL:</span><span className="text-[#F59E0B]">{formatBRL(simulationData.capitalRecomendado)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-[#070B14] border-t border-gray-800 space-y-4">
                            <button 
                                onClick={() => setIsInsuranceActive(!isInsuranceActive)}
                                className={`w-full py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 ${
                                    isInsuranceActive 
                                    ? 'bg-[#00FF66] text-[#070B14] shadow-[0_0_25px_rgba(0,255,102,0.3)]' 
                                    : 'bg-[#00F0FF] text-[#070B14] hover:shadow-[0_0_25px_rgba(0,240,255,0.3)]'
                                }`}
                            >
                                <Power size={20} weight="bold" /> {isInsuranceActive ? 'SISTEMA BLINDADO (ATIVO)' : 'ATIVAR SOLUÇÃO EUROSTOCK'}
                            </button>
                            {isInsuranceActive && (
                                <div className="space-y-1.5 text-[9px] text-[#00FF66] uppercase font-bold px-2">
                                    <p className="flex items-center gap-2"><CheckCircle size={14} weight="bold" /> Patrimônio preservado</p>
                                    <p className="flex items-center gap-2"><CheckCircle size={14} weight="bold" /> Aposentadoria protegida</p>
                                    <p className="flex items-center gap-2"><CheckCircle size={14} weight="bold" /> Inventário pago</p>
                                    <p className="flex items-center gap-2"><CheckCircle size={14} weight="bold" /> Renda garantida</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SimuladorCliente;
