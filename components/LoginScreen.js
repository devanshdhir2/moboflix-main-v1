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
    const [userType, setUserType] = useState('customer');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [view, setView] = useState('login');
    const [checkingAuth, setCheckingAuth] = useState(true);
    const router = useRouter();

    // Check for existing session
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
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

    const whatsappLink = "https://wa.me/918360003700";

    if (checkingAuth) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-black">
                <Spinner />
            </div>
        );
    }

    // Black & Gold Hero Gradient
    const heroBg = {
        background: `radial-gradient(circle at 50% 50%, rgba(191, 149, 63, 0.15), transparent 60%), linear-gradient(180deg, #000000 0%, #0a0a0a 100%)`
    };

    return (
        <div className="min-h-screen w-full flex flex-col-reverse lg:flex-row overflow-hidden bg-black text-white" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui' }}>

            {/* --- HERO SECTION --- */}
            <div className="flex w-full lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden border-r border-white/5" style={heroBg}>
                {/* Gold Glow Effects */}
                <div className="absolute inset-0 -z-10" />
                <div className="absolute left-[-100px] top-[40%] w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[120px]" />
                <div className="absolute right-[-100px] bottom-[-100px] w-[400px] h-[400px] bg-yellow-800/20 rounded-full blur-[100px]" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        {/* LOGO IMAGE FIX */}
                        <div className="w-12 h-12 relative flex items-center justify-center">
                            <Image
                                src="/mobologo.png"
                                alt="Moboflix"
                                width={48}
                                height={48}
                                style={{ objectFit: "contain" }}
                                priority
                            />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">Moboflix</h1>
                    </div>

                    {/* REVERTED HERO TEXT */}
                    <h2 className="text-5xl font-extrabold leading-tight mb-6 text-white">
                        Expert Mobile Repair <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#BF953F]">
                            At Your Doorstep.
                        </span>
                    </h2>

                    <p className="text-zinc-400 text-lg max-w-md leading-relaxed border-l-2 border-yellow-600/50 pl-4">
                        Don't let a broken phone slow you down. We bring certified technicians directly to your home.
                    </p>
                </div>

                <div className="relative z-10 space-y-6 mt-8">
                    {/* REVERTED FEATURE TEXT */}
                    <div className="flex items-start gap-4 group">
                        <div className="p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-xl text-yellow-500 group-hover:bg-yellow-500 group-hover:text-black transition-colors"><Zap className="w-6 h-6" /></div>
                        <div><h3 className="font-bold text-lg text-white group-hover:text-yellow-400 transition-colors">Fast & Convenient</h3></div>
                    </div>
                    <div className="flex items-start gap-4 group">
                        <div className="p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-xl text-yellow-500 group-hover:bg-yellow-500 group-hover:text-black transition-colors"><ShieldCheck className="w-6 h-6" /></div>
                        <div><h3 className="font-bold text-lg text-white group-hover:text-yellow-400 transition-colors">Genuine Parts with Warranty</h3></div>
                    </div>
                </div>

                <div className="relative z-10 text-zinc-600 text-sm mt-8">© 2025 Moboflix India Pvt Ltd.</div>
            </div>

            {/* --- FORM SECTION --- */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative bg-zinc-950">
                <div className="absolute inset-0 opacity-10 bg-[url('/patterns/circuit.svg')] bg-repeat" />

                <Card className="w-full max-w-md bg-black/80 text-white rounded-2xl shadow-2xl border border-yellow-600/20 backdrop-blur-xl relative z-10">

                    {/* --- VERIFICATION SENT --- */}
                    {view === 'verificationSent' && (
                        <CardContent className="pt-10 pb-10 text-center space-y-6">
                            <div className="w-16 h-16 bg-yellow-900/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-600/30">
                                <Mail className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Check Your Email</h2>
                            <p className="text-zinc-400">
                                We've sent a verification link to <strong className="text-yellow-500">{email}</strong>.
                                <br />Please click the link in your inbox to verify.
                            </p>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-yellow-600/50"
                            >
                                Back to Login
                            </Button>
                        </CardContent>
                    )}

                    {/* --- FORGOT PASSWORD --- */}
                    {view === 'forgotPassword' && (
                        <CardContent className="pt-8 pb-8 space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                                <p className="text-zinc-400 text-sm">Enter your email to receive a reset link.</p>
                            </div>

                            <form onSubmit={handlePasswordReset} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reset-email" className="text-yellow-500 text-xs font-bold uppercase tracking-wider">Email Address</Label>
                                    <Input
                                        id="reset-email" type="email" placeholder="you@example.com"
                                        value={email} onChange={(e) => setEmail(e.target.value)}
                                        className="bg-zinc-900/50 border-zinc-700 text-white h-11 focus:border-yellow-500 focus:ring-yellow-500/20"
                                    />
                                </div>

                                {successMessage && (
                                    <div className="bg-green-900/20 border border-green-500/30 text-green-400 text-sm p-3 rounded-md flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> {successMessage}
                                    </div>
                                )}
                                {error && (
                                    <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-sm p-3 rounded-md flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> {error}
                                    </div>
                                )}

                                <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-to-r from-[#BF953F] to-[#B38728] hover:from-[#d4a849] hover:to-[#c4952d] text-black font-bold">
                                    {loading ? <Spinner /> : 'Send Reset Link'}
                                </Button>
                            </form>

                            <Button
                                onClick={() => { setView('login'); setError(''); setSuccessMessage(''); }}
                                variant="ghost"
                                className="w-full text-zinc-400 hover:text-white"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                            </Button>
                        </CardContent>
                    )}

                    {/* --- LOGIN / SIGNUP --- */}
                    {view === 'login' && (
                        <>
                            <CardHeader className="text-center pb-2 flex flex-col items-center">
                                {/* Phone Number Link (Gold Pill) */}
                                <a
                                    href={whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-medium mb-4 transition-all text-yellow-400 bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-600/30 px-4 py-1.5 rounded-full"
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>+91 8360003700</span>
                                </a>

                                <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
                                <p className="text-zinc-400 text-sm mt-2">Log in to manage your repairs.</p>
                            </CardHeader>

                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                                    <Button
                                        variant="ghost" size="sm" onClick={() => { setUserType('customer'); setError(''); }}
                                        className={`text-sm font-medium transition-all ${userType === 'customer' ? 'bg-zinc-800 text-yellow-400 shadow-sm border border-yellow-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        <User className="h-4 w-4 mr-2" /> Customer
                                    </Button>
                                    <Button
                                        variant="ghost" size="sm" onClick={() => { setUserType('technician'); setError(''); }}
                                        className={`text-sm font-medium transition-all ${userType === 'technician' ? 'bg-zinc-800 text-yellow-400 shadow-sm border border-yellow-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        <Wrench className="h-4 w-4 mr-2" /> Staff
                                    </Button>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-yellow-600 text-xs font-bold uppercase tracking-wider">Email</Label>
                                        <Input
                                            id="email" type="email" placeholder="you@example.com"
                                            value={email} onChange={(e) => setEmail(e.target.value)}
                                            className="bg-zinc-950/50 border-zinc-800 text-white focus:border-yellow-500 focus:ring-yellow-500/20 h-11"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label htmlFor="password" className="text-yellow-600 text-xs font-bold uppercase tracking-wider">Password</Label>
                                            <span
                                                onClick={() => { setView('forgotPassword'); setError(''); }}
                                                className="text-yellow-500/80 text-xs cursor-pointer hover:text-yellow-400 hover:underline"
                                            >
                                                Forgot password?
                                            </span>
                                        </div>
                                        <Input
                                            id="password" type="password" placeholder="••••••••"
                                            value={password} onChange={(e) => setPassword(e.target.value)}
                                            className="bg-zinc-950/50 border-zinc-800 text-white focus:border-yellow-500 focus:ring-yellow-500/20 h-11"
                                            disabled={loading}
                                        />
                                    </div>

                                    {error && (
                                        <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-sm p-3 rounded-md flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> {error}
                                        </div>
                                    )}

                                    <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-to-r from-[#BF953F] to-[#B38728] hover:from-[#d4a849] hover:to-[#c4952d] text-black font-bold text-base shadow-lg shadow-yellow-900/20">
                                        {loading ? <Spinner /> : 'Log In'}
                                    </Button>
                                </form>

                                {userType === 'customer' && (
                                    <>
                                        <div className="relative w-full py-2">
                                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800" /></div>
                                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-black/80 px-2 text-zinc-500">Or continue with</span></div>
                                        </div>

                                        <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-11 border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white hover:border-zinc-600">
                                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                            Sign in with Google
                                        </Button>
                                    </>
                                )}
                            </CardContent>

                            <CardFooter className="flex flex-col gap-4 pt-2">
                                {userType === 'customer' && (
                                    <>
                                        <div className="text-center text-sm text-zinc-500">
                                            Don't have an account?{' '}
                                            <button onClick={handleSignUp} className="text-yellow-500 hover:text-yellow-400 font-medium hover:underline">
                                                Sign up & Verify
                                            </button>
                                        </div>

                                        <Button onClick={handleAnonymousLogin} variant="ghost" className="w-full text-zinc-400 hover:text-white hover:bg-zinc-800">
                                            <Smartphone className="h-4 w-4 mr-2" /> Continue as Guest
                                        </Button>
                                    </>
                                )}
                            </CardFooter>
                        </>
                    )}
                </Card>
            </div>

            {/* --- Floating WhatsApp Button --- */}
            <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20bd5a] text-white p-3 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center border-2 border-black/50"
                aria-label="Chat on WhatsApp"
            >
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
            </a>
        </div>
    );
}