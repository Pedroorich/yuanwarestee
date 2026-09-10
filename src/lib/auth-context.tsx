"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from "firebase/firestore";
import { auth, googleProvider, db, isFirebaseConfigured } from "./firebase";
import { UserProfile, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isVip: boolean;
  isFree: boolean;
  dailyAccessUsed: boolean;
  nextAvailableTime: Date | null;
  hoursRemaining: number;
  // Link quota
  recordLinkAccess: (productId: string) => Promise<boolean>;
  resetLinkQuota: (targetUid?: string) => Promise<void>;
  // Declaration quota
  dailyDeclarationsCount: number;
  declarationsRemainingToday: number;
  canGenerateDeclaration: boolean;
  recordDeclarationUsage: () => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  mockLogin: (role?: UserRole, email?: string) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "ph44608@gmail.com")
  .toLowerCase()
  .split(",")
  .map(e => e.trim());

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile from Firestore or local storage
  const fetchUserProfile = async (firebaseUser: User) => {
    const isSuperAdmin = ADMIN_EMAILS.includes((firebaseUser.email || "").toLowerCase());
    const todayStr = new Date().toISOString().split("T")[0];
    
    // Helper to register user in the admin users list cache
    const syncUserToAdminList = (userProf: UserProfile) => {
      try {
        const saved = localStorage.getItem("yw_users_list");
        let list: UserProfile[] = saved ? JSON.parse(saved) : [];
        const index = list.findIndex((u) => u.uid === userProf.uid || u.email.toLowerCase() === userProf.email.toLowerCase());
        if (index >= 0) {
          list[index] = { ...list[index], ...userProf };
        } else {
          list.push(userProf);
        }
        localStorage.setItem("yw_users_list", JSON.stringify(list));
      } catch (err) {
        console.error("Error syncing user to admin list:", err);
      }
    };

    if (isFirebaseConfigured) {
      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          let needsUpdate = false;
          const updates: Partial<UserProfile> = {};

          // Ensure super admin email always has admin role
          if (isSuperAdmin && data.role !== "admin") {
            updates.role = "admin";
            data.role = "admin";
            needsUpdate = true;
          }

          // Check if declaration date is today, reset daily count if new day
          if (data.lastDeclarationDate !== todayStr) {
            updates.dailyDeclarationsCount = 0;
            updates.lastDeclarationDate = todayStr;
            data.dailyDeclarationsCount = 0;
            data.lastDeclarationDate = todayStr;
            needsUpdate = true;
          }

          if (needsUpdate) {
            await updateDoc(userRef, updates);
          }

          setProfile(data);
          syncUserToAdminList(data);
          return;
        } else {
          // Create new user profile
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "Usuário",
            photoURL: firebaseUser.photoURL || undefined,
            role: isSuperAdmin ? "admin" : "free",
            createdAt: Date.now(),
            lastLinkAccessAt: null,
            dailyAccessCount: 0,
            dailyDeclarationsCount: 0,
            lastDeclarationDate: todayStr,
            totalDeclarationsCount: 0,
            maxDailyDeclarations: 10,
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
          syncUserToAdminList(newProfile);
          return;
        }
      } catch (err) {
        console.warn("Firestore access error, falling back to client session:", err);
      }
    }

    // Fallback: local session profile
    const savedLocal = localStorage.getItem(`yw_profile_${firebaseUser.uid}`);
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal) as UserProfile;
        if (isSuperAdmin) parsed.role = "admin";
        if (parsed.lastDeclarationDate !== todayStr) {
          parsed.dailyDeclarationsCount = 0;
          parsed.lastDeclarationDate = todayStr;
        }
        localStorage.setItem(`yw_profile_${firebaseUser.uid}`, JSON.stringify(parsed));
        setProfile(parsed);
        syncUserToAdminList(parsed);
        return;
      } catch (e) {
        console.error(e);
      }
    }

    const fallbackProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      displayName: firebaseUser.displayName || "Usuário",
      photoURL: firebaseUser.photoURL || undefined,
      role: isSuperAdmin ? "admin" : "free",
      createdAt: Date.now(),
      lastLinkAccessAt: null,
      dailyAccessCount: 0,
      dailyDeclarationsCount: 0,
      lastDeclarationDate: todayStr,
      totalDeclarationsCount: 0,
      maxDailyDeclarations: 10,
    };
    localStorage.setItem(`yw_profile_${firebaseUser.uid}`, JSON.stringify(fallbackProfile));
    setProfile(fallbackProfile);
    syncUserToAdminList(fallbackProfile);
  };

  useEffect(() => {
    // Check if there was a saved mock session
    const savedMock = localStorage.getItem("yw_mock_user");
    if (savedMock) {
      try {
        const mockData = JSON.parse(savedMock);
        setUser(mockData.user);
        setProfile(mockData.profile);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem("yw_mock_user");
      }
    }

    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      // If Firebase keys are not configured yet, use mock login
      mockLogin("free");
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      await fetchUserProfile(result.user);
    } catch (error: any) {
      console.error("Firebase Auth error:", error);
      // If API key is invalid in demo, fall back to mock
      if (error.code === "auth/api-key-not-valid" || error.code === "auth/invalid-api-key") {
        mockLogin("free");
      } else {
        throw error;
      }
    }
  };

  // Mock login allows instant testing for Free, VIP or Admin
  const mockLogin = (role: UserRole = "free", email = "lead@exemplo.com") => {
    const isTargetAdmin = role === "admin" || ADMIN_EMAILS.includes(email.toLowerCase());
    const mockUser = {
      uid: isTargetAdmin ? "admin-uid-01" : "mock-uid-" + Date.now(),
      email: isTargetAdmin ? "ph44608@gmail.com" : email,
      displayName: isTargetAdmin ? "Pedro Admin" : "Lead Teste",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    } as User;

    const todayStr = new Date().toISOString().split("T")[0];
    const mockProfile: UserProfile = {
      uid: mockUser.uid,
      email: mockUser.email || "",
      displayName: mockUser.displayName || "",
      photoURL: mockUser.photoURL || undefined,
      role: isTargetAdmin ? "admin" : role,
      createdAt: Date.now(),
      lastLinkAccessAt: null,
      dailyAccessCount: 0,
      dailyDeclarationsCount: 0,
      lastDeclarationDate: todayStr,
      totalDeclarationsCount: 0,
      maxDailyDeclarations: 10,
    };

    localStorage.setItem("yw_mock_user", JSON.stringify({ user: mockUser, profile: mockProfile }));
    setUser(mockUser);
    setProfile(mockProfile);

    // Also sync mock user to admin user list
    try {
      const saved = localStorage.getItem("yw_users_list");
      let list: UserProfile[] = saved ? JSON.parse(saved) : [];
      const index = list.findIndex((u) => u.uid === mockProfile.uid || u.email.toLowerCase() === mockProfile.email.toLowerCase());
      if (index >= 0) {
        list[index] = { ...list[index], ...mockProfile };
      } else {
        list.push(mockProfile);
      }
      localStorage.setItem("yw_users_list", JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const logout = async () => {
    localStorage.removeItem("yw_mock_user");
    if (isFirebaseConfigured) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error(err);
      }
    }
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  };

  const isAdmin = profile?.role === "admin";
  const isVip = profile?.role === "vip" || isAdmin;
  const isFree = profile?.role === "free";

  // Check 24h quota for links
  let dailyAccessUsed = false;
  let nextAvailableTime: Date | null = null;
  let hoursRemaining = 0;

  if (isFree && profile?.lastLinkAccessAt) {
    const timeElapsed = Date.now() - profile.lastLinkAccessAt;
    if (timeElapsed < TWENTY_FOUR_HOURS_MS) {
      dailyAccessUsed = true;
      nextAvailableTime = new Date(profile.lastLinkAccessAt + TWENTY_FOUR_HOURS_MS);
      hoursRemaining = Math.max(1, Math.ceil((TWENTY_FOUR_HOURS_MS - timeElapsed) / (1000 * 60 * 60)));
    }
  }

  // Declaration quota calculation
  const todayStr = new Date().toISOString().split("T")[0];
  const isToday = profile?.lastDeclarationDate === todayStr;
  const dailyDeclarationsCount = isToday ? (profile?.dailyDeclarationsCount || 0) : 0;
  const maxDaily = profile?.maxDailyDeclarations || 10;
  const declarationsRemainingToday = Math.max(0, maxDaily - dailyDeclarationsCount);
  const canGenerateDeclaration = isVip && declarationsRemainingToday > 0;

  // Record declaration usage
  const recordDeclarationUsage = async (): Promise<boolean> => {
    if (!profile || !user) return false;
    if (!isVip) return false;

    const currentTodayCount = profile.lastDeclarationDate === todayStr ? (profile.dailyDeclarationsCount || 0) : 0;
    if (currentTodayCount >= maxDaily) {
      return false; // Quota reached
    }

    const newDailyCount = currentTodayCount + 1;
    const newTotalCount = (profile.totalDeclarationsCount || 0) + 1;

    const updatedProfile: UserProfile = {
      ...profile,
      dailyDeclarationsCount: newDailyCount,
      lastDeclarationDate: todayStr,
      totalDeclarationsCount: newTotalCount,
    };

    setProfile(updatedProfile);

    // Save to Firestore if configured
    if (isFirebaseConfigured) {
      try {
        const userRef = doc(db, "users", profile.uid);
        await updateDoc(userRef, {
          dailyDeclarationsCount: newDailyCount,
          lastDeclarationDate: todayStr,
          totalDeclarationsCount: newTotalCount,
        });
      } catch (err) {
        console.error("Failed to update declaration in Firestore:", err);
      }
    }

    // Save locally
    localStorage.setItem(`yw_profile_${profile.uid}`, JSON.stringify(updatedProfile));

    // Update yw_users_list for admin dashboard
    try {
      const saved = localStorage.getItem("yw_users_list");
      if (saved) {
        const list: UserProfile[] = JSON.parse(saved);
        const updatedList = list.map((u) => (u.uid === profile.uid ? { ...u, ...updatedProfile } : u));
        localStorage.setItem("yw_users_list", JSON.stringify(updatedList));
      }
    } catch (e) {
      console.error(e);
    }

    return true;
  };

  // Record when a free user accesses a supplier link (consumes 1 free link for 24h)
  const recordLinkAccess = async (productId: string): Promise<boolean> => {
    if (!profile || !user) return false;
    const now = Date.now();
    const newCount = (profile.dailyAccessCount || 0) + 1;
    const updatedProfile: UserProfile = {
      ...profile,
      lastLinkAccessAt: now,
      lastAccessedProductId: productId,
      dailyAccessCount: newCount,
    };

    setProfile(updatedProfile);

    // Save to Firestore if configured
    if (isFirebaseConfigured) {
      try {
        const userRef = doc(db, "users", profile.uid);
        await updateDoc(userRef, {
          lastLinkAccessAt: now,
          lastAccessedProductId: productId,
          dailyAccessCount: newCount,
        });
      } catch (err) {
        console.error("Failed to update link access in Firestore:", err);
      }
    }

    // Save local profile
    localStorage.setItem(`yw_profile_${profile.uid}`, JSON.stringify(updatedProfile));

    // Update mock session if present
    const savedMock = localStorage.getItem("yw_mock_user");
    if (savedMock) {
      try {
        const parsedMock = JSON.parse(savedMock);
        parsedMock.profile = updatedProfile;
        localStorage.setItem("yw_mock_user", JSON.stringify(parsedMock));
      } catch (e) {}
    }

    // Update admin list
    try {
      const saved = localStorage.getItem("yw_users_list");
      if (saved) {
        const list: UserProfile[] = JSON.parse(saved);
        const updatedList = list.map((u) => (u.uid === profile.uid ? { ...u, ...updatedProfile } : u));
        localStorage.setItem("yw_users_list", JSON.stringify(updatedList));
      }
    } catch (e) {
      console.error(e);
    }

    return true;
  };

  // Reset link quota for the active user or target user
  const resetLinkQuota = async (targetUid?: string): Promise<void> => {
    const uidToReset = targetUid || profile?.uid;
    if (!uidToReset) return;

    if (profile && profile.uid === uidToReset) {
      const updatedProfile: UserProfile = {
        ...profile,
        lastLinkAccessAt: null,
        lastAccessedProductId: null,
        dailyAccessCount: 0,
      };
      setProfile(updatedProfile);
      localStorage.setItem(`yw_profile_${uidToReset}`, JSON.stringify(updatedProfile));

      const savedMock = localStorage.getItem("yw_mock_user");
      if (savedMock) {
        try {
          const parsedMock = JSON.parse(savedMock);
          parsedMock.profile = updatedProfile;
          localStorage.setItem("yw_mock_user", JSON.stringify(parsedMock));
        } catch (e) {}
      }
    }

    if (isFirebaseConfigured) {
      try {
        const userRef = doc(db, "users", uidToReset);
        await updateDoc(userRef, {
          lastLinkAccessAt: null,
          lastAccessedProductId: null,
          dailyAccessCount: 0,
        });
      } catch (err) {
        console.error(err);
      }
    }

    try {
      const saved = localStorage.getItem("yw_users_list");
      if (saved) {
        const list: UserProfile[] = JSON.parse(saved);
        const updatedList = list.map((u) =>
          u.uid === uidToReset
            ? { ...u, lastLinkAccessAt: null, lastAccessedProductId: null, dailyAccessCount: 0 }
            : u
        );
        localStorage.setItem("yw_users_list", JSON.stringify(updatedList));
      }
    } catch (e) {
      console.error(e);
    }

    // Inform server route to clear in-memory map for this user
    try {
      await fetch(`/api/products/reset/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uidToReset, userEmail: profile?.email || "reset", reset: true }),
      });
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        isVip,
        isFree,
        dailyAccessUsed,
        nextAvailableTime,
        hoursRemaining,
        recordLinkAccess,
        resetLinkQuota,
        dailyDeclarationsCount,
        declarationsRemainingToday,
        canGenerateDeclaration,
        recordDeclarationUsage,
        loginWithGoogle,
        mockLogin,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
