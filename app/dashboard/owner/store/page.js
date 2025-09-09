"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../../firebase/config';
import { collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../../context/AuthContext';
import Spinner from '../../../../components/Spinner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { Trash2, Search } from 'lucide-react';

const ProductItem = ({ product, onDelete }) => {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row items-center p-4 gap-4">
            <img src={product.imageUrl} alt={product.name} className="w-24 h-24 object-cover rounded-md" />
            <div className="flex-1 text-center md:text-left">
                <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
                <p className="text-gray-500 text-sm font-semibold bg-gray-100 inline-block px-2 py-1 rounded">{product.category || 'Uncategorized'}</p>
                <p className="text-gray-600">For {product.model}</p>
                <p className="text-green-600 font-semibold mt-1">₹{product.price}</p>
                <p className={`text-sm font-bold ${product.isAvailable ? 'text-blue-500' : 'text-red-500'}`}>
                    {product.isAvailable ? 'Available' : 'Out of Stock'}
                </p>
            </div>
            <Button variant="destructive" size="icon" onClick={() => onDelete(product.id)}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default function StoreManagementPage() {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- NEW: State for search and filter ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // --- NEW: Define categories for form and filtering ---
    const categories = ['All', 'Display', 'Screen', 'Battery', 'Mobile Frame', 'Charging Circuit'];
    const formCategories = categories.filter(c => c !== 'All'); // Categories for the dropdown

    // Form state
    const [productName, setProductName] = useState('');
    const [productModel, setProductModel] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productImage, setProductImage] = useState(null);
    const [productCategory, setProductCategory] = useState(formCategories[0]); // --- NEW: Category state for form
    const [isAvailable, setIsAvailable] = useState(true);

    useEffect(() => {
        const productsCollection = collection(db, 'products');
        const unsubscribe = onSnapshot(productsCollection, (snapshot) => {
            const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(fetchedProducts);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setProductImage(e.target.files[0]);
        }
    };

    const resetForm = () => {
        setProductName('');
        setProductModel('');
        setProductPrice('');
        setProductImage(null);
        setProductCategory(formCategories[0]);
        if(document.getElementById('productImage')) {
            document.getElementById('productImage').value = '';
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        // --- UPDATED: Validation includes category ---
        if (!productName || !productModel || !productPrice || !productImage || !productCategory) {
            alert("Please fill out all fields, including category, and select an image.");
            return;
        }
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('file', productImage);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            const imageUrl = data.secure_url;
            if (!imageUrl) throw new Error("Image upload failed.");

            await addDoc(collection(db, 'products'), {
                name: productName,
                model: productModel,
                price: Number(productPrice),
                category: productCategory, // --- NEW: Save category to Firestore ---
                imageUrl,
                isAvailable,
                createdAt: serverTimestamp()
            });
            alert("Product added successfully!");
            resetForm();
        } catch (error) {
            console.error("Error adding product: ", error);
            alert("Failed to add product.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            await deleteDoc(doc(db, 'products', productId));
            alert("Product deleted successfully.");
        } catch (error) {
            console.error("Error deleting product: ", error);
            alert("Failed to delete product.");
        }
    };

    // --- NEW: Logic to filter products for display ---
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
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Manage Store Inventory</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Product</CardTitle>
                            <CardDescription>Fill in the details to add a new item.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddProduct} className="space-y-4">
                                {/* Form fields remain the same, with one addition */}
                                <div className="space-y-2">
                                    <Label htmlFor="productName">Product Name</Label>
                                    <Input id="productName" value={productName} onChange={(e) => setProductName(e.target.value)} required />
                                </div>
                                 {/* --- NEW: Category Select Dropdown --- */}
                                <div className="space-y-2">
                                    <Label htmlFor="productCategory">Category</Label>
                                    <Select value={productCategory} onValueChange={setProductCategory}>
                                        <SelectTrigger id="productCategory">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {formCategories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="productModel">For Model</Label>
                                    <Input id="productModel" value={productModel} onChange={(e) => setProductModel(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="productPrice">Price (₹)</Label>
                                    <Input id="productPrice" type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} required />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="productImage">Product Image</Label>
                                    <Input id="productImage" type="file" onChange={handleImageChange} accept="image/*" required />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input type="checkbox" id="isAvailable" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="h-4 w-4" />
                                    <Label htmlFor="isAvailable">Is this product available?</Label>
                                </div>
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? <Spinner/> : 'Add Product'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    {/* --- NEW: Search and Filter UI for the inventory list --- */}
                    <div className="mb-4 space-y-4">
                        <h3 className="text-2xl font-bold text-gray-800">Current Inventory</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input 
                                type="text"
                                placeholder="Search inventory..."
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
                    <div className="space-y-4">
                        {/* --- UPDATED: Use filteredProducts array --- */}
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map(product => (
                                <ProductItem key={product.id} product={product} onDelete={handleDeleteProduct} />
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-10">No products match your search or filter.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

