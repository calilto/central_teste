import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { AlertTriangle, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react'

export default function Auth() {
    const [loading, setLoading] = useState(false)
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState({ type: '', text: '' })

    const handleAuth = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ type: '', text: '' })

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
            } else {
                if (!email.toLowerCase().endsWith('@eurostock.com.br')) {
                    throw new Error('Cadastro restrito a e-mails corporativos (@eurostock.com.br).')
                }
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                setMessage({ type: 'success', text: 'Conta criada! Verifique seu e-mail (se aplicável no seu Supabase) ou faça login.' })
                setIsLogin(true)
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.error_description || error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-gray-100 font-sans flex flex-col items-center justify-center relative overflow-hidden selection:bg-yellow-500 selection:text-black">

            {/* Background Decorators */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-20">
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-yellow-600/20 blur-[120px]"></div>
                <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-yellow-500/10 blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md z-10 px-4 animate-fadeIn">
                <div className="flex flex-col items-center gap-1 mb-8">
                    <img src="/euro-logo.png" alt="Eurostock Logo" className="h-[80px] object-contain drop-shadow-[0_0_15px_rgba(234,179,8,0.2)]" />
                    <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-2">Mesa de Renda Variável • XP</p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl p-6 md:p-8 relative">

                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-white mb-1">
                            {isLogin ? 'Acesso ao Sistema' : 'Criar Conta'}
                        </h2>
                        <p className="text-sm text-gray-400">
                            {isLogin ? 'Entre com as suas credenciais para acessar os simuladores estruturais.' : 'Cadastre-se para acessar o ambiente da Mesa RV.'}
                        </p>
                    </div>

                    {message.text && (
                        <div className={`mb-6 p-4 rounded-md border text-sm flex items-start gap-3 ${message.type === 'error' ? 'bg-red-900/30 border-red-800 text-red-400' : 'bg-green-900/30 border-green-800 text-green-400'}`}>
                            <AlertTriangle className="w-5 h-5 mt-0 flex-shrink-0" />
                            <span className="leading-tight">{message.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1 ml-1">E-mail Corporativo</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black border border-gray-700 rounded p-2.5 pl-10 text-sm text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all placeholder-gray-600"
                                    placeholder="nome@eurostock.com.br"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1 ml-1">Senha</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-gray-500" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black border border-gray-700 rounded p-2.5 pl-10 text-sm text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all placeholder-gray-600"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded transition-all flex justify-center items-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    {isLogin ? 'Entrar na Plataforma' : 'Finalizar Cadastro'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-800 text-center">
                        <p className="text-sm text-gray-400">
                            {isLogin ? 'Não possui acesso? ' : 'Já tem uma conta? '}
                            <button
                                type="button"
                                onClick={() => { setIsLogin(!isLogin); setMessage({ type: '', text: '' }); }}
                                className="text-yellow-500 hover:text-yellow-400 font-bold underline decoration-yellow-500/30 underline-offset-4"
                            >
                                {isLogin ? 'Crie clicando aqui' : 'Faça login aqui'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 flex justify-center items-center gap-2 text-gray-600 text-[10px] uppercase font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Ambiente Restrito e Seguro</span>
                </div>
            </div>
        </div>
    )
}
