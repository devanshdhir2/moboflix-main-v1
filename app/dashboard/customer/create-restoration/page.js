"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { db } from '../../../../firebase/config';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Spinner from '../../../../components/Spinner';

const TechnicianItem = memo(({ item, onSelect, isSelected }) => {
    const baseClasses =
        "flex items-center rounded-lg p-4 mb-3 border-2 transition-all cursor-pointer bg-slate-800/60 backdrop-blur";
    const selectedClasses = "border-blue-500 bg-blue-600/40 text-white shadow-lg";
    const defaultClasses = "border-slate-700 hover:border-blue-400 hover:bg-slate-800/80";
    const itemStyle = `${baseClasses} ${isSelected ? selectedClasses : defaultClasses}`;

    const textColor = isSelected ? "text-white" : "text-slate-200";
    const subTextColor = isSelected ? "text-blue-200" : "text-slate-400";

    return (
        <div onClick={() => onSelect(item)} className={itemStyle}>
            <div className="text-4xl">👤</div>
            <div className="ml-4 flex-1">
                <p className={`font-bold ${textColor}`}>{item.displayName || item.email}</p>
                <p className={`text-sm ${subTextColor}`}>{item.specialty || "General Repairs"}</p>
            </div>
            {isSelected && <div className="text-2xl text-white">✔️</div>}
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
        <div className="min-h-screen w-full bg-slate-950 text-slate-200 py-10 px-5 sm:px-8">
            {/* CENTERED CONTAINER */}
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-white">Book Phone Restoration</h2>
                <p className="text-slate-400 mb-8">
                    Confirm details to book an immediate restoration service.
                </p>

                <form onSubmit={handleCreateTicket} className="space-y-8">
                    {/* Device Info */}
                    <div>
                        <label className="text-lg font-semibold text-slate-300">
                            1. What device needs restoration?
                        </label>
                        <input
                            type="text"
                            value={deviceInfo}
                            onChange={e => setDeviceInfo(e.target.value)}
                            placeholder="e.g., iPhone X"
                            className="w-full mt-2 p-4 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                            required
                        />
                    </div>

                    {/* Issue Description */}
                    <div>
                        <label className="text-lg font-semibold text-slate-300">
                            2. Describe the issue
                        </label>
                        <textarea
                            value={issueDescription}
                            onChange={e => setIssueDescription(e.target.value)}
                            placeholder="e.g., The screen is cracked after a drop."
                            rows="4"
                            className="w-full mt-2 p-4 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                            required
                        ></textarea>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="text-lg font-semibold text-slate-300">3. Service Address</label>
                        <input
                            type="text"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            placeholder="Enter your full address"
                            className="w-full mt-2 p-4 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                            required
                        />
                        <button
                            type="button"
                            onClick={handleGetCurrentLocation}
                            disabled={isFetchingLocation}
                            className="mt-3 w-full sm:w-auto bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all disabled:bg-slate-600"
                        >
                            {isFetchingLocation ? "Fetching..." : "Use My Current Location"}
                        </button>
                    </div>

                    {/* Contact */}
                    <div>
                        <label className="text-lg font-semibold text-slate-300">
                            4. Contact Number (for WhatsApp)
                        </label>
                        <input
                            type="tel"
                            value={contactNumber}
                            onChange={e => setContactNumber(e.target.value)}
                            placeholder="e.g., 9876543210"
                            className="w-full mt-2 p-4 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                            required
                        />
                    </div>

                    {/* Technician Select */}
                    <div>
                        <label className="text-lg font-semibold text-slate-300">
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
                                <p className="text-slate-500">Loading technicians...</p>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-all disabled:bg-slate-600"
                    >
                        {loading ? "Submitting..." : "Book Now"}
                    </button>
                </form>
            </div>
        </div>
    );
}
