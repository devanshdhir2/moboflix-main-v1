"use client";

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { auth } from '../../firebase/config';
import Spinner from '../../components/Spinner';
import { Button } from "@/components/ui/button";
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
            // IMPORTANT: This uses window.confirm as a placeholder for the logic.
            // In your real application, you should replace this with a custom, beautifully styled modal
            // component that explains the consequences to the user.
            const confirmation = window.confirm(
                "Switching accounts will permanently sign you out of this guest session. Your current tickets will no longer be accessible on this device. Are you sure you want to continue?"
            );

            if (confirmation) {
                await auth.signOut(); // This permanently deletes the anonymous user
                router.push('/');
            }
            // If the user clicks 'Cancel', we do nothing.
        } else {
            // For regular (technician) users, a standard sign-out is fine.
            await auth.signOut();
            router.push('/');
        }
    };

    if (loading || !user) {
        return <Spinner />;
    }

    const getRoleName = () => {
        if (user && user.isAnonymous) {
            return 'Customer';
        }
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
                            <Button onClick={handleLogout}>
                                {user && user.isAnonymous ? 'Switch to Technician Account' : 'Sign Out'}
                            </Button>
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

