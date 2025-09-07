"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import { db } from '../../../../../firebase/config';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Spinner from '../../../../../components/Spinner';

const StarRating = ({ rating, setRating }) => {
    return (
        <div className="flex justify-center space-x-4">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-5xl transition-transform transform hover:scale-125"
                >
                    <span className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                </button>
            ))}
        </div>
    );
};

export default function LeaveReviewPage({ params }) {
    const { user } = useAuth();
    const router = useRouter();
    const { ticketId } = params;

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');

    useEffect(() => {
        if (!user || !ticketId) return;

        const ticketRef = doc(db, 'tickets', ticketId);
        const unsubscribe = onSnapshot(ticketRef, (doc) => {
            if (doc.exists()) {
                const ticketData = { id: doc.id, ...doc.data() };
                // Security check: ensure the logged-in user is the customer for this ticket
                if (ticketData.customerId !== user.uid) {
                    alert("Access Denied: You can only review your own tickets.");
                    router.push('/dashboard/customer');
                    return;
                }
                setTicket(ticketData);
            } else {
                alert("Ticket not found.");
                router.push('/dashboard/customer');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, ticketId, router]);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            alert("Please select a star rating before submitting.");
            return;
        }
        setActionLoading(true);
        const ticketRef = doc(db, 'tickets', ticket.id);
        try {
            await updateDoc(ticketRef, {
                rating: rating,
                review: review,
                isReviewed: true,
            });
            alert("Thank You! Your review has been submitted.");
            router.push('/dashboard/customer');
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <Spinner />;
    if (!ticket) return <div className="p-8 text-center">Ticket not found.</div>;

    if (ticket.status !== 'Completed' || ticket.isReviewed) {
         return (
            <div className="text-center p-8">
                <p className="text-lg">This ticket cannot be reviewed at this time.</p>
                <button onClick={() => router.back()} className="mt-4 text-blue-600 font-semibold">Go Back</button>
            </div>
         )
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-800 text-center">Leave a Review</h2>
                <p className="text-gray-500 mb-8 text-center">How was your experience with {ticket.technicianName}?</p>
                
                <form onSubmit={handleSubmitReview} className="space-y-8">
                    <div>
                        <label className="text-lg font-semibold text-gray-700 block text-center mb-4">Your Rating</label>
                        <StarRating rating={rating} setRating={setRating} />
                    </div>
                    <div>
                        <label htmlFor="review" className="text-lg font-semibold text-gray-700">Your Review (Optional)</label>
                        <textarea
                            id="review"
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Describe your experience..."
                            rows="5"
                            className="w-full mt-2 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                    </div>
                    <button type="submit" disabled={actionLoading} className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-all disabled:bg-gray-400">
                        {actionLoading ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            </div>
        </div>
    );
}
