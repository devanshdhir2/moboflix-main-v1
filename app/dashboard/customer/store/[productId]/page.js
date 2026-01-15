"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import { db } from "../../../../../firebase/config";
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
} from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import Spinner from "../../../../../components/Spinner";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Technician list item - DARK THEME
const TechnicianSelectItem = ({ tech, onSelect, isSelected }) => (
    <div
        onClick={() => onSelect(tech)}
        className={`flex items-center p-4 rounded-lg cursor-pointer transition-all border
        ${isSelected
                ? "bg-blue-600/30 border-blue-500 shadow-md"
                : "bg-slate-900/70 border-slate-700 hover:bg-slate-800"
            }`}
    >
        <div className="text-3xl">👤</div>
        <div className="ml-4">
            <p className="font-semibold text-slate-200">
                {tech.displayName || tech.email}
            </p>
            <p className="text-sm text-slate-400">
                {tech.specialty || "General Repairs & Installation"}
            </p>
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
    const [address, setAddress] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [appointmentDate, setAppointmentDate] = useState("");
    const [selectedTech, setSelectedTech] = useState(null);

    // Fetch product + technicians
    useEffect(() => {
        if (!productId) return;

        const fetchData = async () => {
            const productRef = doc(db, "products", productId);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
                setProduct({ id: productSnap.id, ...productSnap.data() });
            } else {
                alert("Product not found.");
                router.push("/dashboard/customer/store");
            }

            const techQuery = query(
                collection(db, "users"),
                where("role", "==", "technician")
            );
            const techSnapshot = await getDocs(techQuery);
            const techList = techSnapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            }));
            setTechnicians(techList);

            setLoading(false);
        };

        fetchData().catch(console.error);
    }, [productId, router]);

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        if (!address || !appointmentDate || !selectedTech || !contactNumber) {
            alert(
                "Please provide an address, contact number, select a date, and choose a technician."
            );
            return;
        }

        setIsSubmitting(true);

        try {
            const ticketData = {
                customerId: user.uid,
                customerEmail: user.email || "Anonymous Guest",
                address,
                contactNumber,
                appointmentDate: new Date(appointmentDate),
                productId: product.id,
                deviceInfo: `Order: ${product.name}`,
                issueDescription: `Deliver and install ${product.name} for ${product.model}.`,
                finalAmount: product.price,
                technicianId: selectedTech.id,
                technicianName: selectedTech.displayName || selectedTech.email,
                status: "Pending",
                type: "product",
                createdAt: serverTimestamp(),
            };

            if (user.isAnonymous) ticketData.isGuestTicket = true;

            await addDoc(collection(db, "tickets"), ticketData);
            alert("Order placed successfully!");
            router.push("/dashboard/customer");
        } catch (error) {
            console.error("Error placing order:", error);
            alert("Failed to place order. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <Spinner />;
    if (!product) return <p className="text-center text-slate-300">Product not found.</p>;

    return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-200 py-10 px-5 lg:px-10">
            <div className="max-w-4xl mx-auto">
                <Card className="bg-slate-900/70 border border-slate-800 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-3xl text-white">Place Your Order</CardTitle>
                        <CardDescription className="text-slate-400">
                            Confirm details for your purchase of the {product.name}.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {/* PRODUCT INFO */}
                        <div className="flex items-center gap-6 p-4 bg-slate-900/70 border border-slate-800 rounded-lg mb-6">
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-28 h-28 object-cover rounded-lg"
                            />
                            <div>
                                <h3 className="text-xl font-bold text-white">{product.name}</h3>
                                <p className="text-slate-400">For {product.model}</p>
                                <p className="text-2xl font-bold text-green-400 mt-2">
                                    ₹{product.price}
                                </p>
                            </div>
                        </div>

                        {/* FORM */}
                        <form onSubmit={handlePlaceOrder} className="space-y-6">
                            <div>
                                <h4 className="font-bold text-lg mb-2 text-white">
                                    1. Delivery & Installation Details
                                </h4>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="address" className="text-slate-300">
                                            Full Address
                                        </Label>
                                        <Input
                                            id="address"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="e.g., 123 Moboflix St, Tech City"
                                            className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contactNumber" className="text-slate-300">
                                            Contact Number
                                        </Label>
                                        <Input
                                            id="contactNumber"
                                            type="tel"
                                            value={contactNumber}
                                            onChange={(e) => setContactNumber(e.target.value)}
                                            placeholder="e.g., 9876543210"
                                            className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="appointmentDate" className="text-slate-300">
                                            Preferred Date & Time
                                        </Label>
                                        <Input
                                            id="appointmentDate"
                                            type="datetime-local"
                                            value={appointmentDate}
                                            onChange={(e) => setAppointmentDate(e.target.value)}
                                            className="bg-slate-900 border-slate-700 text-white"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* TECHNICIAN LIST */}
                            <div>
                                <h4 className="font-bold text-lg mb-2 text-white">
                                    2. Choose Your Technician
                                </h4>
                                <div className="space-y-3">
                                    {technicians.map((tech) => (
                                        <TechnicianSelectItem
                                            key={tech.id}
                                            tech={tech}
                                            onSelect={setSelectedTech}
                                            isSelected={selectedTech?.id === tech.id}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* SUBMIT BUTTON */}
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isSubmitting ? <Spinner /> : `Confirm Order (₹${product.price})`}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
