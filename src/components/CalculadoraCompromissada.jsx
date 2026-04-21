import React, { useState, useMemo } from 'react';
import { ArrowLeft, Grid2X2 } from 'lucide-react';
import { calculateRendimentos } from '../utils/calculatorLogic';

export default function CalculadoraCompromissada({ onClose }) {
  const [financeiro, setFinanceiro] = useState(1570000);
  const [selic, setSelic] = useState(0.15); // 15%
  const [dataInicio, setDataInicio] = useState('2025-12-30');
  const [taxaConta, setTaxaConta] = useState(0.1); // 10% do CDI
  const [taxaCDB, setTaxaCDB] = useState(1.0); // 100% do CDI
  const [taxaCompromissada, setTaxaCompromissada] = useState(0.99); // 99% do CDI

  const results = useMemo(() => {
    return calculateRendimentos(
      financeiro,
      selic,
      dataInicio,
      taxaConta,
      taxaCDB,
      taxaCompromissada
    );
  }, [financeiro, selic, dataInicio, taxaConta, taxaCDB, taxaCompromissada]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#0E0F12] text-slate-300 font-sans flex flex-col">
      {/* Header interno do simulador para manter consistência com o Hub */}
      <header className="h-[64px] bg-[#0E0F12] border-b border-[#1C1F26] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-1.5 hover:bg-[#1C1F26] text-[#94A3B8] rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#E8B923] rounded flex items-center justify-center shadow-[0_0_15px_rgba(232,185,35,0.15)]">
              <span className="text-[#0E0F12] font-black text-sm">E</span>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-[#E2E8F0] font-bold tracking-widest text-[13px] leading-none mb-1 uppercase">Calculadora Compromissada</h1>
              <p className="text-[9px] text-[#64748B] font-medium tracking-wider leading-none uppercase">Versão Cliente XP</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
          
          {/* Coluna de Inputs */}
          <aside className="bg-[#15171C] border border-[#1F232B] rounded-xl p-6 shadow-xl space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Capital Investido (R$)</label>
                <input 
                  type="number" 
                  className="bg-[#0E0F12] border border-[#2D333F] rounded-lg px-4 py-2.5 text-sm text-[#E2E8F0] focus:border-[#E8B923] outline-none transition-colors"
                  value={financeiro} 
                  onChange={(e) => setFinanceiro(Number(e.target.value))}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">SELIC Anual (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="bg-[#0E0F12] border border-[#2D333F] rounded-lg px-4 py-2.5 text-sm text-[#E2E8F0] focus:border-[#E8B923] outline-none transition-colors"
                  value={selic * 100} 
                  onChange={(e) => setSelic(Number(e.target.value) / 100)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Data de Início</label>
                <input 
                  type="date" 
                  className="bg-[#0E0F12] border border-[#2D333F] rounded-lg px-4 py-2.5 text-sm text-[#E2E8F0] focus:border-[#E8B923] outline-none transition-colors"
                  value={dataInicio} 
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Taxa Conta Remunerada (% do CDI)</label>
                <input 
                  type="number" 
                  className="bg-[#0E0F12] border border-[#2D333F] rounded-lg px-4 py-2.5 text-sm text-[#E2E8F0] focus:border-[#E8B923] outline-none transition-colors"
                  value={taxaConta * 100} 
                  onChange={(e) => setTaxaConta(Number(e.target.value) / 100)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Taxa CDB (% do CDI)</label>
                <input 
                  type="number" 
                  className="bg-[#0E0F12] border border-[#2D333F] rounded-lg px-4 py-2.5 text-sm text-[#E2E8F0] focus:border-[#E8B923] outline-none transition-colors"
                  value={taxaCDB * 100} 
                  onChange={(e) => setTaxaCDB(Number(e.target.value) / 100)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Taxa Compromissada (% do CDI)</label>
                <input 
                  type="number" 
                  className="bg-[#0E0F12] border border-[#2D333F] rounded-lg px-4 py-2.5 text-sm text-[#E2E8F0] focus:border-[#E8B923] outline-none transition-colors"
                  value={taxaCompromissada * 100} 
                  onChange={(e) => setTaxaCompromissada(Number(e.target.value) / 100)}
                />
              </div>
            </div>
          </aside>

          {/* Coluna da Tabela */}
          <section className="bg-[#15171C] border border-[#1F232B] rounded-xl overflow-hidden shadow-xl flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="bg-[#0E0F12]/50 border-b border-[#1C1F26]">
                    <th className="p-4 font-bold text-[#64748B] uppercase tracking-wider">D.U.</th>
                    <th className="p-4 font-bold text-[#64748B] uppercase tracking-wider">Data</th>
                    <th className="p-4 font-bold text-[#64748B] uppercase tracking-wider">IOF</th>
                    <th className="p-4 font-bold text-[#64748B] uppercase tracking-wider">Conta Remun.</th>
                    <th className="p-4 font-bold text-[#64748B] uppercase tracking-wider">CDB</th>
                    <th className="p-4 font-bold text-[#E8B923] uppercase tracking-wider">Compromissada</th>
                    <th className="p-4 font-bold text-[#64748B] uppercase tracking-wider">Equiv. CDB*</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C1F26]">
                  {results.map((res) => (
                    <tr key={res.du} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-[#94A3B8]">{res.du}</td>
                      <td className="p-4 text-[#E2E8F0] font-medium">{res.data}</td>
                      <td className="p-4 text-[#F87171]">{res.iof}</td>
                      <td className="p-4 text-[#E2E8F0]">{formatCurrency(res.contaRemunerada)}</td>
                      <td className="p-4 text-[#E2E8F0]">{formatCurrency(res.cdb)}</td>
                      <td className="p-4 text-[#E8B923] font-bold">{formatCurrency(res.compromissada)}</td>
                      <td className="p-4 text-[#94A3B8]">{res.equivCDB}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <footer className="p-6 bg-[#0E0F12]/30 border-t border-[#1C1F26] space-y-2">
              <p className="text-[10px] text-[#64748B] leading-relaxed">
                (*) A equivalência do CDB significa quanto a taxa de remuneração de um CDB precisaria ser para equivaler ao rendimento de uma compromissada naquele prazo.
              </p>
              <p className="text-[10px] text-[#64748B]">Tributação de IR considerada: 22,5% (Curto Prazo).</p>
            </footer>
          </section>

        </div>
      </main>
    </div>
  );
}
