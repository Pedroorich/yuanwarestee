export type UserRole = "free" | "vip" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: number;
  lastLinkAccessAt?: number | null;
  lastAccessedProductId?: string | null;
  dailyAccessCount?: number;
  
  // Declaration tracking & quota
  dailyDeclarationsCount?: number;
  lastDeclarationDate?: string; // YYYY-MM-DD
  totalDeclarationsCount?: number;
  maxDailyDeclarations?: number; // Default 10 for VIP
}

export interface Product {
  id: string;
  title: string;
  description?: string;
  images: string[];
  priceCny: number;
  category: string;
  tags?: string[];
  targetUrl: string; // Only returned to authorized users via secure endpoint
  active: boolean;
  createdAt: number;
  
  // Roadmap: Customs declaration & calculator fields
  estimatedWeightGrams?: number;
  declarationCategoryPt?: string; // e.g. "Camisa de algodão"
  declarationCategoryEn?: string; // e.g. "Cotton T-shirt"
  estimatedUsd?: number;
}

// Product as exposed in public catalog list (targetUrl excluded for security)
export type PublicProduct = Omit<Product, "targetUrl">;

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  targetUrl?: string;
  active: boolean;
  order: number;
}

export interface PopupConfig {
  id?: string;
  title: string;
  description: string;
  imageUrl?: string;
  ctaText: string;
  ctaUrl: string;
  delaySeconds: number;
  active: boolean;
}

export interface LinkAccessLog {
  id?: string;
  userId: string;
  userEmail: string;
  productId: string;
  productTitle: string;
  timestamp: number;
}

export interface DeclarationCartItem {
  product: PublicProduct;
  quantity: number;
  customValueUsd?: number;
  weightGrams?: number;
  notes?: string;
  color?: string;
  size?: string;
}

export interface DeclarationItemOutput {
  id: string;
  technicalDescription: string;
  unitPrice: number;
  totalPrice: number;
  standardCategory: string;
  ncmCode: string;
}

export interface DeclarationTotals {
  totalValueUsd: number;
  totalWeightKg: number;
  itemCount: number;
}

export interface DeclarationRiskAnalysis {
  taxPossibility: string;
  explanation: string;
  recommendations: string[];
}

export interface OptimizedDeclarationResult {
  items: DeclarationItemOutput[];
  totals: DeclarationTotals;
  riskAnalysis: DeclarationRiskAnalysis;
  customsAlertLevel: "baixo" | "medio" | "alto";
  customsAlertExplanation: string;
  declarationText: string;
  declarationTextEn: string;
  declarationTextZh: string;
  legalObservations: string[];
}
