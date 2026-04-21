import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  Calculator, TrendingUp, ShieldCheck, Calendar,
  CheckCircle, MousePointer2, Settings, MonitorPlay, Briefcase,
  ChevronDown, RefreshCw, Landmark, Percent, AlertTriangle, Info, ArrowLeft,
  Plus, Copy, Trash2, ChevronLeft, ChevronRight, Layers, Pencil
} from 'lucide-react';

/* --- UI COMPONENTS --- */
const Card = ({ children, className = "" }) => (
  <div className={`bg-gray-900 border border-gray-800 rounded-lg overflow-hidden shadow-lg ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, type = "neutral" }) => {
  const colors = {
    neutral: "bg-gray-700 text-gray-200",
    success: "bg-green-900/50 text-green-400 border border-green-800",
    warning: "bg-yellow-900/50 text-yellow-400 border border-yellow-800",
    gold: "bg-yellow-600/20 text-yellow-500 border border-yellow-600",
    danger: "bg-red-900/50 text-red-400 border border-red-800",
    blue: "bg-blue-900/50 text-blue-400 border border-blue-800"
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[type] || colors.neutral}`}>
      {children}
    </span>
  );
};

const InputGroup = ({ label, value, onChange, type = "number", step = "0.01", suffix = "" }) => (
  <div className="mb-3">
    <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1 text-gray-400">{label}</label>
    <div className="relative">
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full bg-black border border-gray-700 rounded p-2 text-sm text-white focus:border-yellow-500 outline-none font-mono transition-colors focus:bg-gray-900"
      />
      {suffix && <span className="absolute right-3 top-2 text-xs text-gray-500 font-bold">{suffix}</span>}
    </div>
  </div>
);

/* --- STRATEGIES LOGIC --- */
const STRATEGIES = {
  collar_ui_bi: {
    name: "Collar UI Bidirecional",
    description: "Ganho na alta (limitado) e ganho na queda leve. Proteção Total se cair muito (Knock-out).",
    defaultParams: {
      protection: 100.00, // Capital Protegido (pode ser > 100% para simular mark-to-market ou taxa pré-fixada)
      upsideCap: 54.99,
      upsideBarrier: 55.00,
      upsideBarrierRebate: 36.00,
      downsideBarrier: -10.00,
    },
    inputs: [
      { key: 'protection', label: 'Proteção (Put) %', step: "0.01", suffix: "%" },
      { key: 'upsideCap', label: 'Cap de Alta (%)', step: "0.01", suffix: "%" },
      { key: 'upsideBarrier', label: 'Barreira Alta (Knock-in) %', step: "0.01", suffix: "%" },
      { key: 'upsideBarrierRebate', label: 'Retorno se Bater Barreira Alta (%)', step: "0.01", suffix: "%" },
      { key: 'downsideBarrier', label: 'Barreira Baixa (Knock-out) %', step: "0.01", suffix: "%" },
    ]
  },
  collar_ui: {
    name: "Collar UI (Tradicional)",
    description: "Proteção de piso (perda travada) e participação na alta com barreira.",
    defaultParams: {
      protection: 90.00, // Equivale a -10% de perda max
      upsideCap: 56.36,
      upsideBarrier: 56.37,
      upsideBarrierRebate: 15.00
    },
    inputs: [
      { key: 'protection', label: 'Nível de Proteção (% do Principal)', step: "0.01", suffix: "%" },
      { key: 'upsideCap', label: 'Cap de Alta (%)', step: "0.01", suffix: "%" },
      { key: 'upsideBarrier', label: 'Barreira Alta (Knock-in) %', step: "0.01", suffix: "%" },
      { key: 'upsideBarrierRebate', label: 'Retorno se Bater Barreira Alta (%)', step: "0.01", suffix: "%" },
    ]
  },
  pop: {
    name: "POP",
    description: "Capital Protegido (total ou parcial) com participação na alta ilimitada.",
    defaultParams: {
      protection: 100.00,
      participation: 50.00,
    },
    inputs: [
      { key: 'protection', label: 'Nível de Proteção (%)', step: "0.01", suffix: "%" },
      { key: 'participation', label: 'Taxa de Participação na Alta (%)', step: "0.01", suffix: "%" },
    ]
  },
  fence_ui: {
    name: "FENCE UI",
    description: "Proteção parcial (Buffer) na queda e ganho limitado na alta.",
    defaultParams: {
      protection: 85.00, // Buffer de 15% (100-85)
      upsideCap: 39.45,
      upsideBarrier: 39.46,
      upsideBarrierRebate: 7.00
    },
    inputs: [
      { key: 'protection', label: 'Proteção (Buffer até % do preço)', step: "0.01", suffix: "%" },
      { key: 'upsideCap', label: 'Cap de Alta (%)', step: "0.01", suffix: "%" },
      { key: 'upsideBarrier', label: 'Barreira Alta (Knock-in) %', step: "0.01", suffix: "%" },
      { key: 'upsideBarrierRebate', label: 'Retorno se Bater Barreira Alta (%)', step: "0.01", suffix: "%" },
    ]
  },
  doc_bi: {
    name: "DOC Bidirecional",
    description: "Alta alavancada (2x) ou Cupom fixo. Queda com barreira KO (Desarma Proteção).",
    defaultParams: {
      leverage: 2.0,
      upsideCap: 24.99,
      fixedCouponKO: 25.00, // Cupom se bater a barreira
      protectionBarrier: -20.00 // Barreira KO de baixa
    },
    inputs: [
      { key: 'leverage', label: 'Alavancagem na Alta (x)', step: "0.1", suffix: "x" },
      { key: 'upsideCap', label: 'Limite de Alta (Cap) %', step: "0.01", suffix: "%" },
      { key: 'fixedCouponKO', label: 'Cupom Travado se Bater Cap (%)', step: "0.01", suffix: "%" },
      { key: 'protectionBarrier', label: 'Barreira de Proteção Baixa (KO) %', step: "0.01", suffix: "%" },
    ]
  },
  put_do: {
    name: "Put Down-and-Out",
    description: "Especulação na queda: Potencial de ganhos explosivos com risco limitado ao prêmio.",
    defaultParams: {
      knockOutBarrier: -50.00,
      breakEvenDrop: -4.95, // Ponto onde o resultado é 0% (Equivale ao prêmio em 1:1)
      maxReturnDrop: -49.99, // Ponto de ref da lâmina
      maxReturnPct: 909.12   // Retorno da lâmina
    },
    inputs: [
      { key: 'knockOutBarrier', label: 'Barreira de Desarme (KO) %', step: "0.01", suffix: "%" },
      { key: 'breakEvenDrop', label: 'Queda p/ Zero-a-Zero (Break-even) %', step: "0.01", suffix: "%" },
      { key: 'maxReturnDrop', label: 'Ref. Queda no Pico Máximo (%)', step: "0.01", suffix: "%" },
      { key: 'maxReturnPct', label: 'Ref. Retorno no Pico Máximo (%)', step: "0.01", suffix: "%" },
    ]
  },
  cupom: {
    name: "Cupom Recorrente",
    description: "Pagamento de cupons mensais se ativo estiver acima da barreira.",
    defaultParams: {
      monthlyCoupon: 1.25,
      windows: 12,
      barrier: -15.00
    },
    inputs: [
      { key: 'monthlyCoupon', label: 'Cupom por Janela (%)', step: "0.01", suffix: "%" },
      { key: 'windows', label: 'Nº de Janelas (Meses)', step: "1", suffix: "" },
      { key: 'barrier', label: 'Barreira de Capital (%)', step: "0.01", suffix: "%" },
    ]
  }
};

