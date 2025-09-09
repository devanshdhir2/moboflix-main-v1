"use client";

import React, { useState, useEffect } from 'react';
// --- REMOVED: Firebase Storage imports are no longer needed ---
// import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
// import { db, storage } from '../../../../firebase/config';
import { db } from '../../../../firebase/config'; // Keep db for Firestore
import { collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../../context/AuthContext';
import Spinner from '../../../../components/Spinner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2 } from 'lucide-react';

// ProductItem component remains unchanged
const ProductItem = ({ product, onDelete }) => {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row items-center p-4 gap-4">
            <img src={product.imageUrl} alt={product.name} className="w-24 h-24 object-cover rounded-md" />
            <div className="flex-1 text-center md:text-left">
                <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
                <p className="text-gray-600">For {product.model}</p>
                <p className="text-green-600 font-semibold mt-1">₹{product.price}</p>
                <p className={`text-sm font-bold ${product.isAvailable ? 'text-blue-500' : 'text-red-500'}`}>
                    {product.isAvailable ? 'Available' : 'Out of Stock'}
                </p>
            </div>
            {/* Note: Deleting from Cloudinary from the client-side is complex. 
                This will now only delete the Firestore record. Images can be managed in your Cloudinary dashboard. */}
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

    // Form state remains unchanged
    const [productName, setProductName] = useState('');
    const [productModel, setProductModel] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productImage, setProductImage] = useState(null);
    const [isAvailable, setIsAvailable] = useState(true);

    // useEffect for fetching products remains unchanged
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
        if(document.getElementById('productImage')) {
            document.getElementById('productImage').value = '';
        }
    };

    // --- UPDATED: This function now uploads to Cloudinary ---
    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!productName || !productModel || !productPrice || !productImage) {
            alert("Please fill out all fields and select an image.");
            return;
        }
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('file', productImage);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

        try {
            // 1. Upload image to Cloudinary
            const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            const imageUrl = data.secure_url;

            if (!imageUrl) {
                throw new Error("Image upload failed, no URL returned.");
            }

            // 2. Add product data to Firestore
            await addDoc(collection(db, 'products'), {
                name: productName,
                model: productModel,
                price: Number(productPrice),
                imageUrl, // The new Cloudinary URL
                isAvailable,
                createdAt: serverTimestamp()
            });

            alert("Product added successfully!");
            resetForm();

        } catch (error) {
            console.error("Error adding product: ", error);
            alert("Failed to add product. Please check your Cloudinary credentials and console for errors.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- UPDATED: This function no longer deletes from Firebase Storage ---
    const handleDeleteProduct = async (productId) => {
        if (!confirm("Are you sure you want to delete this product? This will not delete the image from Cloudinary.")) return;

        try {
            // Delete the product document from Firestore
            await deleteDoc(doc(db, 'products', productId));
            alert("Product deleted successfully from the store.");
        } catch (error) {
            console.error("Error deleting product: ", error);
            alert("Failed to delete product. Please check the console.");
        }
    };


    if (loading) return <Spinner />;

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Manage Store Inventory</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Product Form */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Product</CardTitle>
                            <CardDescription>Fill in the details to add a new item to your store.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddProduct} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="productName">Product Name</Label>
                                    <Input id="productName" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g., Screen Guard" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="productModel">For Model</Label>
                                    <Input id="productModel" value={productModel} onChange={(e) => setProductModel(e.target.value)} placeholder="e.g., iPhone 14 Pro" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="productPrice">Price (₹)</Label>
                                    <Input id="productPrice" type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} placeholder="e.g., 499" required />
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

                {/* Product List */}
                <div className="lg:col-span-2">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Current Inventory</h3>
                    <div className="space-y-4">
                        {products.length > 0 ? (
                            products.map(product => (
                                <ProductItem key={product.id} product={product} onDelete={handleDeleteProduct} />
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-10">No products in your inventory yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

