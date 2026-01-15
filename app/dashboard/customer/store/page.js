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

// DARK THEME PRODUCT CARD
const ProductCard = ({ product }) => {
    return (
        <Card className="flex flex-col bg-slate-900/70 border border-slate-800 shadow-lg rounded-lg">
            <CardHeader className="p-0">
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                />
            </CardHeader>

            <CardContent className="flex-1 p-4">
                <CardTitle className="text-lg text-white">{product.name}</CardTitle>
                <CardDescription className="text-slate-400">
                    For {product.model}
                </CardDescription>
                <p className="text-xl font-bold text-green-400 mt-2">₹{product.price}</p>
            </CardContent>

            <CardFooter>
                <Link href={`/dashboard/customer/store/${product.id}`} passHref className="w-full">
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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

    if (loading) return <Spinner />;

    return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-200 py-10 px-5">
            <div className="container mx-auto px-4">

                {/* HEADER */}
                <div className="flex items-center gap-4 mb-6">
                    <ShoppingCart className="h-8 w-8 text-slate-300" />
                    <h2 className="text-3xl font-bold text-white">Moboflix Store</h2>
                </div>

                <p className="text-slate-400 mb-8">
                    Buy genuine parts and accessories. A technician will deliver and install them for you.
                </p>

                {/* SEARCH + FILTER */}
                <div className="mb-8 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />

                        <Input
                            type="text"
                            placeholder="Search by product or model (e.g., iPhone 14 Pro)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 bg-slate-900 border-slate-700 text-white placeholder-slate-500"
                        />
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <Button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1 rounded-lg ${selectedCategory === cat
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
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
                        <p className="col-span-full text-center text-slate-500 py-10">
                            No products match your search.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
