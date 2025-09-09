"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import { db } from '../../../../../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';
import Spinner from '../../../../../components/Spinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Component for the technician selection list
const TechnicianSelectItem = ({ tech, onSelect, isSelected }) => (
    <div
        onClick={() => onSelect(tech)}
        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-blue-100 border-blue-500 shadow-md' : 'border-gray-200 hover:bg-gray-50'}`}
    >
        <div className="text-3xl">👤</div>
        <div className="ml-4">
            <p className="font-semibold text-gray-800">{tech.displayName || tech.email}</p>
            <p className="text-sm text-gray-500">{tech.specialty || 'General Repairs & Installation'}</p>
        </div>
    </div>
);

export default function ProductOrderPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { productId } = params;

    const [product, setProduct] = useState(null);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [address, setAddress] = useState('');
    const [appointmentDate, setAppointmentDate] = useState('');
    const [selectedTech, setSelectedTech] = useState(null);

    // Fetch product details and available technicians
    useEffect(() => {
        if (!productId) return;

        const fetchProductAndTechnicians = async () => {
            // Fetch product
            const productRef = doc(db, 'products', productId);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
                setProduct({ id: productSnap.id, ...productSnap.data() });
            } else {
                alert("Product not found.");
                router.push('/dashboard/customer/store');
            }

            // Fetch technicians
            const techQuery = query(collection(db, "users"), where("role", "==", "technician"));
            const techSnapshot = await getDocs(techQuery);
            const fetchedTechnicians = techSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setTechnicians(fetchedTechnicians);

            setLoading(false);
        };

        fetchProductAndTechnicians().catch(console.error);
    }, [productId, router]);

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (!address || !appointmentDate || !selectedTech) {
            alert("Please provide an address, select a date, and choose a technician.");
            return;
        }
        setIsSubmitting(true);

        try {
            await addDoc(collection(db, 'tickets'), {
                // Customer Info
                customerId: user.uid,
                customerEmail: user.email || 'Anonymous',
                address,
                appointmentDate: new Date(appointmentDate),
                
                // Product Info
                productId: product.id,
                deviceInfo: `Order: ${product.name}`, // For display on dashboard
                issueDescription: `Deliver and install ${product.name} for ${product.model}.`,
                finalAmount: product.price,

                // Technician Info
                technicianId: selectedTech.id,
                technicianName: selectedTech.displayName || selectedTech.email,

                // Ticket Metadata
                status: 'Pending',
                type: 'product', // CRUCIAL: Differentiates this from a repair
                createdAt: serverTimestamp(),
            });
            alert("Order placed successfully!");
            router.push('/dashboard/customer');

        } catch (error) {
            console.error("Error placing order: ", error);
            alert("Failed to place order. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <Spinner />;
    if (!product) return <p>Product not found.</p>;

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">Place Your Order</CardTitle>
                    <CardDescription>Confirm details for your purchase of the {product.name}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-6 p-4 border bg-slate-50 rounded-lg mb-6">
                        <img src={product.imageUrl} alt={product.name} className="w-28 h-28 object-cover rounded-lg"/>
                        <div>
                            <h3 className="text-xl font-bold">{product.name}</h3>
                            <p className="text-slate-600">For {product.model}</p>
                            <p className="text-2xl font-bold text-green-600 mt-2">₹{product.price}</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handlePlaceOrder} className="space-y-6">
                        {/* Step 1: Delivery Details */}
                        <div>
                            <h4 className="font-bold text-lg mb-2">1. Delivery & Installation Details</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="address">Full Address</Label>
                                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g., 123 Moboflix St, Tech City" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="appointmentDate">Preferred Date & Time</Label>
                                    <Input id="appointmentDate" type="datetime-local" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} required />
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Choose Technician */}
                        <div>
                            <h4 className="font-bold text-lg mb-2">2. Choose Your Technician</h4>
                             <div className="space-y-3">
                                {technicians.map(tech => (
                                    <TechnicianSelectItem 
                                        key={tech.id} 
                                        tech={tech} 
                                        onSelect={setSelectedTech} 
                                        isSelected={selectedTech?.id === tech.id} 
                                    />
                                ))}
                            </div>
                        </div>
                        
                        <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-lg">
                            {isSubmitting ? <Spinner /> : `Confirm Order (₹${product.price})`}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

