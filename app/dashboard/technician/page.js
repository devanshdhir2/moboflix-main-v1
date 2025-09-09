"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase/config';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import Link from 'next/link';
import Spinner from '../../../components/Spinner';
import { ShoppingCart } from 'lucide-react'; // Import icon for products

// Hardcoded Warehouse Location
const WAREHOUSE_LOCATION = "patiala, Punjab, India";

const JobItem = ({ job, disabled }) => {
    const appointmentDate = job.appointmentDate?.toDate ? job.appointmentDate.toDate() : new Date(job.appointmentDate);
    const itemClasses = `bg-white rounded-lg shadow-md p-6 mb-4 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}`;
    const detailUrl = `/dashboard/technician/job/${job.id}`;
    
    // --- UPDATED: Differentiate between repair jobs and product deliveries ---
    const isProductOrder = job.type === 'product';

    const content = (
        <div className={itemClasses}>
             {/* --- ADDED: A clear badge for product orders --- */}
            {isProductOrder && (
                <div className="text-xs font-bold uppercase text-white bg-green-500 inline-block px-2 py-1 rounded-full mb-2">
                    Product Delivery
                </div>
            )}
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {job.deviceInfo}
            </h3>
            <p className="text-gray-600 truncate">{job.issueDescription}</p>
            <div className="border-t border-gray-200 mt-4 pt-4">
                <p className="text-sm text-gray-500 mb-1">📍 {job.address}</p>
                <p className="text-sm text-gray-500">🕒 {appointmentDate.toLocaleString()}</p>
            </div>
        </div>
    );
    
    if (disabled) {
        return content;
    }

    return <Link href={detailUrl}>{content}</Link>;
};

export default function TechnicianDashboard() {
    const { user } = useAuth();
    const [activeJob, setActiveJob] = useState(null);
    const [assignedJobs, setAssignedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Listener for the active job (includes both repairs and product deliveries)
        const activeJobQuery = query(
            collection(db, "tickets"),
            where("technicianId", "==", user.uid),
            where("status", "in", ["In Progress", "Work Started"]),
            limit(1)
        );
        const unsubscribeActive = onSnapshot(activeJobQuery, (querySnapshot) => {
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                setActiveJob({ id: doc.id, ...doc.data() });
            } else {
                setActiveJob(null);
            }
            setLoading(false);
        });

        // Listener for new assigned jobs (includes both repairs and product deliveries)
        const assignedJobsQuery = query(
            collection(db, "tickets"),
            where("technicianId", "==", user.uid),
            where("status", "==", "Pending"),
            orderBy("createdAt", "desc")
        );
        const unsubscribeAssigned = onSnapshot(assignedJobsQuery, (querySnapshot) => {
            const fetchedJobs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAssignedJobs(fetchedJobs);
            setLoading(false);
        });

        return () => {
            unsubscribeActive();
            unsubscribeAssigned();
        };
    }, [user]);
    
    const handleNavigateToWarehouse = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(WAREHOUSE_LOCATION)}`;
        window.open(url, '_blank');
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Technician Dashboard</h2>


            
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

