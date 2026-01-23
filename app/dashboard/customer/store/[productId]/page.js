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

// Technician list item - BLACK/GOLD THEME
const TechnicianSelectItem = ({ tech, onSelect, isSelected }) => (
    <div
        onClick={() => onSelect(tech)}
        className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border
        ${isSelected
                ? "bg-yellow-900/10 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                : "bg-zinc-900/70 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700"
            }`}
    >
        <div className="text-3xl grayscale brightness-75">👤</div>
        <div className="ml-4">
            <p className={`font-semibold ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                {tech.displayName || tech.email}
            </p>
            <p className="text-sm text-zinc-400">
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

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Spinner /></div>;
    if (!product) return <div className="min-h-screen bg-black flex items-center justify-center"><p className="text-zinc-300">Product not found.</p></div>;

    return (
        <div className="min-h-screen w-full bg-black text-zinc-200 py-10 px-5 lg:px-10 selection:bg-yellow-500/30">
            <div className="max-w-4xl mx-auto">
                <Card className="bg-zinc-900 border border-zinc-800 shadow-xl rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-3xl text-white">Place Your Order</CardTitle>
                        <CardDescription className="text-zinc-400">
                            Confirm details for your purchase of the <span className="text-yellow-500 font-semibold">{product.name}</span>.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {/* PRODUCT INFO */}
                        <div className="flex items-center gap-6 p-4 bg-zinc-950 border border-zinc-800 rounded-xl mb-6">
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-28 h-28 object-cover rounded-lg border border-zinc-800"
                            />
                            <div>
                                <h3 className="text-xl font-bold text-white">{product.name}</h3>
                                <p className="text-zinc-400">For {product.model}</p>
                                <p className="text-2xl font-bold text-yellow-400 mt-2">
                                    ₹{product.price}
                                </p>
                            </div>
                        </div>

                        {/* FORM */}
                        <form onSubmit={handlePlaceOrder} className="space-y-6">
                            <div>
                                <h4 className="font-bold text-lg mb-2 text-white border-b border-zinc-800 pb-2">
                                    1. Delivery & Installation Details
                                </h4>

                                <div className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="address" className="text-zinc-300">
                                            Full Address
                                        </Label>
                                        <Input
                                            id="address"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="e.g., 123 Moboflix St, Tech City"
                                            className="bg-zinc-950 border-zinc-700 text-white placeholder-zinc-500 focus:border-yellow-500"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contactNumber" className="text-zinc-300">
                                            Contact Number
                                        </Label>
                                        <Input
                                            id="contactNumber"
                                            type="tel"
                                            value={contactNumber}
                                            onChange={(e) => setContactNumber(e.target.value)}
                                            placeholder="e.g., 9876543210"
                                            className="bg-zinc-950 border-zinc-700 text-white placeholder-zinc-500 focus:border-yellow-500"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="appointmentDate" className="text-zinc-300">
                                            Preferred Date & Time
                                        </Label>
                                        <Input
                                            id="appointmentDate"
                                            type="datetime-local"
                                            value={appointmentDate}
                                            onChange={(e) => setAppointmentDate(e.target.value)}
                                            className="bg-zinc-950 border-zinc-700 text-white focus:border-yellow-500 [color-scheme:dark]"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* TECHNICIAN LIST */}
                            <div>
                                <h4 className="font-bold text-lg mb-2 text-white border-b border-zinc-800 pb-2">
                                    2. Choose Your Technician
                                </h4>
                                <div className="space-y-3 pt-2">
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
                                className="w-full h-12 text-lg bg-gradient-to-r from-[#BF953F] to-[#B38728] hover:from-[#d4a849] hover:to-[#c4952d] text-black font-bold shadow-lg"
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