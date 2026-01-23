"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../../../firebase/config";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import Link from "next/link";
import Spinner from "../../../../components/Spinner";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { ShoppingCart, Search } from "lucide-react";

// BLACK & GOLD PRODUCT CARD
const ProductCard = ({ product }) => {
    return (
        <Card className="flex flex-col bg-zinc-900 border border-zinc-800 shadow-lg rounded-xl overflow-hidden hover:border-yellow-600/30 transition-all hover:shadow-yellow-900/10">
            <CardHeader className="p-0">
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover opacity-90 hover:opacity-100 transition-opacity"
                />
            </CardHeader>

            <CardContent className="flex-1 p-4">
                <CardTitle className="text-lg text-white">{product.name}</CardTitle>
                <CardDescription className="text-zinc-400">
                    For {product.model}
                </CardDescription>
                <p className="text-xl font-bold text-yellow-400 mt-2">₹{product.price}</p>
            </CardContent>

            <CardFooter>
                <Link href={`/dashboard/customer/store/${product.id}`} passHref className="w-full">
                    <Button
                        className="w-full bg-gradient-to-r from-[#BF953F] to-[#B38728] hover:from-[#d4a849] hover:to-[#c4952d] text-black font-bold"
                        disabled={!product.isAvailable}
                    >
                        {product.isAvailable ? "Buy Now" : "Out of Stock"}
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
};

export default function CustomerStorePage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const categories = [
        "All",
        "Display",
        "Screen",
        "Battery",
        "Mobile Frame",
        "Charging Circuit",
        "Accessories",
    ];

    // Fetch products
    useEffect(() => {
        const q = query(
            collection(db, "products"),
            where("isAvailable", "==", true)
        );

        const unsub = onSnapshot(
            q,
            (snapshot) => {
                const fetched = snapshot.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }));
                setProducts(fetched);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching products:", error);
                alert("Could not load products.");
                setLoading(false);
            }
        );

        return () => unsub();
    }, []);

    // Filter
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const categoryMatch =
                selectedCategory === "All" ||
                (product.category && product.category === selectedCategory);

            const searchMatch =
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.model.toLowerCase().includes(searchTerm.toLowerCase());

            return categoryMatch && searchMatch;
        });
    }, [products, searchTerm, selectedCategory]);

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Spinner /></div>;

    return (
        <div className="min-h-screen w-full bg-black text-zinc-200 py-10 px-5 selection:bg-yellow-500/30">
            <div className="container mx-auto px-4">

                {/* HEADER */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-zinc-900 rounded-full border border-zinc-800">
                        <ShoppingCart className="h-8 w-8 text-yellow-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Moboflix Store</h2>
                </div>

                <p className="text-zinc-400 mb-8 max-w-2xl">
                    Buy genuine parts and accessories. A technician will deliver and install them for you.
                </p>

                {/* SEARCH + FILTER */}
                <div className="mb-8 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />

                        <Input
                            type="text"
                            placeholder="Search by product or model (e.g., iPhone 14 Pro)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-yellow-500 h-12 rounded-xl"
                        />
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <Button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1 rounded-lg transition-all ${selectedCategory === cat
                                    ? "bg-gradient-to-r from-[#BF953F] to-[#B38728] text-black font-semibold border-transparent"
                                    : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white"
                                    }`}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* PRODUCT GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-zinc-500 py-10 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed">
                            No products match your search.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}