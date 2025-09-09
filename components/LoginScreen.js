"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../firebase/config';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInAnonymously, 
    onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Wrench, ChevronRight } from 'lucide-react';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState('customer'); // 'customer' or 'technician'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [checkingAuth, setCheckingAuth] = useState(true);
    const router = useRouter();

    // Check for a persistent session and redirect based on role
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                if (user.isAnonymous) {
                    router.push('/dashboard/customer');
                    return;
                }
                // For registered users, check their role in Firestore
                const userDocRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    const userRole = docSnap.data().role;
                    if (userRole === 'technician') {
                        router.push('/dashboard/technician');
                    } else {
                        router.push('/dashboard/customer');
                    }
                } else {
                    // User exists in auth but not Firestore, likely an error state.
                    // Keep them on the login page.
                    setCheckingAuth(false);
                }
            } else {
                setCheckingAuth(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // The useEffect will handle the redirect
        } catch (error) {
            setError('Invalid email or password.');
            setLoading(false);
        }
    };
    
    const handleSignUp = async () => {
        if (!email || !password) {
            setError('Please enter both email and password to sign up.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            // Create a user document in Firestore with the 'customer' role
            await setDoc(doc(db, "users", user.uid), {
                role: 'customer',
                email: user.email,
                createdAt: new Date(),
            });
            // The useEffect will handle the redirect after signup
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    const handleAnonymousLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await signInAnonymously(auth);
            // The useEffect will handle the redirect
        } catch (error) {
            setError('Could not start a guest session. Please try again.');
            setLoading(false);
        }
    };

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

                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-md">
                        <Button variant={userType === 'customer' ? 'secondary' : 'ghost'} onClick={() => setUserType('customer')}>
                            <User className="h-4 w-4 mr-2" /> Customer
                        </Button>
                        <Button variant={userType === 'technician' ? 'secondary' : 'ghost'} onClick={() => setUserType('technician')}>
                            <Wrench className="h-4 w-4 mr-2" /> Technician
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" placeholder="Enter atleast a 6 digit password." value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3">
                    <Button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                        {loading ? 'Logging In...' : 'Login'}
                    </Button>
                    {userType === 'customer' && (
                        <Button onClick={handleSignUp} disabled={loading} variant="outline" className="w-full bg-blue-600">
                            Don't have an account? Sign Up
                        </Button>
                    )}
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                </CardFooter>
                
                {/* Separator */}
                 <div className="relative my-4 px-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-800 px-2 text-slate-500">
                            Or
                        </span>
                    </div>
                </div>

                {/* Guest Login */}
                <div className="p-6 pt-0">
                    <Button onClick={handleAnonymousLogin} variant="ghost" className="w-full text-slate-300">
                        Continue as Guest <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </Card>
            <div className="text-center py-4 mt-4">
                <p className="text-sm text-slate-500">Mobiflix 2025.</p>
            </div>
        </div>
    );
}
