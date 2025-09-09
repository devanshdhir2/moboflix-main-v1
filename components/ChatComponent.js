"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from 'lucide-react';

export default function ChatComponent({ ticketId }) {
    const { user, userRole } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!ticketId) return;

        const messagesRef = collection(db, "tickets", ticketId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedMessages = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() // Convert timestamp to Date
            }));
            setMessages(fetchedMessages);
        });

        return () => unsubscribe();
    }, [ticketId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user) return;

        setLoading(true);
        const messagesRef = collection(db, "tickets", ticketId, "messages");

        try {
            await addDoc(messagesRef, {
                text: newMessage,
                createdAt: serverTimestamp(),
                senderId: user.uid,
                senderRole: user.isAnonymous ? 'customer' : userRole // Use userRole from context
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <p>Loading chat...</p>;
    }

    return (
        <div className="mt-8 bg-white rounded-lg shadow-md border border-slate-200">
            <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Live Chat</h3>
                <p className="text-sm text-gray-500">Communicate directly with your technician.</p>
            </div>
            <div className="p-4 h-80 overflow-y-auto bg-slate-50">
                {messages.length > 0 ? (
                    messages.map(msg => (
                        <div key={msg.id} className={`flex my-2 ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.senderId === user.uid ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800'}`}>
                                <p className="text-sm">{msg.text}</p>
                                <p className={`text-xs mt-1 opacity-75 ${msg.senderId === user.uid ? 'text-blue-200' : 'text-slate-500'}`}>
                                    {msg.createdAt ? msg.createdAt.toLocaleTimeString() : 'Sending...'}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-slate-400 mt-16">
                        <p>No messages yet. Say hello!</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <Input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        disabled={loading}
                        className="flex-grow"
                    />
                    <Button type="submit" disabled={loading || newMessage.trim() === ''}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
