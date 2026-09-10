import { Product, Banner, PopupConfig } from "@/types";
import { VIP_CHECKOUT_URL } from "./constants";

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "yw-prod-001",
    title: "Heavyweight Boxy Hoodie Vintage Wash",
    description: "Moletom pesado 480 GSM com caimento oversized drop shoulder e lavagem vintage mineral. Forro flanelado premium com costuras duplas reforçadas.",
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80"
    ],
    priceCny: 168,
    category: "Moletons",
    tags: ["Oversized", "480 GSM", "Streetwear", "Vintage"],
    targetUrl: "https://item.taobao.com/item.htm?id=sample_hoodie_001",
    active: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    estimatedWeightGrams: 750,
    declarationCategoryPt: "Moletom de Algodão",
    declarationCategoryEn: "Cotton Hoodie",
    estimatedUsd: 24,
  },
  {
    id: "yw-prod-002",
    title: "Cargo Tactical Multi-Pocket Pants 100% Ripstop",
    description: "Calça cargo tática com 8 bolsos funcionais, tiras com fivelas ajustáveis na panturrilha e tecido ripstop impermeável de alta densidade.",
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800&auto=format&fit=crop&q=80"
    ],
    priceCny: 145,
    category: "Calças",
    tags: ["Tactical", "Techwear", "Ripstop", "Cargo"],
    targetUrl: "https://weidian.com/item.html?itemID=sample_cargo_002",
    active: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    estimatedWeightGrams: 580,
    declarationCategoryPt: "Calça Tática",
    declarationCategoryEn: "Tactical Cargo Pants",
    estimatedUsd: 21,
  },
  {
    id: "yw-prod-003",
    title: "Retro Runner Silhouette Sneaker Cream/Grey",
    description: "Tênis estético retro anos 90 com cabedal em camurça genuína e mesh respirável. Solado emborrachado com amortecimento EVA de dupla densidade.",
    images: [
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80"
    ],
    priceCny: 280,
    category: "Tênis",
    tags: ["Sneakers", "Retro", "Suede", "Chunky"],
    targetUrl: "https://weidian.com/item.html?itemID=sample_sneaker_003",
    active: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    estimatedWeightGrams: 1100,
    declarationCategoryPt: "Calçado Esportivo",
    declarationCategoryEn: "Sports Running Shoes",
    estimatedUsd: 40,
  },
  {
    id: "yw-prod-004",
    title: "Minimalist Graphic Tee Raw Hem 260 GSM",
    description: "Camiseta gola grossa 2.5cm, malha premium 100% algodão penteado 260 GSM com estampa minimalista em silk relevo de alta durabilidade.",
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80"
    ],
    priceCny: 88,
    category: "Camisetas",
    tags: ["260 GSM", "Heavy Cotton", "Boxy Fit"],
    targetUrl: "https://item.taobao.com/item.htm?id=sample_tee_004",
    active: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    estimatedWeightGrams: 280,
    declarationCategoryPt: "Camiseta de Algodão",
    declarationCategoryEn: "Cotton T-Shirt",
    estimatedUsd: 12,
  },
  {
    id: "yw-prod-005",
    title: "Down Puffer Jacket Quilted Matte Black",
    description: "Jaqueta puffer térmico acolchoada com acabamento fosco repelente à água. Enchimento 90/10 duck down para proteção em baixas temperaturas.",
    images: [
      "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80"
    ],
    priceCny: 340,
    category: "Jaquetas",
    tags: ["Puffer", "Duck Down", "Winter", "Matte"],
    targetUrl: "https://weidian.com/item.html?itemID=sample_puffer_005",
    active: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    estimatedWeightGrams: 890,
    declarationCategoryPt: "Jaqueta Térmica",
    declarationCategoryEn: "Thermal Down Jacket",
    estimatedUsd: 48,
  },
  {
    id: "yw-prod-006",
    title: "Corduroy Overshirt Workwear Edition Sand",
    description: "Sobrecamisa em veludo cotelê pesado cor areia, botões de madeira e bolsos frontais duplos inspirados no clássico workwear japonês.",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80"
    ],
    priceCny: 155,
    category: "Camisetas",
    tags: ["Corduroy", "Workwear", "Overshirt"],
    targetUrl: "https://item.taobao.com/item.htm?id=sample_overshirt_006",
    active: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    estimatedWeightGrams: 460,
    declarationCategoryPt: "Camisa de Veludo",
    declarationCategoryEn: "Corduroy Shirt",
    estimatedUsd: 22,
  },
  {
    id: "yw-prod-007",
    title: "Crossbody Utility Shoulder Bag Cordura",
    description: "Bolsa transversal utilitária compacta em tecido Cordura 1000D resistente a rasgos. Zíperes selados YKK e divisórias internas organizadas.",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80"
    ],
    priceCny: 95,
    category: "Acessórios",
    tags: ["Cordura", "Bag", "Techwear", "YKK"],
    targetUrl: "https://weidian.com/item.html?itemID=sample_bag_007",
    active: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    estimatedWeightGrams: 220,
    declarationCategoryPt: "Bolsa de Ombro",
    declarationCategoryEn: "Shoulder Bag",
    estimatedUsd: 14,
  },
  {
    id: "yw-prod-008",
    title: "Distressed Denim Jeans Baggy Cut",
    description: "Jeans baggy em sarja 14oz com lavagem clara desbotada e puídos artesanais nos joelhos. Barra desfiada e caimento folgado clássico 2000s.",
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80"
    ],
    priceCny: 185,
    category: "Calças",
    tags: ["Baggy", "14oz Denim", "Distressed", "Vintage"],
    targetUrl: "https://item.taobao.com/item.htm?id=sample_denim_008",
    active: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    estimatedWeightGrams: 720,
    declarationCategoryPt: "Calça Jeans",
    declarationCategoryEn: "Denim Jeans",
    estimatedUsd: 26,
  }
];

export const INITIAL_BANNERS: Banner[] = [
  {
    id: "ban-01",
    title: "DROPS EXCLUSIVOS DIRETO DA CHINA",
    subtitle: "Curadoria de fornecedores 1:1, Weidian e Taobao com os melhores preços em Yuan (¥).",
    imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80",
    targetUrl: "#vitrine",
    active: true,
    order: 1,
  },
  {
    id: "ban-02",
    title: "DESBLOQUEIE ACESSO VIP ILIMITADO",
    subtitle: "Acesse centenas de links diretos sem limitação diária e economize em cada importação.",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80",
    targetUrl: VIP_CHECKOUT_URL,
    active: true,
    order: 2,
  }
];

export const DEFAULT_POPUP: PopupConfig = {
  title: "Acesso Exclusivo Fornecedores 🇨🇳",
  description: "Faça seu login Google para liberar sua visualização gratuita diária de links ou assine o VIP para acesso ilimitado a todos os produtos!",
  imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop&q=80",
  ctaText: "QUERO ACESSO VIP ILIMITADO",
  ctaUrl: VIP_CHECKOUT_URL,
  delaySeconds: 12,
  active: true,
};

export const CATEGORIES = [
  "Todos",
  "Camisetas",
  "Moletons",
  "Calças",
  "Tênis",
  "Jaquetas",
  "Acessórios"
];
