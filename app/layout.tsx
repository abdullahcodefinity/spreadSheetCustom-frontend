'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import { LoaderContext, AuthContext } from "./context";
import keys from "./common/keys";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import Loader from "./components/loader/Loader";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = new QueryClient();

  // Initialize auth context from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem(keys.jwttoken);
    const storedUser = localStorage.getItem(keys.user);
    
    if (storedToken) {
      setToken(storedToken);
    }
    
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem(keys.user);
      }
    }
    
    setIsInitialized(true);
  }, []);

  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        {/* <LoaderContext.Provider value={{ loading, setLoading }}> */}
          <AuthContext.Provider
            value={{ currentUser, token: token || undefined, setToken, setCurrentUser }}
          >
            <QueryClientProvider client={queryClient}>
              {/* <Loader visible={loading} /> */}
              {isInitialized ? children : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
              <Toaster position="top-right"  /> 
            </QueryClientProvider>
          </AuthContext.Provider>
        {/* </LoaderContext.Provider> */}
      </body>
    </html>
  );
}