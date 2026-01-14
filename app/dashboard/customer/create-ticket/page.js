"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { db } from '../../../../firebase/config';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Spinner from '../../../../components/Spinner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, Smartphone, Wrench, User, AlertCircle, Phone, CheckCircle2, Camera, X } from 'lucide-react';

// --- COMPONENT: Technician Selection Card ---
const TechnicianItem = memo(({ item, onSelect, isSelected, isBooked }) => {
    let cardStyle = "relative flex items-center p-4 rounded-xl border transition-all cursor-pointer group ";

    if (isBooked) {
        cardStyle += "bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed";
    } else if (isSelected) {
        cardStyle += "bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]";
    } else {
        cardStyle += "bg-slate-900 border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80";
    }

    return (
        <div onClick={() => !isBooked && onSelect(item)} className={cardStyle}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-inner mr-4 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <User className="w-6 h-6" />
            </div>

            <div className="flex-1">
                <h4 className={`font-bold ${isSelected ? 'text-blue-100' : 'text-slate-200'}`}>
                    {item.displayName || item.email?.split('@')[0] || "Technician"}
                </h4>
                {isBooked ? (
                    <p className="text-xs font-semibold text-red-400 flex items-center mt-1">
                        <AlertCircle className="w-3 h-3 mr-1" /> Unavailable
                    </p>
                ) : (
                    <p className="text-xs text-slate-500 flex items-center mt-1">
                        <Wrench className="w-3 h-3 mr-1" /> {item.specialty || 'General Repairs'}
                    </p>
                )}
            </div>

            {isSelected && (
                <div className="absolute top-4 right-4">
                    <CheckCircle2 className="w-6 h-6 text-blue-500" />
                </div>
            )}
        </div>
    );
});

