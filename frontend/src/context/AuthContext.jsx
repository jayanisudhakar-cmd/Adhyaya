import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth } from "../services/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    // Detect if we are using mock mode (Firebase API key not set or is default mock string)
    const isMock = import.meta.env.VITE_FIREBASE_API_KEY === undefined || 
                   import.meta.env.VITE_FIREBASE_API_KEY === "" ||
                   import.meta.env.VITE_FIREBASE_API_KEY === "mock-api-key-for-local-testing";
    
    setIsMockMode(isMock);

    if (isMock) {
      // Mock Auth State Restorer
      const savedUser = localStorage.getItem("namma_guru_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    } else {
      // Real Firebase listener
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email.split("@")[0]
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }, (error) => {
        console.warn("Firebase Auth listener failed, switching to local mock auth mode:", error);
        setIsMockMode(true);
        const savedUser = localStorage.getItem("namma_guru_user");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
        setLoading(false);
      });
      return unsubscribe;
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    if (isMockMode) {
      const mockUser = { uid: "mock-uid-123", email, displayName: email.split("@")[0] };
      setUser(mockUser);
      localStorage.setItem("namma_guru_user", JSON.stringify(mockUser));
      setLoading(false);
      return mockUser;
    } else {
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const u = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || result.user.email.split("@")[0]
        };
        setUser(u);
        return u;
      } catch (err) {
        setLoading(false);
        throw err;
      }
    }
  };

  const signup = async (email, password) => {
    setLoading(true);
    if (isMockMode) {
      const mockUser = { uid: "mock-uid-" + Date.now(), email, displayName: email.split("@")[0] };
      setUser(mockUser);
      localStorage.setItem("namma_guru_user", JSON.stringify(mockUser));
      setLoading(false);
      return mockUser;
    } else {
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const u = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.email.split("@")[0]
        };
        setUser(u);
        return u;
      } catch (err) {
        setLoading(false);
        throw err;
      }
    }
  };

  const logout = async () => {
    setLoading(true);
    if (isMockMode) {
      setUser(null);
      localStorage.removeItem("namma_guru_user");
      setLoading(false);
    } else {
      try {
        await signOut(auth);
        setUser(null);
      } catch (err) {
        console.error("Signout failed", err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isMockMode, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
