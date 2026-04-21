import React, { useState, useMemo } from 'react';
import { Gift, FileText, Info, AlertTriangle, Calculator, X, CheckCircle2, TrendingUp, ArrowLeft } from 'lucide-react';

// Base de dados de regras simplificadas do ITCMD por estado (Referência geral 2024)
// O cálculo de estados progressivos é uma aproximação baseada em faixas genéricas de R$, 
// visto que na vida real dependem das Unidades Fiscais estaduais (UFIR, UFESP, etc) do ano vigente.
const itcmdData = {
    AC: {
        name: "Acre",
        mortis: { type: "progressive", min: 2, max: 4, text: "Alíquota progressiva de 2% a 4%." },
        doacao: { type: "fixed", rate: 2, text: "Alíquota fixa de 2%." }
    },
    AL: {
        name: "Alagoas",
        mortis: { type: "progressive", min: 2, max: 4, text: "Alíquota progressiva de 2% a 4%." },
        doacao: { type: "progressive", min: 2, max: 4, text: "Alíquota progressiva de 2% a 4%." }
    },
    AP: {
        name: "Amapá",
        mortis: { type: "fixed", rate: 4, text: "Alíquota fixa de 4%." },
        doacao: { type: "fixed", rate: 3, text: "Alíquota fixa de 3%." }
    },
    AM: {
        name: "Amazonas",
        mortis: { type: "progressive", min: 2, max: 4, text: "Alíquota progressiva de 2% a 4% baseada em faixas de valor." },
        doacao: { type: "fixed", rate: 2, text: "Alíquota fixa de 2%." }
    },
    BA: {
        name: "Bahia",
        mortis: { type: "progressive", min: 4, max: 8, text: "Alíquota progressiva de 4% a 8% (Causa Mortis)." },
        doacao: { type: "fixed", rate: 3.5, text: "Alíquota fixa de 3,5% para Doações." }
    },
    CE: {
        name: "Ceará",
        mortis: { type: "progressive", min: 2, max: 8, text: "Alíquota progressiva de 2% a 8%." },
        doacao: { type: "progressive", min: 2, max: 8, text: "Alíquota progressiva de 2% a 8%." }
    },
    DF: {
        name: "Distrito Federal",
        mortis: { type: "progressive", min: 4, max: 6, text: "Alíquota progressiva de 4% a 6%." },
        doacao: { type: "progressive", min: 4, max: 6, text: "Alíquota progressiva de 4% a 6%." }
    },
    ES: {
        name: "Espírito Santo",
        mortis: { type: "fixed", rate: 4, text: "Alíquota fixa de 4%." },
        doacao: { type: "fixed", rate: 4, text: "Alíquota fixa de 4%." }
    },
    GO: {
        name: "Goiás",
        mortis: { type: "progressive", min: 2, max: 8, text: "Alíquota progressiva de 2% a 8%." },
        doacao: { type: "progressive", min: 2, max: 8, text: "Alíquota progressiva de 2% a 8%." }
    },
    MA: {
        name: "Maranhão",
        mortis: { type: "progressive", min: 3, max: 7, text: "Alíquota progressiva de 3% a 7%." },
        doacao: { type: "progressive", min: 2, max: 4, text: "Alíquota progressiva de 2% a 4%." }
    },
    MT: {
        name: "Mato Grosso",
        mortis: { type: "progressive", min: 2, max: 8, text: "Alíquota progressiva de 2% a 8%." },
        doacao: { type: "progressive", min: 2, max: 8, text: "Alíquota progressiva de 2% a 8%." }
    },
    MS: {
        name: "Mato Grosso do Sul",
        mortis: { type: "fixed", rate: 6, text: "Alíquota fixa de 6% para Causa Mortis." },
        doacao: { type: "fixed", rate: 3, text: "Alíquota fixa de 3% para Doações." }
    },
    MG: {
        name: "Minas Gerais",
        mortis: { type: "fixed", rate: 5, text: "Alíquota fixa de 5% (Lei 14.941/2003 atualizada)." },
        doacao: { type: "fixed", rate: 5, text: "Alíquota fixa de 5%." }
    },
    PA: {
        name: "Pará",
        mortis: { type: "progressive", min: 2, max: 6, text: "Alíquota progressiva de 2% a 6%." },
        doacao: { type: "progressive", min: 2, max: 6, text: "Alíquota progressiva de 2% a 6%." }
    },
    PB: {
        name: "Paraíba",
        mortis: { type: "progressive", min: 2, max: 8, text: "Alíquota progressiva de 2% a 8%." },
        doacao: { type: "progressive", min: 2, max: 8, text: "Alíquota progressiva de 2% a 8%." }
    },
    PR: {
        name: "Paraná",
        mortis: { type: "fixed", rate: 4, text: "Alíquota fixa de 4%." },
        doacao: { type: "fixed", rate: 4, text: "Alíquota fixa de 4%." }
    },
    PE: {
        name: "Pernambuco",
        mortis: { type: "progressive", min: 2, max: 8, text: "Alíquota progressiva de 2% a 8%." },
        doacao: { type: "progressive", min: 2, max: 8, text: "Alíquota progressiva de 2% a 8%." }
    },
    PI: {
        name: "Piauí",
        mortis: { type: "progressive", min: 2, max: 6, text: "Alíquota progressiva de 2% a 6%." },
        doacao: { type: "progressive", min: 2, max: 6, text: "Alíquota progressiva de 2% a 6%." }
    },
    RJ: {
        name: "Rio de Janeiro",
        mortis: { type: "progressive", min: 4, max: 8, text: "Alíquota progressiva de 4% a 8% com base em UFIR-RJ." },
        doacao: { type: "progressive", min: 4, max: 8, text: "Alíquota progressiva de 4% a 8% com base em UFIR-RJ." }
    },
    RN: {
        name: "Rio Grande do Norte",
        mortis: { type: "fixed", rate: 3, text: "Alíquota fixa de 3% (podendo chegar a 6% dependendo do ano/regras)." },
        doacao: { type: "fixed", rate: 3, text: "Alíquota fixa de 3%." }
    },
    RS: {
        name: "Rio Grande do Sul",
        mortis: { type: "progressive", min: 0, max: 6, text: "Alíquota progressiva de 0% a 6%." },
        doacao: { type: "progressive", min: 3, max: 4, text: "Alíquota progressiva de 3% a 4%." }
    },
    RO: {
        name: "Rondônia",
        mortis: { type: "progressive", min: 2, max: 4, text: "Alíquota progressiva de 2% a 4%." },
        doacao: { type: "progressive", min: 2, max: 4, text: "Alíquota progressiva de 2% a 4%." }
    },
    RR: {
        name: "Roraima",
        mortis: { type: "fixed", rate: 4, text: "Alíquota fixa de 4%." },
        doacao: { type: "fixed", rate: 4, text: "Alíquota fixa de 4%." }
    },
    SC: {
        name: "Santa Catarina",
        mortis: { type: "progressive", min: 1, max: 8, text: "Alíquota progressiva de 1% a 8%." },
        doacao: { type: "progressive", min: 1, max: 8, text: "Alíquota progressiva de 1% a 8%." }
    },
    SP: {
        name: "São Paulo",
        mortis: { type: "fixed", rate: 4, exemption: 353600, text: "Alíquota fixa de 4% (isento até 10.000 UFESPs - valor aprox. R$ 353.600)." },
        doacao: { type: "fixed", rate: 4, exemption: 88400, text: "Alíquota fixa de 4% (isento até 2.500 UFESPs - valor aprox. R$ 88.400)." }
    },
    SE: {
        name: "Sergipe",
        mortis: { type: "progressive", min: 4, max: 8, text: "Alíquota progressiva de 4% a 8%." },
        doacao: { type: "progressive", min: 4, max: 8, text: "Alíquota progressiva de 4% a 8%." }
    },
    TO: {
        name: "Tocantins",
        mortis: { type: "progressive", min: 2, max: 8, text: "Alíquota progressiva de 2% a 8%." },
        doacao: { type: "progressive", min: 2, max: 8, text: "Alíquota progressiva de 2% a 8%." }
    }
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

export default function CalculadoraITCMD({ onClose }) {
    const [valueStr, setValueStr] = useState('');
    const [value, setValue] = useState(0);
    const [type, setType] = useState('mortis'); // 'mortis' | 'doacao'
    const [uf, setUf] = useState('SP');

    // Máscara de moeda simples
    const handleValueChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        const numberValue = Number(rawValue) / 100;
        setValue(numberValue);

        if (rawValue === '') {
            setValueStr('');
            return;
        }

        setValueStr(
            new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
            }).format(numberValue)
        );
    };

    const clearValue = () => {
        setValueStr('');
        setValue(0);
    };

    const sortedStates = useMemo(() => {
        return Object.entries(itcmdData).sort((a, b) => a[1].name.localeCompare(b[1].name));
    }, []);

    const calculationResult = useMemo(() => {
        if (value <= 0) return null;

        const stateRule = itcmdData[uf][type];

        // Verificação de isenção
        if (stateRule.exemption && value <= stateRule.exemption) {
            return {
                taxAmount: 0,
                appliedRate: 0,
                ruleText: stateRule.text,
                isProgressive: false,
                isExempt: true
            };
        }

        let appliedRate = 0;
        let taxAmount = 0;

        if (stateRule.type === 'fixed') {
            appliedRate = stateRule.rate;
            taxAmount = value * (appliedRate / 100);
        } else if (stateRule.type === 'progressive') {
            // Motor de cálculo estimativo simplificado para estados progressivos
            // Usando faixas genéricas de R$ já que as UFIRs estaduais mudam anualmente
            const diff = stateRule.max - stateRule.min;
            const step = diff / 4; // Divide a progressão em 4 faixas

            if (value <= 100000) appliedRate = stateRule.min;
            else if (value <= 300000) appliedRate = stateRule.min + step;
            else if (value <= 600000) appliedRate = stateRule.min + (step * 2);
            else if (value <= 1000000) appliedRate = stateRule.min + (step * 3);
            else appliedRate = stateRule.max;

            // Arredonda para 1 casa decimal a alíquota estimada
            appliedRate = Math.round(appliedRate * 10) / 10;
            taxAmount = value * (appliedRate / 100);
        }

        return {
            taxAmount,
            appliedRate,
            ruleText: stateRule.text,
            isProgressive: stateRule.type === 'progressive',
            minRate: stateRule.min,
            maxRate: stateRule.max,
            isExempt: false
        };
    }, [value, type, uf]);

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans text-zinc-200 selection:bg-amber-500/30">
            {onClose && (
                <button
                    onClick={onClose}
                    className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-xl text-zinc-300 hover:text-amber-400 hover:border-amber-500/50 transition-all text-sm"
                >
                    <ArrowLeft size={16} />
                    Voltar ao Hub
                </button>
            )}
            <div className="max-w-3xl w-full bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden border border-zinc-800">

                {/* Header - Premium Look */}
                <div className="bg-zinc-950/50 p-8 border-b border-zinc-800 text-center relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-900 via-amber-500 to-zinc-900"></div>
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-zinc-900 rounded-full border border-zinc-800 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                            <TrendingUp className="w-8 h-8 text-amber-500" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-light tracking-widest text-zinc-100 uppercase">
                        Euro<span className="text-amber-500 font-bold">stock</span>
                    </h1>
                    <p className="text-zinc-500 mt-3 text-sm tracking-wide uppercase">
                        Gestão de Sucessão e ITCMD
                    </p>
                </div>

                <div className="p-6 md:p-8 space-y-8">

                    {/* Valor Base */}
                    <div className="space-y-3">
                        <label htmlFor="valor-input" className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                            Patrimônio / Valor da Transferência
                        </label>
                        <div className="relative">
                            <input
                                id="valor-input"
                                type="text"
                                value={valueStr}
                                onChange={handleValueChange}
                                placeholder="R$ 0,00"
                                className="w-full text-3xl p-5 pr-12 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-all placeholder:text-zinc-700 font-light text-amber-50"
                            />
                            {valueStr && (
                                <button
                                    onClick={clearValue}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-amber-500 p-2 rounded-full hover:bg-zinc-900 transition-colors"
                                    aria-label="Limpar valor"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tipo de Transmissão */}
                    <div className="space-y-3" role="radiogroup" aria-labelledby="tipo-transmissao-label">
                        <label id="tipo-transmissao-label" className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                            Natureza da Operação
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                role="radio"
                                aria-checked={type === 'mortis'}
                                onClick={() => setType('mortis')}
                                className={`flex items-center justify-center gap-3 p-5 rounded-xl border transition-all duration-300 ${type === 'mortis'
                                    ? 'border-amber-500/50 bg-amber-500/5 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.05)]'
                                    : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                                    }`}
                            >
                                <FileText className="w-5 h-5" />
                                <span className="font-medium tracking-wide">Causa Falecimento</span>
                            </button>

                            <button
                                role="radio"
                                aria-checked={type === 'doacao'}
                                onClick={() => setType('doacao')}
                                className={`flex items-center justify-center gap-3 p-5 rounded-xl border transition-all duration-300 ${type === 'doacao'
                                    ? 'border-amber-500/50 bg-amber-500/5 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.05)]'
                                    : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                                    }`}
                            >
                                <Gift className="w-5 h-5" />
                                <span className="font-medium tracking-wide">Doação em Vida</span>
                            </button>
                        </div>
                    </div>

                    {/* Estado */}
                    <div className="space-y-3">
                        <label htmlFor="estado-select" className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                            Jurisdição (UF)
                        </label>
                        <select
                            id="estado-select"
                            value={uf}
                            onChange={(e) => setUf(e.target.value)}
                            className="w-full p-5 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-all font-light text-zinc-200 appearance-none"
                        >
                            {sortedStates.map(([sigla, data]) => (
                                <option key={sigla} value={sigla} className="bg-zinc-900 text-zinc-200 py-2">
                                    {data.name} ({sigla})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Resultado */}
                    {calculationResult && (
                        <div className={`mt-10 rounded-2xl p-8 border transition-all duration-500 relative overflow-hidden ${calculationResult.isExempt
                            ? 'bg-zinc-900 border-zinc-700'
                            : 'bg-zinc-950 border-amber-900/30 shadow-[0_0_30px_rgba(245,158,11,0.03)]'
                            }`}>

                            {!calculationResult.isExempt && (
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                            )}

                            <div className={`flex flex-col md:flex-row items-center justify-between gap-6 border-b pb-8 ${calculationResult.isExempt ? 'border-zinc-800' : 'border-zinc-800/80'
                                }`}>
                                <div className="text-center md:text-left z-10">
                                    <p className="text-xs font-semibold uppercase tracking-widest mb-2 text-zinc-500">
                                        Obrigação Tributária Estimada
                                    </p>
                                    {calculationResult.isExempt ? (
                                        <div className="flex items-center gap-3 text-4xl md:text-5xl font-light text-zinc-300 justify-center md:justify-start">
                                            <CheckCircle2 className="w-10 h-10 text-zinc-500" />
                                            <span className="tracking-tight">ISENTO</span>
                                        </div>
                                    ) : (
                                        <p className="text-4xl md:text-5xl font-light tracking-tight text-amber-400">
                                            {formatCurrency(calculationResult.taxAmount)}
                                        </p>
                                    )}
                                </div>
                                <div className="text-center md:text-right p-5 rounded-xl w-full md:w-auto bg-zinc-900/50 border border-zinc-800/50 z-10">
                                    <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Alíquota Efetiva</p>
                                    <p className="text-3xl font-light text-zinc-200">
                                        {calculationResult.appliedRate}%
                                    </p>
                                </div>
                            </div>

                            <div className="pt-8 space-y-4 z-10 relative">
                                <div className="flex items-start gap-4 p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                                    <Info className="w-5 h-5 shrink-0 mt-0.5 text-zinc-500" />
                                    <div>
                                        <p className="text-sm font-medium text-zinc-300 mb-1">Diretriz - {itcmdData[uf].name}</p>
                                        <p className="text-sm leading-relaxed text-zinc-500">
                                            {calculationResult.ruleText}
                                        </p>
                                    </div>
                                </div>

                                {calculationResult.isProgressive && !calculationResult.isExempt && (
                                    <div className="flex items-start gap-4 p-5 rounded-xl bg-amber-950/20 border border-amber-900/30">
                                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600/80" />
                                        <p className="text-amber-500/70 text-sm leading-relaxed font-light">
                                            <strong className="text-amber-600/90 font-medium">Nota Legal:</strong> A alíquota é progressiva ({calculationResult.minRate}% a {calculationResult.maxRate}%). Esta é uma estimativa referencial baseada no valor patrimonial. O cálculo exato exige o enquadramento nas faixas de Unidades Fiscais (UFIR/UFESP) vigentes no exercício atual.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!calculationResult && (
                        <div className="text-center text-zinc-600 py-12 border border-dashed border-zinc-800 rounded-2xl font-light tracking-wide bg-zinc-950/30">
                            Insira o valor do patrimônio para simular a tributação.
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