export default function CreateTicketPage() {
    const { user } = useAuth();
    const router = useRouter();

    // --- STATE ---
    const [deviceInfo, setDeviceInfo] = useState('');
    const [selectedIssues, setSelectedIssues] = useState({});
    const [customIssue, setCustomIssue] = useState('');

    // Image Upload State
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [address, setAddress] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [loading, setLoading] = useState(false);

    const [technicians, setTechnicians] = useState([]);
    const [allTickets, setAllTickets] = useState([]);
    const [selectedTechnician, setSelectedTechnician] = useState(null);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('10:00');

    // --- CONFIG ---
    const issueTypes = {
        Display: ["Original", "Good Quality", "Incel Display"],
        'Charging Board': ["Original", "Copy"],
        Battery: ["Original", "Other Brands", "Duplicate"],
        'Speaker': ["Original", "Compatible"],
        'Back Glass': ["Original", "High Copy"]
    };

    // --- FETCH DATA ---
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

    // --- HANDLERS ---

    const handleIssueToggle = (issueName) => {
        setSelectedIssues(prev => {
            const newState = { ...prev };
            if (newState[issueName]) {
                delete newState[issueName];
            } else {
                newState[issueName] = "";
            }
            return newState;
        });
    };

    const handleSubOptionSelect = (issueName, subOption) => {
        setSelectedIssues(prev => ({ ...prev, [issueName]: subOption }));
    };

    // Handle Image Selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) return alert("Geolocation is not supported.");
        setIsFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await response.json();
                setAddress(data?.display_name || "Could not determine address.");
            } catch (err) {
                alert("Could not fetch address details.");
            } finally {
                setIsFetchingLocation(false);
            }
        }, () => {
            alert("Unable to retrieve location.");
            setIsFetchingLocation(false);
        });
    };

    const uploadImageToCloudinary = async () => {
        if (!imageFile) return null;

        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'moboflix_preset');

        try {
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'moboflix';
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error("Image upload failed:", error);
            alert("Failed to upload image. Submitting ticket without image.");
            return null;
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();

        // Validation
        let issueDescriptionList = [];
        Object.entries(selectedIssues).forEach(([issue, subOption]) => {
            if (subOption) issueDescriptionList.push(`${issue}: ${subOption}`);
            else issueDescriptionList.push(issue);
        });
        if (customIssue.trim()) issueDescriptionList.push(`Other: ${customIssue.trim()}`);
        const finalIssueDescription = issueDescriptionList.join(", ");

        if (!deviceInfo || !finalIssueDescription || !address || !contactNumber || !selectedTechnician) {
            alert('Please fill out all required fields.');
            return;
        }

        if (isTechnicianBooked(selectedTechnician.id)) {
            alert('This technician is booked at that time.');
            return;
        }

        setLoading(true);

        try {
            // 1. Upload Image First (if exists)
            let imageUrl = null;
            if (imageFile) {
                imageUrl = await uploadImageToCloudinary();
            }

            // 2. Create Ticket
            if (user) {
                await addDoc(collection(db, "tickets"), {
                    customerId: user.uid,
                    customerEmail: user.email,
                    contactNumber,
                    technicianId: selectedTechnician.id,
                    technicianName: selectedTechnician.displayName || selectedTechnician.email,
                    deviceInfo,
                    issueDescription: finalIssueDescription,
                    address,
                    damageImageUrl: imageUrl, // Save URL to Firestore
                    appointmentDate: getCombinedDateTime(),
                    status: 'Pending',
                    createdAt: serverTimestamp(),
                });
                router.push('/dashboard/customer');
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 selection:bg-blue-500/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12">

                <div className="mb-10 text-center">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Book a Repair</h1>
                    <p className="text-slate-400">Schedule a certified technician to visit your location.</p>
                </div>

                <form onSubmit={handleCreateTicket} className="space-y-8">

                    {/* 1. Device Info */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                        <CardContent className="p-6 sm:p-8">
                            <Label className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2 block">Step 1</Label>
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-slate-400" /> Device Details
                            </h3>
                            <Input
                                value={deviceInfo}
                                onChange={(e) => setDeviceInfo(e.target.value)}
                                placeholder="e.g., iPhone 13 Pro Max"
                                className="bg-slate-950 border-slate-800 h-12 text-lg focus:border-blue-500 text-white"
                            />
                        </CardContent>
                    </Card>

                    {/* 2. Issues */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                        <CardContent className="p-6 sm:p-8">
                            <Label className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2 block">Step 2</Label>
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-slate-400" /> Issues
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                                {Object.keys(issueTypes).map(issueName => {
                                    const isSelected = selectedIssues.hasOwnProperty(issueName);
                                    return (
                                        <div key={issueName} className="relative">
                                            <button type="button" onClick={() => handleIssueToggle(issueName)}
                                                className={`w-full py-3 px-4 rounded-lg font-semibold text-sm border transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'}`}>
                                                {issueName}
                                            </button>
                                            {isSelected && (
                                                <select value={selectedIssues[issueName]} onChange={(e) => handleSubOptionSelect(issueName, e.target.value)}
                                                    className="w-full mt-2 p-2 bg-slate-800 text-white text-xs rounded border border-slate-700">
                                                    <option value="" disabled>Select Quality...</option>
                                                    {issueTypes[issueName].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <Input
                                value={customIssue}
                                onChange={(e) => setCustomIssue(e.target.value)}
                                placeholder="Other Issue (Optional)"
                                className="bg-slate-950 border-slate-800 text-white"
                            />
                        </CardContent>
                    </Card>

                    {/* 3. Image Upload (NEW) */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                        <CardContent className="p-6 sm:p-8">
                            <Label className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2 block">Step 3</Label>
                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                <Camera className="w-5 h-5 text-slate-400" /> Upload Photo (Optional)
                            </h3>
                            <p className="text-slate-500 text-sm mb-4">Upload a clear photo of the damage to help us verify parts.</p>

                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <Label htmlFor="image-upload" className="cursor-pointer flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors">
                                        <Camera className="w-4 h-4 mr-2" /> Choose Photo
                                    </Label>
                                </div>
                                {imagePreview && (
                                    <div className="relative group">
                                        <img src={imagePreview} alt="Damage Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-700" />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-md"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. Location & Contact */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                        <CardContent className="p-6 sm:p-8 space-y-6">
                            <Label className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2 block">Step 4</Label>
                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-slate-400" /> Location & Contact
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Repair Address"
                                        className="bg-slate-950 border-slate-800 h-11 flex-1 text-white"
                                    />
                                    <Button type="button" onClick={handleGetCurrentLocation} variant="outline" className="border-slate-800 text-blue-400">
                                        <MapPin className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <Input
                                        type="tel"
                                        value={contactNumber}
                                        onChange={(e) => setContactNumber(e.target.value)}
                                        placeholder="Phone Number"
                                        className="bg-slate-950 border-slate-800 pl-10 h-11 text-white"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 5. Scheduling & Expert */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                        <CardContent className="p-6 sm:p-8">
                            <Label className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2 block">Step 5</Label>
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-slate-400" /> Schedule
                            </h3>
                            {/* --- FIXED: Added text-white and [color-scheme:dark] to ensure visibility --- */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="bg-slate-950 border-slate-800 h-12 text-center text-white [color-scheme:dark]"
                                />
                                <Input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="bg-slate-950 border-slate-800 h-12 text-center text-white [color-scheme:dark]"
                                />
                            </div>

                            <Label className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2 block">Step 6</Label>
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-slate-400" /> Choose Expert
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {technicians.map(tech => (
                                    <TechnicianItem key={tech.id} item={tech} onSelect={setSelectedTechnician} isSelected={selectedTechnician?.id === tech.id} isBooked={isTechnicianBooked(tech.id)} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="pt-4">
                        <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-xl rounded-xl">
                            {loading ? <Spinner /> : 'Confirm Booking'}
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
}