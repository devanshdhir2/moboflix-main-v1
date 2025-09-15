"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase/config';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import Spinner from '../../../components/Spinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench, HeartPulse, ShoppingCart } from 'lucide-react'; // For icons

// This is the list of your tickets, same component as before
const TicketItem = ({ ticket }) => {
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'In Progress': return 'bg-blue-100 text-blue-800';
            case 'Work Started': return 'bg-indigo-100 text-indigo-800';
            case 'Pending Payment': return 'bg-red-100 text-red-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const appointmentDate = ticket.appointmentDate?.toDate ? ticket.appointmentDate.toDate() : new Date(ticket.appointmentDate);
    const detailUrl = `/dashboard/customer/ticket/${ticket.id}`;
    const reviewUrl = `/dashboard/customer/review/${ticket.id}`;
    const isProductOrder = ticket.type === 'product';

    return (
        <Card className="mb-4 transition-shadow hover:shadow-md">
            <Link href={detailUrl}>
                <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                        <p className="font-bold text-lg text-slate-800">{ticket.deviceInfo}</p>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(ticket.status)}`}>
                            {ticket.status}
                        </span>
                    </div>
                    <p className="text-sm text-slate-600 truncate mt-1">{ticket.issueDescription}</p>
                    <p className="text-xs text-slate-400 mt-2">
                        {isProductOrder ? `Ordered on: ${ticket.createdAt?.toDate().toLocaleDateString()}` : `Scheduled for: ${appointmentDate.toLocaleDateString()}`}
                    </p>
                </CardContent>
            </Link>
            {ticket.status === 'Completed' && !ticket.isReviewed && (
                <div className="bg-slate-50 border-t p-3">
                    <Link href={reviewUrl} className="text-sm font-semibold text-blue-600 hover:underline text-center block">
                        Leave a Review
                    </Link>
                </div>
            )}
        </Card>
    );
};


// Main Dashboard Component
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

    if (loading) {
        return <Spinner />;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-800">Welcome Back!</h2>
                <p className="text-gray-500">How can we help you today?</p>
            </div>
            
            {/* --- UPDATED: Main Action Hub --- */}
            <div className="my-8 space-y-6">
                {/* Main Action Card: Repair */}
                <Link href="/dashboard/customer/create-ticket" className="block">
                    <Card className="text-center transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden group">
                        <CardContent className="p-0">
                            <img src="https://thumbs.dreamstime.com/b/repairing-mobile-phone-realistic-modern-mobile-phone-white-background-vector-repairing-mobile-phone-realistic-modern-130700132.jpg?w=768" alt="Phone Repair" className="w-full h-32 object-cover transition-transform group-hover:scale-105"/>
                            <div className="p-6">
                                <h3 className="text-2xl font-bold text-slate-800">Repair Your Phone</h3>
                                <p className="text-sm text-slate-500 mt-1">Book a certified technician for any issue.</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Secondary Action Cards */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Card 2: Phone Restoration */}
                    <Link href="/dashboard/customer/create-restoration" className="block">
                        <Card className="text-center transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden group">
                            <CardContent className="p-0">
                                 <img src="https://i.ibb.co/Myw0qyzr/Gemini-Generated-Image-pgt52pgt52pgt52p.png" alt="Phone Restoration" className="w-full h-32 object-cover transition-transform group-hover:scale-105"/>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-slate-800">Phone Restoration</h3>
                                    <p className="text-sm text-slate-500 mt-1">Bring your old device back to life.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Card 3: Shop for Accessories */}
                    <Link href="/dashboard/customer/store" className="block">
                         <Card className="text-center transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden group">
                            <CardContent className="p-0">
                                <img src="https://media.istockphoto.com/id/1987775073/vector/shopping-cart-black-line-drawing-icon.jpg?s=612x612&w=0&k=20&c=zZP0Tl3NW6Q96YuaHs5UQCN7E3CGdfI30-JUcM8Z0F8=" alt="Shop for Accessories" className="w-full h-32 object-cover transition-transform group-hover:scale-105"/>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-slate-800">Shop for Accessories</h3>
                                    <p className="text-sm text-slate-500 mt-1">Find high-quality parts and accessories.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
            {/* --- End of Action Hub --- */}

            <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">My Recent Activity</h3>
                 {tickets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tickets.map(ticket => (
                            <TicketItem key={ticket.id} ticket={ticket} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                        <p className="text-gray-500">You have no repair tickets or orders.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

