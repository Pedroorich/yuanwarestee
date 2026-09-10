import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs 
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