const MAX_OPERATIONS = 15;

/* --- PURE FUNCTIONS (usadas tanto pelo editor quanto pelas operações salvas) --- */

function getPutDoParamsPure(p) {
  const premiumEst = Math.abs(p.breakEvenDrop);
  const targetReturn = p.maxReturnPct / 100;
  const absMaxDrop = Math.abs(p.maxReturnDrop);
  const impliedLeverage = (premiumEst * (1 + targetReturn)) / absMaxDrop;
  return { premium: premiumEst, leverage: impliedLeverage };
}

function calculateReturnFor(strategy, params, variation, couponsReceived = 0) {
  const v = Number(variation.toFixed(2));
  const p = params;
  let ret = 0;
  let scenario = "";

  switch (strategy) {
    case 'collar_ui_bi':
      const pisoBi = -(100 - p.protection);
      if (v === 0) {
        ret = Math.max(0, pisoBi);
        scenario = ret > 0 ? `Garantia de ${p.protection}% do Capital` : "Neutro";
      }
      else if (v < 0) {
        if (v <= p.downsideBarrier) {
          ret = Math.max(0, pisoBi);
          scenario = "Proteção Total (KO Baixa) + " + (ret > 0 ? `Piso Mínimo (${p.protection}%)` : "Prêmio Zerado");
        }
        else {
          let guaranteedFloor = Math.max(0, pisoBi);
          ret = Math.max(Math.abs(v) + guaranteedFloor, pisoBi);
          scenario = guaranteedFloor > 0
            ? `Ganho na Queda + Piso (${p.protection}%)`
            : (ret > 0 && ret === pisoBi ? `Piso Mínimo (${p.protection}%)` : "Ganho na Queda (Bidirecional)");
        }
      } else {
        if (v >= p.upsideBarrier) { ret = Math.max(p.upsideBarrierRebate, pisoBi); scenario = "Barreira Alta (Travado)"; }
        else { ret = Math.max(Math.min(v, p.upsideCap), pisoBi); scenario = "Alta (Limitada ao Cap)"; }
      }
      break;

    case 'collar_ui':
      const maxLoss = -(100 - p.protection);
      if (v < 0) {
        ret = Math.max(v, maxLoss);
        scenario = ret === maxLoss
          ? (maxLoss > 0 ? `Garantia Mínima (${p.protection}% do Capital)` : `Proteção Ativada (Piso ${maxLoss}%)`)
          : "Acompanha Queda";
      } else {
        if (v >= p.upsideBarrier) { ret = Math.max(p.upsideBarrierRebate, maxLoss); scenario = "Barreira Alta (Travado)"; }
        else { ret = Math.max(Math.min(v, p.upsideCap), maxLoss); scenario = "Alta (Limitada ao Cap)"; }
      }
      break;

    case 'pop':
      const popLossLimit = -(100 - p.protection);
      if (v < 0) {
        ret = Math.max(v, popLossLimit);
        scenario = ret === 0 ? "Capital 100% Protegido" : `Perda Limitada a ${popLossLimit}%`;
      }
      else {
        ret = v * (p.participation / 100);
        scenario = `Alta (${p.participation}% part.)`;
      }
      break;

    case 'fence_ui':
      const bufferSize = 100 - p.protection;
      const bufferLevel = -bufferSize;
      if (v < 0) {
        if (v >= bufferLevel) { ret = 0; scenario = `Protegido pelo Buffer (${bufferLevel}%)`; }
        else { ret = v - bufferLevel; scenario = "Queda Excedeu Proteção"; }
      } else {
        if (v >= p.upsideBarrier) { ret = p.upsideBarrierRebate; scenario = "Barreira Alta (Travado)"; }
        else { ret = Math.min(v, p.upsideCap); scenario = "Alta (Limitada ao Cap)"; }
      }
      break;

    case 'doc_bi':
      if (v < 0) {
        if (v <= p.protectionBarrier) {
          ret = v;
          scenario = "KO da Proteção (Opções Viraram Pó)";
        } else {
          ret = 0;
          scenario = "Capital Protegido";
        }
      } else {
        if (v >= p.upsideCap) {
          ret = p.fixedCouponKO;
          scenario = "Teto Atingido (Cupom Travado)";
        } else {
          ret = v * p.leverage;
          scenario = `Alta Alavancada (${p.leverage}x)`;
        }
      }
      break;

    case 'put_do':
      const { premium, leverage } = getPutDoParamsPure(p);
      if (v > 0) {
        ret = -100;
        scenario = "Opção Virou Pó (Perda do Prêmio)";
      }
      else if (v === 0) {
        ret = -100;
        scenario = "Opção Virou Pó";
      }
      else {
        if (v <= p.knockOutBarrier) {
          ret = -100;
          scenario = "Barreira KO (Perda do Prêmio)";
        }
        else {
          const grossGain = Math.abs(v) * leverage;
          const netGain = grossGain - premium;
          if (premium > 0) {
            ret = (netGain / premium) * 100;
          } else {
            ret = 0;
          }
          scenario = ret >= 0 ? "Lucro (Opção ITM)" : "Recuperação Parcial";
        }
      }
      break;

    case 'cupom':
      const accumulatedCoupons = p.monthlyCoupon * couponsReceived;
      if (v >= p.barrier) {
        ret = accumulatedCoupons;
        scenario = "Ativo acima da Barreira";
      } else {
        ret = v + accumulatedCoupons;
        scenario = "Ativo abaixo da Barreira";
      }
      break;

    default:
      break;
  }
  return { returnPct: ret, scenario };
}

