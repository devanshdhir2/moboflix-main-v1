"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../../../firebase/config";
import {
    collection,
    addDoc,
    onSnapshot,
    deleteDoc,
    doc,
    serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../../../../context/AuthContext";
import Spinner from "../../../../components/Spinner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Trash2, Search } from "lucide-react";

/* ---------------------- PRODUCT CARD (Dark) ---------------------- */
const ProductItem = ({ product, onDelete }) => {
    return (
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg shadow-md p-4 flex flex-col md:flex-row items-center gap-4 hover:bg-slate-800 transition">
            <img
                src={product.imageUrl}
                alt={product.name}
                className="w-24 h-24 object-cover rounded-md border border-slate-700"
            />

            <div className="flex-1 text-center md:text-left">
                <h3 className="text-white text-lg font-semibold">{product.name}</h3>

                <span className="text-xs px-2 py-1 bg-slate-800 border border-slate-700 text-slate-400 rounded inline-block my-1">
                    {product.category}
                </span>

                <p className="text-slate-400 text-sm">For {product.model}</p>
                <p className="text-green-400 font-semibold mt-1">₹{product.price}</p>

                <p
                    className={`text-sm font-bold ${product.isAvailable ? "text-blue-400" : "text-red-400"
                        }`}
                >
                    {product.isAvailable ? "Available" : "Out of Stock"}
                </p>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-700"
                onClick={() => onDelete(product.id)}
            >
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
    );
};

/* ---------------------- MAIN PAGE ---------------------- */
export default function StoreManagementPage() {
    const { user } = useAuth();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* FORM FIELDS */
    const [productName, setProductName] = useState("");
    const [productModel, setProductModel] = useState("");
    const [productPrice, setProductPrice] = useState("");
    const [productImage, setProductImage] = useState(null);
    const [productCategory, setProductCategory] = useState("Display");
    const [isAvailable, setIsAvailable] = useState(true);

    /* FILTERS */
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

    const formCategories = categories.filter((c) => c !== "All");

    /* FETCH PRODUCTS */
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
            setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => unsub();
    }, []);

    /* IMAGE INPUT */
    const handleImageChange = (e) => {
        if (e.target.files[0]) setProductImage(e.target.files[0]);
    };

    /* RESET FORM */
    const resetForm = () => {
        setProductName("");
        setProductModel("");
        setProductPrice("");
        setProductImage(null);
        setProductCategory("Display");
        setIsAvailable(true);
        document.getElementById("productImage").value = "";
    };

    /* ADD PRODUCT */
    const handleAddProduct = async (e) => {
        e.preventDefault();

        if (!productName || !productModel || !productPrice || !productImage) {
            alert("Fill all fields and upload an image.");
            return;
        }

        setIsSubmitting(true);

        try {
            const data = new FormData();
            data.append("file", productImage);
            data.append(
                "upload_preset",
                process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
            );

            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: "POST", body: data }
            );

            const img = await res.json();
            if (!img.secure_url) throw new Error("Upload failed");

            await addDoc(collection(db, "products"), {
                name: productName,
                model: productModel,
                price: Number(productPrice),
                category: productCategory,
                isAvailable,
                imageUrl: img.secure_url,
                createdAt: serverTimestamp(),
            });

            alert("Product added!");
            resetForm();
        } catch (err) {
            console.error(err);
            alert("Error adding product");
        } finally {
            setIsSubmitting(false);
        }
    };

    /* DELETE PRODUCT */
    const handleDeleteProduct = async (id) => {
        if (!confirm("Delete product?")) return;

        try {
            await deleteDoc(doc(db, "products", id));
            alert("Product removed");
        } catch {
            alert("Error deleting product");
        }
    };

    /* FILTER LOGIC */
    const filtered = useMemo(() => {
        return products.filter((product) => {
            const matchCat =
                selectedCategory === "All" ||
                product.category === selectedCategory;

            const matchSearch =
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.model.toLowerCase().includes(searchTerm.toLowerCase());

            return matchCat && matchSearch;
        });
    }, [products, selectedCategory, searchTerm]);

    if (loading)
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner />
            </div>
        );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 px-4 py-8">

            <h2 className="text-3xl font-bold text-white mb-6">
                Manage Store Inventory
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ---------------- LEFT: FORM ---------------- */}
                <div>
                    <Card className="bg-slate-900/70 border border-slate-800 text-slate-200">
                        <CardHeader>
                            <CardTitle className="text-white">Add New Product</CardTitle>
                            <CardDescription className="text-slate-400">
                                Upload and manage store items.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleAddProduct} className="space-y-4">

                                <div className="space-y-2">
                                    <Label>Product Name</Label>
                                    <Input
                                        className="bg-slate-900 border-slate-700 text-white"
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select
                                        value={productCategory}
                                        onValueChange={setProductCategory}
                                    >
                                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                            {formCategories.map((cat) => (
                                                <SelectItem key={cat} value={cat} className="text-white">
                                                    {cat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>For Model</Label>
                                    <Input
                                        className="bg-slate-900 border-slate-700 text-white"
                                        value={productModel}
                                        onChange={(e) => setProductModel(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Price (₹)</Label>
                                    <Input
                                        type="number"
                                        className="bg-slate-900 border-slate-700 text-white"
                                        value={productPrice}
                                        onChange={(e) => setProductPrice(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Product Image</Label>
                                    <Input
                                        id="productImage"
                                        type="file"
                                        accept="image/*"
                                        className="bg-slate-900 border-slate-700 text-white"
                                        onChange={handleImageChange}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={isAvailable}
                                        onChange={(e) => setIsAvailable(e.target.checked)}
                                    />
                                    <Label>Available?</Label>
                                </div>

                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                    {isSubmitting ? <Spinner /> : "Add Product"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* ---------------- RIGHT: INVENTORY ---------------- */}
                <div className="lg:col-span-2">

                    <h3 className="text-2xl font-bold text-white mb-4">Current Inventory</h3>

                    <div className="space-y-4 mb-6">
                        {/* SEARCH BAR */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                            <Input
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 bg-slate-900 border-slate-700 text-white"
                            />
                        </div>

                        {/* CATEGORY FILTER */}
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => (
                                <Button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={
                                        selectedCategory === cat
                                            ? "bg-blue-600 text-white"
                                            : "bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800"
                                    }
                                >
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* PRODUCT LIST */}
                    <div className="space-y-4">
                        {filtered.length > 0 ? (
                            filtered.map((product) => (
                                <ProductItem
                                    key={product.id}
                                    product={product}
                                    onDelete={handleDeleteProduct}
                                />
                            ))
                        ) : (
                            <p className="text-slate-400 text-center py-10">
                                No products match your search.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
