"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
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
    AlertTriangle, ArrowLeft, CheckCircle2, Phone
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

    // Helper for WhatsApp link
    const whatsappLink = "https://wa.me/918360003700";

    if (checkingAuth) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
                <Spinner />
            </div>
        );
    }

    // Hero background style (Permanent Light Mode)
    const heroBg = {
        background: `radial-gradient(1200px 600px at 10% 20%, rgba(12,78,88,0.45), transparent 8%), radial-gradient(900px 500px at 90% 80%, rgba(139,34,82,0.15), transparent 10%), linear-gradient(180deg, #06343a 0%, #022a2e 100%)`
    };

    return (
        // KEY CHANGE: flex-col-reverse puts the 2nd child (Login) first on mobile.
        // lg:flex-row puts the 1st child (Hero) on the left on desktop.
        <div className="min-h-screen w-full flex flex-col-reverse lg:flex-row overflow-hidden bg-slate-50 text-slate-900" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui' }}>

            {/* --- HERO SECTION (Child 1) --- 
                On Mobile: Displays at bottom (due to flex-col-reverse).
                On Desktop: Displays on Left. 
            */}
            <div
                className="flex w-full lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
                style={heroBg}
            >
                {/* Layered gradients/waves */}
                <div className="absolute inset-0 -z-10" style={heroBg} />
                <div className="absolute left-[-120px] top-[60%] w-[520px] h-36 transform -rotate-12 bg-gradient-to-r from-cyan-500/40 to-blue-600/30 rounded-lg blur-sm opacity-90" />
                <div className="absolute right-[-140px] top-12 w-[420px] h-44 transform rotate-12 bg-gradient-to-r from-pink-600/40 to-violet-600/30 rounded-lg blur-sm opacity-95" />
                <svg className="absolute bottom-0 left-0 opacity-20" width="900" height="300" viewBox="0 0 900 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 200 C150 120 350 280 900 120 L900 300 L0 300 Z" fill="#071f24" />
                </svg>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-violet-500 rounded-lg flex items-center justify-center shadow-2xl text-white overflow-hidden">
                            <Image
                                src="/mobologo.png"
                                alt="Moboflix"
                                width={44}
                                height={44}
                                style={{ objectFit: "contain" }}
                                priority
                            />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">Moboflix</h1>
                    </div>

                    <h2 className="text-5xl font-extrabold leading-tight mb-6 text-white">
                        Expert Mobile Repair <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-pink-400">
                            At Your Doorstep.
                        </span>
                    </h2>

                    <p className="text-slate-300 text-lg max-w-md leading-relaxed">
                        Don't let a broken phone slow you down. We bring certified technicians directly to your home.
                    </p>
                </div>

                <div className="relative z-10 space-y-6 mt-8">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/10 rounded-xl text-cyan-300"><Zap className="w-6 h-6" /></div>
                        <div><h3 className="font-bold text-lg text-white">Fast & Convenient</h3></div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/10 rounded-xl text-emerald-300"><ShieldCheck className="w-6 h-6" /></div>
                        <div><h3 className="font-bold text-lg text-white">Genuine Parts with Warranty</h3></div>
                    </div>
                </div>

                <div className="relative z-10 text-slate-400 text-sm mt-8">© 2025 Moboflix India Pvt Ltd.</div>
            </div>

            {/* --- FORM SECTION (Child 2) --- 
                On Mobile: Displays at Top (due to flex-col-reverse).
                On Desktop: Displays on Right.
            */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative bg-gradient-to-b from-white/30 to-white/60">
                <div className="absolute inset-0 opacity-5 bg-[url('/patterns/diagonal.svg')] bg-repeat" />

                <Card className="w-full max-w-md bg-white/95 text-slate-900 rounded-2xl shadow-2xl border border-slate-200/30 backdrop-blur-sm relative z-10">

                    {/* --- VERIFICATION SENT --- */}
                    {view === 'verificationSent' && (
                        <CardContent className="pt-10 pb-10 text-center space-y-6">
                            <div className="w-16 h-16 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Check Your Email</h2>
                            <p className="text-slate-600">
                                We've sent a verification link to <strong>{email}</strong>.
                                <br />Please click the link in your inbox to verify.
                            </p>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="border-slate-200 text-slate-700 hover:text-white hover:bg-slate-800"
                            >
                                Back to Login
                            </Button>
                        </CardContent>
                    )}

                    {/* --- FORGOT PASSWORD --- */}
                    {view === 'forgotPassword' && (
                        <CardContent className="pt-8 pb-8 space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h2>
                                <p className="text-slate-600 text-sm">Enter your email to receive a reset link.</p>
                            </div>

                            <form onSubmit={handlePasswordReset} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reset-email" className="text-slate-700 text-xs font-bold uppercase">Email Address</Label>
                                    <Input
                                        id="reset-email" type="email" placeholder="you@example.com"
                                        value={email} onChange={(e) => setEmail(e.target.value)}
                                        className="bg-slate-50 border-slate-200 text-slate-900 h-11"
                                    />
                                </div>

                                {successMessage && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-md flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> {successMessage}
                                    </div>
                                )}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-md flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> {error}
                                    </div>
                                )}

                                <Button type="submit" disabled={loading} className="w-full h-11 bg-cyan-600 hover:bg-cyan-700 text-white">
                                    {loading ? <Spinner /> : 'Send Reset Link'}
                                </Button>
                            </form>

                            <Button
                                onClick={() => { setView('login'); setError(''); setSuccessMessage(''); }}
                                variant="ghost"
                                className="w-full text-slate-600 hover:text-slate-900"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                            </Button>
                        </CardContent>
                    )}

                    {/* --- LOGIN / SIGNUP --- */}
                    {view === 'login' && (
                        <>
                            <CardHeader className="text-center pb-2 flex flex-col items-center">
                                {/* Phone Number Link (Green Pill) */}
                                <a
                                    href={whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-medium mb-4 transition-colors text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full"
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>+91 8360003700</span>
                                </a>

                                <CardTitle className="text-2xl font-bold text-slate-900">Welcome Back</CardTitle>
                                <p className="text-slate-600 text-sm mt-2">Log in to manage your repairs.</p>
                            </CardHeader>

                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                                    <Button
                                        variant="ghost" size="sm" onClick={() => { setUserType('customer'); setError(''); }}
                                        className={`text-sm font-medium transition-all ${userType === 'customer' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <User className="h-4 w-4 mr-2" /> Customer
                                    </Button>
                                    <Button
                                        variant="ghost" size="sm" onClick={() => { setUserType('technician'); setError(''); }}
                                        className={`text-sm font-medium transition-all ${userType === 'technician' ? 'bg-cyan-50 text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Wrench className="h-4 w-4 mr-2" /> Staff
                                    </Button>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-slate-700 text-xs font-bold uppercase">Email</Label>
                                        <Input
                                            id="email" type="email" placeholder="you@example.com"
                                            value={email} onChange={(e) => setEmail(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500 h-11"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label htmlFor="password" className="text-slate-700 text-xs font-bold uppercase">Password</Label>
                                            <span
                                                onClick={() => { setView('forgotPassword'); setError(''); }}
                                                className="text-cyan-600 text-xs cursor-pointer hover:underline"
                                            >
                                                Forgot password?
                                            </span>
                                        </div>
                                        <Input
                                            id="password" type="password" placeholder="••••••••"
                                            value={password} onChange={(e) => setPassword(e.target.value)}
                                            className="bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500 h-11"
                                            disabled={loading}
                                        />
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-md flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> {error}
                                        </div>
                                    )}

                                    <Button type="submit" disabled={loading} className="w-full h-11 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-base shadow">
                                        {loading ? <Spinner /> : 'Log In'}
                                    </Button>
                                </form>

                                {userType === 'customer' && (
                                    <>
                                        <div className="relative w-full py-2">
                                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Or continue with</span></div>
                                        </div>

                                        <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-11 border-slate-200 bg-white hover:bg-slate-50 text-slate-800">
                                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                            Sign in with Google
                                        </Button>
                                    </>
                                )}
                            </CardContent>

                            <CardFooter className="flex flex-col gap-4 pt-2">
                                {userType === 'customer' && (
                                    <>
                                        <div className="text-center text-sm text-slate-600">
                                            Don't have an account?{' '}
                                            <button onClick={handleSignUp} className="text-cyan-600 hover:text-cyan-500 font-medium hover:underline">
                                                Sign up & Verify
                                            </button>
                                        </div>

                                        <Button onClick={handleAnonymousLogin} variant="ghost" className="w-full text-slate-600 hover:text-slate-900">
                                            <Smartphone className="h-4 w-4 mr-2" /> Continue as Guest
                                        </Button>
                                    </>
                                )}
                            </CardFooter>
                        </>
                    )}
                </Card>
            </div>

            {/* --- Floating WhatsApp Button (Bottom Right) --- */}
            <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20bd5a] text-white p-3 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center border-2 border-white/20"
                aria-label="Chat on WhatsApp"
            >
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
            </a>
        </div>
    );
}
