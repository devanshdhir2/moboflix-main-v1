"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase/config';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import Link from 'next/link';
import Spinner from '../../../components/Spinner';
import { ShoppingCart, Bell } from 'lucide-react';
import { getMessagingToken } from '../../../firebase/messaging-init'; // Import the new function
import { getMessaging, onMessage } from "firebase/messaging"; // For foreground messages
import { app } from '../../../firebase/config';

const WAREHOUSE_LOCATION = "patiala, Punjab, India";

const JobItem = ({ job, disabled }) => {
    // This component remains the same as your version
    const appointmentDate = job.appointmentDate?.toDate ? job.appointmentDate.toDate() : new Date(job.appointmentDate);
    const itemClasses = `bg-white rounded-lg shadow-md p-6 mb-4 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}`;
    const detailUrl = `/dashboard/technician/job/${job.id}`;
    const isProductOrder = job.type === 'product';
    const content = (
        <div className={itemClasses}>
            {isProductOrder && (
                <div className="text-xs font-bold uppercase text-white bg-green-500 inline-block px-2 py-1 rounded-full mb-2">Product Delivery</div>
            )}
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">{job.deviceInfo}</h3>
            <p className="text-gray-600 truncate">{job.issueDescription}</p>
            <div className="border-t border-gray-200 mt-4 pt-4">
                <p className="text-sm text-gray-500 mb-1">📍 {job.address}</p>
                <p className="text-sm text-gray-500">🕒 {appointmentDate.toLocaleString()}</p>
            </div>
        </div>
    );
    if (disabled) return content;
    return <Link href={detailUrl}>{content}</Link>;
};

export default function TechnicianDashboard() {
    const { user } = useAuth();
    const [activeJob, setActiveJob] = useState(null);
    const [assignedJobs, setAssignedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notificationStatus, setNotificationStatus] = useState('default');

    // --- NEW: Request permission and listen for foreground messages ---
    useEffect(() => {
        if (user) {
            getMessagingToken(user.uid)
                .then(token => {
                    if (token) setNotificationStatus('enabled');
                    else setNotificationStatus('denied');
                })
                .catch(() => setNotificationStatus('denied'));

            // Listen for messages that arrive while the page is active
            const messaging = getMessaging(app);
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Foreground message received.', payload);
                // Play sound for foreground notification
                const sound = new Audio('/notification.mp3');
                sound.play();
                // Optionally, you can show a toast notification here as well
                alert(`New Job Assigned: ${payload.notification.title}`);
            });
            return () => unsubscribe();
        }
    }, [user]);
    
    // --- NEW: Sound and visual feedback for new jobs ---
    useEffect(() => {
        // Play sound when a new job is added to the list and the app is in the foreground
        // This is a simple way to trigger sound on new data
        if (assignedJobs.length > 0 && !loading) {
            const sound = new Audio('/notification.mp3');
            sound.play().catch(e => console.log("Audio play failed, user interaction needed.", e));
        }
    }, [assignedJobs, loading]);

    // Your existing useEffect for fetching jobs remains the same
    useEffect(() => {
        if (!user) return;
        const activeJobQuery = query(collection(db, "tickets"), where("technicianId", "==", user.uid), where("status", "in", ["In Progress", "Work Started"]), limit(1));
        const unsubscribeActive = onSnapshot(activeJobQuery, (qs) => setActiveJob(qs.empty ? null : { id: qs.docs[0].id, ...qs.docs[0].data() }));

        const assignedJobsQuery = query(collection(db, "tickets"), where("technicianId", "==", user.uid), where("status", "==", "Pending"), orderBy("createdAt", "desc"));
        const unsubscribeAssigned = onSnapshot(assignedJobsQuery, (qs) => {
            setAssignedJobs(qs.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => {
            unsubscribeActive();
            unsubscribeAssigned();
        };
    }, [user]);
    
    const handleNavigateToWarehouse = () => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(WAREHOUSE_LOCATION)}`, '_blank');
    };

    if (loading) return <Spinner />;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Technician Dashboard</h2>
            
            {/* Notification Status UI */}
            {notificationStatus !== 'enabled' && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md mb-6" role="alert">
                    <p className="font-bold">Enable Notifications</p>
                    <p>To receive new job alerts instantly, please enable notifications when prompted by your browser.</p>
                </div>
            )}
            
            {activeJob && (
                <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">My Active Job</h3>
                    <JobItem job={activeJob} />
                </div>
            )}

            <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">New Assigned Jobs</h3>
                {assignedJobs.length > 0 ? (
                    <div>
                        {assignedJobs.map(job => (
                            <JobItem key={job.id} job={job} disabled={!!activeJob} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-white rounded-lg shadow-md">
                        <p className="text-gray-500">You have no new jobs assigned.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

