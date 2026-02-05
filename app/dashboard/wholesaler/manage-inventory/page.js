"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase/config';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import Spinner from '../../../../components/Spinner';

// A single item in the inventory list
const PartItem = ({ part, onEdit }) => (
    <div className="flex items-center bg-zinc-900 rounded-lg shadow p-4 mb-3 transition-shadow hover:shadow-md">
        <div className="text-3xl text-zinc-500">📦</div>
        <div className="flex-1 ml-4">
            <p className="text-lg font-bold text-zinc-100">{part.name}</p>
            <p className="text-sm text-zinc-500">In Stock: {part.stock}</p>
        </div>
        <button onClick={onEdit} className="p-2 rounded-full hover:bg-zinc-800">
            <span className="text-zinc-500 text-xl">✏️</span>
        </button>
    </div>
);

// The modal for adding or editing a part
const PartModal = ({ isOpen, onClose, onSave, onDelete, part, loading }) => {
    const [partName, setPartName] = useState('');
    const [partStock, setPartStock] = useState('');

    useEffect(() => {
        setPartName(part ? part.name : '');
        setPartStock(part ? part.stock.toString() : '');
    }, [part]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4">
            <div className="bg-zinc-900 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-bold p-6 border-b">{part ? 'Edit Part' : 'Add New Part'}</h3>
                <div className="p-6 space-y-4">
                    <input type="text" placeholder="Part Name" value={partName} onChange={(e) => setPartName(e.target.value)} className="w-full p-3 border border-zinc-700 rounded-lg" />
                    <input type="number" placeholder="Stock Quantity" value={partStock} onChange={(e) => setPartStock(e.target.value)} className="w-full p-3 border border-zinc-700 rounded-lg" />
                </div>
                <div className="p-6 bg-zinc-950 rounded-b-lg space-y-3">
                    <button onClick={() => onSave(partName, partStock)} disabled={loading} className="w-full bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-400 disabled:bg-zinc-700">
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                    {part && (
                        <button onClick={onDelete} disabled={loading} className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 disabled:bg-zinc-700">
                            Delete Part
                        </button>
                    )}
                     <button onClick={onClose} className="w-full text-center text-zinc-400 font-semibold py-2">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default function ManageInventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setModalVisible] = useState(false);
    const [editingPart, setEditingPart] = useState(null);

    useEffect(() => {
        const q = query(collection(db, "inventory"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedParts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInventory(fetchedParts);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const openModal = (part = null) => {
        setEditingPart(part);
        setModalVisible(true);
    };

    const handleSavePart = async (partName, partStock) => {
        if (!partName || !partStock) {
            alert("Please provide both a name and stock quantity.");
            return;
        }
        setLoading(true);
        const stock = parseInt(partStock, 10);
        if (isNaN(stock)) {
            alert("Stock must be a number.");
            setLoading(false);
            return;
        }

        try {
            if (editingPart) {
                const partRef = doc(db, 'inventory', editingPart.id);
                await updateDoc(partRef, { name: partName, stock: stock, lastUpdated: serverTimestamp() });
            } else {
                await addDoc(collection(db, "inventory"), {
                    name: partName,
                    stock: stock,
                    lastUpdated: serverTimestamp()
                });
            }
            setModalVisible(false);
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePart = () => {
        if (!confirm(`Are you sure you want to delete "${editingPart.name}"? This cannot be undone.`)) {
            return;
        }
        setLoading(true);
        deleteDoc(doc(db, 'inventory', editingPart.id))
            .then(() => setModalVisible(false))
            .catch(error => alert(`Error: ${error.message}`))
            .finally(() => setLoading(false));
    };

    if (loading && inventory.length === 0) {
        return <Spinner />;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative min-h-[calc(100vh-4rem)]">
            <h2 className="text-3xl font-bold text-zinc-100 mb-6">Manage Inventory</h2>

            {inventory.length > 0 ? (
                inventory.map(part => <PartItem key={part.id} part={part} onEdit={() => openModal(part)} />)
            ) : (
                <div className="text-center py-20 bg-zinc-900 rounded-lg shadow-md">
                    <p className="text-zinc-500">No parts in inventory. Tap the plus button to add one.</p>
                </div>
            )}

            <button onClick={() => openModal()} className="fixed bottom-8 right-8 bg-yellow-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-400">
                <span className="text-4xl pb-1">+</span>
            </button>

            <PartModal 
                isOpen={isModalVisible}
                onClose={() => setModalVisible(false)}
                onSave={handleSavePart}
                onDelete={handleDeletePart}
                part={editingPart}
                loading={loading}
            />
        </div>
    );
}
