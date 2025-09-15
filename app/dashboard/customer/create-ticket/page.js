"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { db, FieldValue } from '../../../../firebase/config';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Spinner from '../../../../components/Spinner';

const TechnicianItem = memo(({ item, onSelect, isSelected, isBooked }) => {
    const baseClasses = "flex items-center bg-white rounded-lg p-4 mb-3 border-2 transition-all cursor-pointer";
    const selectedClasses = "border-blue-500 bg-blue-500 text-white shadow-lg";
    const bookedClasses = "border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed";
    const defaultClasses = "border-gray-200 hover:border-blue-400";
    const itemStyle = `${baseClasses} ${isBooked ? bookedClasses : (isSelected ? selectedClasses : defaultClasses)}`;
    const textColor = isSelected ? 'text-white' : 'text-gray-800';
    const subTextColor = isSelected ? 'text-blue-100' : 'text-gray-500';

    return (
        <div onClick={() => !isBooked && onSelect(item)} className={itemStyle}>
            <div className="text-4xl">👤</div>
            <div className="ml-4 flex-1">
                <p className={`font-bold ${textColor}`}>{item.displayName || item.email}</p>
                {isBooked ? (
                    <p className="text-sm font-semibold text-red-500">Booked at this time</p>
                ) : (
                    <p className={`text-sm ${subTextColor}`}>{item.specialty || 'General Repairs'}</p>
                )}
            </div>
            {isSelected && <div className="text-2xl text-white">✔️</div>}
            {isBooked && <div className="text-2xl text-gray-400">❌</div>}
        </div>
    );
});