function generateChartDataFor(strategy, params, couponsReceived = 0) {
  const dataPoints = [];
  const rangeMin = -60;
  const rangeMax = 70;

  for (let i = rangeMin; i <= rangeMax; i += 1) dataPoints.push(i);

  const addP = (val) => {
    if (val !== undefined && val !== null) {
      dataPoints.push(val - 0.1, val, val + 0.1);
    }
  };

  if (strategy === 'doc_bi') {
    addP(params.protectionBarrier);
    addP(params.upsideCap);
  } else if (strategy === 'put_do') {
    addP(params.knockOutBarrier);
    addP(params.breakEvenDrop);
    addP(params.maxReturnDrop);
  } else {
    addP(params.downsideBarrier);
    addP(params.upsideBarrier);
    addP(params.upsideCap);
    addP(params.knockOutBarrier);
    addP(params.barrier);
    if (params.protection) {
      if (strategy === 'fence_ui') addP(-(100 - params.protection));
      if (strategy === 'pop') addP(-(100 - params.protection));
      if (strategy === 'collar_ui') addP(-(100 - params.protection));
      if (strategy === 'collar_ui_bi') addP(-(100 - params.protection));
    }
  }

  return dataPoints.sort((a, b) => a - b).map(val => {
    const res = calculateReturnFor(strategy, params, val, couponsReceived);
    return {
      variation: val,
      strategyReturn: res.returnPct,
      assetReturn: val
    };
  });
}

