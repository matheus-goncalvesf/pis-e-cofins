import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("AuthProvider: Initializing auth..."); // DEBUG

        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            console.warn("AuthProvider: Session check timed out, setting loading to false");
            setLoading(false);
        }, 5000); // 5 segundos

        // Get initial session
        supabase.auth.getSession()
            .then(({ data: { session }, error }) => {
                console.log("AuthProvider: Got session", { session, error }); // DEBUG
                if (error) {
                    console.error("AuthProvider: Error getting session:", error);
                }
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
                clearTimeout(timeout);
            })
            .catch((error) => {
                console.error("AuthProvider: Fatal error getting session:", error);
                setLoading(false);
                clearTimeout(timeout);
            });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("AuthProvider: Auth state changed", { _event, session }); // DEBUG
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
