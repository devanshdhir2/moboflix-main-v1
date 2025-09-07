"use client";

import React, { useState } from 'react';
import { auth, db } from '../firebase/config'; // CORRECTED IMPORT
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState('customer');
    const [loading, setLoading] = useState(false);

    const handleSignUp = () => {
        if (userType !== 'customer') {
            alert('Access Denied: Only customer accounts can be created here.');
            return;
        }
        if (email === '' || password === '') {
            alert('Missing Information: Please enter both email and password.');
            return;
        }
        setLoading(true);
        // CORRECTED: Uses 'auth' which is the correct variable
        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;
                await setDoc(doc(db, "users", user.uid), {
                    role: 'customer',
                    email: user.email
                });
                alert('Success! Customer account created. Please log in.');
            })
            .catch((error) => alert(`Sign Up Error: ${error.message}`))
            .finally(() => setLoading(false));
    };

    const handleLogin = () => {
        if (email === '' || password === '') {
            alert('Missing Information: Please enter both email and password.');
            return;
        }
        setLoading(true);
        // CORRECTED: Uses 'auth' which is the correct variable
        signInWithEmailAndPassword(auth, email, password)
            .catch((error) => alert(`Login Error: Invalid email or password.`))
            .finally(() => setLoading(false));
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 p-4">
            <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white">
                <CardHeader className="text-center">
                    <CardTitle className="text-4xl font-black uppercase tracking-widest">Moboflix</CardTitle>
                    <CardDescription className="text-slate-400">Welcome to Premium At-Home Phone Repair</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-md">
                        <Button variant={userType === 'customer' ? 'secondary' : 'ghost'} onClick={() => setUserType('customer')}>Customer</Button>
                        <Button variant={userType === 'technician' ? 'secondary' : 'ghost'} onClick={() => setUserType('technician')}>Technician</Button>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                    {userType === 'customer' && (
                        <Button variant="link" onClick={handleSignUp} className="text-slate-400">
                            Don't have an account? Sign Up
                        </Button>
                    )}
                </CardFooter>
            </Card>
             <div className="text-center py-4 mt-4">
                <p className="text-sm text-slate-500">
                             </p>
            </div>
        </div>
    );
}

