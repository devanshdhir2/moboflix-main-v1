// context/AuthContext.js
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext({
    user: null,
    userRole: null,
    loading: true,
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
            if (!mounted) return;

            if (authenticatedUser) {
                try {
                    const userDocRef = doc(db, "users", authenticatedUser.uid);
                    const userDoc = await getDoc(userDocRef);
                    setUserRole(userDoc.exists() ? userDoc.data().role : null);
                } catch (err) {
                    // fail-safe: log and continue
                    // don't throw — just provide null role if fetching failed
                    console.error("Failed to read user doc:", err);
                    setUserRole(null);
                }
                setUser(authenticatedUser);
            } else {
                setUser(null);
                setUserRole(null);
            }

            setLoading(false);
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);

    const value = { user, userRole, loading };

    // IMPORTANT: always render children (do not hide them while loading).
    // Let pages/components check `loading` from context if they need to wait.
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
