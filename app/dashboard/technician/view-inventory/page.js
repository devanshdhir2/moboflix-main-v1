"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase/config';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import Spinner from '../../../../components/Spinner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const InventoryItem = ({ item }) => {
    const inStock = item.stock > 0;
    return (
        <div className="flex items-center justify-between bg-white p-4 mb-3 rounded-lg border">
            <div>
                <p className="font-semibold text-slate-800">{item.name}</p>
            </div>
            <div className={`px-3 py-1 text-sm font-semibold rounded-full ${inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {inStock ? `${item.stock} in stock` : 'Out of Stock'}
            </div>
        </div>
    );
};

export default function ViewInventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "inventory"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedParts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInventory(fetchedParts);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching inventory: ", error);
            alert("Could not fetch inventory.");
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <Spinner />;
    }

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl md:text-3xl">Warehouse Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                    {inventory.length > 0 ? (
                        <div className="space-y-2">
                            {inventory.map(item => <InventoryItem key={item.id} item={item} />)}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-slate-500">The warehouse inventory is currently empty.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
