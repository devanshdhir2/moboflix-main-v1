"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../firebase/config";
import {
    collection,
    query,
    onSnapshot,
    orderBy,
    getDocs,
    where,
    doc,
    deleteDoc,
} from "firebase/firestore";
import Link from "next/link";
import Spinner from "../../../components/Spinner";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2 } from "lucide-react";

/* ---------------------- STATUS COLORS (Dark Mode) ---------------------- */
const getStatusStyle = (status) => {
    switch (status) {
        case "Pending":
            return "bg-yellow-600/30 text-yellow-300 border border-yellow-700";
        case "In Progress":
            return "bg-blue-600/30 text-blue-300 border border-blue-700";
        case "Work Started":
            return "bg-indigo-600/30 text-indigo-300 border border-indigo-700";
        case "Pending Payment":
            return "bg-red-600/30 text-red-300 border border-red-700";
        case "Completed":
            return "bg-green-600/30 text-green-300 border border-green-700";
        default:
            return "bg-slate-700/40 text-slate-300 border border-slate-600";
    }
};

/* ---------------------- TICKET ITEM ---------------------- */
const TicketItem = ({ ticket, onDelete }) => {
    const detailUrl = `/dashboard/owner/ticket/${ticket.id}`;

    const handleDeleteClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(ticket.id);
    };

    return (
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg shadow-md mb-4 transition hover:shadow-lg hover:bg-slate-800 relative group">
            <Link href={detailUrl} className="block p-6">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-white w-2/3">
                        {ticket.deviceInfo}
                    </h3>

                    <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyle(
                            ticket.status
                        )}`}
                    >
                        {ticket.status}
                    </span>
                </div>

                <div className="text-sm text-slate-400 space-y-1">
                    <p>
                        <span className="font-semibold text-slate-300">Customer:</span>{" "}
                        {ticket.customerEmail}
                    </p>
                    <p>
                        <span className="font-semibold text-slate-300">Technician:</span>{" "}
                        {ticket.technicianName}
                    </p>
                </div>

                {ticket.rating && (
                    <div className="flex items-center mt-4 pt-4 border-t border-slate-700">
                        <span className="text-yellow-400">⭐</span>
                        <span className="ml-2 font-semibold text-slate-300">
                            {ticket.rating} / 5
                        </span>
                    </div>
                )}
            </Link>

            {/* Delete button */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-red-600/20 hover:bg-red-600/40 text-red-300 opacity-0 group-hover:opacity-100 transition"
                onClick={handleDeleteClick}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
};

/* ---------------------- TECHNICIAN PERFORMANCE CARD ---------------------- */
const TechnicianStatItem = ({ techStat }) => {
    const avgRating =
        techStat.totalJobs > 0
            ? (techStat.totalRating / techStat.totalJobs).toFixed(1)
            : "N/A";

    return (
        <div className="flex items-center bg-slate-900/70 border border-slate-800 rounded-lg shadow p-4 mb-3">
            <div className="text-blue-400 text-3xl">👤</div>

            <div className="flex-1 ml-4">
                <p className="text-md font-bold text-white">{techStat.name}</p>
                <p className="text-sm text-slate-400">
                    Jobs Completed: {techStat.totalJobs}
                </p>
            </div>

            <div className="flex items-center">
                <p className="text-lg font-bold text-slate-200 mr-1">{avgRating}</p>
                <span className="text-yellow-400">⭐</span>
            </div>
        </div>
    );
};

/* ---------------------- PAGE MAIN ---------------------- */
export default function OwnerDashboard() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [technicianStats, setTechnicianStats] = useState([]);
    const [loading, setLoading] = useState(true);

    /* FETCH ALL TICKETS */
    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(
            q,
            async (snapshot) => {
                const allTickets = snapshot.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }));
                setTickets(allTickets);
                await calculateStats(allTickets);
                setLoading(false);
            },
            (error) => {
                console.error("Owner ticket fetch error:", error);
                alert("Could not fetch tickets.");
            }
        );

        return () => unsubscribe();
    }, [user]);

    /* TECHNICIAN STATS */
    const calculateStats = async (allTickets) => {
        const techQuery = query(
            collection(db, "users"),
            where("role", "==", "technician")
        );
        const snapshot = await getDocs(techQuery);

        const techs = snapshot.docs.map((d) => ({
            id: d.id,
            name: d.data().displayName || d.data().email,
        }));

        const stats = techs.map((tech) => {
            const completed = allTickets.filter(
                (t) =>
                    t.technicianId === tech.id &&
                    t.status === "Completed" &&
                    t.isReviewed
            );

            return {
                id: tech.id,
                name: tech.name,
                totalJobs: completed.length,
                totalRating: completed.reduce((a, t) => a + (t.rating || 0), 0),
            };
        });

        stats.sort((a, b) => {
            const avgA = a.totalJobs ? a.totalRating / a.totalJobs : 0;
            const avgB = b.totalJobs ? b.totalRating / b.totalJobs : 0;
            return avgB - avgA;
        });

        setTechnicianStats(stats);
    };

    /* DELETE TICKET */
    const handleDeleteTicket = async (ticketId) => {
        if (
            !confirm(
                "Are you sure you want to permanently delete this ticket?"
            )
        )
            return;

        try {
            await deleteDoc(doc(db, "tickets", ticketId));
            alert("Ticket deleted successfully.");
        } catch (error) {
            console.error("Ticket delete error:", error);
            alert("Failed to delete the ticket.");
        }
    };

    if (loading)
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner />
            </div>
        );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 px-4 sm:px-6 lg:px-8 py-8">
            {/* HEADER */}
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-white">Owner Dashboard</h2>

                <Link href="/dashboard/owner/store">
                    <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                        <ShoppingCart className="h-5 w-5 text-slate-200" />
                        Manage Store
                    </Button>
                </Link>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN — Technician Stats */}
                <div className="lg:col-span-1">
                    <h3 className="text-2xl font-bold text-white mb-4">
                        Technician Performance
                    </h3>

                    <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 shadow-lg">
                        {technicianStats.length > 0 ? (
                            technicianStats.map((stat) => (
                                <TechnicianStatItem key={stat.id} techStat={stat} />
                            ))
                        ) : (
                            <p className="text-slate-400 text-center py-4">
                                No technician data available.
                            </p>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN — Tickets */}
                <div className="lg:col-span-2">
                    <h3 className="text-2xl font-bold text-white mb-4">All Tickets</h3>

                    {tickets.length > 0 ? (
                        <div>
                            {tickets.map((ticket) => (
                                <TicketItem
                                    key={ticket.id}
                                    ticket={ticket}
                                    onDelete={handleDeleteTicket}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-slate-900/70 border border-slate-800 rounded-lg shadow-lg">
                            <p className="text-slate-400">No tickets found.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
