"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../firebase/config';
import { signInWithEmailAndPassword, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Wrench } from 'lucide-react';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [checkingAuth, setCheckingAuth] = useState(true); // State to check for existing session
    const router = useRouter();

    // Check for a persistent session when the component loads
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // A user is already signed in. Let's redirect them.
                if (user.isAnonymous) {
                    router.push('/dashboard/customer');
                } else {
                    // Assumes non-anonymous users are technicians
                    router.push('/dashboard/technician');
                }
            } else {
                // No user is signed in. Show the login page.
                setCheckingAuth(false);
            }
        });

        // Cleanup subscription on component unmount
        return () => unsubscribe();
    }, [router]);

    const handleAnonymousLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await signInAnonymously(auth);
            router.push('/dashboard/customer');
        } catch (error) {
            console.error("Anonymous Sign In Error:", error);
            setError(`Error: Could not start session. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const handleTechnicianLogin = () => {
        if (email === '' || password === '') {
            setError('Please enter both email and password.');
            return;
        }
        setLoading(true);
        setError('');
        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                router.push('/dashboard/technician');
            })
            .catch((error) => {
                console.error("Technician Login Error:", error);
                setError('Login Error: Invalid email or password.');
            })
            .finally(() => setLoading(false));
    };

    // Show a loading screen while we check for an existing session
    if (checkingAuth) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-slate-900">
                <p className="text-white animate-pulse">Loading Session...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 p-4">
            <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white">
                <CardHeader className="text-center">
                    <CardTitle className="text-4xl font-black uppercase tracking-widest text-white">Moboflix</CardTitle>
                    <CardDescription className="text-slate-400">Premium At-Home Mobile Repair</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div>
                        <Button
                            onClick={handleAnonymousLogin}
                            disabled={loading}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-bold text-white flex items-center gap-2"
                        >
                            <User className="h-5 w-5" />
                            {loading ? 'Starting Session...' : 'Continue as Customer'}
                        </Button>
                        <p className="text-center text-xs text-slate-500 mt-2">No account needed. Fast & easy booking.</p>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-slate-800 px-2 text-slate-500">
                                Or
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-400">
                            <Wrench className="h-4 w-4" />
                            Technician Login
                        </h3>
                        <div className="space-y-2">
                            <Label htmlFor="email">Technician Email</Label>
                            <Input id="email" type="email" placeholder="tech@moboflix.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                     <Button onClick={handleTechnicianLogin} disabled={loading} className="w-full bg-slate-700 hover:bg-slate-600">
                        {loading ? 'Logging in...' : 'Login as Technician'}
                    </Button>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                </CardFooter>
            </Card>
             <div className="text-center py-4 mt-4">
                <p className="text-sm text-slate-500">
Mobiflix 2025.                </p>
            </div>
        </div>
    );
}
