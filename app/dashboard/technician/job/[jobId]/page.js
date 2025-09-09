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
        <div className="bg-slate-100 rounded-lg p-4 mb-6 text-center">
            <p className="text-sm text-slate-500 mb-1">Time until appointment</p>
            <p className="text-2xl font-bold text-slate-800">{timeLeft}</p>
        </div>
    );
};

const DetailRow = ({ label, value, icon, isLink = false }) => (
    <div>
        <p className="text-sm font-medium text-slate-500 flex items-center">{icon} <span className="ml-2">{label}</span></p>
        {isLink ? (
             <a href={value} className="mt-1 text-md text-blue-600 underline hover:text-blue-800">{value.replace('tel:', '')}</a>
        ) : (
            <p className="mt-1 text-md text-slate-900">{value}</p>
        )}
    </div>
);

export default function JobDetailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { jobId } = params;

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Fetches job details
    useEffect(() => {
        if (!user || !jobId) return;
        const ticketRef = doc(db, 'tickets', jobId);
        const unsubscribe = onSnapshot(ticketRef, 
            (doc) => {
                if (doc.exists()) {
                    setJob({ id: doc.id, ...doc.data() });
                } else {
                    alert("Job not found.");
                    router.push('/dashboard/technician');
                }
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching job details:", error);
                alert("Could not load job. You may not have permission.");
                setLoading(false);
                router.push('/dashboard/technician');
            }
        );
        return () => unsubscribe();
    }, [user, jobId, router]);

    // --- UPDATED: Manages live location sharing every 30 seconds ---
    useEffect(() => {
        let intervalId = null;

        const updateLocation = () => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        const ticketRef = doc(db, 'tickets', jobId);
                        updateDoc(ticketRef, {
                            technicianLocation: {
                                lat: latitude,
                                lng: longitude,
                                timestamp: new Date()
                            }
                        });
                        console.log(`[Location Update] Position sent at ${new Date().toLocaleTimeString()}`);
                    },
                    (error) => {
                        console.error("Geolocation Error:", error.message);
                        // Don't alert here to avoid spamming the technician
                    },
                    { enableHighAccuracy: true }
                );
            }
        };

        // Start sharing location only when the job status is 'In Progress'
        if (job && job.status === 'In Progress') {
            updateLocation(); // Send location once immediately
            intervalId = setInterval(updateLocation, 30000); // And then every 30 seconds
        }

        // Cleanup: Stop the interval when the component unmounts or the job status changes
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
                console.log("[Location Update] Stopped sharing location.");
            }
        };
    }, [job, jobId]); // Reruns when job status changes

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

    const renderActionButton = () => {
        if (!job) return null;

        if (job.status === 'Pending') {
            return <Button onClick={handleAcceptJob} disabled={actionLoading} className="w-full bg-green-600 hover:bg-green-700">Accept This Job</Button>;
        }
        if (job.status === 'In Progress') {
            return (
                <div className="text-center space-y-4">
                    <p className="text-slate-600 font-semibold animate-pulse">Sharing location... Waiting for customer confirmation.</p>
                    <Button onClick={() => handleNavigate(job.address)} className="w-full bg-purple-600 hover:bg-purple-700">Navigate to Address</Button>
                </div>
            );
        }
        if (job.status === 'Work Started') {
            return (
                <div className="space-y-4">
                     <Button onClick={() => handleNavigate(job.address)} className="w-full bg-purple-600 hover:bg-purple-700">Navigate to Address</Button>
                    <Link href={`/dashboard/technician/payment/${job.id}`} passHref>
                        <Button className="w-full">Proceed to Payment</Button>
                    </Link>
                </div>
            );
        }
        return <p className="text-sm text-center text-slate-500">No actions available.</p>;
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
                        <DetailRow label="Customer Email" value={job.customerEmail} icon="✉️" />
                        {job.contactNumber && <DetailRow label="Contact Number" value={`tel:${job.contactNumber}`} icon="📞" isLink={true} />}
                    </div>
                </CardContent>
                <CardFooter className="bg-slate-50 p-6">
                    {actionLoading ? <div className="flex justify-center w-full"><Spinner/></div> : renderActionButton()}
                </CardFooter>
            </Card>

            {chatEnabledStatuses.includes(job.status) && (
                <ChatComponent ticketId={job.id} />
            )}
        </div>
    );
}

