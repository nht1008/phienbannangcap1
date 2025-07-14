
"use client";

import type { User, AuthError } from 'firebase/auth';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { AuthUser, UserRole } from '@/types';

export interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfileName: (name: string) => Promise<void>;
  error: AuthError | null;
  setError: React.Dispatch<React.SetStateAction<AuthError | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    let roleListener: () => void = () => {};

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Clean up previous role listener if it exists
      roleListener();

      if (user) {
        const roleRef = ref(db, `userRoles/${user.uid}`);
        roleListener = onValue(roleRef, (snapshot) => {
          const role = snapshot.val() as UserRole;
          const userWithRole = Object.assign(user, { role });
          setCurrentUser(userWithRole);
          setLoading(false);
        }, (err) => {
          console.error("Role fetching error:", err);
          // If role fetching fails, still sign in the user but with a null role
          setCurrentUser({ ...user, role: null } as AuthUser);
          setLoading(false);
        });
      } else {
        // User is signed out
        setCurrentUser(null);
        setLoading(false);
      }
    }, (err) => {
      console.error("Auth state change error:", err);
      setError(err as AuthError);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      roleListener(); // Cleanup role listener on unmount
    };
  }, []);

  const signIn = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      // The onAuthStateChanged listener will handle setting the user with their role.
      // We return the user from the credential for immediate feedback if needed,
      // but the context state will be updated asynchronously with the role.
      return userCredential.user;
    } catch (err) {
      setError(err as AuthError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
    } catch (err) {
      setError(err as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfileName = async (name: string) => {
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, { displayName: name });
        // No need to manually setCurrentUser here, onAuthStateChanged will trigger
        // and update the currentUser state with the new displayName.
      } catch (err) {
        setError(err as AuthError);
        throw err; // Re-throw to allow error handling in the component
      }
    } else {
      const err = new Error("No current user to update.") as AuthError;
      setError(err);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err as AuthError);
      throw err; // Re-throw to allow error handling in the component
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    signIn,
    signOut,
    resetPassword,
    updateUserProfileName,
    error,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