function computeSimResults(strategy, params, variation, investment, cdiPeriod, couponsReceived = 0) {
  let retPct = 0;
  let scenario = "";
  let profit = 0;
  let valFinal = 0;

  if (strategy === 'put_do') {
    const res = calculateReturnFor(strategy, params, variation, couponsReceived);
    retPct = res.returnPct;
    scenario = res.scenario;
    const premiumCost = investment;
    profit = premiumCost * (retPct / 100);
    valFinal = premiumCost + profit;

  } else if (strategy === 'cupom') {
    const assetResult = variation < params.barrier ? variation : 0;
    const couponGain = couponsReceived * params.monthlyCoupon;
    retPct = couponGain + assetResult;
    scenario = variation < params.barrier
      ? `Ativo < Barreira (${params.barrier}%) + ${couponsReceived} Cupons`
      : `Capital Devolvido + ${couponsReceived} Cupons`;
    valFinal = investment * (1 + retPct / 100);
    profit = valFinal - investment;

  } else {
    const res = calculateReturnFor(strategy, params, variation, couponsReceived);
    retPct = res.returnPct;
    scenario = res.scenario;
    valFinal = investment * (1 + retPct / 100);
    profit = valFinal - investment;
  }

  const pctCDI = cdiPeriod > 0 ? (retPct / cdiPeriod) * 100 : 0;
  return { retPct, valFinal, profit, scenario, pctCDI };
}

// Formatters
const formatBRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const formatPct = (v) => new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(v / 100);


/* =====================================================================
   PAYOFF CHART + SIMULATOR COMPONENT (reusável para editor e operações)
   ===================================================================== */
