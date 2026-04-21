import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'

export default function App() {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setLoading(false)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-16 h-16 relative flex items-center justify-center">
                    <span className="absolute w-full h-full border-2 border-yellow-500 rounded-full border-t-transparent animate-spin"></span>
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded flex items-center justify-center font-bold text-black text-xl shadow-lg shadow-yellow-500/20">
                        E
                    </div>
                </div>
            </div>
        )
    }

    if (!session) {
        return <Auth />
    }

    return <Dashboard session={session} />
}
