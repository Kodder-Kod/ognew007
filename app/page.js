"use client";

import { useState, useEffect } from "react";
import Header from "./componets/header/page"; // Correct import
import LogIn from "./allpages/user/login/page";
import { onAuthStateChanged, getAuth } from 'firebase/auth';

export default function Home() {

  const [user, setUser] = useState(null);
  const auth = getAuth()

  const [initializing, setInitializing] = useState(true);
 

  // Handle authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false) // Set loading to false when auth check completes
    });
    return () => unsubscribe(); // Cleanup subscription
  }, [initializing]);


  if (initializing) return null;
  // Display a loading state until the authentication status is resolved

  // If user is not authenticated, show the login page
  if (!user) {
    console.log(user)
    return <LogIn />;
  }
  // If user is authenticated, redirect to the dashboard

  if (user) {

    return <Header/>
  }
  // Adjust to your actual dashboard path
  return null;
}
