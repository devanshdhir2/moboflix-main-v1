"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase/config';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import Spinner from '../../../components/Spinner';

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
    
    // CORRECTED: This now links to the dynamic review page
    const reviewUrl = `/dashboard/customer/review/${ticket.id}`;

    return (
        <div className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
            <Link href={detailUrl} className="block p-6 transition-colors hover:bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{ticket.deviceInfo}</h3>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusStyle(ticket.status)}`}>
                        {ticket.status}
                    </span>
                </div>
                <p className="text-gray-600 mb-4 truncate">{ticket.issueDescription}</p>
                <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-500">Scheduled for: {appointmentDate.toLocaleDateString()}</p>
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
            <h2 className="text-3xl font-bold text-gray-800">Welcome Back!</h2>
            <p className="text-gray-500 mb-6">Here are your current and past repair tickets.</p>
            
            {tickets.length > 0 ? (
                <div>
                    {tickets.map(ticket => (
                        <TicketItem key={ticket.id} ticket={ticket} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700">You have no repair tickets.</h3>
                    <p className="text-gray-500 mt-2">Ready to get started? Book a new repair today!</p>
                </div>
            )}

            <Link href="/dashboard/customer/create-ticket" className="fixed bottom-8 right-8 bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all">
                <span className="text-4xl pb-1">+</span>
            </Link>
        </div>
    );
}

