"use client";

import React, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { db, FieldValue } from '../../../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function RequestPartsPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [partName, setPartName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        if (!partName || !quantity) {
            alert("Incomplete Form: Please enter at least a part name and quantity.");
            return;
        }
        const numQuantity = parseInt(quantity, 10);
        if (isNaN(numQuantity) || numQuantity <= 0) {
            alert("Invalid Quantity: Please enter a valid number.");
            return;
        }

        setLoading(true);
        try {
            if (user) {
                await addDoc(collection(db, "partRequests"), {
                    technicianId: user.uid,
                    technicianName: user.displayName || user.email,
                    partName,
                    quantity: numQuantity,
                    notes,
                    status: 'Pending',
                    createdAt: serverTimestamp(),
                });
                alert("Success! Your parts request has been sent to the wholesaler.");
                router.push('/dashboard/technician');
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-2xl mx-auto bg-zinc-900 rounded-lg shadow-lg p-8">
                <h2 className="text-3xl font-bold text-zinc-100">Request Parts</h2>
                <p className="text-zinc-500 mb-8">Submit a request for parts needed for your repairs.</p>
                
                <form onSubmit={handleSubmitRequest} className="space-y-6">
                    <div>
                        <label htmlFor="partName" className="text-lg font-semibold text-zinc-300">Part Name</label>
                        <input
                            id="partName"
                            type="text"
                            value={partName}
                            onChange={(e) => setPartName(e.target.value)}
                            placeholder="e.g., iPhone 13 Screen Assembly"
                            className="w-full mt-2 p-4 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="quantity" className="text-lg font-semibold text-zinc-300">Quantity</label>
                        <input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="e.g., 5"
                            className="w-full mt-2 p-4 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="notes" className="text-lg font-semibold text-zinc-300">Notes (Optional)</label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g., For models A2484, A2638, A2640"
                            rows="4"
                            className="w-full mt-2 p-4 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-yellow-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-yellow-400 transition-all disabled:bg-zinc-700"
                    >
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </form>
            </div>
        </div>
    );
}