export default function CreateTicketPage() {
    const { user } = useAuth();
    const router = useRouter();
    
    const [deviceInfo, setDeviceInfo] = useState('');
    // --- UPDATED STATE for issue selection ---
    const [mainIssue, setMainIssue] = useState(null);
    const [subIssue, setSubIssue] = useState('');
    
    const [address, setAddress] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [technicians, setTechnicians] = useState([]);
    const [allTickets, setAllTickets] = useState([]);
    const [selectedTechnician, setSelectedTechnician] = useState(null);
    
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('10:00');

    useEffect(() => {
        const fetchData = async () => {
            const techQuery = query(collection(db, "users"), where("role", "==", "technician"));
            const techSnapshot = await getDocs(techQuery);
            const fetchedTechnicians = techSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTechnicians(fetchedTechnicians);

            const ticketsQuery = query(collection(db, "tickets"), where("status", "in", ["Pending", "In Progress"]));
            const ticketsSnapshot = await getDocs(ticketsQuery);
            const fetchedTickets = ticketsSnapshot.docs.map(doc => ({ ...doc.data(), appointmentDate: doc.data().appointmentDate.toDate() }));
            setAllTickets(fetchedTickets);
        };
        fetchData().catch(console.error);
    }, []);
    
    const getCombinedDateTime = useCallback(() => new Date(`${date}T${time}`), [date, time]);

    const isTechnicianBooked = useCallback((technicianId) => {
        const oneHour = 60 * 60 * 1000;
        const selectedTimeMs = getCombinedDateTime().getTime();
        return allTickets.some(ticket => 
            ticket.technicianId === technicianId && Math.abs(selectedTimeMs - ticket.appointmentDate.getTime()) < oneHour
        );
    }, [allTickets, getCombinedDateTime]);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) return alert("Geolocation is not supported by your browser.");
        setIsFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            setAddress(data?.display_name || "Could not determine address.");
            setIsFetchingLocation(false);
        }, () => {
            alert("Unable to retrieve your location.");
            setIsFetchingLocation(false);
        });
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        const finalIssueDescription = subIssue ? `${mainIssue}: ${subIssue}` : mainIssue;
        if (!deviceInfo || !finalIssueDescription || !address || !contactNumber || !selectedTechnician) {
            alert('Incomplete Form: Please fill out all fields and select a technician.');
            return;
        }
        if (isTechnicianBooked(selectedTechnician.id)) {
            alert('Technician Unavailable: This technician is booked. Please choose another time or technician.');
            return;
        }
        setLoading(true);
        try {
            if (user) {
                await addDoc(collection(db, "tickets"), {
                    customerId: user.uid,
                    customerEmail: user.email,
                    contactNumber,
                    technicianId: selectedTechnician.id,
                    technicianName: selectedTechnician.displayName || selectedTechnician.email,
                    deviceInfo,
                    issueDescription: finalIssueDescription, // Save combined issue
                    address,
                    appointmentDate: getCombinedDateTime(),
                    status: 'Pending',
                    createdAt: serverTimestamp(),
                });
                alert('Success! Your repair ticket has been created.');
                router.push('/dashboard/customer');
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    // --- NEW: Dynamic options for dropdown ---
    const issueOptions = {
        Display: ["Original", "Good Quality", "Incel Display"],
        'Charging Board': ["Original", "Copy"],
        Battery: ["Original", "Other Brands", "Duplicate"]
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-3xl font-bold text-gray-800">Book a Repair</h2>
            <p className="text-gray-500 mb-8">Fill in the details below to schedule a technician.</p>
            
            <form onSubmit={handleCreateTicket} className="space-y-8">
                <div>
                    <label className="text-lg font-semibold text-gray-700">1. What device needs repair?</label>
                    <input type="text" value={deviceInfo} onChange={(e) => setDeviceInfo(e.target.value)} placeholder="e.g., iPhone 13 Pro" className="w-full mt-2 p-4 border border-gray-300 rounded-lg" required />
                </div>
                {/* --- UPDATED ISSUE SECTION --- */}
                <div>
                    <label className="text-lg font-semibold text-gray-700">2. Describe the issue</label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                        {['Display', 'Charging Board', 'Battery'].map(issue => (
                            <button key={issue} type="button" onClick={() => { setMainIssue(issue); setSubIssue(''); }} className={`p-4 rounded-lg font-semibold border-2 ${mainIssue === issue ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:border-blue-400'}`}>
                                {issue}
                            </button>
                        ))}
                    </div>
                    {mainIssue && (
                        <select value={subIssue} onChange={(e) => setSubIssue(e.target.value)} className="w-full mt-4 p-4 border border-gray-300 rounded-lg" required>
                            <option value="" disabled>Select Quality for {mainIssue}...</option>
                            {issueOptions[mainIssue].map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                    )}
                </div>
                {/* --- END OF UPDATED SECTION --- */}
                <div>
                    <label className="text-lg font-semibold text-gray-700">3. Repair Address</label>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your full address" className="w-full mt-2 p-4 border border-gray-300 rounded-lg" required />
                    <button type="button" onClick={handleGetCurrentLocation} disabled={isFetchingLocation} className="mt-3 w-full sm:w-auto bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 disabled:bg-gray-400">
                        {isFetchingLocation ? 'Fetching...' : 'Use My Current Location'}
                    </button>
                </div>
                <div>
                    <label className="text-lg font-semibold text-gray-700">4. Contact Number</label>
                    <input type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="e.g., 9876543210" className="w-full mt-2 p-4 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                    <label className="text-lg font-semibold text-gray-700">5. Preferred Date & Time</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-4 border border-gray-300 rounded-lg" required />
                        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full p-4 border border-gray-300 rounded-lg" required />
                    </div>
                </div>
                <div>
                    <label className="text-lg font-semibold text-gray-700">6. Choose a Technician</label>
                    <div className="mt-2">
                        {technicians.length > 0 ? (
                            technicians.map(tech => (
                                <TechnicianItem key={tech.id} item={tech} onSelect={setSelectedTechnician} isSelected={selectedTechnician?.id === tech.id} isBooked={isTechnicianBooked(tech.id)} />
                            ))
                        ) : ( <p className="text-gray-500">Loading technicians...</p> )}
                    </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-all disabled:bg-gray-400">
                    {loading ? 'Submitting...' : 'Submit Ticket'}
                </button>
            </form>
        </div>
    );
}

