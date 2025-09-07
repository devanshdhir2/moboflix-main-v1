"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import { db } from '../../../../../firebase/config';
import { doc, onSnapshot, updateDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Spinner from '../../../../../components/Spinner';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DetailRow = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-lg text-gray-900">{value}</p>
    </div>
);

const TechnicianSelectItem = ({ item, onSelect }) => (
    <div onClick={() => onSelect(item)} className="flex items-center p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50">
        <div className="text-3xl">👤</div>
        <div className="ml-4">
            <p className="font-semibold text-gray-800">{item.displayName || item.email}</p>
            <p className="text-sm text-gray-500">{item.specialty || 'General Repairs'}</p>
        </div>
    </div>
);

export default function OwnerTicketDetailPage({ params }) {
    const { user } = useAuth();
    const router = useRouter();
    const { ticketId } = params;

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [technicians, setTechnicians] = useState([]);

    useEffect(() => {
        if (!user || !ticketId) return;
        const ticketRef = doc(db, 'tickets', ticketId);
        const unsubscribe = onSnapshot(ticketRef, (doc) => {
            if (doc.exists()) {
                setTicket({ id: doc.id, ...doc.data() });
            } else {
                alert("Ticket not found.");
                router.push('/dashboard/owner');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user, ticketId, router]);
    
    useEffect(() => {
        const fetchTechnicians = async () => {
            const techQuery = query(collection(db, "users"), where("role", "==", "technician"));
            const querySnapshot = await getDocs(techQuery);
            const fetchedTechnicians = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setTechnicians(fetchedTechnicians);
        };
        if (isModalVisible) {
            fetchTechnicians().catch(console.error);
        }
    }, [isModalVisible]);

    const handleReassign = async (newTechnician) => {
        setModalVisible(false);
        setActionLoading(true);
        const ticketRef = doc(db, 'tickets', ticket.id);
        try {
            await updateDoc(ticketRef, {
                technicianId: newTechnician.id,
                technicianName: newTechnician.displayName || newTechnician.email,
            });
            alert("Success! Ticket has been reassigned.");
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
      };

    const handleApprovePayment = async () => {
        setActionLoading(true);
        const ticketRef = doc(db, 'tickets', ticket.id);
        try {
            await updateDoc(ticketRef, { status: 'Completed' });
            alert("Payment Approved. The ticket is now completed.");
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <Spinner />;
    if (!ticket) return <div className="p-8 text-center">Ticket not found.</div>;

    const appointmentDate = ticket.appointmentDate?.toDate ? ticket.appointmentDate.toDate() : new Date(ticket.appointmentDate);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{ticket.deviceInfo}</h2>
            <p className="text-lg text-gray-600 mb-6">Admin view for Ticket #{ticket.id.substring(0,6)}...</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Ticket Details</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <DetailRow label="Customer" value={ticket.customerEmail} />
                            {/* --- NEW FIELD --- */}
                            <DetailRow label="Contact" value={ticket.contactNumber || 'Not Provided'} />
                            <DetailRow label="Technician" value={ticket.technicianName} />
                            <DetailRow label="Status" value={ticket.status} />
                            <DetailRow label="Scheduled For" value={appointmentDate.toLocaleString()} />
                            <DetailRow label="Address" value={ticket.address} />
                            {ticket.finalAmount && <DetailRow label="Final Amount" value={`₹${ticket.finalAmount}`} />}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Customer Review</CardTitle></CardHeader>
                        <CardContent>
                        {ticket.isReviewed ? (
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className={`text-2xl ${i < ticket.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                                    ))}
                                </div>
                                <p className="text-gray-600 italic">"{ticket.review || 'No written review provided.'}"</p>
                            </div>
                        ) : <p className="text-gray-500">The customer has not left a review yet.</p>}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1">
                    <Card>
                         <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
                         <CardContent>
                         {actionLoading ? <Spinner/> : (
                             <div className="space-y-4">
                                {ticket.status === 'Pending Payment' && (
                                     <Button onClick={handleApprovePayment} className="w-full bg-green-600 hover:bg-green-700">Approve Payment (₹{ticket.finalAmount})</Button>
                                )}
                                {ticket.status !== 'Completed' && (
                                     <Button onClick={() => setModalVisible(true)} className="w-full">Reassign Technician</Button>
                                )}
                                {ticket.status === 'Completed' && <p className="text-sm text-gray-500 text-center">No actions available for completed tickets.</p>}
                             </div>
                         )}
                         </CardContent>
                    </Card>
                </div>
            </div>

            {isModalVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                        <h3 className="text-xl font-bold p-6 border-b">Select a New Technician</h3>
                        <div className="overflow-y-auto">
                            {technicians.map(tech => <TechnicianSelectItem key={tech.id} item={tech} onSelect={handleReassign} />)}
                        </div>
                        <Button variant="ghost" onClick={() => setModalVisible(false)} className="p-4 border-t">Cancel</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

