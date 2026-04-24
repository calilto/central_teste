import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  Target,
  Plus,
  Trash2,
  PieChart as PieChartIcon,
  User,
  Medal,
  Monitor,
  EyeOff,
  Eye,
  BarChart3,
  Edit2,
  X,
  Check,
  Upload,
  Download
} from 'lucide-react';

// Estilo de cores (Dark + Yellow XP style)
const COLORS = ['#FFC709', '#E0A800', '#FCD34D', '#FEF3C7', '#854D0E', '#A16207'];

// Cores expandidas para gráfico de segmentos (11 opções)
const SEGMENT_COLORS = ['#FFC709', '#22c55e', '#3b82f6', '#ef4444', '#a855f7', '#f97316', '#06b6d4', '#ec4899', '#84cc16', '#eab308', '#6366f1'];

// Lista de segmentos disponíveis para Renda Fixa
const RENDA_FIXA_SEGMENTS = [
  'Alimentos - Proteína',
  'Energia',
  'Açucar e Etanol',
  'Varejo',
  'Celulose',
  'Logística',
  'Setor Imobiliário',
  'Mineração',
  'Alimentos',
  'Financeiro',
  'Hospitalar/Saúde'
];

// Lista de segmentos disponíveis para Fundos
const FUNDOS_SEGMENTS = [
  'imobiliário (recebiveis)',
  'agro (recebiveis)',
  'agro (tijolo)',
  'logistica (tijolo)',
  'shopping (tijolo)',
  'infra (recebiveis)'
];

// Formatadores
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatPercent = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100);
};

// Nova função para ler números com vírgula do padrão brasileiro
const parseBrFloat = (val) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;

  // Primeiro removemos potenciais textos que podem atrapalhar a extração do número (ex: 'CDI + 1,50%', IPCA, a.a.)
  let cleanVal = String(val).replace(/CDI/gi, '').replace(/IPCA/gi, '').replace(/\+/g, '').replace(/%/g, '').replace(/a\.a\./gi, '').trim();

  // Extrai apenas a parte numérica, se contiver números, vírgulas e pontos
  const match = cleanVal.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return 0;

  cleanVal = match[0];
  // Se tiver ponto de milhar e vírgula decimal (ex: 1.000,50), remove o ponto
  if (cleanVal.includes('.') && cleanVal.includes(',')) {
    cleanVal = cleanVal.replace(/\./g, '');
  }
  // Troca vírgula por ponto para o Javascript calcular
  cleanVal = cleanVal.replace(',', '.');
  return parseFloat(cleanVal) || 0;
};

