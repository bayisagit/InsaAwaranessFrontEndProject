'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, apiFetch, clearTokens, getTokens, logoutUser } from '@/lib/api';

interface AuthContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    isAuthenticated: boolean;
    isLoading: boolean;
    /** True when the backend sets must_change_password=true (e.g. first-login forced change). */
    mustChangePassword: boolean;
    logout: () => void;
    checkAuth: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async (): Promise<User | null> => {
        setIsLoading(true);
        const tokens = getTokens();
        if (!tokens?.access) {
            setUser(null);
            setIsLoading(false);
            return null;
        }

        const { data, status } = await apiFetch<User>('/api/auth/me/');
        if (status === 200 && data) {
            setUser(data);
            setIsLoading(false);
            return data;
        } else {
            setUser(null);
            clearTokens();
            setIsLoading(false);
            return null;
        }
    };

    useEffect(() => {
        checkAuth();

        const handleUnauthorized = () => {
            setUser(null);
            // Optional: redirect to login
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);

    const logout = useCallback(async () => {
        const tokens = getTokens();
        if (tokens?.refresh) {
            await logoutUser(tokens.refresh).catch(() => {});
        }
        clearTokens();
        setUser(null);
        window.location.href = '/login';
    }, []);

    const value = {
        user,
        setUser,
        isAuthenticated: !!user,
        isLoading,
        mustChangePassword: !!user?.must_change_password,
        logout,
        checkAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
