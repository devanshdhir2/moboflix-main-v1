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
import { AlertCircle, MessageSquare } from 'lucide-react';

const CountdownTimer = ({ appointmentDate }) => {
    const [timeLeft, setTimeLeft] = useState('');
    useEffect(() => {
        const timer = setInterval(() => {
            const difference = +new Date(appointmentDate) - +new Date();
            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);
                const parts = [];
                if (days > 0) parts.push(`${days}d`);
                if (hours > 0) parts.push(`${hours}h`);
                parts.push(`${minutes}m ${seconds}s`);
                setTimeLeft(parts.join(' '));
            } else { setTimeLeft("Appointment Overdue"); }
        }, 1000);
        return () => clearInterval(timer);
    }, [appointmentDate]);
    return (
        <div className="bg-zinc-900 rounded-lg p-4 mb-6 text-center">
            <p className="text-sm text-zinc-500 mb-1">Time until appointment</p>
            <p className="text-2xl font-bold text-zinc-200">{timeLeft}</p>
        </div>
    );
};

const DetailRow = ({ label, value, icon, isLink = false }) => (
    <div>
        <p className="text-sm font-medium text-zinc-500 flex items-center">{icon} <span className="ml-2">{label}</span></p>
        {isLink ? (
             <a href={value} className="mt-1 text-md text-yellow-500 underline hover:text-yellow-300">{value.replace('tel:', '')}</a>
        ) : (
            <p className="mt-1 text-md text-zinc-100">{value}</p>
        )}
    </div>
);

export default function TechnicianJobDetailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { jobId } = params;

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (!user || !jobId) return;
        const ticketRef = doc(db, 'tickets', jobId);
        const unsubscribe = onSnapshot(ticketRef, 
            (doc) => {
                if (doc.exists()) {
                    setJob({ id: doc.id, ...doc.data() });
                } else {
                    alert("Ticket not found.");
                    router.push('/dashboard/technician');
                }
                setLoading(false);
            }, 
            (error) => {
                console.error("Error fetching ticket:", error);
                alert("Could not fetch ticket details. You may not have permission.");
                setLoading(false);
                router.push('/dashboard/technician');
            }
        );
        return () => unsubscribe();
    }, [user, jobId, router]);

    useEffect(() => {
        let intervalId = null;
        const updateLocation = () => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        const ticketRef = doc(db, 'tickets', jobId);
                        updateDoc(ticketRef, {
                            technicianLocation: { lat: latitude, lng: longitude, timestamp: new Date() }
                        });
                    },
                    (error) => { console.error("Geolocation Error:", error.message); },
                    { enableHighAccuracy: true }
                );
            }
        };
        if (job && job.status === 'In Progress') {
            updateLocation();
            intervalId = setInterval(updateLocation, 30000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [job, jobId]);

    const handleNavigate = (address) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        window.open(url, '_blank');
    };

    const handleAcceptJob = () => {
        if (!confirm("Are you sure you want to accept this job? This will start sharing your live location with the customer.")) return;
        setActionLoading(true);
        const ticketRef = doc(db, 'tickets', jobId);
        updateDoc(ticketRef, { 
            status: 'In Progress',
            technicianId: user.uid,
            technicianName: user.displayName || user.email 
        })
        .then(() => alert("Job accepted!"))
        .catch((error) => alert(`Error: ${error.message}`))
        .finally(() => setActionLoading(false));
    };

    const handleWhatsAppContact = () => {
        if (!job?.contactNumber) {
            alert("Contact number not found for this user.");
            return;
        }
        const whatsappUrl = `https://wa.me/91${job.contactNumber}`;
        window.open(whatsappUrl, '_blank');
    };

    const renderActionButton = () => {
        if (!job) return null;

        const isProductOrder = job.type === 'product';

        if (job.isGuestTicket) {
            const actionText = isProductOrder ? 'delivery' : 'repair';
            if (job.status === 'In Progress') {
                return (
                    <div className="space-y-4">
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">
                            <p className="font-bold">Guest User - Awaiting Start</p>
                            <p className="text-sm">The user may be offline. Contact them on WhatsApp to coordinate. The owner can manually start the {actionText} if needed.</p>
                        </div>
                        <Button onClick={handleWhatsAppContact} className="w-full bg-yellow-500 hover:bg-yellow-500 flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Contact on WhatsApp</Button>
                        <Button onClick={() => handleNavigate(job.address)} className="w-full bg-zinc-800 hover:bg-zinc-700">Navigate to Address</Button>
                    </div>
                );
            }
            if (job.status === 'Work Started') {
                 return (
                    <div className="space-y-4">
                        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md">
                            <p className="font-bold">Guest {isProductOrder ? 'Delivery' : 'Repair'} In Progress</p>
                            <p className="text-sm">Work has been started. You may now proceed.</p>
                        </div>
                        <Button onClick={handleWhatsAppContact} className="w-full bg-yellow-500 hover:bg-yellow-500 flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Contact on WhatsApp</Button>
                        <Link href={`/dashboard/technician/payment/${job.id}`} passHref><Button className="w-full">Proceed to Payment</Button></Link>
                    </div>
                );
            }
        }
        
        if (job.status === 'Pending') {
            return <Button onClick={handleAcceptJob} disabled={actionLoading} className="w-full bg-yellow-500 hover:bg-yellow-400">Accept This Job</Button>;
        }
        if (job.status === 'In Progress') {
            return (
                <div className="text-center space-y-4">
                    <p className="text-zinc-400 font-semibold animate-pulse">Waiting for customer to confirm start...</p>
                    <Button onClick={() => handleNavigate(job.address)} className="w-full bg-zinc-800 hover:bg-zinc-700">Navigate to Address</Button>
                </div>
            );
        }
        if (job.status === 'Work Started') {
            return (
                <div className="space-y-4">
                     <Button onClick={() => handleNavigate(job.address)} className="w-full bg-zinc-800 hover:bg-zinc-700">Navigate to Address</Button>
                    <Link href={`/dashboard/technician/payment/${job.id}`} passHref>
                        <Button className="w-full">Proceed to Payment</Button>
                    </Link>
                </div>
            );
        }
        return <p className="text-sm text-center text-zinc-500">No actions available.</p>;
    };

    if (loading) return <Spinner />;
    if (!job) return <div className="p-8 text-center">Job data could not be loaded.</div>;

    const appointmentDateTime = job.appointmentDate?.toDate ? job.appointmentDate.toDate() : new Date(job.appointmentDate);
    const chatEnabledStatuses = ['In Progress', 'Work Started', 'Pending Payment', 'Completed'];

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl md:text-3xl">{job.deviceInfo}</CardTitle>
                    <CardDescription>{job.issueDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                    <CountdownTimer appointmentDate={appointmentDateTime} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-t pt-6">
                        <DetailRow label="Time Slot" value={appointmentDateTime.toLocaleString()} icon="🕒" />
                        <DetailRow label="Address" value={job.address} icon="📍" />
                        <DetailRow label="Customer" value={job.customerEmail} icon="✉️" />
                        {job.contactNumber && <DetailRow label="Contact Number" value={`tel:${job.contactNumber}`} icon="📞" isLink={true} />}
                    </div>
                </CardContent>
                <CardFooter className="bg-zinc-950 p-6">
                    <div className="w-full space-y-3">
                        {actionLoading ? <Spinner/> : renderActionButton()}
                    </div>
                </CardFooter>
            </Card>

            {chatEnabledStatuses.includes(job.status) && (
                <ChatComponent ticketId={job.id} />
            )}
        </div>
    );
}

