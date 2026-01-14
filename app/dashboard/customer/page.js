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

// --- COMPONENT: Dark Mode Ticket Item ---
const TicketItem = ({ ticket }) => {
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'In Progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'Work Started': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'Pending Payment': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            default: return 'bg-slate-800 text-slate-400 border-slate-700';
        }
    };

    const appointmentDate = ticket.appointmentDate?.toDate ? ticket.appointmentDate.toDate() : new Date(ticket.appointmentDate);
    const detailUrl = `/dashboard/customer/ticket/${ticket.id}`;
    const reviewUrl = `/dashboard/customer/review/${ticket.id}`;
    const isProductOrder = ticket.type === 'product';

    return (
        <div className="group relative bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-5 transition-all hover:bg-slate-900 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10">
            <Link href={detailUrl} className="block">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h4 className="font-bold text-slate-100 text-lg group-hover:text-blue-400 transition-colors">
                            {ticket.deviceInfo}
                        </h4>
                        <p className="text-sm text-slate-400 line-clamp-1">{ticket.issueDescription}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusStyle(ticket.status)}`}>
                        {ticket.status}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 mt-4 font-medium uppercase tracking-wide">
                    <Clock className="w-3 h-3" />
                    {isProductOrder
                        ? `Ordered: ${ticket.createdAt?.toDate().toLocaleDateString()}`
                        : `Appointment: ${appointmentDate.toLocaleDateString()}`
                    }
                </div>
            </Link>

            {ticket.status === 'Completed' && !ticket.isReviewed && (
                <div className="mt-4 pt-3 border-t border-dashed border-slate-800 flex justify-end">
                    <Link href={reviewUrl} className="text-sm font-semibold text-blue-400 flex items-center hover:text-blue-300 transition-colors">
                        <Star className="w-4 h-4 mr-1" /> Leave a Review
                    </Link>
                </div>
            )}
        </div>
    );
};

// --- COMPONENT: Feature Card (Why Us) ---
const FeatureCard = ({ icon: Icon, title, desc }) => (
    <div className="flex flex-col items-center text-center p-6 bg-slate-900 rounded-2xl border border-slate-800 transition-transform hover:-translate-y-1 hover:border-slate-700">
        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-blue-400 shadow-inner shadow-black/50">
            <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-200 mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
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

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Spinner /></div>;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 selection:bg-blue-500/30">

            {/* --- HERO SECTION --- */}
            <div className="relative pt-12 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-slate-900">
                {/* Glow Effects */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -mr-32 -mt-32 opacity-40"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] -ml-20 -mb-20 opacity-40"></div>

                <div className="container mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                Customer Portal
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-white">
                                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{user?.displayName?.split(' ')[0] || 'User'}</span>
                            </h1>
                            <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
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
                        <Card className="h-full bg-slate-900 border-slate-800 shadow-xl hover:shadow-2xl hover:border-blue-500/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                            <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 text-blue-500">
                                    <Wrench className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Book a Repair</h3>
                                <p className="text-slate-400 mb-6 text-sm">Cracked screens, battery swaps, and more.</p>
                                <span className="inline-flex items-center text-blue-400 font-bold text-sm group-hover:text-blue-300">
                                    Start Repair <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Action 2: Restoration */}
                    <Link href="/dashboard/customer/create-restoration" className="block group">
                        <Card className="h-full bg-slate-900 border-slate-800 shadow-lg hover:shadow-xl hover:border-purple-500/50 hover:-translate-y-1 transition-all duration-300">
                            <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 text-purple-500">
                                    <Smartphone className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Restoration</h3>
                                <p className="text-slate-400 text-sm">Bring your old device back to life.</p>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Action 3: Store */}
                    <Link href="/dashboard/customer/store" className="block group">
                        <Card className="h-full bg-slate-900 border-slate-800 shadow-lg hover:shadow-xl hover:border-amber-500/50 hover:-translate-y-1 transition-all duration-300">
                            <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 text-amber-500">
                                    <ShoppingCart className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Accessories</h3>
                                <p className="text-slate-400 text-sm">Premium parts & add-ons.</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* --- SECTION: RECENT ACTIVITY --- */}
                <div className="mb-20">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Activity className="w-6 h-6 text-blue-500" /> Recent Activity
                        </h2>
                        {tickets.length > 4 && (
                            <Link href="/dashboard/customer/history" className="text-slate-400 text-sm hover:text-white transition-colors">
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
                        <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
                            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                                <Clock className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-300">No recent activity</h3>
                            <p className="text-slate-500">You haven't booked any repairs yet.</p>
                        </div>
                    )}
                </div>

                {/* --- SECTION: WHY US (The Moboflix Advantage) --- */}
                <div className="relative">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-white mb-4">The Moboflix Advantage</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Fast, reliable, and transparent repairs.
                            Get upfront pricing and book a certified technician in minutes.
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
                <div className="text-center mt-20 text-slate-600 text-sm">
                    &copy; 2025 Moboflix. Premium At-Home Mobile Repair.
                </div>
            </div>
        </div>
    );
}