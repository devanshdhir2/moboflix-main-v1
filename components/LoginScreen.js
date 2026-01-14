"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../firebase/config';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInAnonymously,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendEmailVerification,
    sendPasswordResetEmail,
    signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Wrench, ChevronRight, Zap, ShieldCheck, Smartphone, Mail, AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Spinner from './Spinner';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState('customer'); // 'customer' or 'technician'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [view, setView] = useState('login'); // 'login', 'forgotPassword', 'verificationSent'
    const [checkingAuth, setCheckingAuth] = useState(true);
    const router = useRouter();

    // Check for existing session
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // If user is email/password and NOT verified, force logout
                if (!user.isAnonymous && !user.emailVerified && user.providerData[0]?.providerId === 'password') {
                    if (view !== 'verificationSent') {
                        await signOut(auth);
                    }
                    setCheckingAuth(false);
                    return;
                }

                if (user.isAnonymous) {
                    router.push('/dashboard/customer');
                    return;
                }

                // Check Role
                const userDocRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    const userRole = docSnap.data().role;
                    if (userRole === 'technician') router.push('/dashboard/technician');
                    else if (userRole === 'owner') router.push('/dashboard/owner');
                    else router.push('/dashboard/customer');
                } else {
                    setCheckingAuth(false);
                }
            } else {
                setCheckingAuth(false);
            }
        });
        return () => unsubscribe();
    }, [router, view]);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                await signOut(auth);
                setError('Email not verified. Please check your inbox.');
                setLoading(false);
                return;
            }
        } catch (error) {
            console.error(error);
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

            await sendEmailVerification(user);

            await setDoc(doc(db, "users", user.uid), {
                role: 'customer',
                email: user.email,
                createdAt: new Date(),
            });

            setView('verificationSent');
            setLoading(false);

        } catch (error) {
            // Handle "Email already in use" specifically
            if (error.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please Log In or Reset Password.');
            } else {
                setError(error.message);
            }
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address first.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            await sendPasswordResetEmail(auth, email);
            setSuccessMessage('Password reset link sent! Check your inbox.');
            setLoading(false);
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);

            if (!docSnap.exists()) {
                await setDoc(userDocRef, {
                    role: 'customer',
                    email: user.email,
                    name: user.displayName,
                    createdAt: new Date(),
                });
            }
        } catch (error) {
            console.error(error);
            setError('Google Sign-In failed.');
            setLoading(false);
        }
    };

    const handleAnonymousLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await signInAnonymously(auth);
        } catch (error) {
            setError('Guest login failed.');
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-slate-950">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex bg-slate-950 text-white overflow-hidden">

            {/* --- LEFT SIDE: HERO --- */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-between p-12 border-r border-slate-800">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="font-bold text-xl">M</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Moboflix</h1>
                    </div>
                    <h2 className="text-5xl font-extrabold leading-tight mb-6">
                        Expert Mobile Repair <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                            At Your Doorstep.
                        </span>
                    </h2>
                    <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                        Don't let a broken phone slow you down. We bring certified technicians directly to your home.
                    </p>
                </div>
                <div className="relative z-10 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-800 rounded-xl text-blue-400"><Zap className="w-6 h-6" /></div>
                        <div><h3 className="font-bold text-lg text-white">Fast & Convenient</h3></div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-800 rounded-xl text-emerald-400"><ShieldCheck className="w-6 h-6" /></div>
                        <div><h3 className="font-bold text-lg text-white">Genuine Parts with Warranty</h3></div>
                    </div>
                </div>
                <div className="relative z-10 text-slate-500 text-sm">© 2025 Moboflix India Pvt Ltd.</div>
            </div>

            {/* --- RIGHT SIDE: FORM --- */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
                <div className="absolute inset-0 bg-grid-slate-800/[0.2] bg-[size:30px_30px] opacity-20"></div>

                <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border-slate-800 shadow-2xl relative z-10">

                    {/* --- VIEW: VERIFICATION SENT --- */}
                    {view === 'verificationSent' && (
                        <CardContent className="pt-10 pb-10 text-center space-y-6">
                            <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Check Your Email</h2>
                            <p className="text-slate-400">
                                We've sent a verification link to <strong>{email}</strong>.
                                <br />Please click the link in your inbox to verify.
                            </p>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                            >
                                Back to Login
                            </Button>
                        </CardContent>
                    )}

                    {/* --- VIEW: FORGOT PASSWORD --- */}
                    {view === 'forgotPassword' && (
                        <CardContent className="pt-8 pb-8 space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                                <p className="text-slate-400 text-sm">Enter your email to receive a reset link.</p>
                            </div>

                            <form onSubmit={handlePasswordReset} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reset-email" className="text-slate-300 text-xs font-bold uppercase">Email Address</Label>
                                    <Input
                                        id="reset-email" type="email" placeholder="you@example.com"
                                        value={email} onChange={(e) => setEmail(e.target.value)}
                                        className="bg-slate-950 border-slate-700 text-white h-11"
                                    />
                                </div>

                                {successMessage && (
                                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-3 rounded-md flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> {successMessage}
                                    </div>
                                )}
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-md flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> {error}
                                    </div>
                                )}

                                <Button type="submit" disabled={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white">
                                    {loading ? <Spinner /> : 'Send Reset Link'}
                                </Button>
                            </form>

                            <Button
                                onClick={() => { setView('login'); setError(''); setSuccessMessage(''); }}
                                variant="ghost"
                                className="w-full text-slate-400 hover:text-white"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                            </Button>
                        </CardContent>
                    )}

                    {/* --- VIEW: LOGIN / SIGNUP --- */}
                    {view === 'login' && (
                        <>
                            <CardHeader className="text-center pb-2">
                                <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
                                <p className="text-slate-400 text-sm mt-2">Log in to manage your repairs.</p>
                            </CardHeader>

                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                                    <Button
                                        variant="ghost" size="sm" onClick={() => { setUserType('customer'); setError(''); }}
                                        className={`text-sm font-medium transition-all ${userType === 'customer' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        <User className="h-4 w-4 mr-2" /> Customer
                                    </Button>
                                    <Button
                                        variant="ghost" size="sm" onClick={() => { setUserType('technician'); setError(''); }}
                                        className={`text-sm font-medium transition-all ${userType === 'technician' ? 'bg-blue-600/20 text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        <Wrench className="h-4 w-4 mr-2" /> Staff
                                    </Button>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-slate-300 text-xs font-bold uppercase">Email</Label>
                                        <Input
                                            id="email" type="email" placeholder="you@example.com"
                                            value={email} onChange={(e) => setEmail(e.target.value)}
                                            className="bg-slate-950 border-slate-700 text-white focus:border-blue-500 h-11"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label htmlFor="password" className="text-slate-300 text-xs font-bold uppercase">Password</Label>
                                            <span
                                                onClick={() => { setView('forgotPassword'); setError(''); }}
                                                className="text-xs text-blue-400 cursor-pointer hover:underline"
                                            >
                                                Forgot password?
                                            </span>
                                        </div>
                                        <Input
                                            id="password" type="password" placeholder="••••••••"
                                            value={password} onChange={(e) => setPassword(e.target.value)}
                                            className="bg-slate-950 border-slate-700 text-white focus:border-blue-500 h-11"
                                            disabled={loading}
                                        />
                                    </div>

                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-md flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> {error}
                                        </div>
                                    )}

                                    <Button type="submit" disabled={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg">
                                        {loading ? <Spinner /> : 'Log In'}
                                    </Button>
                                </form>

                                {userType === 'customer' && (
                                    <>
                                        <div className="relative w-full py-2">
                                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800" /></div>
                                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Or continue with</span></div>
                                        </div>

                                        <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-11 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white">
                                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                            Sign in with Google
                                        </Button>
                                    </>
                                )}
                            </CardContent>

                            <CardFooter className="flex flex-col gap-4 pt-2">
                                {userType === 'customer' && (
                                    <>
                                        <div className="text-center text-sm text-slate-500">
                                            Don't have an account?{' '}
                                            <button onClick={handleSignUp} className="text-blue-400 hover:text-blue-300 font-medium hover:underline">
                                                Sign up & Verify
                                            </button>
                                        </div>

                                        <Button onClick={handleAnonymousLogin} variant="ghost" className="w-full text-slate-400 hover:text-white">
                                            <Smartphone className="h-4 w-4 mr-2" /> Continue as Guest
                                        </Button>
                                    </>
                                )}
                            </CardFooter>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}