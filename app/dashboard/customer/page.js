"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase/config';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import Spinner from '../../../components/Spinner';
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart } from 'lucide-react';

const TicketItem = ({ ticket }) => {
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-500 text-white';
            case 'In Progress': return 'bg-blue-500 text-white';
            case 'Work Started': return 'bg-indigo-500 text-white';
            case 'Pending Payment': return 'bg-red-500 text-white';
            case 'Completed': return 'bg-green-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const appointmentDate = ticket.appointmentDate?.toDate ? ticket.appointmentDate.toDate() : new Date(ticket.appointmentDate);
    const detailUrl = `/dashboard/customer/ticket/${ticket.id}`;
    const reviewUrl = `/dashboard/customer/review/${ticket.id}`;

    // --- UPDATED: Differentiate between repair and product tickets ---
    const isProductOrder = ticket.type === 'product';

    return (
        <div className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
            <Link href={detailUrl} className="block p-6 transition-colors hover:bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                       {isProductOrder && <ShoppingCart className="h-5 w-5 text-gray-600" />} 
                       {ticket.deviceInfo}
                    </h3>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusStyle(ticket.status)}`}>
                        {ticket.status}
                    </span>
                </div>
                <p className="text-gray-600 mb-4 truncate">{ticket.issueDescription}</p>
                <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-500">
                        {isProductOrder ? `Ordered on: ${ticket.createdAt?.toDate().toLocaleDateString()}` : `Scheduled for: ${appointmentDate.toLocaleDateString()}`}
                    </p>
                </div>
            </Link>
             {ticket.status === 'Completed' && !ticket.isReviewed && (
                 <Link href={reviewUrl} className="block bg-gray-50 hover:bg-gray-100 border-t border-gray-200 px-6 py-3">
                     <p className="text-center font-semibold text-blue-600">Leave a Review</p>
                 </Link>
             )}
        </div>
    );
};

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
        }, (error) => {
            console.error("Error fetching tickets: ", error);
            alert("Could not fetch tickets.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Spinner/></div>;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative min-h-[calc(100vh-4rem)]">
             <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                 <div>
                    <h2 className="text-3xl font-bold text-gray-800">Welcome Back!</h2>
                    <p className="text-gray-500">Here are your current and past repairs and orders.</p>
                 </div>
                 {/* --- NEW: Link to the Store Page --- */}
                 <Link href="/dashboard/customer/store">
                    <Button className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Shop for Parts
                    </Button>
                </Link>
            </div>
            
            {tickets.length > 0 ? (
                <div>
                    {tickets.map(ticket => (
                        <TicketItem key={ticket.id} ticket={ticket} />
                    ))}
                </div>
            ) : (
                <div classNa    me="text-center py-20 bg-white rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700">You have no repair tickets or orders.</h3>
                    <p className="text-gray-500 mt-2">Ready to get started? Book a new repair or buy a product!</p>
                </div>
            )}

            <Link href="/dashboard/customer/create-ticket" className="fixed bottom-8 right-8 bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all">
                <Plus className="h-8 w-8" />
            </Link>
        </div>
    );
}
