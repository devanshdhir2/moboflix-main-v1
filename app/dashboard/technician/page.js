"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase/config';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import Link from 'next/link';
import Spinner from '../../../components/Spinner';

// Hardcoded Warehouse Location
const WAREHOUSE_LOCATION = "patiala, Punjab, India";

const JobItem = ({ job, disabled }) => {
    const appointmentDate = job.appointmentDate?.toDate ? job.appointmentDate.toDate() : new Date(job.appointmentDate);
    const itemClasses = `bg-white rounded-lg shadow-md p-6 mb-4 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}`;
    const detailUrl = `/dashboard/technician/job/${job.id}`;

    const content = (
        <div className={itemClasses}>
            <h3 className="text-xl font-bold text-gray-800">{job.deviceInfo}</h3>
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

        // Listener for the active job
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

        // Listener for new assigned jobs
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <button onClick={handleNavigateToWarehouse} className="flex items-center justify-center p-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all">
                    <span>📍</span>
                    <span className="ml-2">To Warehouse</span>
                </button>
                <Link href="/dashboard/technician/view-inventory" className="flex items-center justify-center p-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-all">
                    <span>📦</span>
                    <span className="ml-2">View Inventory</span>
                </Link>
                {/* CORRECTED: This now links to the request parts page */}
                <Link href="/dashboard/technician/request-parts" className="flex items-center justify-center p-4 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-all">
                    <span>🔧</span>
                    <span className="ml-2">Request Parts</span>
                </Link>
            </div>
            
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

