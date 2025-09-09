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
import LiveLocationMap from '../../../../../components/LiveLocationMap'; // Import the new map component

const DetailRow = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-md text-slate-900">{value}</p>
    </div>
);

export default function TicketDetailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams(); // Use the hook
    const { ticketId } = params; // Get the ID

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (!user || !ticketId) return;
        const ticketRef = doc(db, 'tickets', ticketId);
        const unsubscribe = onSnapshot(ticketRef, 
            (doc) => {
                if (doc.exists()) {
                    const ticketData = { id: doc.id, ...doc.data() };
                    if (ticketData.customerId !== user.uid) {
                        alert("Access Denied.");
                        router.push('/dashboard/customer');
                        return;
                    }
                    setTicket(ticketData);
                } else {
                    alert("Ticket not found.");
                    router.push('/dashboard/customer');
                }
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching ticket:", error);
                alert("Could not load ticket details.");
                setLoading(false);
                router.push('/dashboard/customer');
            }
        );
        return () => unsubscribe();
    }, [user, ticketId, router]);

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'Pending Payment': return 'bg-red-100 text-red-800';
            case 'Work Started': return 'bg-indigo-100 text-indigo-800';
            case 'In Progress': return 'bg-blue-100 text-blue-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

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

    const appointmentDate = ticket.appointmentDate?.toDate ? ticket.appointmentDate.toDate() : new Date(ticket.appointmentDate);
    
    const chatEnabledStatuses = ['In Progress', 'Work Started', 'Pending Payment', 'Completed'];

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
            {/* --- NEW: Conditionally render the map card --- */}
            {ticket.status === 'In Progress' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Technician Live Location</CardTitle>
                        <CardDescription>Your technician is on the way. Track their location below.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LiveLocationMap technicianLocation={ticket.technicianLocation} />
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl md:text-3xl">{ticket.deviceInfo}</CardTitle>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusVariant(ticket.status)}`}>
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
                {ticket.status === 'In Progress' && (
                    <CardFooter className="bg-slate-50 p-6">
                        <Button onClick={handleStartRepair} disabled={actionLoading} className="w-full bg-green-600 hover:bg-green-700">
                            {actionLoading ? 'Confirming...' : 'Confirm Repair Start'}
                        </Button>
                    </CardFooter>
                )}
                {ticket.status === 'Completed' && !ticket.isReviewed && (
                     <CardFooter className="bg-slate-50 p-6">
                        <Link href={`/dashboard/customer/review/${ticket.id}`} passHref className="w-full">
                            <Button className="w-full bg-yellow-500 hover:bg-yellow-600">Leave a Review</Button>
                        </Link>
                    </CardFooter>
                )}
            </Card>

            {chatEnabledStatuses.includes(ticket.status) && (
                <ChatComponent ticketId={ticket.id} />
            )}
        </div>
    );
}

