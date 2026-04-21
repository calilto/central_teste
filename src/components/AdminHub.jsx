import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Search, Trash2, KeyRound, ShieldAlert, RefreshCw, Send } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

/**
 * Nota de Segurança:
 * A listagem e deleção de usuários agora é feita via endpoints seguros em /api.
 * O front-end não possui acesso à Service Role Key.
 */

export default function AdminHub() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData?.session) throw new Error("Não autenticado");

            const token = sessionData.session.access_token;
            const res = await fetch("/api/admin-list-users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ page: 1, perPage: 200 })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao carregar usuários");

            setUsers(data.users || []);

        } catch (err) {
            console.error(err);
            setActionMessage({ text: `Erro: ${err.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteUser = async (userId, userEmail) => {
        if (!window.confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE o acesso de ${userEmail}? Esta ação apagará o usuário do banco de dados.`)) return;

        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData?.session) throw new Error("Não autenticado");

            const token = sessionData.session.access_token;
            const res = await fetch("/api/admin-delete-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ userId })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao deletar usuário");

            setActionMessage({ text: `Usuário ${userEmail} removido com sucesso.`, type: 'success' });
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            console.error(err);
            setActionMessage({ text: `Erro: ${err.message}`, type: 'error' });
        }
    };

    const handlePasswordReset = async (userEmail) => {
        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData?.session) throw new Error("Não autenticado");

            const token = sessionData.session.access_token;
            const res = await fetch("/api/admin-reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    email: userEmail,
                    redirectTo: `${window.location.origin}/reset-password`
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao redefinir senha");

            setActionMessage({ text: `E-mail de redefinição acionado via Supabase para ${userEmail}.`, type: 'success' });
        } catch (err) {
            console.error(err);
            setActionMessage({ text: `Erro: ${err.message}`, type: 'error' });
        }
    };

    const filteredUsers = users.filter(u => u.email?.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex-1 overflow-y-auto bg-[#0E0F12] p-8 lg:p-10 animate-fadeIn">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 pl-1 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2.5 mb-2.5">
                            <ShieldAlert className="w-6 h-6 text-[#F87171]" />
                            <h2 className="text-[24px] font-bold text-[#F8FAFC] tracking-tight">Gestão da Plataforma</h2>
                        </div>
                        <p className="text-[13px] text-[#94A3B8] font-medium">Controle de acessos, listagem de assesores e redefinição de senhas.</p>
                    </div>
                </div>

                {actionMessage.text && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${actionMessage.type === 'error' ? 'bg-[#2D1A1A] border border-[#F87171]/20 text-[#F87171]' : 'bg-[#1A2D24] border border-[#10B981]/20 text-[#10B981]'} text-sm`}>
                        {actionMessage.text}
                        <button onClick={() => setActionMessage({ text: '', type: '' })} className="hover:opacity-70">X</button>
                    </div>
                )}

                <div className="bg-[#13151A] border border-[#1C1F26] rounded-xl overflow-hidden shadow-2xl">

                    {/* Header Controls */}
                    <div className="p-5 border-b border-[#1C1F26] flex flex-col md:flex-row justify-between items-center gap-4 bg-[#15171C]">
                        <div className="flex items-center bg-[#0E0F12] border border-[#1C1F26] rounded-md px-3 py-2 w-full md:w-80">
                            <Search className="w-4 h-4 text-[#64748B] mr-2" />
                            <input
                                type="text"
                                placeholder="Buscar corretor por email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-[13px] text-[#E2E8F0] placeholder:text-[#475569] w-full"
                            />
                        </div>

                        <button
                            onClick={fetchUsers}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1C1F26] hover:bg-[#2D333F] text-[#E2E8F0] text-[12px] font-bold rounded-md transition-colors border border-[#2D333F]"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Atualizar Lista
                        </button>
                    </div>

                    {/* Users Table */}
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left text-[13px]">
                            <thead className="bg-[#0E0F12] text-[#64748B] border-b border-[#1C1F26]">
                                <tr>
                                    <th className="px-6 py-4 font-bold tracking-wider uppercase">Usuário / E-mail</th>
                                    <th className="px-6 py-4 font-bold tracking-wider uppercase">Criado em</th>
                                    <th className="px-6 py-4 font-bold tracking-wider uppercase">Último Acesso</th>
                                    <th className="px-6 py-4 font-bold tracking-wider uppercase text-right">Ações de Admin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1C1F26] text-[#E2E8F0]">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-12 text-[#64748B]">Carregando base de corretores...</td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-12 text-[#64748B]">Nenhum usuário encontrado.</td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-[#15171C] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#1C1F26] border border-[#2D333F] flex items-center justify-center shrink-0">
                                                        <Users className="w-4 h-4 text-[#94A3B8]" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[#F8FAFC]">{user.email}</div>
                                                        <div className="text-[11px] text-[#64748B] font-mono mt-0.5">ID: {user.id.substring(0, 8)}...</div>
                                                    </div>
                                                    {(user.email === 'enzo.hejazi@eurostock.com' || user.email === 'enzo.hejazi@eurostock.com.br') && (
                                                        <span className="ml-2 bg-[#E8B923]/10 text-[#E8B923] text-[9px] font-bold px-2 py-0.5 rounded border border-[#E8B923]/20 uppercase">
                                                            Master
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[#94A3B8]">
                                                {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4 text-[#94A3B8]">
                                                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR') : 'Nunca acessou'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">

                                                    {/* Send Password Reset */}
                                                    <button
                                                        onClick={() => handlePasswordReset(user.email)}
                                                        className="p-1.5 text-[#94A3B8] hover:text-[#38BDF8] hover:bg-[#38BDF8]/10 rounded transition-colors"
                                                        title="Enviar E-mail de Reset de Senha"
                                                    >
                                                        <KeyRound className="w-4 h-4" />
                                                    </button>

                                                    {/* Delete User */}
                                                    {(user.email !== 'enzo.hejazi@eurostock.com' && user.email !== 'enzo.hejazi@eurostock.com.br') && (
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id, user.email)}
                                                            className="p-1.5 text-[#94A3B8] hover:text-[#F87171] hover:bg-[#F87171]/10 rounded transition-colors"
                                                            title="Revogar Acesso (Excluir Conta)"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
