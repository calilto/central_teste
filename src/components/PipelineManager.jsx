import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Search, 
  Loader2,
  TrendingUp,
  Briefcase,
  Shield,
  Clock,
  Download,
  Trash2,
  XCircle,
  BarChart3,
  Target,
  Activity,
  Zap,
  Flame
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

// ── Animated Counter ──
function AnimatedCounter({ value, duration = 600, suffix = '%', className = '' }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;
    prevRef.current = to;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <span className={className}>{display}{suffix}</span>;
}

// ── SVG Progress Ring ──
function ProgressRing({ value, size = 52, stroke = 4, color = '#3B82F6', trackColor = '#1E293B', glow = false }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle 
        cx={size/2} cy={size/2} r={radius} fill="none" 
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)', filter: glow ? `drop-shadow(0 0 6px ${color})` : 'none' }}
      />
    </svg>
  );
}

export default function PipelineManager({ session }) {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState('RV');
  const [search, setSearch] = useState('');
  const [expandedClients, setExpandedClients] = useState(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const categoryMap = {
    'RV': { name: 'Renda Variável', icon: <TrendingUp className="w-4 h-4" />, role: 'leader_rv', aliases: ['RV', 'RENDA VARIÁVEL', 'RENDA VARIAVEL'] },
    'FIXA_FUNDOS': { name: 'Renda Fixa & Fundos', icon: <Briefcase className="w-4 h-4" />, role: 'leader_fixa', aliases: ['FIXA_FUNDOS', 'ALOCAÇÃO', 'ALOCACAO', 'RENDA FIXA', 'FUNDOS'] },
    'SEGUROS': { name: 'Seguros', icon: <Shield className="w-4 h-4" />, role: 'leader_seguros', aliases: ['SEGUROS'] },
    'PJ': { name: 'PJ & Banking', icon: <BarChart3 className="w-4 h-4" />, role: 'leader_pj', aliases: ['PJ', 'BANKING'] },
  };

  const isOpInCategory = (opCategory, catId) => {
    if (!opCategory) return false;
    const cat = opCategory.toUpperCase().trim();
    if (cat === catId.toUpperCase()) return true;
    const map = categoryMap[catId];
    if (map && map.aliases) {
      return map.aliases.includes(cat);
    }
    return false;
  };

  const categories = Object.entries(categoryMap).map(([id, info]) => ({ id, ...info }));

  useEffect(() => {
    fetchProfile();
    fetchOpportunities();
  }, []);

  async function fetchProfile() {
    try {
      const { data } = await supabase.from('user_roles').select('role').eq('email', session.user.email).single();
      if (data) {
        setUserRole(data.role);
        const leaderCat = categories.find(c => c.role === data.role);
        if (leaderCat) setSelectedCategory(leaderCat.id);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  async function fetchOpportunities() {
    const { data } = await supabase.from('pipeline_opportunities').select('*').order('cliente_nome', { ascending: true });
    if (data) setOpportunities(data);
  }

  const toggleClient360 = (clienteNome) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(clienteNome)) next.delete(clienteNome);
      else next.add(clienteNome);
      return next;
    });
  };

  const availableCategories = useMemo(() => {
    if (userRole === 'admin' || !userRole) return categories;
    const leaderCat = categories.find(c => c.role === userRole);
    return leaderCat ? [leaderCat] : categories;
  }, [userRole]);

  const toggleStatus = async (id, currentStatus, targetStatus) => {
    const newStatus = currentStatus === targetStatus ? 'pending' : targetStatus;
    setOpportunities(prev => prev.map(op => op.id === id ? { ...op, status: newStatus } : op));
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      await fetch('/api/update-opportunity-status', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentSession?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
    } catch (err) {
      setOpportunities(prev => prev.map(op => op.id === id ? { ...op, status: currentStatus } : op));
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setMsg({ type: 'info', text: 'Processando...' });
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (!currentSession?.access_token) {
            setMsg({ type: 'error', text: 'Sessão expirada. Faça login novamente.' });
            setUploading(false);
            return;
          }
          const response = await fetch('/api/upload-pipeline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentSession.access_token}` },
            body: JSON.stringify({ data, category: selectedCategory })
          });
          if (response.ok) {
            setMsg({ type: 'success', text: `Enviado com sucesso!` });
            fetchOpportunities();
          } else {
            let errorText = `Erro ${response.status}`;
            try { const err = await response.json(); errorText = err.error || errorText; } catch (_) {}
            setMsg({ type: 'error', text: errorText });
          }
        } catch (innerErr) {
          setMsg({ type: 'error', text: `Erro ao processar: ${innerErr.message}` });
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setMsg({ type: 'error', text: 'Erro ao ler o arquivo. Tente novamente.' });
        setUploading(false);
      };
      reader.readAsBinaryString(file);
    } catch (err) { setMsg({ type: 'error', text: err.message }); setUploading(false); }
  };

  const allAreaStats = useMemo(() => {
    const calculate = (list) => {
        const total = list.length;
        const worked = list.filter(op => op.status === 'gain' || op.status === 'loss').length;
        const gain = list.filter(op => op.status === 'gain').length;
        return {
          total, worked, gain,
          efficiency: total > 0 ? Math.round((worked / total) * 100) : 0,
          conversion: worked > 0 ? Math.round((gain / worked) * 100) : 0
        };
    };
    const statsMap = {};
    categories.forEach(cat => statsMap[cat.id] = calculate(opportunities.filter(op => isOpInCategory(op.category, cat.id))));
    return { areas: statsMap, overall: calculate(opportunities) };
  }, [opportunities]);

  const filteredOps = useMemo(() => {
    return opportunities.filter(op => {
      const matchesSearch = op.cliente_nome?.toLowerCase().includes(search.toLowerCase()) || 
                           op.cliente_codigo?.toLowerCase().includes(search.toLowerCase());
      const is360 = expandedClients.has(op.cliente_nome);
      const matchesCategory = selectedCategory === 'ALL' || isOpInCategory(op.category, selectedCategory) || is360;
      return matchesSearch && matchesCategory;
    });
  }, [opportunities, search, selectedCategory, expandedClients]);

  const groupedTasks = useMemo(() => {
    return filteredOps.reduce((acc, op) => {
      const key = op.cliente_nome || op.cliente_codigo || 'Desconhecido';
      if (!acc[key]) acc[key] = [];
      acc[key].push(op);
      return acc;
    }, {});
  }, [filteredOps]);

  const clearPipeline = async () => {
    setShowClearConfirm(false);
    setMsg({ type: 'info', text: 'Limpando base...' });
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin-clear-pipeline', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${currentSession?.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await res.json();
      if (result.success) {
        setMsg({ type: 'success', text: 'Pipeline limpo!' });
        setOpportunities([]);
      } else throw new Error(result.error);
    } catch (err) {
      setMsg({ type: 'error', text: `Erro ao limpar: ${err.message}` });
    }
  };

  const downloadTemplate = () => {
    // Ordem exata das colunas esperada pelo back e mostrada na foto do usuário
    const templateData = [
      { 
        'Cliente': 'Enzo Hejazi', 
        'Código Cliente': '2931047', 
        'Assessor': 'A42105', 
        'Ativo': 'Estrutura de Opções', 
        'Ticker': 'VALE3', 
        'Emissor': 'VALE',
        'Taxa': '-',
        'Data de Aplicação': '21/11/2023',
        'Data de Vencimento': '-',
        'Data de Carência': '-',
        'Quantidade': 1000,
        ' Financeiro ': 50000, 
        'Oportunidade': 'Aumentar exposição em Vale',
        'Time': 'RV'
      },
      { 
        'Cliente': 'Enzo Hejazi', 
        'Código Cliente': '2931047', 
        'Assessor': 'A42105', 
        'Ativo': 'LCA Bradesco', 
        'Ticker': 'LCA-BRAD', 
        'Emissor': 'BRADESCO',
        'Taxa': '98% CDI',
        'Data de Aplicação': '07/09/2023',
        'Data de Vencimento': '07/09/2025',
        'Data de Carência': '07/12/2023',
        'Quantidade': 150,
        ' Financeiro ': 150000, 
        'Oportunidade': 'Vencimento vindo da concorrência',
        'Time': 'FIXA_FUNDOS'
      },
      { 
        'Cliente': 'João da Silva', 
        'Código Cliente': '99881', 
        'Assessor': 'A42105', 
        'Ativo': 'Seguro de Vida Resgatável', 
        'Ticker': 'PRUDENTIAL', 
        'Emissor': 'PRUDENTIAL',
        'Taxa': 'IPCA + 5%',
        'Data de Aplicação': '11/06/2023',
        'Data de Vencimento': '-',
        'Data de Carência': '-',
        'Quantidade': 1,
        ' Financeiro ': 25000, 
        'Oportunidade': 'Proteção familiar e sucessão',
        'Time': 'SEGUROS'
      },
      { 
        'Cliente': 'João da Silva', 
        'Código Cliente': '99881', 
        'Assessor': 'A42105', 
        'Ativo': 'Crédito Imobiliário', 
        'Ticker': 'EUROBANK', 
        'Emissor': 'EUROBANK',
        'Taxa': 'TR + 9%',
        'Data de Aplicação': '21/03/2023',
        'Data de Vencimento': '21/03/2043',
        'Data de Carência': '21/09/2023',
        'Quantidade': 1,
        ' Financeiro ': 850000, 
        'Oportunidade': 'Taxa competitiva para expansão',
        'Time': 'PJ'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData, { 
      header: [
        'Cliente', 'Código Cliente', 'Assessor', 'Ativo', 'Ticker', 'Emissor', 'Taxa', 
        'Data de Aplicação', 'Data de Vencimento', 'Data de Carência', 'Quantidade', 
        ' Financeiro ', 'Oportunidade', 'Time'
      ] 
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "Modelo_Pipeline_Eurostock.xlsx");
  };

  // ── Sticky scoreboard logic ──
  const headerRef = useRef(null);
  const [showSticky, setShowSticky] = useState(false);
  const [pulse, setPulse] = useState(false);
  const prevStatsRef = useRef(null);

  // Detect when header scrolls out of view
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-10px 0px 0px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading]);

  // Pulse when stats change
  useEffect(() => {
    const current = selectedCategory === 'ALL' ? allAreaStats.overall : (allAreaStats.areas[selectedCategory] || allAreaStats.overall);
    const key = `${current.efficiency}-${current.conversion}`;
    if (prevStatsRef.current && prevStatsRef.current !== key) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 800);
      return () => clearTimeout(t);
    }
    prevStatsRef.current = key;
  }, [allAreaStats, selectedCategory]);

  // Current stats for selected category
  const activeStats = useMemo(() => {
    return selectedCategory === 'ALL' ? allAreaStats.overall : (allAreaStats.areas[selectedCategory] || allAreaStats.overall);
  }, [allAreaStats, selectedCategory]);

  const activeCatName = selectedCategory === 'ALL' 
    ? (userRole === 'admin' ? 'Geral' : 'Resumo') 
    : (categoryMap[selectedCategory]?.name || 'Pipe');

  // ── Stat Card render ──
  const renderStatCard = (id, title, icon, s, isActive) => (
      <button 
          key={id}
          onClick={() => setSelectedCategory(id)}
          className={`group bg-[#1A1D24] border p-4 xl:p-5 rounded-3xl flex flex-col gap-4 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-left shadow-xl ${isActive ? 'border-[#E8B923] ring-1 ring-[#E8B923]/30 shadow-[0_8px_30px_rgb(232,185,35,0.15)]' : 'border-[#1F232B] opacity-60 hover:opacity-100 hover:border-white/10'}`}
      >
          <div className="flex items-center justify-between w-full gap-2">
              <div className={`p-2 rounded-xl transition-all flex-shrink-0 ${isActive ? 'bg-[#E8B923] text-black shadow-lg shadow-[#E8B923]/30 scale-110' : 'bg-white/5 text-[#64748B] group-hover:bg-white/10 group-hover:text-white'}`}>
                  {icon}
              </div>
              <div className="flex items-center gap-2 min-w-0 pl-1">
                  <span className="text-[10px] xl:text-[11px] font-black uppercase text-[#64748B] tracking-wider truncate">{title}</span>
                  <span className={`flex-shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded-md ${isActive ? 'bg-[#E8B923]/20 text-[#E8B923]' : 'bg-white/5 text-[#64748B]'}`}>{s.total}</span>
              </div>
          </div>

          <div className="space-y-3 w-full mt-1">
              {/* Produção */}
              <div className={`rounded-2xl p-3 border relative overflow-hidden transition-colors ${isActive ? 'bg-[#15171C] border-blue-500/20' : 'bg-[#15171C] border-[#1F232B]'}`}>
                  <div className="flex items-center gap-3 relative z-10">
                      <ProgressRing value={s.efficiency} size={44} stroke={3.5} color="#3B82F6" glow={isActive} />
                      <div className="flex-1 min-w-0">
                          <p className="text-[9px] text-[#94A3B8] font-black uppercase tracking-widest mb-0.5 flex items-center gap-1"><Activity className={`w-3 h-3 ${isActive ? 'text-blue-400' : 'text-blue-500/50'}`} /> Produção</p>
                          <div className="flex items-baseline gap-1.5">
                              <AnimatedCounter value={s.efficiency} className={`text-xl font-black ${isActive ? 'text-white' : 'text-[#E2E8F0]/50'}`} />
                              <span className="text-[10px] font-bold text-[#64748B]">({s.worked}/{s.total})</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Conversão */}
              <div className={`rounded-2xl p-3 border relative overflow-hidden transition-colors ${isActive ? 'bg-[#15171C] border-green-500/20' : 'bg-[#15171C] border-[#1F232B]'}`}>
                  <div className="flex items-center gap-3 relative z-10">
                      <ProgressRing value={s.conversion} size={44} stroke={3.5} color="#22C55E" glow={isActive} />
                      <div className="flex-1 min-w-0">
                          <p className="text-[9px] text-[#94A3B8] font-black uppercase tracking-widest mb-0.5 flex items-center gap-1"><Zap className={`w-3 h-3 ${isActive ? 'text-green-400' : 'text-green-500/50'}`} /> Conversão</p>
                          <div className="flex items-baseline gap-1.5">
                              <AnimatedCounter value={s.conversion} className={`text-xl font-black ${isActive ? 'text-green-400' : 'text-green-500/50'}`} />
                              <span className="text-[10px] font-bold text-[#64748B]">({s.gain}/{s.worked})</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </button>
  );

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#0E0F12]">
      <Loader2 className="w-8 h-8 text-[#E8B923] animate-spin" />
    </div>
  );

  return (
    <div className="p-8 max-w-[1750px] mx-auto space-y-8 animate-in fade-in duration-700">

      {/* ▸ STICKY SCOREBOARD — always visible on scroll */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${showSticky ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}
      >
        <div className="bg-[#0E0F12]/95 backdrop-blur-xl border-b border-[#1F232B] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="max-w-[1750px] mx-auto px-8 py-3 flex items-center justify-between gap-6">
            {/* Left: branding */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="p-1.5 bg-[#E8B923]/10 rounded-lg"><Target className="w-4 h-4 text-[#E8B923]" /></div>
              <span className="text-xs font-black text-white uppercase tracking-wider hidden sm:block">{activeCatName}</span>
            </div>

            {/* Center: Stat pills */}
            <div className="flex items-center gap-4 flex-1 justify-center">
              {/* Produção pill */}
              <div className={`flex items-center gap-3 bg-[#15171C] border border-blue-500/20 rounded-2xl px-4 py-2 transition-all ${pulse ? 'ring-2 ring-blue-400/40 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : ''}`}>
                <ProgressRing value={activeStats.efficiency} size={36} stroke={3} color="#3B82F6" glow={true} />
                <div>
                  <p className="text-[8px] text-blue-400 font-black uppercase tracking-widest flex items-center gap-1"><Activity className="w-2.5 h-2.5" /> Produção</p>
                  <div className="flex items-baseline gap-1">
                    <AnimatedCounter value={activeStats.efficiency} className="text-lg font-black text-white" />
                    <span className="text-[9px] font-bold text-[#64748B]">{activeStats.worked}/{activeStats.total}</span>
                  </div>
                </div>
              </div>

              {/* Conversão pill */}
              <div className={`flex items-center gap-3 bg-[#15171C] border border-green-500/20 rounded-2xl px-4 py-2 transition-all ${pulse ? 'ring-2 ring-green-400/40 shadow-[0_0_20px_rgba(34,197,94,0.15)]' : ''}`}>
                <ProgressRing value={activeStats.conversion} size={36} stroke={3} color="#22C55E" glow={true} />
                <div>
                  <p className="text-[8px] text-green-400 font-black uppercase tracking-widest flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> Conversão</p>
                  <div className="flex items-baseline gap-1">
                    <AnimatedCounter value={activeStats.conversion} className="text-lg font-black text-green-400" />
                    <span className="text-[9px] font-bold text-[#64748B]">{activeStats.gain}/{activeStats.worked}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: streak / pending count */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="bg-[#E8B923]/10 border border-[#E8B923]/20 rounded-xl px-3 py-1.5 flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-[#E8B923]" />
                <span className="text-[10px] font-black text-[#E8B923]">{activeStats.total - activeStats.worked} pendentes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header & Stats Grid */}
      <div ref={headerRef} className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#E8B923]/10 rounded-lg"><Target className="w-6 h-6 text-[#E8B923]" /></div>
                    <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">Portal Comercial</h1>
                </div>
            </div>
            <div className="bg-[#15171C] border border-[#1F232B] p-1 rounded-xl flex gap-1">
                <button onClick={() => setActiveView('dashboard')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeView === 'dashboard' ? 'bg-[#E8B923] text-black shadow-lg shadow-[#E8B923]/10' : 'text-[#64748B] hover:text-white'}`}>Dashboard</button>
                {(userRole === 'admin' || userRole?.startsWith('leader')) && (
                  <button onClick={() => setActiveView('upload')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeView === 'upload' ? 'bg-[#E8B923] text-black shadow-lg shadow-[#E8B923]/10' : 'text-[#64748B] hover:text-white'}`}>Upload</button>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {(userRole === 'admin' || !userRole) && 
                renderStatCard(
                    'ALL', 
                    userRole === 'admin' ? 'Cockpit Geral (Admin)' : 'Meu Resumo Geral', 
                    <Target className="w-5 h-5" />, 
                    allAreaStats.overall, 
                    selectedCategory === 'ALL'
                )
            }
            {availableCategories.map(cat => 
                renderStatCard(
                    cat.id, 
                    cat.name, 
                    cat.icon, 
                    allAreaStats.areas[cat.id], 
                    selectedCategory === cat.id
                )
            )}
        </div>
      </div>

      {activeView === 'upload' ? (
        <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           {/* Upload Component */}
           <div className="bg-[#15171C] border border-[#1F232B] rounded-3xl p-10 text-center space-y-8 shadow-2xl">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Upload da Área: {categoryMap[selectedCategory]?.name || 'Geral'}</h3>
                <p className="text-sm text-[#64748B]">Os dados serão re-classificados automaticamente pela coluna "Time".</p>
              </div>
              <div className="relative border-2 border-dashed border-[#1C1F26] rounded-3xl p-16 bg-black/20 group hover:border-[#E8B923]/50 transition-all">
                <input type="file" onChange={handleFileUpload} accept=".xlsx, .xls" className="absolute inset-0 opacity-0 cursor-pointer" />
                <Upload className={`w-12 h-12 text-[#E8B923] mx-auto mb-6 ${uploading ? 'animate-bounce' : ''}`} />
                <h4 className="text-lg font-bold text-white">Arraste sua planilha aqui</h4>
                <p className="text-sm text-[#64748B]">Clique para explorar</p>
              </div>
              <div className="flex justify-center gap-4 relative">
                <button onClick={downloadTemplate} className="px-6 py-3 bg-white/5 rounded-xl border border-white/10 text-xs font-bold uppercase"><Download className="w-4 h-4 inline mr-2" /> Modelo</button>
                {userRole === 'admin' && (
                  <>
                    <button onClick={() => setShowClearConfirm(true)} className="px-6 py-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-500 text-xs font-bold uppercase"><Trash2 className="w-4 h-4 inline mr-2" /> Limpar Tudo</button>
                    {showClearConfirm && (
                      <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-[#1C1F26] border border-red-500/30 p-4 rounded-xl shadow-2xl z-10 w-80 text-center">
                        <p className="text-xs text-white mb-3">⚠️ Tem certeza? Isso apagará TODAS as oportunidades de todas as áreas!</p>
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => setShowClearConfirm(false)} className="px-3 py-1.5 bg-white/10 rounded text-xs text-white hover:bg-white/20">Cancelar</button>
                          <button onClick={clearPipeline} className="px-3 py-1.5 bg-red-500 rounded text-xs text-white hover:bg-red-600 font-bold">Sim, Apagar Tudo</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              {msg.text && <div className={`p-4 rounded-xl text-xs font-bold border ${msg.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : msg.type === 'info' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg.type === 'info' && <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />}{msg.text}</div>}
           </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
              <input type="text" placeholder={`Filtrar cliente...`} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#15171C] border border-[#1F232B] rounded-2xl pl-14 pr-6 py-4 text-sm text-white focus:border-[#E8B923]/50 outline-none shadow-2xl" />
            </div>
            <div className="flex items-center justify-between bg-[#15171C] border border-[#1F232B] rounded-2xl px-6 py-4 shadow-xl">
                <div className="flex items-center gap-3"><Users className="w-5 h-5 text-[#E8B923]" /><span className="text-sm font-bold text-white uppercase">{Object.keys(groupedTasks).length} Clientes</span></div>
                <div className="text-right"><p className="text-[10px] text-[#64748B] font-bold">TOTAL PIPE</p><p className="text-sm font-black text-white">{filteredOps.length}</p></div>
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([clienteNome, ops]) => {
              const is360 = expandedClients.has(clienteNome);
              return (
              <div key={clienteNome} className={`bg-[#15171C] border ${is360 ? 'border-[#E8B923]' : 'border-[#1F232B]'} rounded-3xl overflow-hidden shadow-2xl transition-all`}>
                <div className="p-6 flex items-center justify-between bg-white/[0.02] border-b border-white/5">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E8B923] to-[#B8860B] flex items-center justify-center text-black font-black text-lg">{clienteNome[0]}</div>
                    <div>
                      <h4 className="text-base font-black text-white">{clienteNome}</h4>
                      <p className="text-[11px] text-[#64748B] font-bold">Cod: {ops[0].cliente_codigo || '-'} • <span className="text-[#E8B923]">{ops.length} itens</span></p>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleClient360(clienteNome)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-bold uppercase transition-all ${is360 ? 'bg-[#E8B923] text-black border-[#E8B923]' : 'border-white/10 text-white hover:bg-white/5'}`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    {is360 ? 'Visão 360 Ativa' : 'Ver Visão 360'}
                  </button>
                </div>
                <div className="p-6 bg-black/20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ops.map(op => {
                    const isGain = op.status === 'gain';
                    const isLoss = op.status === 'loss';
                    return (
                      <div key={op.id} className={`bg-[#1A1D24] border ${isGain ? 'border-green-500/30 shadow-green-500/5' : isLoss ? 'border-red-500/30' : 'border-[#2A2F3A]'} rounded-2xl p-5 space-y-4 relative transition-all ${isGain || isLoss ? 'opacity-60' : 'hover:border-[#E8B923]/40'}`}>
                        <div className="absolute top-4 right-4 flex gap-2">
                           <button onClick={() => toggleStatus(op.id, op.status, 'gain')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isGain ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-white/5 text-[#64748B] hover:bg-green-500/40'}`}><CheckCircle2 className="w-4 h-4" /></button>
                           <button onClick={() => toggleStatus(op.id, op.status, 'loss')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isLoss ? 'bg-red-500 text-black shadow-lg shadow-red-500/20' : 'bg-white/5 text-[#64748B] hover:bg-red-500/40'}`}><XCircle className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-1.5 pr-20">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${isOpInCategory(op.category, 'RV') ? 'bg-orange-500/10 text-orange-400' : isOpInCategory(op.category, 'PJ') ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                            {categoryMap[op.category]?.name || op.category || op.time_origem || 'Op'}
                          </span>
                          <h4 className="text-sm font-bold text-white line-clamp-2 leading-tight">{op.ativo}</h4>
                        </div>
                        
                        {op.tipo_oportunidade && op.tipo_oportunidade !== '-' && (
                          <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex-grow">
                            <p className="text-[11px] text-white/80 leading-snug italic">"{op.tipo_oportunidade}"</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5 mt-auto">
                          {op.taxa && op.taxa !== '-' && (
                            <div className="bg-[#1C1F26] border border-[#2D333F] rounded-lg px-2 py-1.5 flex-1 min-w-[30%]">
                              <p className="text-[8px] text-[#94A3B8] uppercase font-bold tracking-widest leading-none mb-1">Taxa/Deságio</p>
                              <p className="text-xs font-black text-white">{op.taxa}</p>
                            </div>
                          )}
                          
                          {op.data_vencimento && op.data_vencimento !== '-' && (
                            <div className="bg-[#1C1F26] border border-[#2D333F] rounded-lg px-2 py-1.5 flex-1 min-w-[30%]">
                              <p className="text-[8px] text-[#94A3B8] uppercase font-bold tracking-widest leading-none mb-1">Vencimento</p>
                              <p className="text-[11px] font-bold text-[#E2E8F0]">
                                {op.data_vencimento.includes('-') 
                                  ? op.data_vencimento.split('-').reverse().join('/') 
                                  : op.data_vencimento}
                              </p>
                            </div>
                          )}

                          {op.quantidade > 0 && op.category !== 'PJ' && (
                            <div className="bg-[#1C1F26] border border-[#2D333F] rounded-lg px-2 py-1.5 flex-1 min-w-[20%]">
                              <p className="text-[8px] text-[#94A3B8] uppercase font-bold tracking-widest leading-none mb-1">Qtd.</p>
                              <p className="text-[11px] font-bold text-[#E2E8F0]">{op.quantidade.toLocaleString('pt-BR')}</p>
                            </div>
                          )}

                          {op.emissor && op.emissor !== '-' && !op.tipo_oportunidade?.includes(op.emissor) && (
                            <div className="bg-[#1C1F26] border border-[#2D333F] rounded-lg px-2 py-1.5 flex-1 min-w-[30%]">
                              <p className="text-[8px] text-[#94A3B8] uppercase font-bold tracking-widest leading-none mb-1">Emissor</p>
                              <p className="text-[11px] font-bold text-[#E2E8F0] truncate" title={op.emissor}>{op.emissor}</p>
                            </div>
                          )}

                          {op.financeiro > 0 && (
                            <div className="bg-[#E8B923]/10 border border-[#E8B923]/20 rounded-lg px-2 py-1.5 flex-1 min-w-[40%] text-right ml-auto">
                              <p className="text-[8px] text-[#E8B923] uppercase font-bold tracking-widest leading-none mb-1">Financeiro</p>
                              <p className="text-sm font-black text-[#E8B923]">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(op.financeiro)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );})}
          </div>
        </div>
      )}
    </div>
  );
}
