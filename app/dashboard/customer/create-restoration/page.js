"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { db } from '../../../../firebase/config';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Spinner from '../../../../components/Spinner';

const TechnicianItem = memo(({ item, onSelect, isSelected }) => {
    // Premium Black & Gold Styling
    const baseClasses =
        "flex items-center rounded-xl p-4 mb-3 border transition-all cursor-pointer backdrop-blur-md";

    const selectedClasses = "border-yellow-500/50 bg-yellow-900/10 shadow-[0_0_15px_rgba(234,179,8,0.1)]";
    const defaultClasses = "border-zinc-800 bg-zinc-900/40 hover:border-yellow-500/30 hover:bg-zinc-900/60";

    const itemStyle = `${baseClasses} ${isSelected ? selectedClasses : defaultClasses}`;

    const textColor = isSelected ? "text-white" : "text-zinc-200";
    const subTextColor = isSelected ? "text-yellow-500" : "text-zinc-500";

    return (
        <div onClick={() => onSelect(item)} className={itemStyle}>
            <div className="text-4xl grayscale brightness-75">👤</div>
            <div className="ml-4 flex-1">
                <p className={`font-bold ${textColor}`}>{item.displayName || item.email}</p>
                <p className={`text-sm ${subTextColor}`}>{item.specialty || "General Repairs"}</p>
            </div>
            {isSelected && <div className="text-2xl text-yellow-500">✔️</div>}
        </div>
    );
});

export default function CreateRestorationPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [deviceInfo, setDeviceInfo] = useState('');
    const [issueDescription, setIssueDescription] = useState('Full device restoration and servicing.');
    const [address, setAddress] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [loading, setLoading] = useState(false);

    const [technicians, setTechnicians] = useState([]);
    const [selectedTechnician, setSelectedTechnician] = useState(null);

    useEffect(() => {
        const fetchTechnicians = async () => {
            const techQuery = query(collection(db, "users"), where("role", "==", "technician"));
            const techSnapshot = await getDocs(techQuery);
            const fetchedTechnicians = techSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTechnicians(fetchedTechnicians);
        };
        fetchTechnicians().catch(console.error);
    }, []);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }
        setIsFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async position => {
                const { latitude, longitude } = position.coords;
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                );
                const data = await response.json();
                if (data?.display_name) {
                    setAddress(data.display_name);
                } else {
                    alert("Could not determine address from your location.");
                }
                setIsFetchingLocation(false);
            },
            () => {
                alert("Unable to retrieve your location. Please grant permission or enter it manually.");
                setIsFetchingLocation(false);
            }
        );
    };

    const handleCreateTicket = async e => {
        e.preventDefault();
        if (!deviceInfo || !issueDescription || !address || !contactNumber || !selectedTechnician) {
            alert("Incomplete Form: Please fill out all fields and select a technician.");
            return;
        }

        setLoading(true);
        try {
            if (user) {
                await addDoc(collection(db, "tickets"), {
                    customerId: user.uid,
                    customerEmail: user.isAnonymous ? "Guest User" : user.email,
                    isGuestTicket: user.isAnonymous,
                    contactNumber,
                    technicianId: selectedTechnician.id,
                    technicianName: selectedTechnician.displayName || selectedTechnician.email,
                    deviceInfo,
                    issueDescription,
                    address,
                    appointmentDate: new Date(),
                    status: "Pending",
                    type: "Restoration",
                    createdAt: serverTimestamp(),
                });
                alert("Success! Your restoration request has been created.");
                router.push("/dashboard/customer");
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-black text-zinc-200 py-10 px-5 sm:px-8 selection:bg-yellow-500/30">
            {/* CENTERED CONTAINER */}
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-2">Book Phone Restoration</h2>
                <p className="text-zinc-400 mb-8 border-b border-zinc-800 pb-4">
                    Confirm details to book an immediate restoration service.
                </p>

                <form onSubmit={handleCreateTicket} className="space-y-8">
                    {/* Device Info */}
                    <div>
                        <label className="text-lg font-semibold text-zinc-300">
                            1. What device needs restoration?
                        </label>
                        <input
                            type="text"
                            value={deviceInfo}
                            onChange={e => setDeviceInfo(e.target.value)}
                            placeholder="e.g., iPhone X"
                            className="w-full mt-2 p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                            required
                        />
                    </div>

                    {/* Issue Description */}
                    <div>
                        <label className="text-lg font-semibold text-zinc-300">
                            2. Describe the issue
                        </label>
                        <textarea
                            value={issueDescription}
                            onChange={e => setIssueDescription(e.target.value)}
                            placeholder="e.g., The screen is cracked after a drop."
                            rows="4"
                            className="w-full mt-2 p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                            required
                        ></textarea>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="text-lg font-semibold text-zinc-300">3. Service Address</label>
                        <input
                            type="text"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            placeholder="Enter your full address"
                            className="w-full mt-2 p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                            required
                        />
                        <button
                            type="button"
                            onClick={handleGetCurrentLocation}
                            disabled={isFetchingLocation}
                            className="mt-3 w-full sm:w-auto bg-zinc-800 text-yellow-500 border border-zinc-700 font-semibold py-2 px-4 rounded-lg hover:bg-zinc-700 hover:text-yellow-400 transition-all disabled:opacity-50"
                        >
                            {isFetchingLocation ? "Fetching..." : "Use My Current Location"}
                        </button>
                    </div>

                    {/* Contact */}
                    <div>
                        <label className="text-lg font-semibold text-zinc-300">
                            4. Contact Number (for WhatsApp)
                        </label>
                        <input
                            type="tel"
                            value={contactNumber}
                            onChange={e => setContactNumber(e.target.value)}
                            placeholder="e.g., 9876543210"
                            className="w-full mt-2 p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                            required
                        />
                    </div>

                    {/* Technician Select */}
                    <div>
                        <label className="text-lg font-semibold text-zinc-300">
                            5. Choose a Technician
                        </label>
                        <div className="mt-2">
                            {technicians.length > 0 ? (
                                technicians.map(tech => (
                                    <TechnicianItem
                                        key={tech.id}
                                        item={tech}
                                        onSelect={setSelectedTechnician}
                                        isSelected={selectedTechnician && selectedTechnician.id === tech.id}
                                    />
                                ))
                            ) : (
                                <p className="text-zinc-500">Loading technicians...</p>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#BF953F] to-[#B38728] hover:from-[#d4a849] hover:to-[#c4952d] text-black font-bold py-4 px-6 rounded-xl shadow-lg shadow-yellow-900/20 hover:shadow-yellow-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Submitting..." : "Book Now"}
                    </button>
                </form>
            </div>
        </div>
    );
}