function PayoffView({ strategy, params, ticker, investment, cdiAnnual, maturityDate, cdiPeriod, simulatedVariation, onVariationChange, simulatedCouponsReceived, onCouponsChange, todayDate, isTab = false }) {

  const chartData = useMemo(() => {
    return generateChartDataFor(strategy, params, simulatedCouponsReceived);
  }, [strategy, params, simulatedCouponsReceived]);

  const simulationResults = useMemo(() => {
    return computeSimResults(strategy, params, simulatedVariation, investment, cdiPeriod, simulatedCouponsReceived);
  }, [strategy, params, simulatedVariation, investment, cdiPeriod, simulatedCouponsReceived]);

  return (
    <>
      {/* Header Presentation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            {ticker.toUpperCase()}
            <span className="text-gray-600 text-2xl font-light">|</span>
            <span className="text-yellow-500">{STRATEGIES[strategy].name}</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">{STRATEGIES[strategy].description}</p>
        </div>
        <div className="flex gap-2">
          <Badge type="gold">Vencimento: {new Date(maturityDate).toLocaleDateString('pt-BR')}</Badge>
          <Badge type="blue">CDI Ref: {cdiAnnual}% a.a.</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* SIMULATOR */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 h-full flex flex-col justify-between bg-gradient-to-b from-gray-900 to-gray-950">
            <div>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800">
                <Calculator className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-white">Simulador de Resultado</h3>
              </div>

              {/* Asset Variation Slider */}
              <div className="mb-8">
                <div className="flex justify-between mb-2 items-end">
                  <label className="text-xs text-gray-400 uppercase font-bold flex gap-1 items-center">
                    <MousePointer2 className="w-3 h-3" /> Preço do Ativo (Final)
                  </label>
                  <span className={`text-lg font-mono font-bold ${simulatedVariation >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {simulatedVariation > 0 ? '+' : ''}{simulatedVariation}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="70"
                  step="0.5"
                  value={simulatedVariation}
                  onChange={(e) => onVariationChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <div className="flex justify-between text-[10px] text-gray-600 mt-2 font-mono">
                  <span>-60%</span>
                  <span className="cursor-pointer hover:text-white" onClick={() => onVariationChange(0)}>0%</span>
                  <span>+70%</span>
                </div>
              </div>

              {/* Special Control: Cupom Recorrente */}
              {strategy === 'cupom' && (
                <div className="mb-8 p-3 bg-gray-800/50 rounded border border-gray-700 ring-2 ring-blue-500/20">
                  <div className="flex justify-between mb-2">
                    <label className="text-xs text-yellow-500 uppercase font-bold">Cupons Recebidos</label>
                    <span className="text-white font-bold">{simulatedCouponsReceived} / {params.windows}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={params.windows}
                    step="1"
                    value={simulatedCouponsReceived}
                    onChange={(e) => onCouponsChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-2">
                    <span>0 Meses</span>
                    <span>{params.windows} Meses</span>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Result */}
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
              <div className="mb-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Cenário</p>
                <p className="text-sm font-medium text-yellow-400 leading-tight">{simulationResults.scenario}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700/50">
                <div className={`p-2 rounded ${simulationResults.retPct > 0 && strategy.includes('collar') && params.protection > 100 && simulationResults.retPct === -(100 - params.protection) ? 'bg-green-900/30 border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : ''}`}>
                  <p className="text-[10px] text-gray-500 uppercase mb-1">Rentabilidade</p>
                  <p className={`text-2xl font-bold ${simulationResults.retPct >= 0 ? 'text-white' : 'text-red-400'}`}>
                    {formatPct(simulationResults.retPct)}
                  </p>
                  {strategy.includes('collar') && params.protection > 100 && simulationResults.retPct === -(100 - params.protection) && (
                    <p className="text-[10px] text-green-400 mt-1 font-bold animate-pulse">Piso Garantido!</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase mb-1">vs CDI do Período</p>
                  <div className="flex items-center gap-1">
                    <Percent className="w-3 h-3 text-blue-400" />
                    <p className={`text-xl font-bold text-blue-400`}>
                      {simulationResults.pctCDI.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-between items-center">
                <span className="text-[10px] text-gray-500 uppercase">
                  {strategy === 'put_do' ? 'Lucro/Prejuízo Líquido' : 'Resultado R$'}
                </span>
                <span className={`text-lg font-bold ${simulationResults.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {simulationResults.profit > 0 ? '+' : ''}{formatBRL(simulationResults.profit)}
                </span>
              </div>

              {/* DISCLAIMER */}
              <div className="mt-3 flex items-start gap-2 bg-blue-900/20 p-2 rounded border border-blue-900/30">
                <Info className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-[9px] text-blue-300 leading-tight">
                  Valores aproximados para fins de simulação. O resultado real depende das condições de mercado no momento da desmontagem ou vencimento.
                </p>
              </div>

              {strategy === 'put_do' && (
                <div className="mt-2 text-right">
                  <span className="text-[9px] text-gray-500">
                    *Base de cálculo: Valor Alocado (Prêmio).
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* CHART */}
        <div className="lg:col-span-8">
          <Card className="p-4 h-[500px] bg-gray-900 flex flex-col relative">
            <div className="flex justify-between items-center mb-2 px-2">
              <h3 className="font-bold text-white text-sm flex gap-2 items-center">
                <CheckCircle className="w-4 h-4 text-green-500" /> Payoff Estrutural (Vencimento)
              </h3>
              <div className="flex gap-4 text-[10px]">
                <span className="flex items-center gap-1 text-gray-300"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Estrutura</span>
                <span className="flex items-center gap-1 text-gray-300"><span className="w-2 h-2 rounded-full bg-gray-600"></span> Ativo Puro</span>
              </div>
            </div>

            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id={`colorStrategy${isTab ? '-tab' : ''}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EAB308" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="variation" stroke="#666" tickFormatter={(v) => `${v}%`} type="number" domain={[-60, 70]} allowDataOverflow />
                  <YAxis stroke="#666" tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000', borderColor: '#333' }}
                    labelFormatter={(v) => `Variação Ativo: ${v}%`}
                    formatter={(v, name) => [v.toFixed(2) + '%', name === 'strategyReturn' ? 'Estrutura' : 'Ativo']}
                  />
                  <ReferenceLine y={0} stroke="#444" />
                  <ReferenceLine x={0} stroke="#444" />

                  {/* VISUAL LINES (Barriers) */}
                  {params.upsideBarrier && <ReferenceLine x={params.upsideBarrier} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'KI Alta', fill: '#EF4444', fontSize: 10 }} />}

                  {/* Logic for specific Strategy Lines */}
                  {strategy === 'doc_bi' ? (
                    <ReferenceLine x={params.protectionBarrier} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'KO Baixa', fill: '#EF4444', fontSize: 10 }} />
                  ) : (
                    <>
                      {params.downsideBarrier && <ReferenceLine x={params.downsideBarrier} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'KO Baixa', fill: '#EF4444', fontSize: 10 }} />}
                      {params.knockOutBarrier && <ReferenceLine x={params.knockOutBarrier} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'KO Baixa', fill: '#EF4444', fontSize: 10 }} />}
                    </>
                  )}

                  {params.barrier && <ReferenceLine x={params.barrier} stroke="#3B82F6" strokeDasharray="3 3" label={{ value: 'Barreira Cupom', fill: '#3B82F6', fontSize: 10 }} />}

                  {/* Dynamic Cursor */}
                  <ReferenceLine x={simulatedVariation} stroke="#FFF" strokeWidth={2} label={{ value: 'CENÁRIO', fill: '#FFF', fontSize: 10, position: 'top', fontWeight: 'bold' }} />

                  <Line type="monotone" dataKey="assetReturn" stroke="#4B5563" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Area type="monotone" dataKey="strategyReturn" stroke="#EAB308" fill={`url(#colorStrategy${isTab ? '-tab' : ''})`} strokeWidth={3} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}


/* =====================================================================
   MAIN SIMULADOR OPCOES COMPONENT
   ===================================================================== */
