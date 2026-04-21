import React, { useState, useMemo } from 'react';
import {
    Calculator, Info, TrendingUp, ShieldCheck,
    Home, DollarSign, Calendar, Sun, Moon, ArrowLeft
} from 'lucide-react';

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

export default function SimuladorImobiliario({ onClose }) {
    // --- Estado do Tema ---
    const [darkMode, setDarkMode] = useState(true);

    // --- Estados do Simulador Imobiliário ---
    const [valorImovel, setValorImovel] = useState(350000);
    const [valorEntrada, setValorEntrada] = useState(70000);
    const [prazoAnos, setPrazoAnos] = useState(30);

    // Taxas e Amortização
    const [tipoTaxa, setTipoTaxa] = useState('pos'); // Default para 'pos' para demonstrar
    const [jurosAnual, setJurosAnual] = useState(9.5);
    const [correcaoAnual, setCorrecaoAnual] = useState(0); // Novo estado de Correção
    const [sistema, setSistema] = useState('price'); // Mudado default para Price com base na nova imagem para consistência visual

    // Seguros
    const [dfi, setDfi] = useState(0.01);
    const [mip, setMip] = useState(0.05);

    // --- Lógica de Cálculo do Financiamento ---
    const simulacao = useMemo(() => {
        const imovel = parseFloat(valorImovel) || 0;
        const entrada = parseFloat(valorEntrada) || 0;
        const anos = parseInt(prazoAnos) || 0;
        const jurosA = parseFloat(jurosAnual) || 0;
        const taxaCorrecaoA = parseFloat(correcaoAnual) || 0;
        const taxaDfi = parseFloat(dfi) || 0;
        const taxaMip = parseFloat(mip) || 0;

        const meses = anos * 12;
        const financiado = Math.max(0, imovel - entrada);

        // Taxas mensais proporcionais
        const jurosMensal = (jurosA / 100) / 12;
        // NOVA LOGICA REPLICADA: Conversão de indexador anual para mensal usando Juros Compostos
        const taxaCorrecaoMensal = tipoTaxa === 'pos' ? (Math.pow(1 + taxaCorrecaoA / 100, 1 / 12) - 1) : 0;
        const valorDfi = imovel * (taxaDfi / 100); // DFI é fixo sobre o valor do imóvel

        let schedule = [];
        let saldoAtual = financiado;
        let totalJuros = 0;
        let totalSeguros = 0;
        let primeiraPrestacao = 0;
        let ultimaPrestacao = 0;
        let totalGeralPrestações = 0; // Somatório do custo efetivo

        for (let i = 1; i <= meses; i++) {
            // 1. Aplicação da Correção (TR/IPCA) sobre o Saldo Devedor
            const correcao = saldoAtual * taxaCorrecaoMensal;
            saldoAtual += correcao;

            let amortizacao = 0;
            let juros = saldoAtual * jurosMensal;

            // 2. Cálculo da Amortização baseada no sistema (sobre saldo já corrigido)
            if (sistema === 'price') {
                const pmt = (saldoAtual * jurosMensal) / (1 - Math.pow(1 + jurosMensal, -(meses - i + 1)));
                amortizacao = pmt - juros;
            } else { // SAC
                amortizacao = saldoAtual / (meses - i + 1);
            }

            // 3. Cálculo de Seguros e Prestação Final
            const valorMip = saldoAtual * (taxaMip / 100);
            const seguros = valorDfi + valorMip;
            const prestacao = amortizacao + juros + seguros;

            // 4. Atualização de totais
            saldoAtual -= amortizacao;
            totalJuros += juros;
            totalSeguros += seguros;
            totalGeralPrestações += prestacao;

            if (i === 1) primeiraPrestacao = prestacao;
            ultimaPrestacao = prestacao; // Sempre guarda a última calculada

            schedule.push({
                mes: i,
                prestacao,
                amortizacao,
                juros,
                seguros,
                correcao,
                saldoDevedor: Math.max(0, saldoAtual)
            });
        }

        return {
            primeiraPrestacao,
            ultimaPrestacao,
            totalJuros,
            totalSeguros,
            totalGeral: totalGeralPrestações, // Custo efetivo total gerado
            cronograma: schedule,
            prazoMeses: meses
        };
    }, [valorImovel, valorEntrada, prazoAnos, jurosAnual, correcaoAnual, tipoTaxa, sistema, dfi, mip]);

    // --- Formatadores ---
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className={`${darkMode ? "dark" : ""} flex-1 w-full h-full`}>
            <div className="bg-slate-50 dark:bg-[#0E0F12] text-slate-800 dark:text-slate-300 font-sans flex flex-col md:flex-row overflow-hidden selection:bg-indigo-500/30 dark:selection:bg-amber-500/30 w-full h-full relative z-50 transition-colors duration-300">

                {/* HEADER MOBILE */}
                <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#121520] border-b border-slate-200 dark:border-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-transparent dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        <EurostockLogo isMobile={true} isDark={darkMode} />
                    </div>
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:text-[#E8B923] transition-all"
                    >
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>

                {/* SIDEBAR (Controles) */}
                <div className="w-full md:w-[320px] bg-white dark:bg-[#13151A] border-r border-slate-200 dark:border-[#1C1F26] flex flex-col h-auto md:h-full overflow-y-auto custom-scrollbar shrink-0 transition-colors duration-300">

                    {/* Header Desktop */}
                    <div className="hidden md:flex flex-col p-6 pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <EurostockLogo isMobile={false} isDark={darkMode} />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setDarkMode(!darkMode)}
                                    className="p-1.5 bg-slate-100 dark:bg-[#161a27] border border-slate-200 dark:border-[#1C1F26] rounded-lg text-slate-500 dark:text-[#94A3B8] hover:bg-slate-200 dark:hover:text-[#E8B923] transition-all"
                                    title="Alternar Tema"
                                >
                                    {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                                </button>
                                {onClose && (
                                    <button
                                        onClick={onClose}
                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-transparent dark:hover:bg-[#1C1F26] border border-slate-200 dark:border-transparent text-slate-500 dark:text-[#94A3B8] rounded-lg transition-colors cursor-pointer"
                                        title="Voltar ao Hub"
                                    >
                                        <ArrowLeft size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-2 mb-1">
                            <div className="bg-indigo-600 shadow-md dark:shadow-none dark:bg-[#1C1F26] dark:border dark:border-[#2D333F] p-1.5 rounded-lg flex items-center justify-center transition-colors">
                                <Calculator size={18} className="text-white dark:text-[#E8B923]" />
                            </div>
                            <h1 className="text-slate-800 dark:text-[#F8FAFC] font-bold text-[16px] leading-tight transition-colors">Simulador Imobiliário</h1>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] transition-colors">Planeje o seu financiamento com seguros e taxas.</p>
                    </div>

                    <div className="p-5 space-y-4 pt-2 pb-20">

                        {/* Seção: Dados Iniciais */}
                        <div className="bg-white dark:bg-[#15171C] rounded-lg p-4 border border-slate-200 dark:border-[#1C1F26] shadow-sm dark:shadow-none transition-colors">
                            <div className="flex items-center gap-2 mb-4 text-indigo-600 dark:text-[#94A3B8] transition-colors">
                                <Info size={16} />
                                <h2 className="font-bold text-[12px] text-slate-800 dark:text-[#E2E8F0] transition-colors">Dados Iniciais</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-[#64748B] mb-1.5 ml-1 transition-colors">Valor do Imóvel</label>
                                    <div className="relative flex items-center bg-slate-50 dark:bg-[#0E0F12] border border-slate-300 dark:border-[#1C1F26] rounded-md focus-within:border-indigo-500 dark:focus-within:border-[#2D333F] transition-colors">
                                        <Home size={14} className="absolute left-3 text-slate-400 dark:text-[#64748B] transition-colors" />
                                        <input
                                            type="number"
                                            value={valorImovel}
                                            onChange={(e) => setValorImovel(e.target.value)}
                                            className="w-full bg-transparent border-none py-2 pl-9 pr-3 text-slate-800 dark:text-[#E2E8F0] text-[13px] font-medium outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-[#64748B] mb-1.5 ml-1 transition-colors">Valor de Entrada</label>
                                    <div className="relative flex items-center bg-slate-50 dark:bg-[#0E0F12] border border-slate-300 dark:border-[#1C1F26] rounded-md focus-within:border-indigo-500 dark:focus-within:border-[#2D333F] transition-colors">
                                        <DollarSign size={14} className="absolute left-3 text-slate-400 dark:text-[#64748B] transition-colors" />
                                        <input
                                            type="number"
                                            value={valorEntrada}
                                            onChange={(e) => setValorEntrada(e.target.value)}
                                            className="w-full bg-transparent border-none py-2 pl-9 pr-3 text-slate-800 dark:text-[#E2E8F0] text-[13px] font-medium outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-[#64748B] mb-1.5 ml-1 transition-colors">Prazo (Anos)</label>
                                    <div className="relative flex items-center bg-slate-50 dark:bg-[#0E0F12] border border-slate-300 dark:border-[#1C1F26] rounded-md focus-within:border-indigo-500 dark:focus-within:border-[#2D333F] transition-colors">
                                        <Calendar size={14} className="absolute left-3 text-slate-400 dark:text-[#64748B] transition-colors" />
                                        <input
                                            type="number"
                                            value={prazoAnos}
                                            onChange={(e) => setPrazoAnos(e.target.value)}
                                            className="w-full bg-transparent border-none py-2 pl-9 pr-3 text-slate-800 dark:text-[#E2E8F0] text-[13px] font-medium outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Seção: Taxas e Amortização */}
                        <div className="bg-white dark:bg-[#15171C] rounded-lg p-4 border border-slate-200 dark:border-[#1C1F26] shadow-sm dark:shadow-none transition-colors">
                            <div className="flex items-center gap-2 mb-4 text-indigo-600 dark:text-[#94A3B8] transition-colors">
                                <TrendingUp size={16} />
                                <h2 className="font-bold text-[12px] text-slate-800 dark:text-[#E2E8F0] transition-colors">Taxas e Amortização</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-[#64748B] mb-1.5 ml-1 transition-colors">Tipo de Taxa</label>
                                    <div className="flex bg-slate-100 dark:bg-[#0E0F12] border border-slate-200 dark:border-[#1C1F26] p-1 rounded-md transition-colors">
                                        <button
                                            onClick={() => setTipoTaxa('pre')}
                                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-[4px] transition-all ${tipoTaxa === 'pre' ? 'bg-white shadow text-slate-800 dark:bg-[#1C1F26] dark:text-[#E2E8F0]' : 'text-slate-500 hover:text-slate-700 dark:text-[#64748B] dark:hover:text-[#94A3B8]'
                                                }`}
                                        >
                                            Pré-fixada
                                        </button>
                                        <button
                                            onClick={() => setTipoTaxa('pos')}
                                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-[4px] transition-all ${tipoTaxa === 'pos' ? 'bg-white shadow text-slate-800 dark:bg-[#1C1F26] dark:text-[#E2E8F0]' : 'text-slate-500 hover:text-slate-700 dark:text-[#64748B] dark:hover:text-[#94A3B8]'
                                                }`}
                                        >
                                            Pós-fixada<br /><span className="text-[8px] font-medium text-slate-400 dark:text-[#94A3B8]">(+TR/IPCA)</span>
                                        </button>
                                    </div>
                                </div>

                                {tipoTaxa === 'pre' ? (
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-[#64748B] mb-1.5 ml-1 transition-colors">Juros Anual (Total) %</label>
                                        <input
                                            type="number" step="0.1"
                                            value={jurosAnual}
                                            onChange={(e) => setJurosAnual(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-[#0E0F12] border border-slate-300 dark:border-[#1C1F26] rounded-md py-2 px-3 text-slate-800 dark:text-[#E2E8F0] text-[13px] font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-[#2D333F] transition-all"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-[#64748B] mb-1.5 ml-1 transition-colors">Juros Anual (Fixo) %</label>
                                            <input
                                                type="number" step="0.1"
                                                value={jurosAnual}
                                                onChange={(e) => setJurosAnual(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-[#0E0F12] border border-slate-300 dark:border-[#1C1F26] rounded-md py-2 px-3 text-slate-800 dark:text-[#E2E8F0] text-[13px] font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-[#2D333F] transition-all"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-[#64748B] mb-1.5 ml-1 transition-colors">Correção Est. % (a.a.)</label>
                                            <input
                                                type="number" step="0.1"
                                                value={correcaoAnual}
                                                onChange={(e) => setCorrecaoAnual(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-[#0E0F12] border border-slate-300 dark:border-[#1C1F26] rounded-md py-2 px-3 text-slate-800 dark:text-[#E2E8F0] text-[13px] font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-[#2D333F] transition-all"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-[#64748B] mb-1.5 ml-1 transition-colors">Sistema</label>
                                    <div className="flex bg-slate-100 dark:bg-[#0E0F12] border border-slate-200 dark:border-[#1C1F26] p-1 rounded-md transition-colors">
                                        <button
                                            onClick={() => setSistema('price')}
                                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-[4px] transition-all ${sistema === 'price' ? 'bg-white shadow text-slate-800 dark:bg-[#1C1F26] dark:text-[#E2E8F0]' : 'text-slate-500 hover:text-slate-700 dark:text-[#64748B] dark:hover:text-[#94A3B8]'
                                                }`}
                                        >
                                            Price
                                        </button>
                                        <button
                                            onClick={() => setSistema('sac')}
                                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-[4px] transition-all ${sistema === 'sac' ? 'bg-white shadow text-slate-800 dark:bg-[#1C1F26] dark:text-[#E2E8F0]' : 'text-slate-500 hover:text-slate-700 dark:text-[#64748B] dark:hover:text-[#94A3B8]'
                                                }`}
                                        >
                                            SAC
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Seção: Seguros Obrigatórios */}
                        <div className="bg-white dark:bg-[#15171C] rounded-lg p-4 border border-slate-200 dark:border-[#1C1F26] shadow-sm dark:shadow-none transition-colors">
                            <div className="flex items-center gap-2 mb-4 text-indigo-600 dark:text-[#94A3B8] transition-colors">
                                <ShieldCheck size={16} />
                                <h2 className="font-bold text-[12px] text-slate-800 dark:text-[#E2E8F0] transition-colors">Seguros Obrigatórios</h2>
                            </div>

                            <div className="flex gap-3 mb-2">
                                <div className="flex-1">
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-[#64748B] mb-1.5 ml-1 transition-colors">DFI (% a.m.)</label>
                                    <input
                                        type="number" step="0.01"
                                        value={dfi}
                                        onChange={(e) => setDfi(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-[#0E0F12] border border-slate-300 dark:border-[#1C1F26] rounded-md py-2 px-3 text-slate-800 dark:text-[#E2E8F0] text-[13px] font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-[#2D333F] transition-all"
                                    />
                                </div>

                                <div className="flex-1">
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-[#64748B] mb-1.5 ml-1 transition-colors">MIP/DIT (% a.m.)</label>
                                    <input
                                        type="number" step="0.01"
                                        value={mip}
                                        onChange={(e) => setMip(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-[#0E0F12] border border-slate-300 dark:border-[#1C1F26] rounded-md py-2 px-3 text-slate-800 dark:text-[#E2E8F0] text-[13px] font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-[#2D333F] transition-all"
                                    />
                                </div>
                            </div>
                            <p className="text-[9px] text-slate-400 dark:text-[#475569] font-medium ml-1 transition-colors">
                                *DFI sobre valor do imóvel. MIP sobre saldo devedor.
                            </p>
                        </div>

                    </div>
                </div>

                {/* MAIN CONTENT (Resultados) */}
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-[#0a0c10] transition-colors duration-300">

                    {/* Top Cards Section */}
                    <div className="p-6 pb-2">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                            <div className="bg-white dark:bg-[#15171C] p-4 rounded-lg border border-slate-200 dark:border-[#1C1F26] shadow-sm dark:shadow-none flex flex-col justify-center transition-colors">
                                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#64748B] mb-1 transition-colors">1ª Prestação</p>
                                <h3 className="text-[18px] font-bold text-slate-800 dark:text-[#F8FAFC] tracking-tight leading-none transition-colors">
                                    {formatCurrency(simulacao.primeiraPrestacao)}
                                </h3>
                                {Math.abs(simulacao.primeiraPrestacao - simulacao.ultimaPrestacao) > 1 && (
                                    <p className="text-[10px] font-bold text-sky-600 dark:text-[#38BDF8] mt-1.5 transition-colors">
                                        Última: {formatCurrency(simulacao.ultimaPrestacao)}
                                    </p>
                                )}
                            </div>

                            <div className="bg-white dark:bg-[#15171C] p-4 rounded-lg border border-slate-200 dark:border-[#1C1F26] shadow-sm dark:shadow-none flex flex-col justify-center transition-colors">
                                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#64748B] mb-1 transition-colors">Total Juros</p>
                                <h3 className="text-[18px] font-bold text-slate-800 dark:text-[#F8FAFC] tracking-tight transition-colors">
                                    {formatCurrency(simulacao.totalJuros)}
                                </h3>
                            </div>

                            <div className="bg-white dark:bg-[#15171C] p-4 rounded-lg border border-slate-200 dark:border-[#1C1F26] shadow-sm dark:shadow-none flex flex-col justify-center transition-colors">
                                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#64748B] mb-1 transition-colors">Total Seguros</p>
                                <h3 className="text-[18px] font-bold text-slate-800 dark:text-[#F8FAFC] tracking-tight transition-colors">
                                    {formatCurrency(simulacao.totalSeguros)}
                                </h3>
                            </div>

                            <div className="bg-white dark:bg-[#15171C] p-4 rounded-lg border border-slate-200 dark:border-[#1C1F26] shadow-sm dark:shadow-none flex flex-col justify-center transition-colors">
                                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#64748B] mb-1 transition-colors">Total Geral</p>
                                <h3 className="text-[18px] font-bold text-slate-800 dark:text-[#F8FAFC] tracking-tight transition-colors">
                                    {formatCurrency(simulacao.totalGeral)}
                                </h3>
                            </div>

                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="flex-1 p-6 pt-4 min-h-0 flex flex-col">
                        <div className="bg-white dark:bg-[#15171C] shadow-sm dark:shadow-none rounded-xl border border-slate-200 dark:border-[#1C1F26] flex-1 flex flex-col overflow-hidden transition-colors">

                            {/* Table Header Controls */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#1C1F26] bg-slate-50 dark:bg-[#1A1D24] transition-colors">
                                <h3 className="font-bold text-slate-800 dark:text-[#F8FAFC] text-[13px] transition-colors">Cronograma de Pagamentos</h3>
                                <div className="bg-slate-200 dark:bg-[#1C1F26] border border-slate-300 dark:border-[#2D333F] text-[10px] px-3 py-1 rounded-[4px] text-slate-600 dark:text-[#94A3B8] font-bold tracking-wider transition-colors">
                                    {simulacao.prazoMeses} MESES
                                </div>
                            </div>

                            {/* Table Header */}
                            <div className="grid grid-cols-[40px_1.5fr_1.2fr_1fr_1fr_1.2fr_1.5fr] gap-2 p-3 text-[9px] font-bold text-slate-500 dark:text-[#64748B] bg-slate-100 dark:bg-[#0E0F12] border-b border-slate-200 dark:border-[#1C1F26] uppercase tracking-wider transition-colors">
                                <div className="text-center">Mês</div>
                                <div>Prestação Total</div>
                                <div className="text-indigo-600 dark:text-[#8B5CF6] transition-colors">Amortização</div>
                                <div className="text-amber-600 dark:text-[#F59E0B] transition-colors">Juros</div>
                                <div className="text-sky-600 dark:text-[#38BDF8] transition-colors">Seguros</div>
                                <div>Correção</div>
                                <div className="text-right pr-2">Saldo Devedor</div>
                            </div>

                            {/* Table Body (Scrollable) */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {simulacao.cronograma.map((row) => (
                                    <div
                                        key={row.mes}
                                        className="grid grid-cols-[40px_1.5fr_1.2fr_1fr_1fr_1.2fr_1.5fr] gap-2 p-3 text-[11px] items-center border-b border-slate-100 dark:border-[#1C1F26]/50 hover:bg-slate-50 dark:hover:bg-[#1A1D24] transition-colors bg-transparent"
                                    >
                                        <div className="text-center text-slate-500 dark:text-[#64748B] font-medium transition-colors">{row.mes}</div>
                                        <div className="font-bold text-slate-800 dark:text-[#F8FAFC] transition-colors">{formatCurrency(row.prestacao)}</div>
                                        <div className="text-indigo-600 dark:text-[#8B5CF6]/90 font-medium transition-colors">{formatCurrency(row.amortizacao)}</div>
                                        <div className="text-amber-600 dark:text-[#F59E0B]/90 font-medium transition-colors">{formatCurrency(row.juros)}</div>
                                        <div className="text-sky-600 dark:text-[#38BDF8]/90 font-medium transition-colors">{formatCurrency(row.seguros)}</div>
                                        <div className="text-slate-500 dark:text-[#94A3B8] text-[10px] transition-colors">+{formatCurrency(row.correcao)}</div>
                                        <div className="text-right pr-2 text-slate-800 dark:text-[#E2E8F0] font-bold transition-colors">{formatCurrency(row.saldoDevedor)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          border-radius: 4px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2a3042;
        }
        :not(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3b4259;
        }
        :not(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
      `}} />
            </div>
        </div>
    );
}
