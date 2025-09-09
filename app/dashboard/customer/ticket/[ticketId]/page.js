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
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-md text-slate-900">{value}</p>
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

    // This useEffect for fetching the ticket is now simplified
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

    const getStatusVariant = (status) => { /* ... remains unchanged ... */ };
    
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

    if (loading) return <Spinner />;
    if (!ticket) return <div className="p-8 text-center">Ticket not found.</div>;

    // --- UPDATED: Logic to determine if the current user can interact ---
    // A user can interact if they are the original customer who created the ticket.
    const canInteract = user && user.uid === ticket.customerId;
    // A special case: the ticket belongs to a guest, but the current user is a *different* guest.
    const isViewingSomeoneElsesGuestTicket = ticket.isGuestTicket && !canInteract;

    const appointmentDate = ticket.appointmentDate?.toDate ? ticket.appointmentDate.toDate() : new Date(ticket.appointmentDate);
    const chatEnabledStatuses = ['In Progress', 'Work Started', 'Pending Payment', 'Completed'];

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
            {ticket.status === 'In Progress' && (
                <Card>
                    <CardHeader><CardTitle>Technician Live Location</CardTitle></CardHeader>
                    <CardContent><LiveLocationMap technicianLocation={ticket.technicianLocation} /></CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl md:text-3xl">{ticket.deviceInfo}</CardTitle>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full`}>
                            {ticket.status}
                        </span>
                    </div>
                    <CardDescription>{ticket.issueDescription}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                    <DetailRow label="Technician" value={ticket.technicianName || 'Awaiting Assignment'} />
                    <DetailRow label="Scheduled For" value={appointmentDate.toLocaleString()} />
                    <DetailRow label="Service Address" value={ticket.address} />
                    {ticket.issueType && <DetailRow label="Diagnosed Issue" value={ticket.issueType} />}
                </CardContent>
                
                {/* --- UPDATED: Conditionally render the footer based on status and user --- */}
                {(ticket.status === 'In Progress' || (ticket.status === 'Completed' && !ticket.isReviewed)) && (
                    <CardFooter className="bg-slate-50 p-6">
                        {ticket.status === 'In Progress' && (
                            // Disable the start button if the current user is not the original customer
                            <Button 
                                onClick={handleStartRepair} 
                                disabled={actionLoading || !canInteract} 
                                className="w-full bg-green-600 hover:bg-green-700"
                                title={!canInteract ? "Only the user who created this ticket can start the repair." : ""}
                            >
                                {actionLoading ? 'Confirming...' : 'Confirm Repair Start'}
                            </Button>
                        )}
                        {ticket.status === 'Completed' && !ticket.isReviewed && (
                            <Link href={`/dashboard/customer/review/${ticket.id}`} passHref className="w-full">
                                <Button className="w-full bg-yellow-500 hover:bg-yellow-600" disabled={!canInteract}>
                                    Leave a Review
                                </Button>
                            </Link>
                        )}
                    </CardFooter>
                )}
            </Card>

            {isViewingSomeoneElsesGuestTicket && (
                 <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md text-center">
                    <p className="font-bold">This ticket was created by a different guest session.</p>
                    <p className="text-sm">You can view the details, but you cannot perform actions like starting the repair.</p>
                </div>
            )}

            {chatEnabledStatuses.includes(ticket.status) && (
                <ChatComponent ticketId={ticket.id} />
            )}
        </div>
    );
}

