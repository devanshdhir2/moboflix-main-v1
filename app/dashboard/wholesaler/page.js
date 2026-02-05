"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase/config';
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import Link from 'next/link';
import Spinner from '../../../components/Spinner';

const RequestItem = ({ request }) => {
    const handleFulfillRequest = () => {
        if (!confirm(`Are you sure you want to mark this request for "${request.partName}" as fulfilled?`)) {
            return;
        }
        
        const requestRef = doc(db, 'partRequests', request.id);
        updateDoc(requestRef, { status: 'Fulfilled' })
            .catch(error => {
                alert("Error: Could not update the request.");
                console.error("Fulfill request error:", error);
            });
    };

    const createdAtDate = request.createdAt?.toDate ? request.createdAt.toDate() : new Date();

    return (
        <div className="bg-zinc-900 rounded-lg shadow-md p-6 mb-4 relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-zinc-100 w-2/3">{request.partName} <span className="text-lg font-medium text-zinc-500">(Qty: {request.quantity})</span></h3>
                {request.status === 'Pending' && (
                    <button onClick={handleFulfillRequest} className="bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-yellow-400 transition-all text-sm">
                        Fulfill
                    </button>
                )}
            </div>
            <p className="text-zinc-400 mb-2"><span className="font-semibold">Requested by:</span> {request.technicianName}</p>
            {request.notes && <p className="text-sm text-zinc-500 italic bg-zinc-950 p-2 rounded-md">Notes: {request.notes}</p>}
            <div className="border-t border-zinc-800 mt-4 pt-4">
                <p className="text-xs text-zinc-500">Requested on: {createdAtDate.toLocaleDateString()}</p>
            </div>
            {request.status === 'Fulfilled' && (
                <div className="absolute top-4 right-4 flex items-center bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                    <span className="mr-1">✔️</span>
                    Fulfilled
                </div>
            )}
        </div>
    );
};

export default function WholesaleDashboard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, "partRequests"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedRequests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(fetchedRequests);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching part requests: ", error);
            alert("Could not fetch part requests.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="text-3xl font-bold text-zinc-100 mb-4 sm:mb-0">Wholesale Portal</h2>
                {/* CORRECTED: This now links to the manage inventory page */}
                <Link href="/dashboard/wholesaler/manage-inventory" className="flex items-center justify-center p-4 w-full sm:w-auto bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-400 transition-all">
                    <span>📦</span>
                    <span className="ml-2">Manage Inventory</span>
                </Link>
            </div>

            {requests.length > 0 ? (
                <div>
                    {requests.map(request => (
                        <RequestItem key={request.id} request={request} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-zinc-900 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-zinc-300">No part requests found.</h3>
                    <p className="text-zinc-500 mt-2">When technicians request parts, they will appear here.</p>
                </div>
            )}
        </div>
    );
}

