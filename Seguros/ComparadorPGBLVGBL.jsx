import React, { useState } from 'react';
import { 
  LayoutGrid, 
  Settings, 
  Info,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

export default function ComparadorPGBLVGBL({ onClose }) {
  // 1. Regras de Entrada (Variáveis do Simulador)
  const [rendaAnual, setRendaAnual] = useState(50000);
  const [aporte, setAporte] = useState(6000);
  const [anos, setAnos] = useState(40);
  const [taxaAno, setTaxaAno] = useState(8);
  const [tributacao, setTributacao] = useState('regressiva'); // 'regressiva' | 'progressiva'
  const [declaracao, setDeclaracao] = useState('completa'); // 'completa' | 'simplificada'

  // Theme colors
  const theme = {
    bgMain: 'bg-[#0F1115]',
    bgCard: 'bg-[#1A1C23]',
    bgCardHover: 'hover:bg-[#22252e]',
    accent: 'text-[#F2C94C]',
    accentBg: 'bg-[#F2C94C]',
    accentBorder: 'border-[#F2C94C]',
    textMain: 'text-white',
    textMuted: 'text-[#8E93A3]',
    borderDark: 'border-[#2A2D35]',
    success: 'text-emerald-400',
    danger: 'text-red-400'
  };

  // --- 2. Regras de Cálculo e Lógica ---
  const taxaDecimal = taxaAno / 100;

  // Verificação da Trava de 12% (PGBL)
  const limitePGBL = rendaAnual * 0.12;
  const percentualAporte = (aporte / rendaAnual) * 100;
  const ultrapassouLimite = percentualAporte > 12;
  
  // Benefício Fiscal: Apenas na declaração completa e limitado a 12%
  const temBeneficio = declaracao === 'completa';
  const deducaoEfetiva = temBeneficio ? Math.min(aporte, limitePGBL) : 0;
  const restituicaoAnual = deducaoEfetiva * 0.275; 

  // Variáveis Acumuladoras
  let montanteBrutoFundo = 0; // O fundo em si cresce igual para PGBL e VGBL
  let totalInvestido = 0;
  
  let irFundoVGBL = 0;
  let irFundoPGBL = 0;

  let montanteRestituicaoReinvestida = 0;
  let irRestituicao = 0;

  // Fase de Acumulação e Tributação (Ano a Ano)
  for (let ano = 1; ano <= anos; ano++) {
    const tempo = anos - ano + 1; 
    const fator = Math.pow(1 + taxaDecimal, tempo);

    // Crescimento do Aporte no Fundo
    const vfAporte = aporte * fator;
    const lucroAno = vfAporte - aporte;

    // Crescimento da Restituição (Se reinvestida)
    const vfRestituicao = restituicaoAnual * fator;
    const lucroRestAno = vfRestituicao - restituicaoAnual;

    // 3. Tabelas de Tributação (Regras de Saída)
    let aliquota = 0.15; // Tabela Progressiva (15% retido na fonte conforme regra)
    
    if (tributacao === 'regressiva') {
      if (tempo > 10) aliquota = 0.10;
      else if (tempo > 8) aliquota = 0.15;
      else if (tempo > 6) aliquota = 0.20;
      else if (tempo > 4) aliquota = 0.25;
      else if (tempo > 2) aliquota = 0.30;
      else aliquota = 0.35;
    }

    // Acumulação Bruta
    montanteBrutoFundo += vfAporte;
    totalInvestido += aporte;

    // Tributação VGBL: Incide apenas sobre os rendimentos (lucro)
    irFundoVGBL += lucroAno * aliquota; 

    // Tributação PGBL: Incide sobre o valor total (principal + rendimentos)
    irFundoPGBL += vfAporte * aliquota; 

    // Tributação da Restituição (Tratada como um investimento à parte, taxada no lucro)
    montanteRestituicaoReinvestida += vfRestituicao;
    irRestituicao += lucroRestAno * aliquota; 
  }

  // --- RESULTADOS FINAIS ---
  const lucroTotalFundo = montanteBrutoFundo - totalInvestido;
  
  // VGBL Líquido
  const liquidoFundoVGBL = montanteBrutoFundo - irFundoVGBL;
  const aliquotaEfetivaVGBL = lucroTotalFundo > 0 ? (irFundoVGBL / lucroTotalFundo) * 100 : 0;
  const patrimonioTotalVGBL = liquidoFundoVGBL; // VGBL não tem restituição extra

  // PGBL Líquido
  const liquidoFundoPGBL = montanteBrutoFundo - irFundoPGBL;
  const aliquotaEfetivaPGBL = montanteBrutoFundo > 0 ? (irFundoPGBL / montanteBrutoFundo) * 100 : 0;
  const liquidoRestituicaoTotal = montanteRestituicaoReinvestida - irRestituicao;
  
  // O Patrimônio Final do PGBL = O Fundo + O que você lucrou reinvestindo o troco do leão
  const patrimonioTotalPGBL = liquidoFundoPGBL + liquidoRestituicaoTotal;

  // Verificação de Vencedor Baseado Estritamente no Patrimônio Líquido Final
  const vgblVenceu = patrimonioTotalVGBL > patrimonioTotalPGBL;

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className={`absolute inset-0 z-50 w-full h-full min-h-screen ${theme.bgMain} ${theme.textMain} font-sans flex flex-col items-center py-12 px-4 md:px-8 overflow-y-auto`}>

      {/* Brand Header Minimalista */}
      <div className="mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-500 relative w-full max-w-6xl flex justify-center items-center">
          {onClose && (
              <button
                  onClick={onClose}
                  className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                  <ArrowLeft size={20} />
                  <span className="text-sm font-medium hidden sm:block">Voltar ao Hub</span>
              </button>
          )}
          <div>
              <h1 className="text-3xl font-bold tracking-wider">
                  EURO<span className={theme.accent}>STOCK</span>
              </h1>
              <p className={`text-xs ${theme.textMuted} tracking-widest mt-1`}>INVESTIMENTOS</p>
          </div>
      </div>

      <div className="w-full max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-500">
        
        {/* Header - substituindo pelo layout antigo + novo */}
        <div className="mb-8 border-b border-[#2A2D35] pb-6">
          <h2 className="text-3xl font-bold flex items-center text-white">
            <Scale className={`${theme.accent} mr-3`} size={32} />
            Comparador PGBL vs VGBL
          </h2>
          <p className={`${theme.textMuted} mt-2`}>Fases: Aporte, Acumulação e Resgate. Baseado nas regras oficiais de tributação e dedução do IRPF.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
          
          {/* COLUNA ESQUERDA: CONTROLES */}
          <div className="lg:col-span-4 space-y-6">
            <div className={`${theme.bgCard} p-6 rounded-xl border ${theme.borderDark} shadow-lg`}>
              <h3 className={`text-lg font-semibold mb-6 pb-4 border-b ${theme.borderDark} flex items-center`}>
                <Settings className="w-5 h-5 mr-2" /> 1. Regras de Entrada
              </h3>
              
              <div className="space-y-6">
                
                {/* Modelo de Declaração */}
                <div>
                  <label className={`text-sm font-medium ${theme.textMuted} mb-3 block`}>Declaração do IRPF</label>
                  <div className="flex bg-[#0F1115] p-1 rounded-lg border border-[#2A2D35]">
                    <button 
                      onClick={() => setDeclaracao('completa')}
                      className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${declaracao === 'completa' ? 'bg-[#F2C94C] text-black shadow-md' : 'text-[#8E93A3] hover:text-white'}`}
                    >
                      Completa
                    </button>
                    <button 
                      onClick={() => setDeclaracao('simplificada')}
                      className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${declaracao === 'simplificada' ? 'bg-[#F2C94C] text-black shadow-md' : 'text-[#8E93A3] hover:text-white'}`}
                    >
                      Simplificada
                    </button>
                  </div>
                </div>

                {/* Tabela de Tributação */}
                <div>
                  <label className={`text-sm font-medium ${theme.textMuted} mb-3 block`}>Tabela de Tributação</label>
                  <div className="flex bg-[#0F1115] p-1 rounded-lg border border-[#2A2D35]">
                    <button 
                      onClick={() => setTributacao('regressiva')}
                      className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${tributacao === 'regressiva' ? 'bg-[#2A2D35] text-white shadow-md' : 'text-[#8E93A3] hover:text-white'}`}
                    >
                      Regressiva
                    </button>
                    <button 
                      onClick={() => setTributacao('progressiva')}
                      className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${tributacao === 'progressiva' ? 'bg-[#2A2D35] text-white shadow-md' : 'text-[#8E93A3] hover:text-white'}`}
                    >
                      Progressiva
                    </button>
                  </div>
                </div>

                <InputRange 
                  label="Renda Bruta Tributável (R$)" 
                  value={rendaAnual} 
                  min={50000} max={500000} step={5000}
                  onChange={setRendaAnual} 
                  theme={theme} 
                  format={formatCurrency}
                />
                <InputRange 
                  label="Aporte Anual (R$)" 
                  value={aporte} 
                  min={1000} max={rendaAnual * 0.5} step={1000}
                  onChange={setAporte} 
                  theme={theme} 
                  format={formatCurrency}
                />
                <InputRange 
                  label="Prazo do Investimento (Anos)" 
                  value={anos} 
                  min={1} max={40} step={1}
                  onChange={setAnos} 
                  theme={theme} 
                  format={(v) => `${v} anos`}
                />
                <InputRange 
                  label="Rentabilidade Estimada (% a.a.)" 
                  value={taxaAno} 
                  min={2} max={15} step={0.5}
                  onChange={setTaxaAno} 
                  theme={theme} 
                  format={(v) => `${v}% a.a.`}
                />
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: RESULTADOS MATEMÁTICOS */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Alertas Inteligentes */}
            <div className="space-y-4">
              {!temBeneficio && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start text-sm">
                  <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-red-400" />
                  <div className="text-white">
                    <strong className="text-red-400 block mb-1">Cuidado com o PGBL!</strong>
                    No modelo <strong>Simplificado</strong>, você não tem benefício fiscal. Ao colocar dinheiro num PGBL, você pagará imposto sobre o principal sem receber nada em troca. <strong>O VGBL tem vantagem absoluta.</strong>
                  </div>
                </div>
              )}
              {temBeneficio && ultrapassouLimite && (
                <div className="bg-[#F2C94C]/10 border border-[#F2C94C]/30 p-4 rounded-xl flex items-start text-sm">
                  <Info className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-[#F2C94C]" />
                  <div className="text-white">
                    <strong className="text-[#F2C94C] block mb-1">Atenção ao limite de 12%!</strong>
                    O seu aporte representa {percentualAporte.toFixed(1)}% da renda. O excedente não gera benefício no PGBL, mas será tributado no total. O <strong>VGBL costuma vencer</strong> matematicamente nessa situação.
                  </div>
                </div>
              )}
            </div>

            {/* Cards de Comparação (Quebra de Fases) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card PGBL */}
              <div className={`${theme.bgCard} p-6 rounded-xl border ${!vgblVenceu ? theme.accentBorder + ' shadow-[0_0_15px_rgba(242,201,76,0.15)]' : theme.borderDark} relative transition-all duration-300`}>
                {!vgblVenceu && (
                   <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${theme.accentBg} text-black text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md z-10`}>
                      Patrimônio Final Maior
                   </div>
                )}
                <h4 className="text-xl font-bold text-white mt-2">PGBL</h4>
                <p className={`text-xs ${theme.textMuted} mb-6`}>Imposto incide sobre o Total (Principal + Lucro).</p>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center text-[#E2E8F0]">
                    <span>Fundo Bruto (Acumulado)</span>
                    <span className="font-semibold">{formatCurrency(montanteBrutoFundo)}</span>
                  </div>
                  <div className="flex justify-between items-center text-red-400 pb-3 border-b border-[#2A2D35]">
                    <span>IR Retido (Média {aliquotaEfetivaPGBL.toFixed(1)}%)</span>
                    <span className="font-semibold">-{formatCurrency(irFundoPGBL)}</span>
                  </div>
                  
                  {/* O LÍQUIDO DO FUNDO (Aqui o PGBL sempre perde) */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[#8E93A3]">Líquido Retirado do Fundo</span>
                    <span className="font-semibold text-white">{formatCurrency(liquidoFundoPGBL)}</span>
                  </div>

                  {/* O TRUNFO: A RESTITUIÇÃO */}
                  <div className="flex justify-between items-center text-[#F2C94C] pt-2 pb-3 border-b border-[#2A2D35]">
                    <span className="flex items-center" title="Economia de IR gerada na declaração e reinvestida com juros">
                      <Info size={14} className="mr-1.5" /> 
                      Benefício Reinvestido (Líquido)
                    </span>
                    <span className="font-semibold">+{formatCurrency(liquidoRestituicaoTotal)}</span>
                  </div>

                  <div className={`pt-4 flex justify-between items-center`}>
                    <span className="text-white font-bold">Patrimônio Líquido Final</span>
                    <span className={`text-xl font-black ${!vgblVenceu ? theme.accent : 'text-white'}`}>
                      {formatCurrency(patrimonioTotalPGBL)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card VGBL */}
              <div className={`${theme.bgCard} p-6 rounded-xl border ${vgblVenceu ? theme.accentBorder + ' shadow-[0_0_15px_rgba(242,201,76,0.15)]' : theme.borderDark} relative transition-all duration-300`}>
                {vgblVenceu && (
                   <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${theme.accentBg} text-black text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md z-10`}>
                      Patrimônio Final Maior
                   </div>
                )}
                <h4 className="text-xl font-bold text-white mt-2">VGBL</h4>
                <p className={`text-xs ${theme.textMuted} mb-6`}>Imposto incide apenas sobre os Rendimentos.</p>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center text-[#E2E8F0]">
                    <span>Fundo Bruto (Acumulado)</span>
                    <span className="font-semibold">{formatCurrency(montanteBrutoFundo)}</span>
                  </div>
                  <div className="flex justify-between items-center text-red-400 pb-3 border-b border-[#2A2D35]">
                    <span>IR Retido (Média {aliquotaEfetivaVGBL.toFixed(1)}%)</span>
                    <span className="font-semibold">-{formatCurrency(irFundoVGBL)}</span>
                  </div>
                  
                  {/* O LÍQUIDO DO FUNDO */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[#8E93A3]">Líquido Retirado do Fundo</span>
                    <span className="font-semibold text-white">{formatCurrency(liquidoFundoVGBL)}</span>
                  </div>

                  {/* VGBL NÃO TEM RESTITUIÇÃO */}
                  <div className="flex justify-between items-center text-[#5e6373] pt-2 pb-3 border-b border-[#2A2D35]">
                    <span className="flex items-center">
                      Benefício Reinvestido (Líquido)
                    </span>
                    <span className="font-semibold">R$ 0,00</span>
                  </div>

                  <div className={`pt-4 flex justify-between items-center`}>
                    <span className="text-white font-bold">Patrimônio Líquido Final</span>
                    <span className={`text-xl font-black ${vgblVenceu ? theme.accent : 'text-white'}`}>
                      {formatCurrency(patrimonioTotalVGBL)}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* 4. Benefícios e Malefícios (Tabela de Resumo Educativo) */}
            <div className={`${theme.bgCard} border border-[#2A2D35] rounded-xl overflow-hidden mt-8`}>
              <div className="bg-[#15171C] p-4 border-b border-[#2A2D35]">
                <h4 className="text-white font-bold flex items-center">
                  <CheckCircle2 size={18} className={`${theme.accent} mr-2`} />
                  Resumo Técnico (Comparativo)
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#8E93A3] uppercase bg-[#1A1C23] border-b border-[#2A2D35]">
                    <tr>
                      <th className="px-6 py-4">Característica</th>
                      <th className="px-6 py-4 text-white">PGBL</th>
                      <th className="px-6 py-4 text-[#F2C94C]">VGBL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2D35]">
                    <tr className="hover:bg-[#22252e] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#8E93A3]">Benefícios</td>
                      <td className="px-6 py-4 text-white">Adia o pagamento de imposto; permite reinvestir a restituição do IR.</td>
                      <td className="px-6 py-4 text-white">Tributação apenas sobre o lucro; ideal para sucessão patrimonial.</td>
                    </tr>
                    <tr className="hover:bg-[#22252e] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#8E93A3]">Malefícios</td>
                      <td className="px-6 py-4 text-red-300">Paga imposto sobre <strong>todo o montante</strong> no final; vantajoso apenas para declaração completa.</td>
                      <td className="px-6 py-4 text-red-300">Não oferece abatimento fiscal imediato na base do IR.</td>
                    </tr>
                    <tr className="hover:bg-[#22252e] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#8E93A3]">Tributação no Resgate</td>
                      <td className="px-6 py-4 text-white">Incide sobre <strong>Valor Total</strong> (Principal + Rendimentos)</td>
                      <td className="px-6 py-4 text-white">Incide sobre os <strong>Rendimentos</strong> (Base = Valor Final - Aporte)</td>
                    </tr>
                    <tr className="hover:bg-[#22252e] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#8E93A3]">Sucessão</td>
                      <td className="px-6 py-4 text-white">Geralmente entra em inventário (depende do estado).</td>
                      <td className="px-6 py-4 text-white">Não entra em inventário e não incide ITCMD na maioria dos casos.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// --- MICRO-COMPONENTS ---

function InputRange({ label, value, min, max, step, onChange, theme, format }) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className={`text-sm font-medium ${theme.textMuted}`}>{label}</label>
        <span className="text-sm font-bold text-white bg-[#0F1115] px-2 py-1 rounded border border-[#2A2D35]">
          {format(value)}
        </span>
      </div>
      <div className="relative pt-2 pb-2">
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step}
          value={value} 
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 bg-[#2A2D35] rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#F2C94C]"
          style={{
            background: `linear-gradient(to right, #F2C94C 0%, #F2C94C ${percentage}%, #2A2D35 ${percentage}%, #2A2D35 100%)`
          }}
        />
        <style dangerouslySetInnerHTML={{__html: `
          input[type=range]::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #F2C94C;
            cursor: pointer;
            border: 2px solid #1A1C23;
            box-shadow: 0 0 4px rgba(0,0,0,0.5);
          }
        `}} />
      </div>
    </div>
  );
}
