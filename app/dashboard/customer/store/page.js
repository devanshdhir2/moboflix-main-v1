"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { db } from '../../../../firebase/config';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import Link from 'next/link';
import Spinner from '../../../../components/Spinner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ShoppingCart } from 'lucide-react';

const ProductCard = ({ product }) => {
    return (
        <Card className="flex flex-col">
            <CardHeader className="p-0">
                <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover rounded-t-lg" />
            </CardHeader>
            <CardContent className="flex-1 p-4">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription>For {product.model}</CardDescription>
                <p className="text-xl font-bold text-green-600 mt-2">₹{product.price}</p>
            </CardContent>
            <CardFooter>
                {/* --- UPDATED: This now links to the dedicated order page --- */}
                <Link href={`/dashboard/customer/store/${product.id}`} passHref className="w-full">
                    <Button className="w-full" disabled={!product.isAvailable}>
                        {product.isAvailable ? 'Buy Now' : 'Out of Stock'}
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
};

export default function CustomerStorePage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "products"), where("isAvailable", "==", true));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(fetchedProducts);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching products: ", error);
            alert("Could not load the store. Please try again later.");
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return <Spinner />;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-6">
                 <ShoppingCart className="h-8 w-8 text-gray-800" />
                 <h2 className="text-3xl font-bold text-gray-800">Moboflix Store</h2>
            </div>
            <p className="text-gray-500 mb-8">Buy genuine parts and accessories. A technician will deliver and install them for you.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.length > 0 ? (
                    products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500 py-10">
                        The store is currently empty. Please check back later!
                    </p>
                )}
            </div>
        </div>
    );
}

