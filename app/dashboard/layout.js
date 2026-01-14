"use client";

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { auth } from '../../firebase/config';
import Spinner from '../../components/Spinner';
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle } from 'lucide-react';
import "leaflet/dist/leaflet.css";

export default function DashboardLayout({ children }) {
    const { user, userRole, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    const handleLogout = async () => {
        if (user && user.isAnonymous) {
            const confirmation = window.confirm(
                "Switching accounts will permanently sign you out of this guest session. Your current tickets will no longer be accessible on this device. Are you sure you want to continue?"
            );

            if (confirmation) {
                await auth.signOut();
                router.push('/');
            }
        } else {
            await auth.signOut();
            router.push('/');
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    const getRoleName = () => {
        if (user && user.isAnonymous) return 'Guest';
        if (!userRole) return '';
        return userRole.charAt(0).toUpperCase() + userRole.slice(1);
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
            {/* --- HEADER --- */}
            <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 transition-all duration-300">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">

                        {/* Logo Area */}
                        <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard/customer')}>
                            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <span className="font-bold text-white text-lg">M</span>
                            </div>
                            <h1 className="text-xl font-bold text-white tracking-tight">
                                Moboflix
                            </h1>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center space-x-4">
                            {/* Role Badge */}
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-full">
                                <UserCircle className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                                    {getRoleName()} Portal
                                </span>
                            </div>

                            {/* Logout Button */}
                            <Button
                                onClick={handleLogout}
                                variant="ghost"
                                className="text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                                <LogOut className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">
                                    {user && user.isAnonymous ? 'Switch Account' : 'Sign Out'}
                                </span>
                            </Button>
                        </div>
                    </div>
                </nav>
            </header>

            {/* --- MAIN CONTENT --- */}
            {/* IMPORTANT: Padding removed here so the Hero section can touch the edges */}
            <main>
                {children}
            </main>
        </div>
    );
}