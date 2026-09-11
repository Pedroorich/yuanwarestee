import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs,
  onSnapshot,
  Unsubscribe
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { Banner, Product, PopupConfig, UserProfile } from "@/types";

/**
 * Fetch banners stored in Firestore settings collection
 */
export async function getBannersFromFirestore(): Promise<Banner[] | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const snap = await getDoc(doc(db, "settings", "banners"));
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.list) && data.list.length > 0) {
        return data.list as Banner[];
      }
    }
  } catch (err) {
    console.warn("Firestore: Error loading banners:", err);
  }
  return null;
}

/**
 * Subscribe to real-time banner updates (instant sync between PC and cellphone)
 */
export function subscribeToBanners(onUpdate: (banners: Banner[]) => void): Unsubscribe | null {
  if (!isFirebaseConfigured) return null;
  try {
    return onSnapshot(doc(db, "settings", "banners"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.list) && data.list.length > 0) {
          onUpdate(data.list as Banner[]);
        }
      }
    }, (err) => {
      console.warn("Banners onSnapshot error:", err);
    });
  } catch (err) {
    console.warn("Could not attach banners listener:", err);
    return null;
  }
}

/**
 * Save banners to Firestore so all devices (mobile & desktop) receive them
 */
export async function saveBannersToFirestore(banners: Banner[]): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    await setDoc(doc(db, "settings", "banners"), {
      list: banners,
      updatedAt: Date.now(),
    });
    return true;
  } catch (err) {
    console.error("Firestore: Error saving banners:", err);
    return false;
  }
}

/**
 * Fetch products stored in Firestore settings collection
 */
export async function getProductsFromFirestore(): Promise<Product[] | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const snap = await getDoc(doc(db, "settings", "products"));
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.list) && data.list.length > 0) {
        return data.list as Product[];
      }
    }
  } catch (err) {
    console.warn("Firestore: Error loading products:", err);
  }
  return null;
}

/**
 * Subscribe to real-time products updates
 */
export function subscribeToProducts(onUpdate: (products: Product[]) => void): Unsubscribe | null {
  if (!isFirebaseConfigured) return null;
  try {
    return onSnapshot(doc(db, "settings", "products"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.list) && data.list.length > 0) {
          onUpdate(data.list as Product[]);
        }
      }
    }, (err) => {
      console.warn("Products onSnapshot error:", err);
    });
  } catch (err) {
    console.warn("Could not attach products listener:", err);
    return null;
  }
}

/**
 * Save products to Firestore so all devices receive additions/edits/removals
 */
export async function saveProductsToFirestore(products: Product[]): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    await setDoc(doc(db, "settings", "products"), {
      list: products,
      updatedAt: Date.now(),
    });
    return true;
  } catch (err) {
    console.error("Firestore: Error saving products:", err);
    return false;
  }
}

/**
 * Fetch popup configuration stored in Firestore
 */
export async function getPopupFromFirestore(): Promise<PopupConfig | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const snap = await getDoc(doc(db, "settings", "popup"));
    if (snap.exists()) {
      return snap.data() as PopupConfig;
    }
  } catch (err) {
    console.warn("Firestore: Error loading popup:", err);
  }
  return null;
}

/**
 * Save popup configuration to Firestore
 */
export async function savePopupToFirestore(popup: PopupConfig): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    await setDoc(doc(db, "settings", "popup"), {
      ...popup,
      updatedAt: Date.now(),
    });
    return true;
  } catch (err) {
    console.error("Firestore: Error saving popup:", err);
    return false;
  }
}

/**
 * Fetch all registered users from Firestore for the Admin panel
 */
export async function getUsersFromFirestore(): Promise<UserProfile[] | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const snap = await getDocs(collection(db, "users"));
    if (!snap.empty) {
      const users: UserProfile[] = [];
      snap.forEach((docSnap) => {
        users.push(docSnap.data() as UserProfile);
      });
      return users;
    }
  } catch (err) {
    console.warn("Firestore: Error loading users:", err);
  }
  return null;
}

/**
 * Subscribe to real-time users collection updates for Admin panel
 */
export function subscribeToUsers(onUpdate: (users: UserProfile[]) => void): Unsubscribe | null {
  if (!isFirebaseConfigured) return null;
  try {
    return onSnapshot(collection(db, "users"), (snap) => {
      if (!snap.empty) {
        const users: UserProfile[] = [];
        snap.forEach((docSnap) => {
          users.push(docSnap.data() as UserProfile);
        });
        onUpdate(users);
      }
    }, (err) => {
      console.warn("Users onSnapshot error:", err);
    });
  } catch (err) {
    console.warn("Could not attach users listener:", err);
    return null;
  }
}
