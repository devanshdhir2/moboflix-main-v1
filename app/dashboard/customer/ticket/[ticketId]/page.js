"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import { db } from '../../../../../firebase/config';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';
import Spinner from '../../../../../components/Spinner';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ChatComponent from '../../../../../components/ChatComponent';
import LiveLocationMap from '../../../../../components/LiveLocationMap';

const DetailRow = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
        <p className="mt-1 text-md text-zinc-100 font-medium">{value}</p>
    </div>
);

export default function TicketDetailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { ticketId } = params;

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (!ticketId) return;
        const ticketRef = doc(db, 'tickets', ticketId);
        const unsubscribe = onSnapshot(ticketRef, (doc) => {
            if (doc.exists()) {
                setTicket({ id: doc.id, ...doc.data() });
            } else {
                alert("Ticket not found.");
                router.push('/dashboard/customer');
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching ticket:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [ticketId, router]);

    const handleStartRepair = () => {
        if (!confirm("Confirm that the technician has arrived and is starting the repair?")) return;
        updateTicketStatus('Work Started');
    };

    const updateTicketStatus = async (newStatus) => {
        setActionLoading(true);
        const ticketRef = doc(db, 'tickets', ticket.id);
        try {
            await updateDoc(ticketRef, { status: newStatus });
            alert("Status Updated!");
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Spinner /></div>;
    if (!ticket) return <div className="p-8 text-center bg-black text-white min-h-screen">Ticket not found.</div>;

    const canInteract = user && user.uid === ticket.customerId;
    const isViewingSomeoneElsesGuestTicket = ticket.isGuestTicket && !canInteract;

    const appointmentDate = ticket.appointmentDate?.toDate ? ticket.appointmentDate.toDate() : new Date(ticket.appointmentDate);
    const chatEnabledStatuses = ['In Progress', 'Work Started', 'Pending Payment', 'Completed'];

    return (
        <div className="min-h-screen w-full bg-black text-zinc-200 pb-20 selection:bg-yellow-500/30">
            <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
                {ticket.status === 'In Progress' && (
                    <Card className="bg-zinc-900 border border-zinc-800">
                        <CardHeader><CardTitle className="text-white">Technician Live Location</CardTitle></CardHeader>
                        <CardContent><LiveLocationMap technicianLocation={ticket.technicianLocation} /></CardContent>
                    </Card>
                )}

                <Card className="bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden">
                    <CardHeader className="bg-zinc-950/50 border-b border-zinc-800">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-2xl md:text-3xl text-white">{ticket.deviceInfo}</CardTitle>
                            <span className={`px-4 py-1.5 text-sm font-bold rounded-full bg-zinc-800 text-yellow-500 border border-yellow-600/30`}>
                                {ticket.status}
                            </span>
                        </div>
                        <CardDescription className="text-zinc-400 mt-2">{ticket.issueDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                        <DetailRow label="Technician" value={ticket.technicianName || 'Awaiting Assignment'} />
                        <DetailRow label="Scheduled For" value={appointmentDate.toLocaleString()} />
                        <DetailRow label="Service Address" value={ticket.address} />
                        {ticket.issueType && <DetailRow label="Diagnosed Issue" value={ticket.issueType} />}
                    </CardContent>

                    {(ticket.status === 'In Progress' || (ticket.status === 'Completed' && !ticket.isReviewed)) && (
                        <CardFooter className="bg-zinc-950 p-6 border-t border-zinc-800">
                            {ticket.status === 'In Progress' && (
                                <Button
                                    onClick={handleStartRepair}
                                    disabled={actionLoading || !canInteract}
                                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold"
                                    title={!canInteract ? "Only the user who created this ticket can start the repair." : ""}
                                >
                                    {actionLoading ? 'Confirming...' : 'Confirm Repair Start'}
                                </Button>
                            )}
                            {ticket.status === 'Completed' && !ticket.isReviewed && (
                                <Link href={`/dashboard/customer/review/${ticket.id}`} passHref className="w-full">
                                    <Button className="w-full bg-gradient-to-r from-[#BF953F] to-[#B38728] hover:from-[#d4a849] hover:to-[#c4952d] text-black font-bold" disabled={!canInteract}>
                                        Leave a Review
                                    </Button>
                                </Link>
                            )}
                        </CardFooter>
                    )}
                </Card>

                {isViewingSomeoneElsesGuestTicket && (
                    <div className="bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-200 p-4 rounded-md text-center">
                        <p className="font-bold">This ticket was created by a different guest session.</p>
                        <p className="text-sm text-yellow-200/70">You can view the details, but you cannot perform actions like starting the repair.</p>
                    </div>
                )}

                {chatEnabledStatuses.includes(ticket.status) && (
                    <ChatComponent ticketId={ticket.id} />
                )}
            </div>
        </div>
    );
}