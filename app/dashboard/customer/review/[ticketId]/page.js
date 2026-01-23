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
                    <span className={star <= rating ? "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" : "text-zinc-700"}>
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

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Spinner /></div>;
    if (!ticket) return <div className="p-8 text-center bg-black text-white min-h-screen">Ticket not found.</div>;

    if (ticket.status !== "Completed" || ticket.isReviewed) {
        return (
            <div className="min-h-screen bg-black text-zinc-200 flex items-center justify-center p-8">
                <div className="max-w-xl w-full text-center">
                    <p className="text-lg">This ticket cannot be reviewed at this time.</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 inline-block bg-zinc-800 text-white font-semibold py-2 px-4 rounded-lg hover:bg-zinc-700 transition border border-zinc-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-black text-zinc-200 py-10 px-5 sm:px-8 selection:bg-yellow-500/30">
            <div className="max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl p-8 backdrop-blur-md">
                <h2 className="text-3xl font-bold text-white text-center">Leave a Review</h2>
                <p className="text-zinc-400 mb-8 text-center">
                    How was your experience with <span className="text-yellow-500 font-semibold">{ticket.technicianName}</span>?
                </p>

                <form onSubmit={handleSubmitReview} className="space-y-8">
                    <div>
                        <label className="text-lg font-semibold text-zinc-300 block text-center mb-4">
                            Your Rating
                        </label>
                        <StarRating rating={rating} setRating={setRating} />
                    </div>

                    <div>
                        <label htmlFor="review" className="text-lg font-semibold text-zinc-300">
                            Your Review (Optional)
                        </label>
                        <textarea
                            id="review"
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Describe your experience..."
                            rows="5"
                            className="w-full mt-2 p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:border-yellow-500 focus:ring-0 outline-none transition-all"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full bg-gradient-to-r from-[#BF953F] to-[#B38728] hover:from-[#d4a849] hover:to-[#c4952d] text-black font-bold py-4 px-6 rounded-xl shadow-lg transition-all disabled:opacity-50"
                    >
                        {actionLoading ? "Submitting..." : "Submit Review"}
                    </button>
                </form>
            </div>
        </div>
    );
}