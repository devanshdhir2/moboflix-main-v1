"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../components/LoginScreen';
import Spinner from '../components/Spinner';

export default function HomePage() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && userRole) {
      // Redirect based on role
      const dashboardPath = `/dashboard/${userRole}`;
      router.push(dashboardPath);
    }
  }, [user, userRole, loading, router]);

  if (loading || (user && userRole)) {
    return <Spinner />;
  }
  
  return <LoginScreen />;
}

