import { NextRequest, NextResponse } from "next/server";
import { INITIAL_PRODUCTS } from "@/lib/mock-data";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// In-memory fallback tracking for link clicks when Firestore server SDK is not directly connected
const localAccessLog = new Map<string, { timestamp: number; productId?: string }>();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: productId } = params;
    const body = await req.json().catch(() => ({}));
    const { 
      userId, 
      userEmail, 
      userRole, 
      lastLinkAccessAt, 
      lastAccessedProductId,
      targetUrl: bodyTargetUrl,
      productTitle: bodyProductTitle,
      reset
    } = body;

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "Autenticação com Google obrigatória para acessar o link do fornecedor." },
        { status: 401 }
      );
    }

    // Handle administrative quota reset
    if (reset) {
      localAccessLog.delete(userId);
    }

    // 1. Resolve product & targetUrl (search INITIAL_PRODUCTS or fallback to client-supplied dynamic product data)
    let foundProduct = INITIAL_PRODUCTS.find((p) => p.id === productId);
    const resolvedTargetUrl = foundProduct?.targetUrl || bodyTargetUrl;
    const resolvedTitle = foundProduct?.title || bodyProductTitle || "Produto Fornecedor";

    if (!resolvedTargetUrl) {
      return NextResponse.json(
        { error: "Link do fornecedor indisponível para este produto." },
        { status: 404 }
      );
    }

    const isVipOrAdmin = userRole === "vip" || userRole === "admin";

    // 2. VIP or Admin: unlimited instant access
    if (isVipOrAdmin) {
      return NextResponse.json({
        authorized: true,
        targetUrl: resolvedTargetUrl,
        productTitle: resolvedTitle,
        status: "VIP_UNLIMITED",
      });
    }

    // 3. For FREE users:
    const inMemoryEntry = localAccessLog.get(userId);
    const clientTimestamp = typeof lastLinkAccessAt === "number" && lastLinkAccessAt > 0 ? lastLinkAccessAt : 0;
    const memoryTimestamp = inMemoryEntry?.timestamp || 0;
    const effectiveLastAccessTime = Math.max(clientTimestamp, memoryTimestamp);

    const effectiveLastProductId = clientTimestamp >= memoryTimestamp 
      ? (lastAccessedProductId || inMemoryEntry?.productId) 
      : (inMemoryEntry?.productId || lastAccessedProductId);

    const now = Date.now();
    const elapsed = now - effectiveLastAccessTime;

    // Check if the user already unlocked THIS specific product today:
    // If it's the SAME product unlocked within 24h, allow re-accessing it!
    if (effectiveLastAccessTime > 0 && elapsed < TWENTY_FOUR_HOURS_MS && effectiveLastProductId === productId) {
      return NextResponse.json({
        authorized: true,
        targetUrl: resolvedTargetUrl,
        productTitle: resolvedTitle,
        accessedAt: effectiveLastAccessTime,
        status: "FREE_ALREADY_UNLOCKED",
        message: "Link previamente liberado nas últimas 24h!",
      });
    }

    // If quota was already used on a DIFFERENT product within 24h:
    if (effectiveLastAccessTime > 0 && elapsed < TWENTY_FOUR_HOURS_MS) {
      const remainingMs = TWENTY_FOUR_HOURS_MS - elapsed;
      const hoursRemaining = Math.ceil(remainingMs / (1000 * 60 * 60));

      return NextResponse.json(
        {
          authorized: false,
          locked: true,
          reason: "DAILY_LIMIT_EXCEEDED",
          message: "Você já utilizou sua cota de 1 link gratuito nas últimas 24h.",
          hoursRemaining,
          nextAvailableAt: new Date(effectiveLastAccessTime + TWENTY_FOUR_HOURS_MS).toISOString(),
        },
        { status: 403 }
      );
    }

    // 4. Grant access for the 1 FREE link of the day!
    localAccessLog.set(userId, { timestamp: now, productId });

    return NextResponse.json({
      authorized: true,
      targetUrl: resolvedTargetUrl,
      productTitle: resolvedTitle,
      accessedAt: now,
      status: "FREE_QUOTA_USED",
      message: "Link liberado! Sua cota gratuita de 1 link foi utilizada com sucesso.",
    });
  } catch (error: any) {
    console.error("Link access error:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor de links." },
      { status: 500 }
    );
  }
}
