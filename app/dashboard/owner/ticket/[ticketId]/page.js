"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import { db } from "../../../../../firebase/config";
import {
    doc,
    onSnapshot,
    updateDoc,
    getDocs,
    collection,
    query,
    where,
} from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import Spinner from "../../../../../components/Spinner";

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

/* ------------------ DARK DETAIL ROW ------------------ */
const DetailRow = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-zinc-400">{label}</p>
        <p className="mt-1 text-lg text-zinc-200">{value}</p>
    </div>
);

/* ------------------ DARK TECH SELECT ITEM ------------------ */
const TechnicianSelectItem = ({ item, onSelect }) => (
    <div
        onClick={() => onSelect(item)}
        className="flex items-center p-4 cursor-pointer border-b border-zinc-700 hover:bg-zinc-800 transition"
    >
        <div className="text-3xl">👤</div>
        <div className="ml-4">
            <p className="font-semibold text-zinc-200">
                {item.displayName || item.email}
            </p>
            <p className="text-sm text-zinc-400">
                {item.specialty || "General Repairs"}
            </p>
        </div>
    </div>
);

export default function OwnerTicketDetailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { ticketId } = params;

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [technicians, setTechnicians] = useState([]);

    /* ------------------ FETCH TICKET ------------------ */
    useEffect(() => {
        if (!user || !ticketId) return;

        const ticketRef = doc(db, "tickets", ticketId);
        const unsub = onSnapshot(
            ticketRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    setTicket({ id: snapshot.id, ...snapshot.data() });
                } else {
                    alert("Ticket not found.");
                    router.push("/dashboard/owner");
                }
                setLoading(false);
            },
            (err) => {
                console.error("Error loading ticket:", err);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [user, ticketId, router]);

    /* ------------------ FETCH TECHNICIANS ON MODAL OPEN ------------------ */
    useEffect(() => {
        if (!isModalVisible) return;

        const fetchTechs = async () => {
            const q = query(
                collection(db, "users"),
                where("role", "==", "technician")
            );
            const snap = await getDocs(q);
            setTechnicians(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        };

        fetchTechs().catch(console.error);
    }, [isModalVisible]);

    /* ------------------ UPDATE TICKET STATUS ------------------ */
    const updateStatus = async (newStatus, extra = {}) => {
        setActionLoading(true);
        try {
            await updateDoc(doc(db, "tickets", ticket.id), {
                status: newStatus,
                ...extra,
            });
            alert(`Updated to "${newStatus}"`);
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    /* ------------------ REASSIGN TECH ------------------ */
    const handleReassign = (tech) => {
        setModalVisible(false);
        updateStatus("Pending", {
            technicianId: tech.id,
            technicianName: tech.displayName || tech.email,
        });
    };

    /* ------------------ MANUAL START ------------------ */
    const handleManualStart = () => {
        const type = ticket.type === "product" ? "delivery" : "repair";

        if (!confirm(`Manually start this ${type}?`)) return;

        updateStatus("Work Started");
    };

    /* ------------------ APPROVE PAYMENT ------------------ */
    const handleApprovePayment = () => updateStatus("Completed");

    if (loading)
        return (
            <div className="flex justify-center items-center h-screen bg-black">
                <Spinner />
            </div>
        );

    if (!ticket)
        return (
            <div className="text-center text-zinc-300 p-10 bg-black">
                Ticket not found
            </div>
        );

    const appointmentDate = ticket.appointmentDate?.toDate
        ? ticket.appointmentDate.toDate()
        : new Date(ticket.appointmentDate);

    return (
        <div className="min-h-screen bg-black text-zinc-200 px-4 sm:px-6 lg:px-8 py-8">

            {/* ------------------ PAGE TITLE ------------------ */}
            <h2 className="text-3xl font-bold text-white mb-2">
                {ticket.deviceInfo}
            </h2>
            <p className="text-lg text-zinc-400 mb-6">
                Admin view for Ticket #{ticket.id.substring(0, 6)}…
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ------------------ LEFT SECTION ------------------ */}
                <div className="lg:col-span-2 space-y-6">

                    {/* DETAILS CARD */}
                    <Card className="bg-zinc-900/70 border border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Ticket Details</CardTitle>
                        </CardHeader>

                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                            <DetailRow label="Customer" value={ticket.customerEmail} />
                            <DetailRow
                                label="Contact"
                                value={ticket.contactNumber || "Not Provided"}
                            />
                            <DetailRow
                                label="Technician"
                                value={ticket.technicianName}
                            />
                            <DetailRow label="Status" value={ticket.status} />

                            <DetailRow
                                label="Scheduled For"
                                value={appointmentDate.toLocaleString()}
                            />

                            <DetailRow label="Address" value={ticket.address} />

                            {ticket.finalAmount && (
                                <DetailRow
                                    label="Final Amount"
                                    value={`₹${ticket.finalAmount}`}
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* GUEST BADGE */}
                    {ticket.isGuestTicket && (
                        <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-300 p-4 rounded-md">
                            <p className="font-bold">Guest Ticket</p>
                            <p className="text-sm">
                                This request was created without signing in.
                            </p>
                        </div>
                    )}

                    {/* REVIEW CARD */}
                    <Card className="bg-zinc-900/70 border border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Customer Review</CardTitle>
                        </CardHeader>

                        <CardContent>
                            {ticket.isReviewed ? (
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <span
                                                key={i}
                                                className={`text-2xl ${i < ticket.rating
                                                    ? "text-yellow-400"
                                                    : "text-zinc-400"
                                                    }`}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-zinc-400 italic">
                                        &ldquo;{ticket.review || "No written review provided."}&rdquo;
                                    </p>
                                </div>
                            ) : (
                                <p className="text-zinc-500">
                                    No review has been left yet.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ------------------ RIGHT SECTION (ADMIN ACTIONS) ------------------ */}
                <div>
                    <Card className="bg-zinc-900/70 border border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Admin Actions</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {actionLoading ? (
                                <Spinner />
                            ) : (
                                <>

                                    {/* Manual Start for Guest */}
                                    {ticket.isGuestTicket &&
                                        ticket.status === "In Progress" && (
                                            <div className="space-y-4">

                                                <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-300 p-4 rounded-md">
                                                    <p className="font-bold">Guest Offline</p>
                                                    <p className="text-sm">
                                                        You can manually start this job.
                                                    </p>
                                                </div>

                                                <Button
                                                    onClick={handleManualStart}
                                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                                                >
                                                    <CheckCircle className="h-5 w-5" />
                                                    Start {ticket.type === "product" ? "Delivery" : "Repair"}
                                                </Button>
                                            </div>
                                        )}

                                    {/* Approve Payment */}
                                    {ticket.status === "Pending Payment" && (
                                        <Button
                                            onClick={handleApprovePayment}
                                            className="w-full bg-yellow-500 hover:bg-yellow-400 text-white"
                                        >
                                            Approve Payment (₹{ticket.finalAmount})
                                        </Button>
                                    )}

                                    {/* Reassign */}
                                    {ticket.status !== "Completed" && (
                                        <Button
                                            onClick={() => setModalVisible(true)}
                                            className="w-full bg-slate-800 hover:bg-slate-700 text-zinc-200"
                                        >
                                            Reassign Technician
                                        </Button>
                                    )}

                                    {ticket.status === "Completed" && (
                                        <p className="text-center text-zinc-500">
                                            No actions available.
                                        </p>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ------------------ DARK GLASS MODAL ------------------ */}
            {isModalVisible && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-40">
                    <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden backdrop-blur-xl">

                        <h3 className="text-xl font-bold text-white p-6 border-b border-zinc-700">
                            Select a Technician
                        </h3>

                        <div className="max-h-[60vh] overflow-y-auto">
                            {technicians.map((tech) => (
                                <TechnicianSelectItem
                                    key={tech.id}
                                    item={tech}
                                    onSelect={handleReassign}
                                />
                            ))}
                        </div>

                        <Button
                            variant="ghost"
                            onClick={() => setModalVisible(false)}
                            className="w-full p-4 border-t border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
