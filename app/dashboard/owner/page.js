"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase/config';
import { collection, query, onSnapshot, orderBy, getDocs, where, doc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import Spinner from '../../../components/Spinner';
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2 } from 'lucide-react';

const TicketItem = ({ ticket, onDelete }) => {
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
    const detailUrl = `/dashboard/owner/ticket/${ticket.id}`;

    // --- UPDATED: Handler to stop link navigation when deleting ---
    const handleDeleteClick = (e) => {
        e.preventDefault(); // Stop the Link from navigating
        e.stopPropagation(); // Stop any other parent click events
        onDelete(ticket.id);
    };

    return (
        // --- UPDATED: Changed structure to accommodate delete button ---
        <div className="bg-white rounded-lg shadow-md mb-4 transition-transform transform hover:scale-105 hover:shadow-xl relative group">
            <Link href={detailUrl} className="block p-6">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-800 w-2/3">{ticket.deviceInfo}</h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyle(ticket.status)}`}>
                        {ticket.status}
                    </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-semibold">Customer:</span> {ticket.customerEmail}</p>
                    <p><span className="font-semibold">Technician:</span> {ticket.technicianName}</p>
                </div>
                {ticket.rating && (
                    <div className="flex items-center mt-4 pt-4 border-t border-gray-200">
                        <span className="text-yellow-500">⭐</span>
                        <span className="ml-2 font-semibold text-gray-700">{ticket.rating} / 5</span>
                    </div>
                )}
            </Link>
            {/* --- NEW: Delete button --- */}
            <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDeleteClick}
                title="Delete Ticket"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
};


const TechnicianStatItem = ({ techStat }) => {
    const avgRating = techStat.totalJobs > 0 ? (techStat.totalRating / techStat.totalJobs).toFixed(1) : 'N/A';
    return (
        <div className="flex items-center bg-white rounded-lg shadow p-4 mb-3">
            <div className="text-blue-500 text-3xl">👤</div>
            <div className="flex-1 ml-4">
                <p className="text-md font-bold text-gray-800">{techStat.name}</p>
                <p className="text-sm text-gray-500">Jobs Completed: {techStat.totalJobs}</p>
            </div>
            <div className="flex items-center">
                <p className="text-lg font-bold text-gray-800 mr-1">{avgRating}</p>
                <span className="text-yellow-500">⭐</span>
            </div>
        </div>
    )
}

export default function OwnerDashboard() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [technicianStats, setTechnicianStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const fetchedTickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTickets(fetchedTickets);
            await calculateStats(fetchedTickets);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tickets for owner: ", error);
            alert("Could not fetch tickets.");
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const calculateStats = async (allTickets) => {
        const techQuery = query(collection(db, "users"), where("role", "==", "technician"));
        const techSnapshot = await getDocs(techQuery);
        const technicians = techSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().displayName || doc.data().email }));
        const stats = technicians.map(tech => {
            const completedTickets = allTickets.filter(
                ticket => ticket.technicianId === tech.id && ticket.status === 'Completed' && ticket.isReviewed
            );
            const totalJobs = completedTickets.length;
            const totalRating = completedTickets.reduce((sum, ticket) => sum + (ticket.rating || 0), 0);
            return { id: tech.id, name: tech.name, totalJobs, totalRating };
        });
        stats.sort((a, b) => {
            const avgA = a.totalJobs > 0 ? a.totalRating / a.totalJobs : 0;
            const avgB = b.totalJobs > 0 ? b.totalRating / b.totalJobs : 0;
            return avgB - avgA;
        });
        setTechnicianStats(stats);
    };

    // --- NEW: Delete handler ---
    const handleDeleteTicket = async (ticketId) => {
        if (!confirm("Are you sure you want to permanently delete this ticket? This action cannot be undone.")) {
            return;
        }
        try {
            await deleteDoc(doc(db, "tickets", ticketId));
            alert("Ticket deleted successfully.");
        } catch (error) {
            console.error("Error deleting ticket: ", error);
            alert("Failed to delete the ticket. Please try again.");
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
             <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Owner Dashboard</h2>
                <Link href="/dashboard/owner/store">
                    <Button className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Manage Store
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Technician Performance</h3>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        {technicianStats.length > 0 ? (
                            technicianStats.map(stat => <TechnicianStatItem key={stat.id} techStat={stat} />)
                        ) : (
                            <p className="text-gray-500 text-center py-4">No technician data available.</p>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">All Tickets</h3>
                    {tickets.length > 0 ? (
                        <div>
                            {/* --- UPDATED: Pass the onDelete handler --- */}
                            {tickets.map(ticket => <TicketItem key={ticket.id} ticket={ticket} onDelete={handleDeleteTicket} />)}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-lg shadow-md">
                            <p className="text-gray-500">No tickets found in the system.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

