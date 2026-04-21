import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, KeyRound, AlertTriangle } from 'lucide-react';

export default function ResetPassword({ session }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    // O Supabase processa o hash (#access_token=...) e atrela uma sessão automaticamente.
    // Assim que a página carrega confirmamos a validade:
    useEffect(() => {
        // Se a pessoa acessou a página diretamente (sem hash de recovery e sem sessão na memória)
        if (!session && !window.location.hash.includes('type=recovery')) {
            setError('Link inválido, expirado ou você não tem permissão para acessar esta requisição.');
        }
    }, [session]);

    const handleReset = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            setError('A nova senha deve ter no mínimo 6 caracteres.');
            return;
        }

        setLoading(true);

        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        });

        setLoading(false);

        if (updateError) {
            setError(updateError.message);
        } else {
            setSuccess(true);
        }
    };

    return (
        <div className="min-h-screen bg-[#0E0F12] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#13151A] border border-[#1C1F26] rounded-xl p-8 shadow-2xl">
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#E8B923] to-[#B38D1B] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(232,185,35,0.2)]">
                        <KeyRound className="w-6 h-6 text-[#0E0F12]" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center text-[#F8FAFC] mb-2 tracking-tight">Redefinir Senha</h2>
                
                {success ? (
                    <div className="text-center">
                        <p className="text-[#94A3B8] text-sm mb-6">Sua senha foi redefinida com sucesso. Você já pode acessar a plataforma normalmente.</p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full bg-[#E8B923] hover:bg-[#FCD34D] text-[#0E0F12] font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Ir para o Painel
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="text-center text-[#94A3B8] text-sm mb-6">
                            Digite a sua nova senha abaixo. Evite usar senhas antigas.
                        </p>

                        {error && (
                            <div className="mb-6 bg-[#F87171]/10 border border-[#F87171]/20 rounded-lg p-4 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-[#F87171] shrink-0 mt-0.5" />
                                <p className="text-[#F87171] text-sm leading-tight">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleReset} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5 uppercase tracking-wider">Nova Senha</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#0E0F12] border border-[#1C1F26] rounded-lg px-4 py-3 text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#E8B923] focus:ring-1 focus:ring-[#E8B923] transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5 uppercase tracking-wider">Confirmar Nova Senha</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-[#0E0F12] border border-[#1C1F26] rounded-lg px-4 py-3 text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#E8B923] focus:ring-1 focus:ring-[#E8B923] transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || (!session && !window.location.hash.includes('type=recovery'))}
                                className="w-full bg-gradient-to-r from-[#E8B923] to-[#B38D1B] hover:from-[#FCD34D] hover:to-[#E8B923] disabled:opacity-50 disabled:cursor-not-allowed text-[#0E0F12] font-bold py-3 px-4 rounded-lg transition-all shadow-[0_0_15px_rgba(232,185,35,0.15)] mt-2"
                            >
                                {loading ? 'Salvando...' : 'Salvar Nova Senha'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
