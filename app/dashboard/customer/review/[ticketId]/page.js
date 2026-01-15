"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import { db } from "../../../../../firebase/config";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Spinner from "../../../../../components/Spinner";

const StarRating = ({ rating, setRating }) => {
    return (
        <div className="flex justify-center space-x-4">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-5xl transition-transform transform hover:scale-125 focus:outline-none"
                    aria-label={`${star} star`}
                >
                    <span className={star <= rating ? "text-yellow-400" : "text-slate-600"}>
                        ★
                    </span>
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
    const [review, setReview] = useState("");

    useEffect(() => {
        if (!user || !ticketId) return;

        const ticketRef = doc(db, "tickets", ticketId);
        const unsubscribe = onSnapshot(ticketRef, (docSnap) => {
            if (docSnap.exists()) {
                const ticketData = { id: docSnap.id, ...docSnap.data() };
                // Security check: ensure the logged-in user is the customer for this ticket
                if (ticketData.customerId !== user.uid) {
                    alert("Access Denied: You can only review your own tickets.");
                    router.push("/dashboard/customer");
                    return;
                }
                setTicket(ticketData);
            } else {
                alert("Ticket not found.");
                router.push("/dashboard/customer");
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
        const ticketRef = doc(db, "tickets", ticket.id);
        try {
            await updateDoc(ticketRef, {
                rating: rating,
                review: review,
                isReviewed: true,
            });
            alert("Thank You! Your review has been submitted.");
            router.push("/dashboard/customer");
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <Spinner />;
    if (!ticket) return <div className="p-8 text-center">Ticket not found.</div>;

    if (ticket.status !== "Completed" || ticket.isReviewed) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-8">
                <div className="max-w-xl w-full text-center">
                    <p className="text-lg">This ticket cannot be reviewed at this time.</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 inline-block bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-200 py-10 px-5 sm:px-8">
            <div className="max-w-2xl mx-auto bg-slate-900/70 border border-slate-800 rounded-lg shadow-lg p-8">
                <h2 className="text-3xl font-bold text-white text-center">Leave a Review</h2>
                <p className="text-slate-400 mb-8 text-center">
                    How was your experience with {ticket.technicianName}?
                </p>

                <form onSubmit={handleSubmitReview} className="space-y-8">
                    <div>
                        <label className="text-lg font-semibold text-slate-300 block text-center mb-4">
                            Your Rating
                        </label>
                        <StarRating rating={rating} setRating={setRating} />
                    </div>

                    <div>
                        <label htmlFor="review" className="text-lg font-semibold text-slate-300">
                            Your Review (Optional)
                        </label>
                        <textarea
                            id="review"
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Describe your experience..."
                            rows="5"
                            className="w-full mt-2 p-4 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-0 outline-none"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-all disabled:bg-slate-600"
                    >
                        {actionLoading ? "Submitting..." : "Submit Review"}
                    </button>
                </form>
            </div>
        </div>
    );
}
