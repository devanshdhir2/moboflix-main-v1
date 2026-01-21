"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import { db } from '../../../../../firebase/config';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Spinner from '../../../../../components/Spinner';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PaymentPage({ params }) {
    const { user } = useAuth();
    const router = useRouter();
    const { jobId } = params;

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [amount, setAmount] = useState('');
    const [qrValue, setQrValue] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // IMPORTANT: Replace this with the technician's actual UPI ID from their profile in Firestore
    const UPI_ID = 'dhir007.devansh-1@okhdfcbank';

    useEffect(() => {
        if (!user || !jobId) return;

        const ticketRef = doc(db, 'tickets', jobId);
        const unsubscribe = onSnapshot(ticketRef, (doc) => {
            if (doc.exists()) {
                const jobData = { id: doc.id, ...doc.data() };
                setJob(jobData);
                if (jobData.status === 'Pending Payment') {
                    setSubmitted(true);
                }
            } else {
                alert("Job not found.");
                router.push('/dashboard/technician');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, jobId, router]);

    const generateQR = () => {
        if (!amount || isNaN(amount) || amount <= 0) {
            alert("Invalid Amount: Please enter a valid amount.");
            return;
        }
        const upiString = `upi://pay?pa=${UPI_ID}&pn=Mobofix%20Repair&am=${amount}&cu=INR&tn=Repair%20for%20${job.deviceInfo}`;
        setQrValue(upiString);
    };

    const handleSubmitForApproval = async () => {
        if (!qrValue) {
            alert("Payment Not Generated: Please generate a QR code first.");
            return;
        }
        setActionLoading(true);
        const ticketRef = doc(db, 'tickets', job.id);
        try {
            await updateDoc(ticketRef, {
                status: 'Pending Payment',
                finalAmount: parseFloat(amount)
            });
            setSubmitted(true);
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <Spinner />;
    if (!job) return <div className="p-8 text-center">Job not found.</div>;

    const isPaymentApproved = job.status === 'Completed';

    return (
        <div className="container mx-auto max-w-lg px-4 py-8">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl md:text-3xl">Process Payment</CardTitle>
                    <CardDescription>Enter the final amount to generate a payment QR code for the customer.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <div className="my-6 p-4 bg-white rounded-lg shadow-inner inline-block">
                        {qrValue ? (
                            <QRCodeCanvas value={qrValue} size={220} />
                        ) : (
                            <div className="w-56 h-56 bg-slate-100 flex items-center justify-center rounded-lg">
                                <p className="text-slate-400 text-sm">QR Code will appear here</p>
                            </div>
                        )}
                    </div>

                    {isPaymentApproved && (
                        <div className="w-full text-center bg-green-100 text-green-800 p-4 rounded-lg">
                            <p className="font-bold">Payment Approved!</p>
                            <p>You can now close this ticket.</p>
                        </div>
                    )}

                    {submitted && !isPaymentApproved && (
                        <div className="w-full text-center p-6 bg-blue-50 rounded-lg animate-pulse">
                            <p className="text-blue-600 font-semibold">Waiting for owner approval...</p>
                        </div>
                    )}
                </CardContent>

                {!submitted && !isPaymentApproved && (
                    <CardFooter className="flex-col space-y-4 bg-slate-50 p-6">
                        <div className="w-full flex items-center bg-white rounded-lg border">
                            <span className="text-xl font-bold text-slate-600 px-4">₹</span>
                            <Input
                                type="number"
                                placeholder="Final Amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="flex-1 text-xl p-3 border-0 focus-visible:ring-0"
                            />
                            <Button onClick={generateQR} className="mr-2">Generate</Button>
                        </div>
                        <Button onClick={handleSubmitForApproval} disabled={!qrValue || actionLoading} className="w-full bg-green-600 hover:bg-green-700">
                            {actionLoading ? 'Submitting...' : 'Submit for Approval'}
                        </Button>
                    </CardFooter>
                )}

                {isPaymentApproved && (
                    <CardFooter className="bg-slate-50 p-6">
                        <Button onClick={() => router.push('/dashboard/technician')} className="w-full bg-slate-800 hover:bg-slate-900">
                            Close Ticket
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}