const MONTHS = [
  { value: '0', label: 'Janeiro' },
  { value: '1', label: 'Fevereiro' },
  { value: '2', label: 'Março' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Maio' },
  { value: '5', label: 'Junho' },
  { value: '6', label: 'Julho' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Setembro' },
  { value: '9', label: 'Outubro' },
  { value: '10', label: 'Novembro' },
  { value: '11', label: 'Dezembro' }
];

export default function SimuladorRendaMensal({ onClose }) {
  // Estado do CDI Global e IPCA para simulações
  const [referenceCDI, setReferenceCDI] = useState('10,40');
  const [referenceIPCA, setReferenceIPCA] = useState('4,50');

  // Cálculos Básicos Base
  const numCDI = parseBrFloat(referenceCDI);
  const numIPCA = parseBrFloat(referenceIPCA);

  const monthlyCDI = (Math.pow(1 + numCDI / 100, 1 / 12) - 1) * 100;
  const monthlyIPCA = (Math.pow(1 + numIPCA / 100, 1 / 12) - 1) * 100;

  // Estado inicial
  const [portfolio, setPortfolio] = useState([]);

  // Estados do formulário
  const [productType, setProductType] = useState('Renda Fixa');
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('CDI');
  const [assetMaturity, setAssetMaturity] = useState('');
  const [assetContractedRate, setAssetContractedRate] = useState('');
  const [assetAmount, setAssetAmount] = useState('');
  const [assetYield, setAssetYield] = useState('');
  const [assetFee, setAssetFee] = useState('');
  const [assetCouponFrequency, setAssetCouponFrequency] = useState('');
  const [assetCouponMonth, setAssetCouponMonth] = useState('');
  const [assetAnnualCoupon, setAssetAnnualCoupon] = useState('');
  const [assetSegment, setAssetSegment] = useState(''); // Setor
  const [assetSubSegment, setAssetSubSegment] = useState(''); // Segmento
  const [assetIsTaxFree, setAssetIsTaxFree] = useState(true); // Isento IR

  // Estado de Edição
  const [editingAssetId, setEditingAssetId] = useState(null);

  // Estado do Modo Apresentação e Privacidade
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);

  // Referência para o input de arquivo ocuto
  const fileInputRef = useRef(null);

  // Funcão para gerar e baixar a planilha modelo de Carteira
  const handleDownloadTemplate = () => {
    // Aba Sua carteira
    const wsDataCarteira = [
      { 'Nome do Produto': '', 'Total aplicado': '', 'Indexador': '', 'Taxa': '', 'Vencimento': '', 'Segmento': '', 'Fluxo de pagamento': '', 'Isento': '' }
    ];
    // Aba Fundos
    const wsDataFundos = [
      { 'Nome do produto': '', 'Aplicação': '', 'Segmento': '', 'Indexador': '', 'Taxa (ano)': '' }
    ];

    const wb = XLSX.utils.book_new();
    const wsCarteira = XLSX.utils.json_to_sheet(wsDataCarteira);
    const wsFundos = XLSX.utils.json_to_sheet(wsDataFundos);

    XLSX.utils.book_append_sheet(wb, wsCarteira, "Sua carteira");
    XLSX.utils.book_append_sheet(wb, wsFundos, "Fundos");

    XLSX.writeFile(wb, "Modelo_Carteira_Simulador.xlsx");
  };

  const handleDownloadPortfolio = () => {
    // Aba Sua carteira
    const wsDataCarteira = portfolio
      .filter(p => p.productType !== 'Fundos')
      .map(p => ({
        'Nome do Produto': p.name || '',
        'Total aplicado': p.amount || 0,
        'Indexador': p.type || '',
        'Taxa': p.contractedRate || '',
        'Vencimento': p.maturity || '',
        'Segmento': p.segment || '',
        'Fluxo de pagamento': p.couponFrequency || '',
        'Isento': p.isTaxFree ? 'Sim' : 'Não'
      }));

    // Aba Fundos
    const wsDataFundos = portfolio
      .filter(p => p.productType === 'Fundos')
      .map(p => ({
        'Nome do produto': p.name || '',
        'Aplicação': p.amount || 0,
        'Segmento': p.segment || '',
        'Indexador': p.type || '',
        'Taxa (ano)': p.annualCoupon > 0 ? `${p.annualCoupon.toString().replace('.', ',')}%` : (p.contractedRate || '')
      }));

    // Se estiver vazio, coloca uma linha em branco para manter a estrutura
    if (wsDataCarteira.length === 0) {
      wsDataCarteira.push({ 'Nome do Produto': '', 'Total aplicado': '', 'Indexador': '', 'Taxa': '', 'Vencimento': '', 'Segmento': '', 'Fluxo de pagamento': '', 'Isento': '' });
    }
    if (wsDataFundos.length === 0) {
      wsDataFundos.push({ 'Nome do produto': '', 'Aplicação': '', 'Segmento': '', 'Indexador': '', 'Taxa (ano)': '' });
    }

    const wb = XLSX.utils.book_new();
    const wsCarteira = XLSX.utils.json_to_sheet(wsDataCarteira);
    const wsFundos = XLSX.utils.json_to_sheet(wsDataFundos);

    XLSX.utils.book_append_sheet(wb, wsCarteira, "Sua carteira");
    XLSX.utils.book_append_sheet(wb, wsFundos, "Fundos");

    XLSX.writeFile(wb, "Minha_Carteira_Exportada.xlsx");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary', raw: false }); 
        
        let allNewAssets = [];
        
        // Loop por todas as abas que quisermos suportar
        wb.SheetNames.forEach((sheetName, sheetIndex) => {
           const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
           if (data.length === 0) return;

           const isFundos = sheetName.toLowerCase().includes('fundos');
           const prodType = isFundos ? 'Fundos' : 'Renda Fixa';

           const mappedAssets = data.map((row, index) => {
             const rawName = row['Nome do Produto'] || row['Nome do produto'] || row['Nome'] || row['Produto'];
             const name = typeof rawName === 'string' ? rawName : (rawName ? String(rawName) : `Produto ${sheetIndex}-${index + 1}`);

             let amount = 0;
             const rawApp = row['Total aplicado'] || row['Aplicação'] || row['Aplicacao'] || row['Valor'] || 0;
             if (typeof rawApp === 'number') {
                 amount = rawApp;
             } else {
                 const amountCleanStr = String(rawApp).replace(/R\$/gi, '').replace(/\./g, '').replace(',', '.').trim();
                 amount = parseFloat(amountCleanStr) || 0;
             }

             const segment = row['Segmento'] || row['Setor'] || '';
             
             // Indexador customizado para IPCA+, Pré, Pós (CDI)
             let rawIndexador = String(row['Indexador'] || 'Prefixado').toUpperCase();
             let rawTaxa = String(row['Taxa (ano)'] || row['Taxa'] || '0');
             
             // PÓS == CDI
             if (rawIndexador.includes('PÓS') || rawIndexador.includes('POS')) {
                 if (rawTaxa.toUpperCase().includes('CDI') && rawTaxa.includes('+')) rawIndexador = 'CDI+';
                 else rawIndexador = 'CDI'; 
             }

             let finalType = 'Prefixado';
             if (rawIndexador.includes('CDI')) {
                if (rawIndexador.includes('+') || rawTaxa.includes('+')) finalType = 'CDI+';
                else finalType = 'CDI';
             } else if (rawIndexador.includes('IPCA')) {
                finalType = 'IPCA+';
             }
             
             let taxaClean = 0;
             // Limpeza mágica rápida (tira %, pega os numeros)
             const stringMatch = rawTaxa.match(/[\d,.]+/);
             if (stringMatch) {
               let valStr = stringMatch[0];
               if (valStr.includes(',')) {
                 valStr = valStr.replace(/\./g, '').replace(',', '.');
               }
               taxaClean = parseFloat(valStr) || 0;
             }

             let cdiPercent = 0;
             let preRate = 0;
             let finalContractedRate = rawTaxa;

             if (finalType === 'CDI') {
                cdiPercent = taxaClean;
                finalContractedRate = `${taxaClean}% do CDI`;
             } else if (finalType === 'CDI+') {
                cdiPercent = 100;
                preRate = taxaClean;
                finalContractedRate = `CDI + ${taxaClean}%`;
             } else if (finalType === 'IPCA+') {
                finalContractedRate = `IPCA + ${taxaClean}%`;
                preRate = taxaClean; // PreRate no IPCA+ armazena o spread
             } else {
                preRate = taxaClean;
                finalContractedRate = `${taxaClean}% a.a.`;
             }

             // Datas / Cupons
             const frequencyInput = String(row['Fluxo de pagamento'] || '').toLowerCase();
             const isentoInput = String(row['Isento'] || '').toLowerCase();
             
             let finalFreq = frequencyInput.includes('semestral') ? 'semestral' : frequencyInput.includes('mensal') ? 'mensal' : '';
             if (isFundos) finalFreq = 'mensal'; // Fundo sempre mensal
             
             let couponM = '';
             let vencRaw = row['Vencimento'] || '';
             let venc = String(vencRaw);
             
             if (typeof vencRaw === 'number') {
                 // Converte data do Excel para JS (considerando 1/1/1970 = 25569)
                 const date = new Date((vencRaw - 25569) * 86400 * 1000);
                 const m = date.getUTCMonth();
                 couponM = String(m);
                 const d = String(date.getUTCDate()).padStart(2, '0');
                 const mm = String(m + 1).padStart(2, '0');
                 const yyyy = date.getUTCFullYear();
                 venc = `${d}/${mm}/${yyyy}`;
             } else if (venc.includes('/')) {
                const parts = venc.split('/');
                if (parts.length >= 2) {
                   const m = parseInt(parts[1]) - 1; // Mês no formato DD/MM/YYYY é o índice 1
                   if (m >= 0 && m <= 11) couponM = String(m);
                }
             }

             // Isenção IR
             let isTaxFree = true;
             if (isentoInput === 'não' || isentoInput === 'nao') isTaxFree = false;
             if (isentoInput === '' && !isFundos) {
                 const n = name.toUpperCase();
                 if (n.includes('DEB') && !n.includes('INCENTIVADA') && !n.includes('INFRA')) {
                     isTaxFree = false; 
                 } else if (n.includes('CDB')) {
                     isTaxFree = false;
                 }
             }

             return {
                id: Date.now() + Math.random(), 
                name: name,
                type: finalType,
                contractedRate: finalContractedRate,
                cdiPercent: cdiPercent,
                preRate: preRate,
                amount: amount,
                maturity: venc, 
                yieldRate: 0,
                feeRate: 0,
                couponFrequency: finalFreq,
                couponMonth: couponM,
                annualCoupon: isFundos ? taxaClean : 0, 
                segment: segment,
                subSegment: '',
                productType: prodType,
                isTaxFree: isTaxFree
             };
           });
           allNewAssets = [...allNewAssets, ...mappedAssets];
        });
        
        if (allNewAssets.length === 0) {
           alert("Nenhuma carteira válida lida a partir da aba 'Sua carteira' ou 'Fundos'.");
           return;
        }

        // Adiciona os novos ativos à lista atual, preservando o que já estava lá
        setPortfolio([...portfolio, ...allNewAssets]);
        
        // Limpar o input file para permitir novo upload
        if (fileInputRef.current) fileInputRef.current.value = '';

      } catch (err) {
        console.error("Erro no processamento da planilha:", err);
        alert("Ops! Houve um erro ao ler a planilha. Verifique se ela está no modelo correto.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // Handlers para Blur (Auto-completar inteligente)
  const handleContractedRateBlur = () => {
    let val = assetContractedRate.trim();
    if (!val) return;
    // Se digitou só número (ex: 98,5 ou 12), formata de acordo com o Indexador
    if (!isNaN(val.replace(',', '.'))) {
      if (assetType === 'CDI') setAssetContractedRate(val + '% do CDI');
      else if (assetType === 'Prefixado') setAssetContractedRate(val + '% a.a.');
      else if (assetType === 'CDI+') setAssetContractedRate('CDI + ' + val + '%');
      else if (assetType === 'IPCA+') setAssetContractedRate('IPCA + ' + val + '%');
      else setAssetContractedRate(val + '%');
    }
  };

  const handleFeeBlur = () => {
    let val = assetFee.trim();
    if (val && !isNaN(val.replace(',', '.'))) setAssetFee(val + '%');
  };

  const handleYieldBlur = () => {
    let val = assetYield.trim();
    if (val && !isNaN(val.replace(',', '.'))) setAssetYield(val + '%');
  };

  const handleMaturityBlur = () => {
    let val = assetMaturity.trim();
    // Se digitou 6 números seguidos ex: 062036, formata para 06/2036
    if (/^\d{6}$/.test(val)) {
      setAssetMaturity(`${val.substring(0, 2)}/${val.substring(2)}`);
    }
  };

  const handleAnnualCouponBlur = () => {
    let val = assetAnnualCoupon.trim();
    if (val && !isNaN(val.replace(',', '.')) && !val.includes('%')) {
      setAssetAnnualCoupon(val + '%');
    }
  };

  // Cálculos Derivados (Agora com CDI Dinâmico)
  const { totalInvested, totalCommission, averageFee, allocationData, segmentAllocationData, monthlyProjections, totalYearIncome, averageMonthlyIncome, averageMonthlyYield } = useMemo(() => {
    let invested = 0;
    let commission = 0;
    const allocationMap = {};
    const segmentMap = {};

    portfolio.forEach(asset => {
      invested += asset.amount;
      commission += asset.amount * (asset.feeRate / 100);

      let groupType = asset.type;
      if (asset.type === 'CDI+' || asset.type === 'CDI') groupType = 'Pós-fixado';
      else if (asset.type === 'IPCA+') groupType = 'Inflação';
      else if (asset.type === 'Prefixado') groupType = 'Prefixado';
      if (allocationMap[groupType]) {
        allocationMap[groupType] += asset.amount;
      } else {
        allocationMap[groupType] = asset.amount;
      }

      // Agrupamento por Segmento
      if (asset.segment) {
        if (segmentMap[asset.segment]) {
          segmentMap[asset.segment] += asset.amount;
        } else {
          segmentMap[asset.segment] = asset.amount;
        }
      }
    });

    const allocData = Object.keys(allocationMap).map(key => ({
      name: key,
      value: allocationMap[key]
    }));

    const segAllocData = Object.keys(segmentMap).map(key => ({
      name: key,
      value: segmentMap[key]
    }));

    let yearIncome = 0;
    const projections = MONTHS.map((m) => {
      let monthIncome = 0;
      portfolio.forEach(asset => {
        // === NOVA MATEMÁTICA RODA DIRETAMENTE A TAXA DE CADA LINHA, ELIMINANDO O CUPOM ANUAL DUPLICADO ===
        let accrualBaseAnnualTotal = 0;
        let couponBaseAnnualTotal = 0;
        
        // 1. Descobrir a Taxa Anual Total Nominal Bruta
        if (asset.productType === 'Fundos') {
           accrualBaseAnnualTotal = asset.annualCoupon > 0 ? asset.annualCoupon : 0;
           couponBaseAnnualTotal = accrualBaseAnnualTotal;
        } else {
           if (asset.type === 'CDI') {
              accrualBaseAnnualTotal = numCDI * (asset.cdiPercent > 0 ? (asset.cdiPercent / 100) : 1);
              couponBaseAnnualTotal = accrualBaseAnnualTotal;
           } else if (asset.type === 'CDI+') {
              accrualBaseAnnualTotal = numCDI + asset.preRate;
              couponBaseAnnualTotal = accrualBaseAnnualTotal;
           } else if (asset.type === 'IPCA+') {
              // IPCA+ sempre projeta o IPCA + spread para capitalização dinâmica (se não distribuir cupom)
              accrualBaseAnnualTotal = numIPCA + asset.preRate;
              // No cupom de IPCA+ apenas os juros reais são distribuídos
              couponBaseAnnualTotal = asset.preRate;
           } else if (asset.type === 'Prefixado') {
              accrualBaseAnnualTotal = asset.preRate;
              couponBaseAnnualTotal = accrualBaseAnnualTotal;
           }
        }

        // Descobrir o fator de Imposto de Renda (15%)
        // Se isTaxFree é falso (nao marcado), abate 15% na fonte (Multiplica rendimento por 0.85)
        const irMultiplier = (asset.isTaxFree !== false) ? 1 : 0.85;
        
        // 2. Aplicar a frequência com cortes (IR) correspondentes
        // Por padrao, projetamos a rentabilidade num formato "Acréscimo Mês a Mês" caso nao tenha cupom marcado
        if (!asset.couponFrequency) {
           const monthlyAccrualRate = (Math.pow(1 + accrualBaseAnnualTotal / 100, 1 / 12) - 1) * 100;
           monthIncome += asset.amount * ((monthlyAccrualRate / 100) * irMultiplier);
        } else {
           // Tem fluxo de caixa programado
           if (asset.couponFrequency === 'mensal') {
              let periodicYieldRate = 0;
              if (asset.productType === 'Fundos') {
                 periodicYieldRate = couponBaseAnnualTotal / 12; // Linearidade comum em fundos
              } else {
                 periodicYieldRate = (Math.pow(1 + couponBaseAnnualTotal / 100, 1 / 12) - 1) * 100;
              }
              monthIncome += asset.amount * ((periodicYieldRate / 100) * irMultiplier);
              
           } else if (asset.couponFrequency === 'semestral') {
              const baseMonth = asset.couponMonth !== '' ? parseInt(asset.couponMonth) : 0;
              const secondMonth = (baseMonth + 6) % 12;
              
              const mVal = parseInt(m.value);
              // Paga apenas no mes de cupom e na janela + 6 meses
              if (mVal === baseMonth || mVal === secondMonth) {
                 const semiYieldRate = (Math.pow(1 + couponBaseAnnualTotal / 100, 1 / 2) - 1) * 100;
                 monthIncome += asset.amount * ((semiYieldRate / 100) * irMultiplier);
              }
           }
        }
      });
      yearIncome += monthIncome;
      return {
        monthName: m.label,
        income: monthIncome,
        yield: invested > 0 ? (monthIncome / invested) * 100 : 0
      };
    });

    return {
      totalInvested: invested,
      totalCommission: commission,
      averageFee: invested > 0 ? (commission / invested) * 100 : 0,
      allocationData: allocData,
      segmentAllocationData: segAllocData,
      monthlyProjections: projections,
      totalYearIncome: yearIncome,
      averageMonthlyIncome: yearIncome / 12,
      averageMonthlyYield: invested > 0 ? ((yearIncome / 12) / invested) * 100 : 0
    };
  }, [portfolio, monthlyCDI, numIPCA, numCDI]);

  const handleAddAsset = (e) => {
    e.preventDefault();
    if (!assetName || !assetAmount) return;

    let finalContractedRate = assetContractedRate;
    let cdiPercent = 0;
    let preRate = 0;

    // Tratamento Inteligente para CDI, Prefixado e Novos Prefixos (CDI+, IPCA+)
    if (assetType === 'CDI') {
      const rawVal = parseBrFloat(assetContractedRate);
      if (rawVal > 0) {
        cdiPercent = rawVal;
        finalContractedRate = `${rawVal}% do CDI`;
      }
    } else if (assetType === 'CDI+') {
      const rawVal = parseBrFloat(assetContractedRate);
      if (rawVal > 0) {
        cdiPercent = 100; // CDI integral
        preRate = rawVal; // O preRate guarda o spread fixo
        finalContractedRate = `CDI + ${rawVal}%`;
      }
    } else if (assetType === 'Prefixado') {
      const rawVal = parseBrFloat(assetContractedRate);
      if (rawVal > 0) {
        preRate = rawVal;
        finalContractedRate = `${rawVal}% a.a.`;
      }
    } else if (assetType === 'IPCA+') {
      // Extrai apenas os números e decimais para salvar como rentabilidade real, ignorando a palavra IPCA
      const strVal = assetContractedRate.toUpperCase().replace('IPCA', '').replace('+', '').trim();
      const rawVal = parseBrFloat(strVal);
      if (rawVal > 0) {
        preRate = rawVal;
        finalContractedRate = `IPCA + ${rawVal.toString().replace('.', ',')}%`;
      }
    }

    const newAsset = {
      id: editingAssetId || Date.now(),
      name: assetName,
      type: assetType,
      maturity: assetMaturity,
      contractedRate: finalContractedRate,
      cdiPercent: cdiPercent,
      preRate: preRate,
      amount: parseBrFloat(assetAmount),
      yieldRate: parseBrFloat(assetYield) || 0,
      feeRate: parseBrFloat(assetFee),
      couponFrequency: productType === 'Fundos' ? 'mensal' : assetCouponFrequency,
      couponMonth: productType === 'Fundos' ? '' : assetCouponMonth,
      annualCoupon: parseBrFloat(assetAnnualCoupon),
      segment: assetSegment,
      subSegment: assetSubSegment,
      productType: productType,
      isTaxFree: assetIsTaxFree
    };

    if (editingAssetId) {
      setPortfolio(portfolio.map(a => a.id === editingAssetId ? newAsset : a));
    } else {
      setPortfolio([...portfolio, newAsset]);
    }

    cancelEdit();
  };

  const handleEditAsset = (asset) => {
    setProductType(asset.productType || 'Renda Fixa');
    setEditingAssetId(asset.id);
    setAssetName(asset.name);
    setAssetType(asset.type);
    setAssetMaturity(asset.maturity);

    // Recovery of original string format for the rate if possible
    let rateStr = '';
    if (asset.type === 'CDI' && asset.cdiPercent > 0) rateStr = asset.cdiPercent.toString().replace('.', ',');
    else if (asset.type === 'CDI+' && asset.preRate > 0) rateStr = asset.preRate.toString().replace('.', ',');
    else if (asset.type === 'Prefixado' && asset.preRate > 0) rateStr = asset.preRate.toString().replace('.', ',');
    else if (asset.contractedRate) rateStr = asset.contractedRate.replace(/[^0-9,.]/g, '');

    setAssetContractedRate(asset.contractedRate || '');
    setAssetAmount(asset.amount.toString().replace('.', ','));
    setAssetYield(asset.yieldRate > 0 ? formatPercent(asset.yieldRate * 100).replace('%', '') : '');
    setAssetFee(asset.feeRate?.toString().replace('.', ',') || '');
    setAssetCouponFrequency(asset.couponFrequency || '');
    setAssetCouponMonth(asset.couponMonth || '');
    setAssetAnnualCoupon(asset.annualCoupon?.toString().replace('.', ',') || '');
    setAssetSegment(asset.segment || '');
    setAssetSubSegment(asset.subSegment || '');
    setAssetIsTaxFree(asset.isTaxFree !== false);

    // Scroll suavemente para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingAssetId(null);
    setAssetName('');
    setAssetType('CDI');
    setAssetMaturity('');
    setAssetContractedRate('');
    setAssetAmount('');
    setAssetYield('');
    setAssetFee('');
    setAssetCouponFrequency('');
    setAssetCouponMonth('');
    setAssetAnnualCoupon('');
    setAssetSegment('');
    setAssetSubSegment('');
    setAssetIsTaxFree(true);
  };

  const handleRemoveAsset = (id) => {
    setPortfolio(portfolio.filter(asset => asset.id !== id));
  };

  // Handler para Modo Apresentação com trava de segurança
  const handleTogglePresentation = () => {
    if (isPresentationMode) {
      // Ao SAIR do modo apresentação, sempre reativar o blur de privacidade
      setIsPrivacyMode(true);
    }
    setIsPresentationMode(!isPresentationMode);
  };

  // Gamificação: ROA da Alocação (Alvo 0,80%)
  const roaTarget = 0.80;
  const progressPercent = Math.min((averageFee / roaTarget) * 100, 100);

  // Classe CSS utilitária para borrar os dados sensíveis (Filtro mais forte e bloqueio de interações)
  const privacyBlur = isPrivacyMode ? "blur-[12px] select-none opacity-30 transition-all duration-300 pointer-events-none" : "transition-all duration-300";

  // Lógica de cálculo em tempo real para o Formulário (Auto-preenchimento)
  let isAutoYield = false;
  let displayYield = assetYield;

  if (assetType === 'CDI') {
    isAutoYield = true;
    const cdiVal = parseBrFloat(assetContractedRate);
    if (cdiVal > 0) {
      const equivYield = (Math.pow(1 + (numCDI * (cdiVal / 100)) / 100, 1 / 12) - 1) * 100;
      displayYield = formatPercent(equivYield);
    } else displayYield = '';
  } else if (assetType === 'CDI+') {
    isAutoYield = true;
    const spreadVal = parseBrFloat(assetContractedRate);
    if (spreadVal > 0) {
      const annualTotal = numCDI + spreadVal;
      const equivYield = (Math.pow(1 + annualTotal / 100, 1 / 12) - 1) * 100;
      displayYield = formatPercent(equivYield);
    } else {
      displayYield = '';
    }
  } else if (assetType === 'Prefixado') {
    isAutoYield = true;
    const preVal = parseBrFloat(assetContractedRate);
    if (parseBrFloat(assetAnnualCoupon) > 0) {
      displayYield = 'Via Cupons';
    } else if (preVal > 0) {
      const monthlyPre = (Math.pow(1 + preVal / 100, 1 / 12) - 1) * 100;
      displayYield = formatPercent(monthlyPre);
    } else {
      displayYield = '';
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 md:p-6 lg:p-8">

      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <div className="bg-yellow-500 text-zinc-950 p-1.5 rounded-md">
              <TrendingUp size={24} strokeWidth={3} />
            </div>
            EUROSTOCK
            <span className="text-xl font-light text-zinc-500 ml-2 tracking-normal hidden sm:inline-block">| Simulador</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1.5 ml-1">Ferramenta de estruturação de carteiras</p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-4">

          {/* Inputs CDI e IPCA Referência */}
          <div className="flex items-center gap-4 mr-4 hidden sm:flex">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">CDI Base Simulação</span>
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 shadow-inner">
                <input
                  type="text"
                  value={referenceCDI}
                  onChange={(e) => setReferenceCDI(e.target.value)}
                  className="w-16 bg-transparent text-yellow-500 font-bold text-lg focus:outline-none text-right"
                />
                <span className="text-sm font-medium text-zinc-400">% a.a.</span>
              </div>
            </div>
            <div className="flex flex-col items-end border-l border-zinc-800 pl-4">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">IPCA Base Simulação</span>
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 shadow-inner">
                <input
                  type="text"
                  value={referenceIPCA}
                  onChange={(e) => setReferenceIPCA(e.target.value)}
                  className="w-16 bg-transparent text-yellow-500 font-bold text-lg focus:outline-none text-right"
                />
                <span className="text-sm font-medium text-zinc-400">% a.a.</span>
              </div>
            </div>
          </div>

          <div className="text-right border-l border-zinc-800 pl-4 hidden md:block">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Patrimônio Total</p>
            <p className="text-2xl font-light text-white">{formatCurrency(totalInvested)}</p>
          </div>

          {/* Botão de Fechar e Modo Apresentação */}
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={handleTogglePresentation}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all shadow-lg ${isPresentationMode
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                : 'bg-yellow-500 hover:bg-yellow-400 text-zinc-950'
                }`}
            >
              {isPresentationMode ? <EyeOff size={20} /> : <Monitor size={20} />}
              {isPresentationMode ? 'Sair da Apresentação' : 'Modo Apresentação'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all shadow-lg bg-zinc-800 hover:bg-red-500 text-zinc-300 hover:text-white border border-zinc-700"
              >
                <X size={20} />
                Fechar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* =========================================
            COLUNA 1: ASSESSOR (Esquerda)
        ========================================= */}
        {!isPresentationMode && (
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-zinc-900 border border-yellow-500/20 rounded-xl p-5 shadow-lg relative overflow-hidden">

              <div className="flex justify-between items-center mb-4 relative z-10">
                <h2 className="text-lg font-semibold text-yellow-500 flex items-center gap-2">
                  <User size={20} />
                  Visão do Assessor
                </h2>
                <button
                  onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                  className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-700"
                  title={isPrivacyMode ? "Revelar dados" : "Ocultar dados"}
                >
                  {isPrivacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Container com Blur aplicado a todo o conteúdo sensível */}
              <div className={privacyBlur}>
                <div className="mb-6 relative z-10">
                  <p className="text-sm text-zinc-400 mb-1">Receita Gerada (Comissão Total)</p>
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(totalCommission)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                  <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-800">
                    <p className="text-xs text-zinc-400 mb-1">ROA (Fee Médio)</p>
                    <p className="text-lg font-semibold text-yellow-400">
                      {formatPercent(averageFee)}
                    </p>
                  </div>
                  <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-800">
                    <p className="text-xs text-zinc-400 mb-1">Nº de Ativos</p>
                    <p className="text-lg font-semibold text-white">{portfolio.length}</p>
                  </div>
                </div>

                {/* Gamificação / ROA */}
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 relative z-10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Medal size={14} className="text-yellow-500" /> ROA da Alocação
                    </span>
                    <span className="text-xs text-white font-medium">
                      {formatPercent(averageFee)}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 mb-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${averageFee >= 0.80 ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-zinc-500 text-right">Alvo: 0,80%</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =========================================
            COLUNA 2: ÁREA DE TRABALHO (Centro)
        ========================================= */}
        <div className={`space-y-6 ${isPresentationMode ? 'lg:col-span-7' : 'lg:col-span-6'}`}>

          {/* Formulário de Inserção */}
          {!isPresentationMode && (
            <div className={`bg-zinc-900 border ${editingAssetId ? 'border-blue-500/50 shadow-blue-500/10' : 'border-zinc-800'} rounded-xl p-5 shadow-lg relative transition-all duration-300`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  {editingAssetId ? (
                    <>
                      <Edit2 size={20} className="text-blue-500" />
                      Editar Ativo
                    </>
                  ) : (
                    <>
                      <Plus size={20} className="text-yellow-500" />
                      Adicionar Ativo
                    </>
                  )}
                </h2>

                {!editingAssetId && (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
                      title="Baixar planilha modelo vazia"
                    >
                      <Download size={14} />
                      Modelo
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadPortfolio}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-blue-600/20 hover:text-blue-400 hover:border-blue-500/30 border border-zinc-700 transition-colors"
                      title="Exportar carteira atual para Excel"
                    >
                      <Download size={14} />
                      Exportar
                    </button>
                    <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 border border-yellow-500/30 cursor-pointer transition-colors" title="Fazer upload de uma carteira">
                      <Upload size={14} />
                      Upload Carteira
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Seletor Categoria de Produto (Abas) */}
              <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 mb-6 w-max">
                {['Renda Fixa', 'Fundos'].map(tipo => (
                  <button
                    key={tipo}
                    onClick={() => setProductType(tipo)}
                    className={`px-6 py-2 rounded-md text-sm font-bold uppercase transition-all ${productType === tipo
                      ? 'bg-zinc-800 text-yellow-500 shadow-sm border border-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAddAsset} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs text-zinc-400 mb-1">Nome do Produto</label>
                    <input
                      type="text"
                      value={assetName}
                      onChange={(e) => setAssetName(e.target.value)}
                      placeholder="Ex: CRA BRF"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Indexador</label>
                    <select
                      value={assetType}
                      onChange={(e) => setAssetType(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    >
                      <option value="CDI">CDI</option>
                      <option value="CDI+">CDI+</option>
                      <option value="IPCA+">IPCA+</option>
                      <option value="Prefixado">Prefixado</option>
                      <option value="FIIs">FIIs</option>
                      <option value="Ações">Ações</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Vencimento</label>
                    <input
                      type="text"
                      value={assetMaturity}
                      onChange={(e) => setAssetMaturity(e.target.value)}
                      onBlur={handleMaturityBlur}
                      placeholder="MM/AAAA"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      {assetType === 'CDI' ? '% do CDI' : assetType === 'Prefixado' ? 'Taxa a.a. (%)' : assetType === 'IPCA+' ? 'Taxa Fixa IPCA+ (%)' : assetType === 'CDI+' ? 'Taxa Fixa CDI+ (%)' : 'Taxa Contratada'}
                    </label>
                    <input
                      type="text"
                      value={assetContractedRate}
                      onChange={(e) => setAssetContractedRate(e.target.value)}
                      onBlur={handleContractedRateBlur}
                      placeholder={assetType === 'CDI' ? "Ex: 115" : assetType === 'Prefixado' ? "Ex: 12,50" : assetType === 'CDI+' ? "Ex: 1,50" : "Ex: 7,50"}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Valor Alocado (R$)</label>
                    <input
                      type="text"
                      value={assetAmount}
                      onChange={(e) => setAssetAmount(e.target.value)}
                      placeholder="50000"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>
                  <div className={privacyBlur}>
                    <label className="block text-xs text-yellow-500/80 mb-1">Fee Comissão (%)</label>
                    <input
                      type="text"
                      value={assetFee}
                      onChange={(e) => setAssetFee(e.target.value)}
                      onBlur={handleFeeBlur}
                      placeholder="1,50"
                      className="w-full bg-zinc-950 border border-yellow-500/50 rounded-lg px-3 py-2 text-sm text-yellow-500 focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>
                  {/* Campo Rend. Mensal removido conforme solicitado */}
                </div>

                <div className="mt-2 flex items-center justify-end mb-4 pr-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={assetIsTaxFree}
                      onChange={(e) => setAssetIsTaxFree(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-zinc-950" 
                    />
                    <span className="text-sm text-zinc-400 group-hover:text-white transition-colors tracking-wide">Produto Isento de IR? (Não bate 15%)</span>
                  </label>
                </div>

                {/* Setor e Segmento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Setor</label>
                    <select
                      value={assetSegment}
                      onChange={(e) => setAssetSegment(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    >
                      <option value="">Selecione o setor</option>
                      {(productType === 'Fundos' ? FUNDOS_SEGMENTS : RENDA_FIXA_SEGMENTS).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Segmento</label>
                    <select
                      value={assetSubSegment}
                      onChange={(e) => setAssetSubSegment(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    >
                      <option value="">Selecione o segmento</option>
                      {['Bancários', 'Títulos Públicos'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Cupons */}
                {productType === 'Renda Fixa' ? (
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                    <p className="text-xs text-zinc-400 mb-3">Cupons e Pagamentos</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Frequência</label>
                        <div className="flex gap-3 mt-1">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="couponFreq"
                              value="mensal"
                              checked={assetCouponFrequency === 'mensal'}
                              onChange={(e) => setAssetCouponFrequency(e.target.value)}
                              className="accent-yellow-500"
                            />
                            <span className="text-xs text-zinc-300">Mensal</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="couponFreq"
                              value="semestral"
                              checked={assetCouponFrequency === 'semestral'}
                              onChange={(e) => setAssetCouponFrequency(e.target.value)}
                              className="accent-yellow-500"
                            />
                            <span className="text-xs text-zinc-300">Semestral</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Mês Base Pgto</label>
                        <select
                          value={assetCouponMonth}
                          onChange={(e) => setAssetCouponMonth(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                        >
                          <option value="">Nenhum</option>
                          {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                      </div>
                      {/* O campo de Cupom Anual para Renda Fixa foi removido para evitar duplicidade. A taxa contratada agora alimenta os pagamentos diretos na janela do fluxo de freq. */}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                    <p className="text-xs text-zinc-400 mb-3">Dividend Yield</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Frequência</label>
                        <p className="text-sm text-zinc-300 py-1.5 px-2 bg-zinc-900/50 rounded-lg border border-zinc-800/50 mt-1">Mensal (Padrão)</p>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Dividend Yield Anual (%)</label>
                        <input
                          type="text"
                          value={assetAnnualCoupon}
                          onChange={(e) => setAssetAnnualCoupon(e.target.value)}
                          onBlur={handleAnnualCouponBlur}
                          placeholder="Ex: 10,50"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <button
                    type="submit"
                    className={`flex-1 ${editingAssetId ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-yellow-500 hover:bg-yellow-400 text-zinc-950'} font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2`}
                  >
                    {editingAssetId ? <Check size={18} /> : <Plus size={18} />}
                    {editingAssetId ? 'Salvar Alterações' : 'Incluir na Carteira'}
                  </button>

                  {editingAssetId && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border border-zinc-700"
                    >
                      <X size={18} />
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Lista de Ativos */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h3 className="text-md font-semibold text-white">Composição Atual</h3>
                {portfolio.length > 0 && !isPresentationMode && (
                  <button 
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja limpar todos os ativos da carteira?')) {
                        setPortfolio([]);
                      }
                    }} 
                    className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 border border-red-900/30 bg-red-900/10 px-2 py-1 rounded"
                    title="Remover todos os ativos"
                  >
                    <Trash2 size={14} /> Limpar Tudo
                  </button>
                )}
              </div>
              <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-md">{portfolio.length} ativos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-500 border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ativo / Venc.</th>
                    <th className="px-4 py-3 font-medium">Taxa</th>
                    <th className="px-4 py-3 font-medium text-right">Valor</th>
                    <th className="px-4 py-3 font-medium text-right">Janelas / Renda</th>

                    {/* Oculta FEE e Ação no modo apresentação */}
                    {!isPresentationMode && <th className={`px-4 py-3 font-medium text-right text-zinc-600 text-[10px] ${privacyBlur}`}>FEE</th>}
                    {!isPresentationMode && <th className="px-4 py-3 font-medium text-center">Ação</th>}
                  </tr>
                </thead>
                <tbody>
                  {portfolio.length === 0 ? (
                    <tr>
                      <td colSpan={isPresentationMode ? "4" : "6"} className="px-4 py-8 text-center text-zinc-500">
                        Nenhum ativo adicionado. Comece a montar a carteira.
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      const getAssetCategory = (asset) => {
                        if (asset.productType === 'Fundos') return 'Fundos';
                        const upperName = (asset.name || '').toUpperCase();
                        if (asset.subSegment === 'Títulos Públicos' || asset.segment === 'Títulos Públicos' || upperName.includes('NTN') || upperName.includes('LTN') || upperName.includes('LFT') || upperName.includes('TESOURO')) {
                           return 'Títulos Públicos';
                        }
                        if (asset.subSegment === 'Bancários' || asset.segment === 'Bancários' || upperName.includes('CDB') || upperName.includes('LCI') || upperName.includes('LCA') || upperName.includes('CDCA') || (upperName.includes('LF') && !upperName.includes('LFT'))) {
                           return 'Ativos Bancários';
                        }
                        return 'Crédito Privado';
                      };

                      const CATEGORY_ORDER = ['Ativos Bancários', 'Crédito Privado', 'Títulos Públicos', 'Fundos'];

                      return CATEGORY_ORDER.map(cat => {
                        const catAssets = portfolio.filter(a => getAssetCategory(a) === cat);
                        if (catAssets.length === 0) return null;

                        return (
                          <React.Fragment key={cat}>
                            {/* Cabeçalho da Categoria Sempre Visível para melhor organização, mas especialmente focado na apresentação */}
                            <tr className="bg-zinc-950 border-y border-zinc-800">
                              <td colSpan={isPresentationMode ? "4" : "6"} className="px-4 py-2 text-[10px] font-black text-yellow-500 uppercase tracking-widest opacity-80">
                                {cat}
                              </td>
                            </tr>
                            {catAssets.map((asset) => {
                              // LÓGICA DE EXIBIÇÃO DA TABELA (Sincronizada com o Gráfico)
                              let baseAnnualTotal = 0;
                      if (asset.productType === 'Fundos') {
                         baseAnnualTotal = asset.annualCoupon > 0 ? asset.annualCoupon : 0;
                      } else {
                         if (asset.type === 'CDI') {
                            baseAnnualTotal = numCDI * (asset.cdiPercent > 0 ? (asset.cdiPercent / 100) : 1);
                         } else if (asset.type === 'CDI+') {
                            baseAnnualTotal = numCDI + asset.preRate;
                         } else if (asset.type === 'IPCA+') {
                            // IPCA+ sempre projeta o IPCA + spread para simulação dinâmica
                            baseAnnualTotal = numIPCA + asset.preRate;
                         } else if (asset.type === 'Prefixado') {
                            baseAnnualTotal = asset.preRate;
                         }
                      }

                      const irMultiplier = (asset.isTaxFree !== false) ? 1 : 0.85;
                      
                      let currentEffectiveYield = 0;
                      let couponLabel = '';
                      let couponPerPeriodRate = 0;

                      if (!asset.couponFrequency) {
                         // Apenas projeta um ganho mês a mês (Acréscimo virtual)
                         currentEffectiveYield = (Math.pow(1 + baseAnnualTotal / 100, 1 / 12) - 1) * 100;
                         currentEffectiveYield = currentEffectiveYield * irMultiplier;
                      } else {
                         // Exibição de Cupons com Frequência Literal
                         if (asset.couponFrequency === 'mensal') {
                            if (asset.productType === 'Fundos') {
                               couponPerPeriodRate = baseAnnualTotal / 12; // Linear para FII
                            } else {
                               couponPerPeriodRate = (Math.pow(1 + baseAnnualTotal / 100, 1 / 12) - 1) * 100;
                            }
                            couponPerPeriodRate = couponPerPeriodRate * irMultiplier;
                            couponLabel = `Mensal: ${formatPercent(couponPerPeriodRate)}`;
                         } else if (asset.couponFrequency === 'semestral') {
                            couponPerPeriodRate = (Math.pow(1 + baseAnnualTotal / 100, 1 / 2) - 1) * 100;
                            couponPerPeriodRate = couponPerPeriodRate * irMultiplier;

                            const baseM = asset.couponMonth !== '' ? parseInt(asset.couponMonth) : 0;
                            const m2 = (baseM + 6) % 12;
                            couponLabel = `Sem: ${MONTHS[baseM]?.label?.substring(0, 3)}/${MONTHS[m2]?.label?.substring(0, 3)}`;
                         }
                      }

                      return (
                        <tr key={asset.id} className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-zinc-200">{asset.name}</p>
                            <p className="text-xs text-zinc-500">{asset.type} {asset.maturity ? `• Venc: ${asset.maturity}` : ''}{asset.segment ? ` • ${asset.segment}` : ''}{asset.subSegment ? ` • ${asset.subSegment}` : ''}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium text-zinc-300 bg-zinc-800 px-2 py-1 rounded">{asset.contractedRate || '-'}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-zinc-300 font-medium">
                            {formatCurrency(asset.amount)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {/* Mostra Renda Mensal fixa ou Projetada pelo CDI */}
                            {currentEffectiveYield > 0 && !couponLabel && (
                              <div className="mb-1 group relative">
                                <p className="text-xs font-medium text-green-400/90">{formatPercent(currentEffectiveYield)} ao mês</p>
                                <p className="text-xs text-zinc-500">({formatCurrency(asset.amount * (currentEffectiveYield / 100))})</p>
                                {asset.isTaxFree === false && <span className="absolute -top-4 -right-1 text-[8px] text-zinc-500 bg-zinc-800 px-1 border border-zinc-700 rounded z-10">Liq. 15% IR</span>}
                              </div>
                            )}

                            {couponLabel && (
                              <div className="mb-1 group relative">
                                <p className="text-xs font-medium text-green-400/90">{couponLabel}</p>
                                {couponPerPeriodRate > 0 && (
                                  <p className="text-xs text-zinc-500">({formatCurrency(asset.amount * (couponPerPeriodRate / 100))})</p>
                                )}
                                {asset.isTaxFree === false && <span className="absolute -top-4 -right-1 text-[8px] text-zinc-500 bg-zinc-800 px-1 border border-zinc-700 rounded z-10">Liq. 15% IR</span>}
                              </div>
                            )}

                            {!currentEffectiveYield && !couponLabel && <p className="text-xs text-zinc-600">-</p>}
                          </td>

                          {/* Oculta FEE e Ação no modo apresentação */}
                          {!isPresentationMode && (
                            <td className="px-4 py-3 text-right">
                              <p className={`text-zinc-600 text-xs font-medium ${privacyBlur}`}>
                                {formatPercent(asset.feeRate)}
                              </p>
                            </td>
                          )}
                          {!isPresentationMode && (
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center items-center gap-1">
                                <button
                                  onClick={() => handleEditAsset(asset)}
                                  className="text-zinc-500 hover:text-blue-400 transition-colors p-1"
                                  title="Editar ativo"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleRemoveAsset(asset.id)}
                                  className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                                  title="Remover ativo"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          )}
                            </tr>
                          )
                        })}
                      </React.Fragment>
                    )
                  })
                })()
              )}
              </tbody>
              </table>
            </div>
          </div>

          {/* Gráfico de Barras de Fluxo Mensal (Agora embaixo da Composição Atual) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-md font-semibold text-white flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-green-400" />
              Fluxo de Pagamentos Mensal
            </h3>
            <div className="h-64 w-full bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyProjections} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="monthName"
                    tickFormatter={(val) => val.substring(0, 3).toUpperCase()}
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    tickFormatter={(val) => `R$ ${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartsTooltip
                    formatter={(value) => [formatCurrency(value), 'Proventos']}
                    labelFormatter={(label) => `Mês: ${label}`}
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                    itemStyle={{ color: '#4ade80' }}
                    cursor={{ fill: '#27272a', opacity: 0.4 }}
                  />
                  <Bar
                    dataKey="income"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* =========================================
            COLUNA 3: CLIENTE (Direita)
        ========================================= */}
        <div className={`space-y-6 ${isPresentationMode ? 'lg:col-span-5' : 'lg:col-span-3'}`}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg relative h-full">

            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
              <TrendingUp size={20} className="text-yellow-500" />
              Visão do Cliente
            </h2>

            {/* Tabela de Projeção Mensal (Inspirada no CSV) */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-3">
                <DollarSign size={16} className="text-green-400" />
                Projeção de Renda
              </h3>

              <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-900 text-zinc-500 uppercase">
                    <tr>
                      <th className="px-3 py-2 font-medium">Mês</th>
                      <th className="px-3 py-2 font-medium text-right">Proventos</th>
                      <th className="px-3 py-2 font-medium text-right">Retorno</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {monthlyProjections.map((proj, i) => (
                      <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-3 py-2">{proj.monthName.substring(0, 3).toUpperCase()}</td>
                        <td className="px-3 py-2 text-right text-green-400 font-medium">
                          {formatCurrency(proj.income)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatPercent(proj.yield)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-900 border-t border-zinc-700 font-medium text-sm">
                    <tr>
                      <td className="px-3 py-2 text-zinc-400">Total Ano</td>
                      <td className="px-3 py-2 text-right text-white">{formatCurrency(totalYearIncome)}</td>
                      <td className="px-3 py-2 text-right text-zinc-500">-</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-yellow-500">Média/Mês</td>
                      <td className="px-3 py-2 text-right text-yellow-500">{formatCurrency(averageMonthlyIncome)}</td>
                      <td className="px-3 py-2 text-right text-yellow-500">{formatPercent(averageMonthlyYield)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Gráfico de Alocação por Indexador */}
            <div>
              <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-4">
                <PieChartIcon size={16} className="text-yellow-500" />
                Distribuição por Indexador
              </h3>

              {portfolio.length > 0 ? (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 w-full flex items-center justify-center text-zinc-600 text-sm border border-dashed border-zinc-700 rounded-lg">
                  Sem dados para o gráfico
                </div>
              )}

              {/* Legenda Manual Personalizada */}
              <div className="mt-4 space-y-2">
                {allocationData.map((entry, index) => (
                  <div key={index} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-zinc-300">{entry.name}</span>
                    </div>
                    <span className="text-zinc-400 font-medium">
                      {((entry.value / totalInvested) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráfico de Setor */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-4">
                <PieChartIcon size={16} className="text-green-400" />
                Distribuição por Setor
              </h3>

              {segmentAllocationData.length > 0 ? (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={segmentAllocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {segmentAllocationData.map((entry, index) => (
                          <Cell key={`seg-cell-${index}`} fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 w-full flex items-center justify-center text-zinc-600 text-sm border border-dashed border-zinc-700 rounded-lg">
                  Sem dados de segmento
                </div>
              )}

              {/* Legenda Segmentos */}
              <div className="mt-4 space-y-2">
                {segmentAllocationData.map((entry, index) => (
                  <div key={index} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length] }}></div>
                      <span className="text-zinc-300">{entry.name}</span>
                    </div>
                    <span className="text-zinc-400 font-medium">
                      {((entry.value / totalInvested) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo Geral */}
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-4">
                <Briefcase size={16} className="text-yellow-500" />
                Resumo Geral
              </h3>
              <div className="space-y-3">
                {allocationData.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center">Nenhuma alocação.</p>
                ) : (
                  allocationData.map((entry, index) => (
                    <div key={index} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <p className="text-sm font-medium text-zinc-200">{entry.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{formatCurrency(entry.value)}</p>
                        <p className="text-xs text-zinc-500">
                          {((entry.value / totalInvested) * 100).toFixed(1)}% da carteira
                        </p>
                      </div>
                    </div>
                  ))
                )}

                {/* Total Alocado */}
                {allocationData.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-zinc-800 flex justify-between items-center">
                    <span className="text-sm font-semibold text-zinc-400">Total Alocado</span>
                    <span className="text-lg font-bold text-yellow-500">{formatCurrency(totalInvested)}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
