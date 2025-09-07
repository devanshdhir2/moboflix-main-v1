"use client";

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { auth } from '../../firebase/config'; // CORRECTED IMPORT
import Spinner from '../../components/Spinner';
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }) {
    const { user, userRole, loading } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        // CORRECTED: Uses 'auth' which is the correct variable
        await auth.signOut();
        router.push('/');
    };

    if (loading) return <Spinner />;
    if (!user) {
        if (typeof window !== 'undefined') router.push('/');
        return <Spinner />;
    }

    const getRoleName = () => {
        if (!userRole) return '';
        return userRole.charAt(0).toUpperCase() + userRole.slice(1);
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white shadow-sm sticky top-0 z-50 border-b">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex-shrink-0">
                            <h1 className="text-2xl font-bold text-slate-800">Moboflix</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-slate-500 hidden sm:block p-2 bg-slate-100 rounded-md">
                                {getRoleName()} Portal
                            </span>
                            <Button onClick={handleLogout}>Sign Out</Button>
                        </div>
                    </div>
                </nav>
            </header>
            <main className="p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}

