import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, ReferenceLine
} from 'recharts';
import {
  TrendingUp, DollarSign,
  Monitor, Target,
  RefreshCw, Lock, ArrowUpRight, Briefcase, Calendar, AlertTriangle, Scale, Timer,
  CheckCircle2, Hourglass, TrendingDown, ArrowLeft
} from 'lucide-react';

// --- Utilitários de Formatação ---
const formatCurrency = (value) => {
  if (!value || isNaN(value)) return "R$ 0,00";
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatPercent = (value) => {
  if (!value || isNaN(value)) return "0,00%";
  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(value / 100);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const parts = dateStr.split('-');
  if (parts.length !== 3) return "-";
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

// --- Componente Principal ---
export default function EurostockSimulador({ onClose }) {

  // Datas Default
  const today = new Date();
  const formattedToday = today.toLocaleDateString('pt-BR');

  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const defaultAlocacaoStr = sixMonthsAgo.toISOString().split('T')[0];

  const twoYearsFromNow = new Date(today);
  twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
  const defaultVencimentoStr = twoYearsFromNow.toISOString().split('T')[0];

  // --- Estado: Inputs ---
  const [inputs, setInputs] = useState({
    // Configurações Globais
    cdiAnual: 11.25,
    ipcaAnual: 4.50,
    taxaReinvestimento: 11.25, // NOVO: Taxa conservadora para reinvestir cupons

    // Título Atual
    tipoTaxa: 'pre',
    taxaContratada: 12.00,
    dataAlocacao: defaultAlocacaoStr,
    dataVencimento: defaultVencimentoStr,
    durationAtual: '', // Duration do ATUAL
    valorInvestido: 100000,
    regimeIr: 'regressiva',
    isentoIrAtual: false,

    // Valores Manuais
    valorCurvaManual: 106000,
    valorMercadoManual: 98000,

    // Dados para Troca
    taxaNovaOportunidade: 14.50,
    tipoTaxaNova: 'pre',
    isentoIrNovo: false,
    durationNova: '' // Duration do NOVO
  });

  const [presentationMode, setPresentationMode] = useState(false);
  const [activeTab, setActiveTab] = useState('grafico');

  // --- Lógica Financeira ---
  const simulation = useMemo(() => {
    // 1. Sanitização
    const safeNumber = (val) => (val === '' || isNaN(Number(val)) ? 0 : Number(val));

    const cdiAnual = safeNumber(inputs.cdiAnual);
    const ipcaAnual = safeNumber(inputs.ipcaAnual);
    const taxaReinvestimento = safeNumber(inputs.taxaReinvestimento);
    const taxaContratada = safeNumber(inputs.taxaContratada);
    const taxaNovaOportunidade = safeNumber(inputs.taxaNovaOportunidade);
    const valorCurvaManual = safeNumber(inputs.valorCurvaManual);
    const valorMercadoManual = safeNumber(inputs.valorMercadoManual);
    const valorInvestido = safeNumber(inputs.valorInvestido);

    const durationAtualInput = safeNumber(inputs.durationAtual);
    const durationNovaInput = safeNumber(inputs.durationNova);

    // 2. Cálculo de Prazos via DATA
    const isValidDate = (d) => d instanceof Date && !isNaN(d);
    const start = new Date(inputs.dataAlocacao);
    const end = new Date(inputs.dataVencimento);
    const now = new Date();

    if (!isValidDate(start) || !isValidDate(end)) {
      return {
        valorCurvaHoje: 0, valorMercadoHoje: 0, diferencaBruta: 0, diferencaPercentual: 0,
        valorLiquidoParaTroca: 0, impostoDevido: 0, dataPoints: [],
        tipoResultado: "...",
        mesCruzamento: null, ganhoNoVencimento: 0,
        prazoRestante: 0, recuperaDentroDoPrazo: false
      };
    }

    const diffInMonths = (d1, d2) => {
      let months = (d2.getFullYear() - d1.getFullYear()) * 12;
      months -= d1.getMonth();
      months += d2.getMonth();
      if (d2.getDate() < d1.getDate()) months--;
      return Math.max(0, months);
    };

    const prazoTotalMeses = diffInMonths(start, end);
    const mesesDecorridos = diffInMonths(start, now);
    const prazoRestante = Math.max(0, prazoTotalMeses - mesesDecorridos);
    const prazoRestanteAnos = prazoRestante / 12;

    // Duration Efetiva (Se manual > 0, usa manual. Senão, assume Bullet = Prazo Restante)
    const durationAtual = (durationAtualInput > 0) ? Math.min(durationAtualInput, prazoRestanteAnos) : prazoRestanteAnos;
    const durationNova = (durationNovaInput > 0) ? Math.min(durationNovaInput, prazoRestanteAnos) : prazoRestanteAnos;

    // 3. Taxas Mensais
    const cdiMensal = Math.pow(1 + cdiAnual / 100, 1 / 12) - 1;
    const ipcaMensal = Math.pow(1 + ipcaAnual / 100, 1 / 12) - 1;

    // Helper Taxa
    const getRateMonth = (tipo, valor) => {
      if (tipo === 'pre') return Math.pow(1 + valor / 100, 1 / 12) - 1;
      if (tipo === 'cdi') return cdiMensal * (valor / 100);
      if (tipo === 'ipca') return (1 + ipcaMensal) * (1 + (Math.pow(1 + valor / 100, 1 / 12) - 1)) - 1;
      return 0;
    };

    const rateContractMonth = getRateMonth(inputs.tipoTaxa, taxaContratada);
    const rateNewMonth = getRateMonth(inputs.tipoTaxaNova, taxaNovaOportunidade);
    // Assumimos reinvestimento em taxa Pré conservadora (input)
    const rateReinvestMonth = Math.pow(1 + taxaReinvestimento / 100, 1 / 12) - 1;

    // 4. Valores Atuais
    const valorCurvaHoje = valorCurvaManual;
    const valorMercadoHoje = valorMercadoManual;

    // 5. Diferença e IR
    const diferencaBruta = valorMercadoHoje - valorCurvaHoje;
    const diferencaPercentual = valorCurvaHoje > 0 ? (diferencaBruta / valorCurvaHoje) * 100 : 0;

    const lucroParaIR = valorMercadoHoje - valorInvestido;
    const getAliquotaIR = (meses) => {
      if (inputs.isentoIrAtual || inputs.regimeIr === 'isento') return 0;
      const dias = meses * 30;
      if (dias <= 180) return 0.225;
      if (dias <= 360) return 0.20;
      if (dias <= 720) return 0.175;
      return 0.15;
    };
    const aliquota = getAliquotaIR(mesesDecorridos);
    const impostoDevido = lucroParaIR > 0 ? lucroParaIR * aliquota : 0;
    const valorLiquidoParaTroca = valorMercadoHoje - impostoDevido;

    // --- LÓGICA DE PROJEÇÃO COM IMPACTO DE DURATION E REINVESTIMENTO ---

    // Função para calcular Taxa Efetiva Blendada
    // Se Duration < Prazo, parte do retorno vem da taxa contratada, parte do reinvestimento
    const calculateEffectiveRate = (baseRate, reinvestRate, duration, maturity) => {
      if (maturity <= 0) return baseRate;
      if (duration >= maturity) return baseRate; // Bullet puro

      // Peso simplificado do reinvestimento (proporção do tempo que o capital fica "livre")
      const weightReinvest = 1 - (duration / maturity);
      return (baseRate * (1 - weightReinvest)) + (reinvestRate * weightReinvest);
    };

    const effectiveRateManter = calculateEffectiveRate(rateContractMonth, rateReinvestMonth, durationAtual, prazoRestanteAnos);
    const effectiveRateTrocar = calculateEffectiveRate(rateNewMonth, rateReinvestMonth, durationNova, prazoRestanteAnos);

    // 6. Projeção Futura
    const dataPoints = [];
    let mesCruzamento = null;
    let cruzou = false;
    const loopLimit = isFinite(prazoRestante) ? prazoRestante : 0;

    for (let m = 0; m <= loopLimit; m++) {
      const projecaoManter = valorCurvaHoje * Math.pow(1 + effectiveRateManter, m);
      const projecaoTrocar = valorLiquidoParaTroca * Math.pow(1 + effectiveRateTrocar, m);

      if (!cruzou && projecaoTrocar > projecaoManter && m > 0) {
        mesCruzamento = m;
        cruzou = true;
      }

      dataPoints.push({
        mesRelativo: m,
        ValorManter: projecaoManter,
        ValorTrocar: projecaoTrocar,
        Diferenca: projecaoTrocar - projecaoManter,
        isVencimento: m === loopLimit
      });
    }

    // 7. Veredito e Análise de Risco (Duration)
    let tipoResultado = "";
    let riscoInfo = "";
    const recuperaDentroDoPrazo = mesCruzamento !== null && mesCruzamento <= loopLimit;
    const ganhoNoVencimento = dataPoints[loopLimit] ? dataPoints[loopLimit].Diferenca : 0;

    // Análise de Risco de Reinvestimento
    const riscoReinvestimentoAlto = (rateReinvestMonth < rateNewMonth * 0.8) && (durationNova < prazoRestanteAnos * 0.8);

    if (riscoReinvestimentoAlto) {
      riscoInfo = "Alerta: Fluxos reinvestidos a taxas conservadoras impactam o retorno total.";
    } else if (durationNovaInput > 0 && durationNovaInput > durationAtual + 1) {
      riscoInfo = "Atenção: Aumento de exposição à volatilidade (Duration maior).";
    }

    if (diferencaBruta >= 0) {
      if (effectiveRateTrocar > effectiveRateManter) {
        tipoResultado = "TROCA RECOMENDADA (LUCRO + EFICIÊNCIA)";
      } else {
        tipoResultado = "MANTER (RETORNO TOTAL SUPERIOR)";
      }
    } else {
      if (recuperaDentroDoPrazo) {
        tipoResultado = "TROCA VIÁVEL (RECUPERA PERDA)";
      } else {
        tipoResultado = "SEGURAR (NÃO RECUPERA A TEMPO)";
      }
    }

    return {
      valorCurvaHoje, valorMercadoHoje, diferencaBruta, diferencaPercentual,
      valorLiquidoParaTroca, impostoDevido, dataPoints, tipoResultado, riscoInfo,
      mesCruzamento, ganhoNoVencimento, prazoRestante, recuperaDentroDoPrazo,
      durationAtual, durationNova, effectiveRateManter, effectiveRateTrocar
    };

  }, [inputs]);

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInputs(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-gray-100 font-sans overflow-hidden print:h-auto print:overflow-visible print:bg-white print:text-black">

      {/* SIDEBAR */}
      {!presentationMode && (
        <aside className="w-80 bg-[#121214] text-gray-300 flex flex-col border-r border-zinc-800 overflow-y-auto custom-scrollbar shadow-xl z-20 print:hidden">
          <div className="p-6 border-b border-zinc-800 bg-[#121214] sticky top-0 z-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-yellow-600 rounded-sm flex items-center justify-center font-bold text-black">E</div>
              <h1 className="text-xl font-semibold text-white tracking-tight">EUROSTOCK</h1>
            </div>
            <p className="text-xs text-yellow-600 tracking-widest uppercase">Investimentos | XP</p>
          </div>

          <div className="p-6 space-y-8">

            {/* DADOS DA POSIÇÃO ATUAL */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase size={12} /> Posição Atual
                </h3>
                <div className="flex items-center gap-2">
                  <label htmlFor="isentoIrAtual" className="text-[10px] text-gray-400 cursor-pointer select-none">Isento IR?</label>
                  <input type="checkbox" name="isentoIrAtual" id="isentoIrAtual" checked={inputs.isentoIrAtual} onChange={handleInputChange} className="accent-yellow-600 w-3 h-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1">Investido (R$)</label>
                  <input type="number" name="valorInvestido" value={inputs.valorInvestido} onChange={handleInputChange} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:border-yellow-600 outline-none" />
                </div>
                <div>
                  <label className="text-xs block mb-1">Indexador</label>
                  <select name="tipoTaxa" value={inputs.tipoTaxa} onChange={handleInputChange} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white focus:border-yellow-600 outline-none">
                    <option value="pre">Pré-fixado</option>
                    <option value="cdi">CDI</option>
                    <option value="ipca">IPCA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs block mb-1">Taxa Original (% ou +)</label>
                <input type="number" name="taxaContratada" value={inputs.taxaContratada} onChange={handleInputChange} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:border-yellow-600 outline-none" />
              </div>

              <div className="space-y-3 bg-zinc-900/50 p-3 rounded border border-zinc-800">
                <div>
                  <label className="text-xs block mb-1 text-yellow-500 font-medium flex items-center gap-1">
                    <Calendar size={10} /> Data da Aplicação
                  </label>
                  <input type="date" name="dataAlocacao" value={inputs.dataAlocacao} onChange={handleInputChange} className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white focus:border-yellow-600 outline-none" />
                </div>
                <div>
                  <label className="text-xs block mb-1 text-white font-medium flex items-center gap-1">
                    <Target size={10} /> Data de Vencimento
                  </label>
                  <input type="date" name="dataVencimento" value={inputs.dataVencimento} onChange={handleInputChange} min={inputs.dataAlocacao} className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white focus:border-yellow-600 outline-none" />
                </div>
                {/* DURATION ATUAL */}
                <div>
                  <label className="text-xs block mb-1 text-blue-400 font-medium flex items-center gap-1">
                    <Hourglass size={10} /> Duration Atual (Anos)
                  </label>
                  <input
                    type="number" step="0.1" name="durationAtual" value={inputs.durationAtual} onChange={handleInputChange}
                    placeholder={`Padrão: ${(simulation.prazoRestante / 12).toFixed(1)}`}
                    className="w-full bg-zinc-800 border border-blue-900/50 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none placeholder-zinc-600"
                  />
                </div>
              </div>

              {/* VALORES MANUAIS */}
              <div className="space-y-3 bg-yellow-900/10 border border-yellow-900/30 p-3 rounded mt-2">
                <div>
                  <label className="text-xs block mb-1 text-yellow-500 font-bold">Valor Atual na Curva (Bruto)</label>
                  <input type="number" name="valorCurvaManual" value={inputs.valorCurvaManual} onChange={handleInputChange} className="w-full bg-zinc-800 border border-yellow-600 rounded px-2 py-2 text-sm text-white font-bold outline-none" />
                </div>
                <div>
                  <label className="text-xs block mb-1 text-white font-bold">Valor de Saída Mercado (Bruto)</label>
                  <input type="number" name="valorMercadoManual" value={inputs.valorMercadoManual} onChange={handleInputChange} className="w-full bg-zinc-700 border border-white rounded px-2 py-2 text-sm text-white font-bold outline-none" />
                </div>
              </div>
            </div>

            {/* DADOS DA NOVA OPORTUNIDADE */}
            <div className="space-y-4 border-t border-zinc-800 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-green-500 uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw size={12} /> Oportunidade de Troca
                </h3>
                <div className="flex items-center gap-2">
                  <label htmlFor="isentoIrNovo" className="text-[10px] text-gray-400 cursor-pointer select-none">Isento IR?</label>
                  <input type="checkbox" name="isentoIrNovo" id="isentoIrNovo" checked={inputs.isentoIrNovo} onChange={handleInputChange} className="accent-green-600 w-3 h-3" />
                </div>
              </div>

              <div className="bg-green-900/10 border border-green-900/30 p-3 rounded space-y-3">
                <div>
                  <label className="text-xs block mb-1 text-green-400">Nova Taxa (% a.a.)</label>
                  <input type="number" name="taxaNovaOportunidade" value={inputs.taxaNovaOportunidade} onChange={handleInputChange} className="w-full bg-zinc-800 border border-green-600 rounded px-2 py-2 text-lg text-white font-bold outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs block mb-1">Indexador</label>
                    <select name="tipoTaxaNova" value={inputs.tipoTaxaNova} onChange={handleInputChange} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white">
                      <option value="pre">Pré-fixado</option>
                      <option value="cdi">CDI</option>
                      <option value="ipca">IPCA</option>
                    </select>
                  </div>
                  {/* DURATION NOVA */}
                  <div>
                    <label className="text-xs block mb-1 text-green-400">Duration (Anos)</label>
                    <input
                      type="number" step="0.1" name="durationNova" value={inputs.durationNova} onChange={handleInputChange}
                      placeholder={`Ref: ${(simulation.prazoRestante / 12).toFixed(1)}`}
                      className="w-full bg-zinc-800 border border-green-800/50 rounded px-2 py-1.5 text-xs text-white outline-none placeholder-zinc-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* PREMISSAS / RISCO */}
            <div className="space-y-3 border-t border-zinc-800 pt-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Premissas de Risco</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1 text-gray-400">Reinvestimento (% a.a.)</label>
                  <input
                    type="number"
                    name="taxaReinvestimento"
                    value={inputs.taxaReinvestimento}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white focus:border-yellow-600 outline-none"
                  />
                  <p className="text-[9px] text-zinc-600 mt-0.5">Taxa estimada p/ cupons futuros</p>
                </div>
                <div>
                  <label className="text-xs block mb-1 text-gray-500">CDI Atual (%)</label>
                  <input type="number" name="cdiAnual" value={inputs.cdiAnual} onChange={handleInputChange} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white" />
                </div>
              </div>
            </div>

          </div>
        </aside>
      )}

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative print:h-auto print:overflow-visible bg-zinc-950 print:bg-white">

        {/* BANNER DE VALIDADE */}
        <div className="bg-yellow-950/50 border-b border-yellow-600/30 px-8 py-2 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-yellow-500" />
            <span className="text-yellow-500 text-sm font-medium tracking-wide">
              ATENÇÃO: Proposta e taxas válidas somente para hoje, {formattedToday}.
            </span>
          </div>
          <span className="hidden md:inline-block px-3 py-1 bg-yellow-900/40 border border-yellow-700/50 rounded text-[10px] text-yellow-400 font-bold uppercase tracking-wider">
            Condição Especial
          </span>
        </div>

        {/* Header - Escuro */}
        <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-8 shadow-sm z-10 print:hidden">
          <div className="flex items-center gap-4">
            {!presentationMode && (
              <div className="flex items-center gap-4">
                {onClose && (
                  <button onClick={onClose} className="p-1.5 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md transition-colors mr-2">
                    <ArrowLeft size={18} />
                  </button>
                )}
                <h2 className="text-lg font-medium text-gray-200">Análise de Troca de Posição</h2>
              </div>
            )}
            {presentationMode && (
              <div className="flex items-center gap-2 animate-fade-in">
                <div className="w-6 h-6 bg-yellow-600 rounded-sm flex items-center justify-center font-bold text-black text-xs">E</div>
                <h1 className="text-lg font-semibold text-white tracking-tight">EUROSTOCK <span className="text-zinc-500 font-normal">| Simulador de Troca</span></h1>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-zinc-800 rounded-lg p-1 mr-4">
              <button
                onClick={() => setActiveTab('grafico')}
                className={`px-3 py-1 text-xs font-medium rounded ${activeTab === 'grafico' ? 'bg-zinc-700 shadow text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Gráfico
              </button>
              <button
                onClick={() => setActiveTab('tabela')}
                className={`px-3 py-1 text-xs font-medium rounded ${activeTab === 'tabela' ? 'bg-zinc-700 shadow text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Tabela
              </button>
            </div>
            <button
              onClick={() => setPresentationMode(!presentationMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${presentationMode ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-700/50' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
            >
              <Monitor size={16} />
              {presentationMode ? 'Sair' : 'Apresentar'}
            </button>
          </div>
        </header>

        {/* Header Print */}
        <div className="hidden print:flex items-center justify-between p-8 border-b border-gray-200 mb-4 bg-white text-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-600 rounded-sm flex items-center justify-center font-bold text-black text-xl">E</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">EUROSTOCK</h1>
              <p className="text-xs text-yellow-600 uppercase tracking-widest">Relatório de Reallocation</p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Data: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar print:p-0 print:overflow-visible">
          <div className="max-w-6xl mx-auto space-y-6 print:w-full print:max-w-none">

            {/* LINHA 1: VALORES HOJE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Card 1: Posição Atual */}
              <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 shadow-sm relative overflow-hidden print:bg-white print:border-gray-300 print:text-black">
                <div className="absolute top-0 left-0 w-1 h-full bg-zinc-600 print:bg-gray-400"></div>
                <p className="text-xs text-zinc-400 font-bold uppercase mb-1 flex items-center gap-2 print:text-gray-500">
                  <Lock size={12} /> Posição Atual (Bruto)
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-2xl font-bold text-white print:text-black">{formatCurrency(simulation.valorCurvaHoje)}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-zinc-500 print:text-gray-400">Vence em {formatDate(inputs.dataVencimento)}</p>
                      {inputs.isentoIrAtual && <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 rounded print:bg-gray-200 print:text-gray-600">Isento IR</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Valor Mercado */}
              <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 shadow-sm relative overflow-hidden print:bg-white print:border-gray-300 print:text-black">
                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                <div className="flex justify-between">
                  <p className="text-xs text-zinc-400 font-bold uppercase mb-1 flex items-center gap-2 print:text-gray-500">
                    <Target size={12} /> Valor de Mercado (Bruto)
                  </p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${simulation.diferencaBruta >= 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'} print:bg-transparent print:text-black`}>
                    {simulation.diferencaBruta >= 0 ? 'Ágio' : 'Deságio'}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white print:text-black">{formatCurrency(simulation.valorMercadoHoje)}</h3>
                <p className={`text-xs mt-1 font-medium ${simulation.diferencaBruta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  Impacto: {formatCurrency(simulation.diferencaBruta)} ({simulation.diferencaPercentual.toFixed(2)}%)
                </p>
              </div>

              {/* Card 3: Liquidez */}
              <div className="bg-blue-950/30 p-5 rounded-xl border border-blue-900/50 shadow-sm relative overflow-hidden print:bg-blue-50 print:border-blue-200 print:text-black">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="flex justify-between">
                  <p className="text-xs text-blue-400 font-bold uppercase mb-1 flex items-center gap-2 print:text-blue-800">
                    <ArrowUpRight size={12} /> Liquidez P/ Troca
                  </p>
                  <span className="text-[10px] text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded border border-blue-800/50 print:bg-blue-100 print:text-blue-600 print:border-blue-200">
                    IR: {formatCurrency(simulation.impostoDevido)}
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-white print:text-blue-900">{formatCurrency(simulation.valorLiquidoParaTroca)}</h3>
                <p className="text-xs text-blue-300 mt-1 flex items-center gap-1 print:text-blue-700">
                  <Briefcase size={10} />
                  Aplicar a <strong>{inputs.taxaNovaOportunidade}%</strong>
                  {inputs.isentoIrNovo && <span className="ml-1 text-[10px] bg-green-900 text-green-300 px-1 rounded print:bg-green-200 print:text-green-800">(Isento)</span>}
                </p>
              </div>

            </div>

            {/* LINHA 2: GRÁFICO COMPARATIVO */}
            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-sm print:bg-white print:border-gray-300 print:text-black">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 print:text-gray-800">
                    <TrendingUp size={18} className="text-yellow-600" />
                    Projeção Comparativa
                  </h3>
                  <p className="text-sm text-zinc-400 print:text-gray-500">
                    Até o Vencimento em {formatDate(inputs.dataVencimento)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-zinc-500 print:bg-gray-400"></div>
                    <span className="text-zinc-300 print:text-gray-600">Manter Atual ({inputs.tipoTaxa === 'pre' ? '' : inputs.tipoTaxa.toUpperCase() + ' '}{inputs.taxaContratada}%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500 print:bg-blue-600"></div>
                    <span className="text-white font-bold print:text-gray-800">Fazer a Troca ({inputs.tipoTaxaNova === 'pre' ? '' : inputs.tipoTaxaNova.toUpperCase() + ' '}{inputs.taxaNovaOportunidade}%)</span>
                  </div>
                </div>
              </div>

              {activeTab === 'grafico' ? (
                <div className="h-80 w-full print:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={simulation.dataPoints} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTrocar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" />
                      <XAxis
                        dataKey="mesRelativo"
                        tick={{ fontSize: 12, fill: '#a1a1aa' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `+${val}m`}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 12, fill: '#a1a1aa' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                        width={40}
                      />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                        formatter={(value) => formatCurrency(value)}
                        labelFormatter={(label) => `Daqui a ${label} meses`}
                      />

                      <Area
                        type="monotone"
                        dataKey="ValorManter"
                        name="Manter Posição"
                        stroke="#71717a"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fill="none"
                      />

                      <Area
                        type="monotone"
                        dataKey="ValorTrocar"
                        name="Estratégia de Troca"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="url(#colorTrocar)"
                        fillOpacity={1}
                      />

                      {simulation.mesCruzamento && (
                        <ReferenceLine x={simulation.mesCruzamento} stroke="#22c55e" label={{ position: 'insideBottom', value: 'Breakeven', fill: '#22c55e', fontSize: 10 }} />
                      )}

                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-zinc-300 print:text-black">
                    <thead className="bg-zinc-800 text-zinc-400 font-medium print:bg-gray-50 print:text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Mês Futuro</th>
                        <th className="px-4 py-3">Manter</th>
                        <th className="px-4 py-3">Trocar</th>
                        <th className="px-4 py-3">Diferença</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 print:divide-gray-100">
                      {simulation.dataPoints.map((row) => (
                        <tr key={row.mesRelativo} className={row.isVencimento ? "bg-red-900/20 print:bg-red-50" : "hover:bg-zinc-800 print:hover:bg-gray-50"}>
                          <td className="px-4 py-2">
                            +{row.mesRelativo}m
                            {row.isVencimento && <span className="ml-2 text-[10px] text-red-400 font-bold border border-red-900/50 px-1 rounded bg-red-900/20 print:text-red-600 print:border-red-200 print:bg-white">VENCIMENTO</span>}
                          </td>
                          <td className="px-4 py-2">{formatCurrency(row.ValorManter)}</td>
                          <td className="px-4 py-2 font-medium text-blue-400 print:text-blue-600">{formatCurrency(row.ValorTrocar)}</td>
                          <td className={`px-4 py-2 font-bold ${row.Diferenca >= 0 ? 'text-green-500 print:text-green-600' : 'text-red-500'}`}>
                            {formatCurrency(row.Diferenca)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* LINHA 3: VEREDITO APENAS */}
            <div className={`p-6 rounded-xl shadow-lg border flex flex-col justify-center items-center text-center print:bg-white print:border-gray-300 print:text-black ${simulation.tipoResultado.includes('SEGURAR') ? 'bg-red-950/30 border-red-900' : 'bg-green-950/30 border-green-900'}`}>
              <span className="text-xs text-gray-400 uppercase tracking-widest mb-2">Veredito do Modelo</span>
              <h2 className={`text-2xl font-bold mb-2 ${simulation.tipoResultado.includes('SEGURAR') ? 'text-red-400' : 'text-green-400 print:text-green-700'}`}>
                {simulation.tipoResultado}
              </h2>
              {simulation.recuperaDentroDoPrazo && (
                <div className="flex items-center gap-2 text-sm text-green-300 bg-green-900/30 px-3 py-1 rounded-full border border-green-800">
                  <CheckCircle2 size={14} /> Recupera antes do vencimento
                </div>
              )}

              {/* ALERTA DE RISCO */}
              {simulation.riscoInfo && (
                <div className={`mt-3 text-xs px-3 py-1 rounded border flex items-center gap-2 ${simulation.riscoInfo.includes('Aumento') || simulation.riscoInfo.includes('Alerta') ? 'bg-orange-900/30 text-orange-300 border-orange-800' : 'bg-blue-900/30 text-blue-300 border-blue-800'}`}>
                  {simulation.riscoInfo.includes('Aumento') ? <AlertTriangle size={12} /> : <TrendingDown size={12} />}
                  {simulation.riscoInfo}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #27272a; border-radius: 20px; }
        @media print {
          @page { margin: 1cm; size: landscape; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .print\\:flex { display: flex !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:text-black { color: black !important; }
        }
      `}</style>
    </div>
  );
}