export default function SimuladorOpcoes({ onClose }) {
  // --- GENERAL STATES ---
  const [selectedStrategy, setSelectedStrategy] = useState('collar_ui_bi');
  const [ticker, setTicker] = useState('BOVA11');
  const [investment, setInvestment] = useState(5000);
  const [params, setParams] = useState(STRATEGIES['collar_ui_bi'].defaultParams);
  const [simulatedVariation, setSimulatedVariation] = useState(0);
  const [presentationMode, setPresentationMode] = useState(false);
  const [todayDate, setTodayDate] = useState("");

  // CDI Logic
  const [cdiAnnual, setCdiAnnual] = useState(10.65);
  const [maturityDate, setMaturityDate] = useState("2026-12-20");
  const [cdiPeriod, setCdiPeriod] = useState(0);

  // Cupom Recorrente Logic
  const [simulatedCouponsReceived, setSimulatedCouponsReceived] = useState(0);

  // --- MULTI-OPERATIONS STATE ---
  const [operations, setOperations] = useState([]);
  const [activeOpIndex, setActiveOpIndex] = useState(0);
  const tabsContainerRef = useRef(null);

  // Init Data
  useEffect(() => {
    const today = new Date();
    setTodayDate(today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }));

    // Default maturity +2 years
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 2);
    setMaturityDate(nextYear.toISOString().split('T')[0]);
  }, []);

  // Calculate CDI Period
  useEffect(() => {
    const start = new Date();
    const end = new Date(maturityDate);
    const diffTime = end - start;
    if (diffTime < 0) { setCdiPeriod(0); return; }

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const workDays = Math.floor(diffDays * (5 / 7));
    const factor = Math.pow(1 + (cdiAnnual / 100), workDays / 252);
    setCdiPeriod((factor - 1) * 100);
  }, [cdiAnnual, maturityDate]);

  const handleStrategyChange = (newStrategy) => {
    setSelectedStrategy(newStrategy);
    setParams(STRATEGIES[newStrategy].defaultParams);
    setSimulatedVariation(0);
    // Reset simulation props
    if (newStrategy === 'cupom') setSimulatedCouponsReceived(STRATEGIES['cupom'].defaultParams.windows);
  };

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  // --- MULTI-OPERATIONS MANAGEMENT ---
  const addOperation = () => {
    if (operations.length >= MAX_OPERATIONS) return;
    const newOp = {
      id: Date.now(),
      strategy: selectedStrategy,
      params: { ...params },
      ticker,
      investment,
      maturityDate,
      cdiAnnual,
      label: `${STRATEGIES[selectedStrategy].name} — ${ticker}`,
      simulatedVariation: 0,
      simulatedCouponsReceived: selectedStrategy === 'cupom' ? params.windows : 0,
    };
    setOperations(prev => [...prev, newOp]);
  };

  const removeOperation = (id) => {
    setOperations(prev => {
      const newOps = prev.filter(op => op.id !== id);
      // Ajustar activeOpIndex se necessário
      if (activeOpIndex >= newOps.length && newOps.length > 0) {
        setActiveOpIndex(newOps.length - 1);
      } else if (newOps.length === 0) {
        setActiveOpIndex(0);
      }
      return newOps;
    });
  };

  const editOperation = (op) => {
    setSelectedStrategy(op.strategy);
    setParams({ ...op.params });
    setTicker(op.ticker);
    setInvestment(op.investment);
    setMaturityDate(op.maturityDate);
    setCdiAnnual(op.cdiAnnual);
    setSimulatedVariation(0);
    if (op.strategy === 'cupom') setSimulatedCouponsReceived(op.params.windows);
    // Sair do modo apresentação para editar
    setPresentationMode(false);
  };

  const duplicateOperation = (op) => {
    if (operations.length >= MAX_OPERATIONS) return;
    setOperations(prev => [...prev, { ...op, id: Date.now(), label: op.label + ' (cópia)' }]);
  };

  const updateOperationVariation = (index, value) => {
    setOperations(prev => prev.map((op, i) => i === index ? { ...op, simulatedVariation: value } : op));
  };

  const updateOperationCoupons = (index, value) => {
    setOperations(prev => prev.map((op, i) => i === index ? { ...op, simulatedCouponsReceived: value } : op));
  };

  // Compute CDI period for a specific operation
  const computeCdiPeriodFor = (opCdiAnnual, opMaturityDate) => {
    const start = new Date();
    const end = new Date(opMaturityDate);
    const diffTime = end - start;
    if (diffTime < 0) return 0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const workDays = Math.floor(diffDays * (5 / 7));
    const factor = Math.pow(1 + (opCdiAnnual / 100), workDays / 252);
    return (factor - 1) * 100;
  };

  // Scroll de abas
  const scrollTabs = (direction) => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: direction * 200, behavior: 'smooth' });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!presentationMode || operations.length === 0) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') {
        setActiveOpIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveOpIndex(prev => Math.min(operations.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [presentationMode, operations.length]);

  // --- CHART DATA for editor (backward compatible) ---
  const chartData = useMemo(() => {
    return generateChartDataFor(selectedStrategy, params, simulatedCouponsReceived);
  }, [params, selectedStrategy, simulatedCouponsReceived]);

  // --- SIMULATOR RESULTS for editor (backward compatible) ---
  const simulationResults = useMemo(() => {
    return computeSimResults(selectedStrategy, params, simulatedVariation, investment, cdiPeriod, simulatedCouponsReceived);
  }, [simulatedVariation, params, selectedStrategy, investment, cdiPeriod, simulatedCouponsReceived]);

  // Active operation for presentation
  const activeOp = operations.length > 0 ? operations[activeOpIndex] : null;

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-yellow-500 selection:text-black pb-12">

      {/* HEADER */}
      <header className="border-b border-gray-800 bg-gray-950 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/euro-logo.png" alt="Eurostock Logo" className="w-12 object-contain drop-shadow-[0_0_10px_rgba(234,179,8,0.2)]" />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">EUROSTOCK</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Mesa de Renda Variável • XP</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              {/* Operations counter */}
              {operations.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 rounded-md border border-gray-700">
                  <Layers className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-xs font-bold text-gray-300">{operations.length}</span>
                </div>
              )}
              <button
                onClick={() => setPresentationMode(!presentationMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${presentationMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-yellow-500 text-black hover:bg-yellow-400'}`}
              >
                {presentationMode ? <Settings className="w-4 h-4" /> : <MonitorPlay className="w-4 h-4" />}
                {presentationMode ? "Editar Estrutura" : "Modo Apresentação"}
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-all border border-transparent"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* VALIDITY BANNER */}
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center justify-between animate-pulse-slow">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="text-yellow-500 font-bold text-sm md:text-base">
              ATENÇÃO: Proposta e taxas válidas somente para hoje, {todayDate}.
            </span>
          </div>
          <Badge type="warning">Condição Especial</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* --- EDITOR PANEL (LEFT) --- */}
          {!presentationMode && (
            <div className="lg:col-span-3 space-y-6 animate-fadeIn">

              {/* Structure Selection */}
              <Card className="p-4 border-l-4 border-l-yellow-500">
                <div className="flex items-center gap-2 mb-3 text-yellow-500 font-bold uppercase text-xs tracking-wider">
                  <Briefcase className="w-4 h-4" /> Estrutura
                </div>
                <div className="relative">
                  <select
                    value={selectedStrategy}
                    onChange={(e) => handleStrategyChange(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded p-2 appearance-none focus:border-yellow-500 outline-none cursor-pointer"
                  >
                    {Object.entries(STRATEGIES).map(([key, strat]) => (
                      <option key={key} value={key}>{strat.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </Card>

              {/* Market Data */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4 text-gray-400 font-bold uppercase text-xs tracking-wider">
                  <Landmark className="w-4 h-4" /> Dados de Mercado
                </div>
                <InputGroup label="Ticker" type="text" value={ticker} onChange={setTicker} />
                <InputGroup
                  label={selectedStrategy === 'put_do' ? "Valor Alocado / Prêmio (R$)" : "Aporte (R$)"}
                  value={investment}
                  onChange={setInvestment}
                  step="1000"
                />
                <InputGroup label="CDI Anual (%)" value={cdiAnnual} onChange={setCdiAnnual} suffix="%" />
                <div className="mb-3">
                  <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1 text-gray-400">Vencimento</label>
                  <input
                    type="date"
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded p-2 text-sm text-white focus:border-yellow-500 outline-none"
                  />
                  <div className="text-[10px] text-gray-500 mt-1 text-right">
                    CDI Período Est.: {formatPct(cdiPeriod)}
                  </div>
                </div>
              </Card>

              {/* Calibration */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4 text-gray-400 font-bold uppercase text-xs tracking-wider">
                  <RefreshCw className="w-4 h-4" /> Calibragem
                </div>
                {STRATEGIES[selectedStrategy].inputs.map((input) => (
                  <InputGroup
                    key={input.key}
                    label={input.label}
                    value={params[input.key]}
                    onChange={(val) => updateParam(input.key, val)}
                    step={input.step}
                    suffix={input.suffix}
                    type="number"
                  />
                ))}
              </Card>

              {/* ADD TO PRESENTATION BUTTON */}
              <button
                onClick={addOperation}
                disabled={operations.length >= MAX_OPERATIONS}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20"
                title={operations.length >= MAX_OPERATIONS ? `Limite de ${MAX_OPERATIONS} operações atingido` : "Salvar configuração atual como operação"}
              >
                <Plus className="w-4 h-4" />
                Adicionar à Apresentação
                {operations.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-black/20 rounded text-[10px]">
                    {operations.length}/{MAX_OPERATIONS}
                  </span>
                )}
              </button>

              {/* OPERATIONS LIST */}
              {operations.length > 0 && (
                <Card className="p-4 border-l-4 border-l-yellow-600">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-yellow-600 font-bold uppercase text-xs tracking-wider">
                      <Layers className="w-4 h-4" /> Operações ({operations.length})
                    </div>
                    <button
                      onClick={() => { setOperations([]); setActiveOpIndex(0); }}
                      className="text-[10px] text-gray-500 hover:text-red-400 transition-colors uppercase font-bold"
                    >
                      Limpar Tudo
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {operations.map((op, idx) => (
                      <div
                        key={op.id}
                        className="bg-gray-800/70 rounded-lg p-3 border border-gray-700/50 hover:border-gray-600 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-white truncate">{STRATEGIES[op.strategy].name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-2">
                          <span>{op.ticker}</span>
                          <span className="text-gray-600">•</span>
                          <span>{formatBRL(op.investment)}</span>
                          <span className="text-gray-600">•</span>
                          <span>{new Date(op.maturityDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => editOperation(op)}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-700/50 hover:bg-gray-700 rounded text-[10px] text-gray-300 hover:text-white transition-colors"
                            title="Carregar no editor"
                          >
                            <Pencil className="w-3 h-3" /> Editar
                          </button>
                          <button
                            onClick={() => duplicateOperation(op)}
                            disabled={operations.length >= MAX_OPERATIONS}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-700/50 hover:bg-gray-700 rounded text-[10px] text-gray-300 hover:text-white transition-colors disabled:opacity-30"
                            title="Duplicar"
                          >
                            <Copy className="w-3 h-3" /> Duplicar
                          </button>
                          <button
                            onClick={() => removeOperation(op.id)}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-700/50 hover:bg-red-900/50 rounded text-[10px] text-gray-300 hover:text-red-400 transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-3 h-3" /> Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* --- PRESENTATION AREA --- */}
          <div className={`${presentationMode ? 'lg:col-span-12' : 'lg:col-span-9'} space-y-6 transition-all duration-500`}>

            {/* MULTI-OPERATION TABS (only in presentation mode with operations) */}
            {presentationMode && operations.length > 0 ? (
              <>
                {/* TABS BAR */}
                <div className="flex items-center gap-2 bg-gray-900 rounded-lg border border-gray-800 p-1.5">
                  {/* Left scroll arrow */}
                  <button
                    onClick={() => scrollTabs(-1)}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Scrollable tabs container */}
                  <div
                    ref={tabsContainerRef}
                    className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {operations.map((op, idx) => (
                      <button
                        key={op.id}
                        onClick={() => setActiveOpIndex(idx)}
                        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
                          idx === activeOpIndex
                            ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                            : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                      >
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          idx === activeOpIndex ? 'bg-black/20' : 'bg-gray-700'
                        }`}>
                          {idx + 1}
                        </span>
                        {STRATEGIES[op.strategy].name} — {op.ticker}
                      </button>
                    ))}
                  </div>

                  {/* Right scroll arrow */}
                  <button
                    onClick={() => scrollTabs(1)}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Tab navigation hint */}
                <div className="flex justify-center">
                  <span className="text-[10px] text-gray-600 flex items-center gap-2">
                    Use ← → para navegar entre operações • {activeOpIndex + 1} de {operations.length}
                  </span>
                </div>

                {/* ACTIVE OPERATION CONTENT */}
                {activeOp && (
                  <PayoffView
                    key={activeOp.id}
                    strategy={activeOp.strategy}
                    params={activeOp.params}
                    ticker={activeOp.ticker}
                    investment={activeOp.investment}
                    cdiAnnual={activeOp.cdiAnnual}
                    maturityDate={activeOp.maturityDate}
                    cdiPeriod={computeCdiPeriodFor(activeOp.cdiAnnual, activeOp.maturityDate)}
                    simulatedVariation={activeOp.simulatedVariation}
                    onVariationChange={(v) => updateOperationVariation(activeOpIndex, v)}
                    simulatedCouponsReceived={activeOp.simulatedCouponsReceived}
                    onCouponsChange={(v) => updateOperationCoupons(activeOpIndex, v)}
                    todayDate={todayDate}
                    isTab={true}
                  />
                )}
              </>
            ) : (
              /* DEFAULT VIEW (editor or presentation without operations) */
              <PayoffView
                strategy={selectedStrategy}
                params={params}
                ticker={ticker}
                investment={investment}
                cdiAnnual={cdiAnnual}
                maturityDate={maturityDate}
                cdiPeriod={cdiPeriod}
                simulatedVariation={simulatedVariation}
                onVariationChange={setSimulatedVariation}
                simulatedCouponsReceived={simulatedCouponsReceived}
                onCouponsChange={setSimulatedCouponsReceived}
                todayDate={todayDate}
                isTab={false}
              />
            )}

            {/* Legal Footer */}
            <div className="border-t border-gray-800 pt-6 text-center">
              <p className="text-[10px] text-gray-500">
                EUROSTOCK INVESTIMENTOS • ESCRITÓRIO CREDENCIADO XP INVESTIMENTOS
              </p>
              <p className="text-[10px] text-gray-600 mt-1 max-w-4xl mx-auto leading-relaxed">
                Documento gerado em {todayDate}. Simulação baseada em parâmetros de mercado estimados. Estruturas com derivativos possuem riscos específicos, incluindo risco de crédito do emissor e risco de mercado em caso de saída antecipada (Mark-to-Market). Rentabilidade passada não é garantia de rentabilidade futura.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
