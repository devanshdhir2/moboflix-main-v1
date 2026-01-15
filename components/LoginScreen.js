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
import {
    User, Wrench, Zap, ShieldCheck, Smartphone, Mail,
    AlertTriangle, ArrowLeft, CheckCircle2, Sun, Moon
} from 'lucide-react';
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
    const [theme, setTheme] = useState('dark'); // 'dark' or 'light'
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
            <div className={theme === 'dark' ? "min-h-screen w-full flex items-center justify-center bg-slate-950" : "min-h-screen w-full flex items-center justify-center"} >
                <Spinner />
            </div>
        );
    }

    // top-level root class
    const rootClass = `min-h-screen w-full flex flex-col lg:flex-row overflow-hidden ${theme === 'dark' ? 'bg-slate-950 text-white' : ''}`;

    // Light-mode hero background exactly from your first file
    const lightHeroBg = {
        background: `radial-gradient(1200px 600px at 10% 20%, rgba(12,78,88,0.45), transparent 8%), radial-gradient(900px 500px at 90% 80%, rgba(139,34,82,0.15), transparent 10%), linear-gradient(180deg, #06343a 0%, #022a2e 100%)`
    };

    return (
        <div className={rootClass} style={{ fontFamily: 'Inter, ui-sans-serif, system-ui' }}>

            {/* Theme toggle (top-right) */}
            <div className="absolute top-4 right-4 z-30">
                <Button
                    variant="ghost"
                    onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                    className="h-9 px-3 flex items-center gap-2"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    <span className="text-sm">{theme === 'light' ? 'Light' : 'Dark'}</span>
                </Button>
            </div>

            {/* --- HERO: visible on mobile and desktop; matches the light theme exactly when theme === 'light' --- */}
            <div
                className={`flex w-full lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-r border-slate-800' : ''}`}
                style={theme === 'light' ? lightHeroBg : undefined}
            >
                {/* dark theme decorative orbs */}
                {theme === 'dark' && (
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
                    </div>
                )}

                {/* light theme layered gradients / waves (exact first-file look) */}
                {theme === 'light' && (
                    <>
                        <div className="absolute inset-0 -z-10" style={lightHeroBg} />
                        <div className="absolute left-[-120px] top-[60%] w-[520px] h-36 transform -rotate-12 bg-gradient-to-r from-cyan-500/40 to-blue-600/30 rounded-lg blur-sm opacity-90" />
                        <div className="absolute right-[-140px] top-12 w-[420px] h-44 transform rotate-12 bg-gradient-to-r from-pink-600/40 to-violet-600/30 rounded-lg blur-sm opacity-95" />
                        <svg className="absolute bottom-0 left-0 opacity-20" width="900" height="300" viewBox="0 0 900 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 200 C150 120 350 280 900 120 L900 300 L0 300 Z" fill="#071f24" />
                        </svg>
                    </>
                )}

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className={`${theme === 'light' ? 'w-12 h-12 bg-gradient-to-br from-cyan-400 to-violet-500 rounded-lg flex items-center justify-center shadow-2xl text-white' : 'w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg text-white'}`}>
                            <span className={`${theme === 'light' ? 'font-bold text-2xl' : 'font-bold text-xl'}`}>M</span>
                        </div>
                        <h1 className={`${theme === 'light' ? 'text-2xl font-bold tracking-tight text-white' : 'text-2xl font-bold tracking-tight'}`}>Moboflix</h1>
                    </div>

                    <h2 className={`${theme === 'light' ? 'text-5xl font-extrabold leading-tight mb-6 text-white' : 'text-3xl sm:text-5xl font-extrabold leading-tight mb-4'}`}>
                        Expert Mobile Repair <br />
                        <span className={`${theme === 'light' ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-pink-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400'}`}>
                            At Your Doorstep.
                        </span>
                    </h2>

                    <p className={`${theme === 'light' ? 'text-slate-300 text-lg max-w-md leading-relaxed' : 'text-slate-400 text-sm sm:text-lg max-w-md leading-relaxed'}`}>
                        Don't let a broken phone slow you down. We bring certified technicians directly to your home.
                    </p>
                </div>

                <div className="relative z-10 space-y-6 mt-8">
                    <div className="flex items-start gap-4">
                        <div className={`${theme === 'light' ? 'p-3 bg-white/6 rounded-xl text-cyan-300' : 'p-3 bg-slate-800 rounded-xl text-blue-400'}`}><Zap className="w-6 h-6" /></div>
                        <div><h3 className={`${theme === 'light' ? 'font-bold text-lg text-white' : 'font-bold text-lg text-white'}`}>Fast & Convenient</h3></div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className={`${theme === 'light' ? 'p-3 bg-white/6 rounded-xl text-emerald-300' : 'p-3 bg-slate-800 rounded-xl text-emerald-400'}`}><ShieldCheck className="w-6 h-6" /></div>
                        <div><h3 className={`${theme === 'light' ? 'font-bold text-lg text-white' : 'font-bold text-lg text-white'}`}>Genuine Parts with Warranty</h3></div>
                    </div>
                </div>

                <div className={`relative z-10 ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'} text-sm mt-8`}>© 2025 Moboflix India Pvt Ltd.</div>
            </div>

            {/* --- FORM: right side, switches appearance based on theme --- */}
            <div className={`${theme === 'light' ? 'w-full lg:w-1/2 flex items-center justify-center p-6 relative bg-gradient-to-b from-white/3 to-white/6' : 'w-full lg:w-1/2 flex items-center justify-center p-6 relative'}`}>
                <div className="absolute inset-0 opacity-5 bg-[url('/patterns/diagonal.svg')] bg-repeat" />

                <Card className={`${theme === 'light' ? 'w-full max-w-md bg-white/95 text-slate-900 rounded-2xl shadow-2xl border border-slate-200/30 backdrop-blur-sm relative z-10' : 'w-full max-w-md bg-slate-900/80 text-white rounded-2xl shadow-2xl border border-slate-800 backdrop-blur-md relative z-10'}`}>

                    {/* --- VERIFICATION SENT --- */}
                    {view === 'verificationSent' && (
                        <CardContent className="pt-10 pb-10 text-center space-y-6">
                            <div className={`${theme === 'light' ? 'w-16 h-16 bg-cyan-50 text-cyan-600' : 'w-16 h-16 bg-blue-600/20 text-blue-500'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                                <Mail className="w-8 h-8" />
                            </div>
                            <h2 className={`${theme === 'light' ? 'text-2xl font-bold text-slate-900' : 'text-2xl font-bold text-white'}`}>Check Your Email</h2>
                            <p className={`${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                                We've sent a verification link to <strong>{email}</strong>.
                                <br />Please click the link in your inbox to verify.
                            </p>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className={`${theme === 'light' ? 'border-slate-200 text-slate-700 hover:text-white hover:bg-slate-800' : 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'}`}
                            >
                                Back to Login
                            </Button>
                        </CardContent>
                    )}

                    {/* --- FORGOT PASSWORD --- */}
                    {view === 'forgotPassword' && (
                        <CardContent className="pt-8 pb-8 space-y-6">
                            <div className="text-center">
                                <h2 className={`${theme === 'light' ? 'text-2xl font-bold text-slate-900 mb-2' : 'text-2xl font-bold text-white mb-2'}`}>Reset Password</h2>
                                <p className={`${theme === 'light' ? 'text-slate-600 text-sm' : 'text-slate-400 text-sm'}`}>Enter your email to receive a reset link.</p>
                            </div>

                            <form onSubmit={handlePasswordReset} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reset-email" className={`${theme === 'light' ? 'text-slate-700' : 'text-slate-300'} text-xs font-bold uppercase`}>Email Address</Label>
                                    <Input
                                        id="reset-email" type="email" placeholder="you@example.com"
                                        value={email} onChange={(e) => setEmail(e.target.value)}
                                        className={`${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'} h-11`}
                                    />
                                </div>

                                {successMessage && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-md flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> {successMessage}
                                    </div>
                                )}
                                {error && (
                                    <div className={`${theme === 'light' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-red-500/10 border border-red-500/20 text-red-400'} text-sm p-3 rounded-md flex items-center gap-2`}>
                                        <AlertTriangle className="w-4 h-4" /> {error}
                                    </div>
                                )}

                                <Button type="submit" disabled={loading} className={`${theme === 'light' ? 'w-full h-11 bg-cyan-600 hover:bg-cyan-700 text-white' : 'w-full h-11 bg-blue-600 hover:bg-blue-700 text-white'}`}>
                                    {loading ? <Spinner /> : 'Send Reset Link'}
                                </Button>
                            </form>

                            <Button
                                onClick={() => { setView('login'); setError(''); setSuccessMessage(''); }}
                                variant="ghost"
                                className={`${theme === 'light' ? 'w-full text-slate-600 hover:text-slate-900' : 'w-full text-slate-400 hover:text-white'}`}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                            </Button>
                        </CardContent>
                    )}

                    {/* --- LOGIN / SIGNUP --- */}
                    {view === 'login' && (
                        <>
                            <CardHeader className="text-center pb-2">
                                <CardTitle className={`${theme === 'light' ? 'text-2xl font-bold text-slate-900' : 'text-2xl font-bold text-white'}`}>Welcome Back</CardTitle>
                                <p className={`${theme === 'light' ? 'text-slate-600 text-sm mt-2' : 'text-slate-400 text-sm mt-2'}`}>Log in to manage your repairs.</p>
                            </CardHeader>

                            <CardContent className="space-y-6 pt-6">
                                <div className={`grid grid-cols-2 gap-2 ${theme === 'light' ? 'bg-slate-50 p-1 rounded-lg border border-slate-100' : 'bg-slate-950 p-1 rounded-lg border border-slate-800'}`}>
                                    <Button
                                        variant="ghost" size="sm" onClick={() => { setUserType('customer'); setError(''); }}
                                        className={`text-sm font-medium transition-all ${userType === 'customer' ? (theme === 'light' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'bg-slate-800 text-white shadow-sm') : (theme === 'light' ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200')}`}
                                    >
                                        <User className="h-4 w-4 mr-2" /> Customer
                                    </Button>
                                    <Button
                                        variant="ghost" size="sm" onClick={() => { setUserType('technician'); setError(''); }}
                                        className={`text-sm font-medium transition-all ${userType === 'technician' ? (theme === 'light' ? 'bg-cyan-50 text-cyan-600 shadow-sm' : 'bg-blue-600/20 text-blue-400 shadow-sm') : (theme === 'light' ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200')}`}
                                    >
                                        <Wrench className="h-4 w-4 mr-2" /> Staff
                                    </Button>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className={`${theme === 'light' ? 'text-slate-700' : 'text-slate-300'} text-xs font-bold uppercase`}>Email</Label>
                                        <Input
                                            id="email" type="email" placeholder="you@example.com"
                                            value={email} onChange={(e) => setEmail(e.target.value)}
                                            className={`${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500' : 'bg-slate-950 border-slate-700 text-white focus:border-blue-500'} h-11`}
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label htmlFor="password" className={`${theme === 'light' ? 'text-slate-700' : 'text-slate-300'} text-xs font-bold uppercase`}>Password</Label>
                                            <span
                                                onClick={() => { setView('forgotPassword'); setError(''); }}
                                                className={`${theme === 'light' ? 'text-cyan-600' : 'text-blue-400'} text-xs cursor-pointer hover:underline`}
                                            >
                                                Forgot password?
                                            </span>
                                        </div>
                                        <Input
                                            id="password" type="password" placeholder="••••••••"
                                            value={password} onChange={(e) => setPassword(e.target.value)}
                                            className={`${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500' : 'bg-slate-950 border-slate-700 text-white focus:border-blue-500'} h-11`}
                                            disabled={loading}
                                        />
                                    </div>

                                    {error && (
                                        <div className={`${theme === 'light' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-red-500/10 border border-red-500/20 text-red-400'} text-sm p-3 rounded-md flex items-center gap-2`}>
                                            <AlertTriangle className="w-4 h-4" /> {error}
                                        </div>
                                    )}

                                    <Button type="submit" disabled={loading} className={`${theme === 'light' ? 'w-full h-11 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-base shadow' : 'w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg'}`}>
                                        {loading ? <Spinner /> : 'Log In'}
                                    </Button>
                                </form>

                                {userType === 'customer' && (
                                    <>
                                        <div className="relative w-full py-2">
                                            <div className="absolute inset-0 flex items-center"><span className={`w-full border-t ${theme === 'light' ? 'border-slate-100' : 'border-slate-800'}`} /></div>
                                            <div className="relative flex justify-center text-xs uppercase"><span className={`${theme === 'light' ? 'bg-white px-2 text-slate-400' : 'bg-slate-900 px-2 text-slate-500'}`}>Or continue with</span></div>
                                        </div>

                                        <Button onClick={handleGoogleLogin} variant="outline" className={`${theme === 'light' ? 'w-full h-11 border-slate-200 bg-white hover:bg-slate-50 text-slate-800' : 'w-full h-11 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white'}`}>
                                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                            Sign in with Google
                                        </Button>
                                    </>
                                )}
                            </CardContent>

                            <CardFooter className="flex flex-col gap-4 pt-2">
                                {userType === 'customer' && (
                                    <>
                                        <div className={`${theme === 'light' ? 'text-center text-sm text-slate-600' : 'text-center text-sm text-slate-500'}`}>
                                            Don't have an account?{' '}
                                            <button onClick={handleSignUp} className={`${theme === 'light' ? 'text-cyan-600 hover:text-cyan-500' : 'text-blue-400 hover:text-blue-300'} font-medium hover:underline`}>
                                                Sign up & Verify
                                            </button>
                                        </div>

                                        <Button onClick={handleAnonymousLogin} variant="ghost" className={`${theme === 'light' ? 'w-full text-slate-600 hover:text-slate-900' : 'w-full text-slate-400 hover:text-white'}`}>
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
