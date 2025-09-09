"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { db } from '../../../../firebase/config';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import Link from 'next/link';
import Spinner from '../../../../components/Spinner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; // Import Input for search
import { ShoppingCart, Search } from 'lucide-react';

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
    // --- NEW: State for search and filter ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // --- NEW: Define categories for filtering ---
    const categories = ['All', 'Display', 'Screen', 'Battery', 'Mobile Frame', 'Charging Circuit'];

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

    // --- NEW: Logic to filter products based on search and category ---
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const categoryMatch = selectedCategory === 'All' || (product.category && product.category === selectedCategory);
            const searchMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                product.model.toLowerCase().includes(searchTerm.toLowerCase());
            return categoryMatch && searchMatch;
        });
    }, [products, searchTerm, selectedCategory]);

    if (loading) return <Spinner />;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-6">
                 <ShoppingCart className="h-8 w-8 text-gray-800" />
                 <h2 className="text-3xl font-bold text-gray-800">Moboflix Store</h2>
            </div>
            <p className="text-gray-500 mb-8">Buy genuine parts and accessories. A technician will deliver and install them for you.</p>

            {/* --- NEW: Search and Filter UI --- */}
            <div className="mb-8 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                        type="text"
                        placeholder="Search by product or model (e.g., iPhone 14 Pro)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                        <Button 
                            key={category}
                            variant={selectedCategory === category ? 'default' : 'outline'}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* --- UPDATED: Use filteredProducts array --- */}
                {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500 py-10">
                        No products match your search. Try adjusting your filters.
                    </p>
                )}
            </div>
        </div>
    );
}

