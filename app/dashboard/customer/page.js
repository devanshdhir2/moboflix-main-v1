"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase/config';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import Spinner from '../../../components/Spinner';
import { Card, CardContent } from "@/components/ui/card";
import {
    Wrench,
    Smartphone,
    ShoppingCart,
    Clock,
    ShieldCheck,
    Award,
    ChevronRight,
    Star,
    Zap,
    Activity
} from 'lucide-react';

// --- COMPONENT: Ticket Item (Gold/Dark Theme) ---
const TicketItem = ({ ticket }) => {
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
            case 'In Progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'Work Started': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'Pending Payment': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
        }
    };

    const appointmentDate = ticket.appointmentDate?.toDate ? ticket.appointmentDate.toDate() : new Date(ticket.appointmentDate);
    const detailUrl = `/dashboard/customer/ticket/${ticket.id}`;
    const reviewUrl = `/dashboard/customer/review/${ticket.id}`;
    const isProductOrder = ticket.type === 'product';

    return (
        <div className="group relative bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800 p-5 transition-all hover:bg-black hover:border-yellow-600/50 hover:shadow-lg hover:shadow-yellow-900/10">
            <Link href={detailUrl} className="block">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h4 className="font-bold text-zinc-100 text-lg group-hover:text-yellow-400 transition-colors">
                            {ticket.deviceInfo}
                        </h4>
                        <p className="text-sm text-zinc-400 line-clamp-1">{ticket.issueDescription}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusStyle(ticket.status)}`}>
                        {ticket.status}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-4 font-medium uppercase tracking-wide">
                    <Clock className="w-3 h-3 text-yellow-600" />
                    {isProductOrder
                        ? `Ordered: ${ticket.createdAt?.toDate().toLocaleDateString()}`
                        : `Appointment: ${appointmentDate.toLocaleDateString()}`
                    }
                </div>
            </Link>

            {ticket.status === 'Completed' && !ticket.isReviewed && (
                <div className="mt-4 pt-3 border-t border-dashed border-zinc-800 flex justify-end">
                    <Link href={reviewUrl} className="text-sm font-semibold text-yellow-500 flex items-center hover:text-yellow-300 transition-colors">
                        <Star className="w-4 h-4 mr-1" /> Leave a Review
                    </Link>
                </div>
            )}
        </div>
    );
};

// --- COMPONENT: Feature Card ---
const FeatureCard = ({ icon: Icon, title, desc }) => (
    <div className="flex flex-col items-center text-center p-6 bg-zinc-950 rounded-2xl border border-zinc-800 transition-all hover:-translate-y-1 hover:border-yellow-600/40 hover:shadow-xl hover:shadow-yellow-900/10 group">
        <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-yellow-500 shadow-inner shadow-black/50 border border-zinc-800 group-hover:border-yellow-600/30 group-hover:text-yellow-400">
            <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-zinc-200 mb-2 group-hover:text-white">{title}</h3>
        <p className="text-sm text-zinc-500 leading-relaxed group-hover:text-zinc-400">{desc}</p>
    </div>
);

// --- MAIN COMPONENT ---
export default function CustomerDashboard() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, "tickets"),
            where("customerId", "==", user.uid),
            orderBy("createdAt", "desc")
        );
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedTickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTickets(fetchedTickets);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Spinner /></div>;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

    return (
        <div className="min-h-screen bg-black text-zinc-200 pb-20 selection:bg-yellow-500/30">

            {/* --- HERO SECTION --- */}
            <div className="relative pt-12 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-white/5">
                {/* Glow Effects */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[120px] -mr-32 -mt-32 opacity-30"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-800/10 rounded-full blur-[100px] -ml-20 -mb-20 opacity-30"></div>

                <div className="container mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-yellow-600/30 text-yellow-500 text-xs font-semibold uppercase tracking-wider mb-4">
                                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                Customer Portal
                            </div>
                            {/* REVERTED TEXT */}
                            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-white">
                                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#BF953F]">{user?.displayName?.split(' ')[0] || 'User'}</span>
                            </h1>
                            <p className="text-zinc-400 text-lg max-w-xl leading-relaxed">
                                Your Phone, Fixed Fast. Expert Repair, Simplified.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">

                {/* --- SERVICE ACTION HUB --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    {/* Action 1: Repair */}
                    <Link href="/dashboard/customer/create-ticket" className="block group">
                        <Card className="h-full bg-zinc-950 border-zinc-800 shadow-xl hover:shadow-2xl hover:border-yellow-600/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                            <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-yellow-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-800 group-hover:border-yellow-600/50 group-hover:text-yellow-400 transition-all duration-300 text-zinc-500">
                                    <Wrench className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Book a Repair</h3>
                                <p className="text-zinc-500 mb-6 text-sm group-hover:text-zinc-400 transition-colors">Cracked screens, battery swaps, and more.</p>
                                <span className="inline-flex items-center text-yellow-500 font-bold text-sm group-hover:text-yellow-400">
                                    Start Repair <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Action 2: Restoration */}
                    <Link href="/dashboard/customer/create-restoration" className="block group">
                        <Card className="h-full bg-zinc-950 border-zinc-800 shadow-lg hover:shadow-xl hover:border-yellow-600/50 hover:-translate-y-1 transition-all duration-300">
                            <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-yellow-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-800 group-hover:border-yellow-600/50 group-hover:text-yellow-400 transition-all duration-300 text-zinc-500">
                                    <Smartphone className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Restoration</h3>
                                <p className="text-zinc-500 text-sm group-hover:text-zinc-400 transition-colors">Bring your old device back to life.</p>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Action 3: Store */}
                    <Link href="/dashboard/customer/store" className="block group">
                        <Card className="h-full bg-zinc-950 border-zinc-800 shadow-lg hover:shadow-xl hover:border-yellow-600/50 hover:-translate-y-1 transition-all duration-300">
                            <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-yellow-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-800 group-hover:border-yellow-600/50 group-hover:text-yellow-400 transition-all duration-300 text-zinc-500">
                                    <ShoppingCart className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Spare Parts & Accessories</h3>
                                <p className="text-zinc-500 text-sm group-hover:text-zinc-400 transition-colors">Buy Premium parts & Accessories for your device.</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* --- SECTION: RECENT ACTIVITY --- */}
                <div className="mb-20">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Activity className="w-6 h-6 text-yellow-500" /> Recent Activity
                        </h2>
                        {tickets.length > 4 && (
                            <Link href="/dashboard/customer/history" className="text-zinc-500 text-sm hover:text-white transition-colors">
                                View All
                            </Link>
                        )}
                    </div>

                    {tickets.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            {tickets.slice(0, 4).map(ticket => (
                                <TicketItem key={ticket.id} ticket={ticket} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-zinc-950/50 rounded-2xl border border-dashed border-zinc-800">
                            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-700">
                                <Clock className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-300">No recent activity</h3>
                            <p className="text-zinc-500">You haven't booked any repairs yet.</p>
                        </div>
                    )}
                </div>

                {/* --- SECTION: WHY US (The Moboflix Advantage) --- */}
                <div className="relative">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-white mb-4">The Moboflix Advantage</h2>
                        <p className="text-zinc-400 max-w-2xl mx-auto">
                            Fast, reliable, and transparent repairs. Get upfront pricing and book a certified technician in minutes.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={Award}
                            title="Certified Technicians"
                            desc="Our experts are fully trained and vetted to handle any repair with precision and care."
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Fast & Convenient"
                            desc="Book a repair in minutes. Many common issues are fixed the very same day at your doorstep."
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Quality & Warranty"
                            desc="We use only high-quality parts and back every single repair with a solid warranty."
                        />
                    </div>
                </div>

                {/* Footer Note */}
                <div className="text-center mt-20 text-zinc-700 text-sm">
                    &copy; 2025 Moboflix. Premium At-Home Mobile Repair.
                </div>
            </div>
        </div>
    );
}