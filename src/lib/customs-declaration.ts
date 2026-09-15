import { DeclarationCartItem, OptimizedDeclarationResult, DeclarationItemOutput, PublicProduct } from "@/types";

/**
 * Limpa o texto da declaração aduaneira para o padrão exigido pelas redirecionadoras (CSSBuy, PandaBuy, etc.):
 * - Sem caractere '+'
 * - Sem parênteses '(' ou ')'
 * - Sem espaços duplos
 */
export function cleanDeclarationText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\+/g, " ")        // Substitui '+' por espaço
    .replace(/\(\s*/g, "")      // Remove parêntese aberto '('
    .replace(/\s*\)/g, "")      // Remove parêntese fechado ')'
    .replace(/  +/g, " ")       // Remove espaços duplos
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

export interface DetectedCategoryInfo {
  categoryPt: string;
  categoryEn: string;
  categoryZh: string;
  materialPt: string;
  materialEn: string;
  materialZh: string;
  defaultSizePt: string;
  defaultSizeEn: string;
  defaultSizeZh: string;
  isOneSize: boolean;
  kind:
    | "oculos"
    | "dryfit"
    | "calcados"
    | "slides"
    | "jaquetas_windbreaker"
    | "jaquetas_puffer"
    | "jaquetas"
    | "jeans"
    | "calcas"
    | "relogios"
    | "joias"
    | "bones"
    | "bolsas"
    | "meias_underwear"
    | "eletronicos"
    | "camisetas";
}

/**
 * 1. CLASSIFICAÇÃO INTELIGENTE DE PRODUTOS E MATERIAIS:
 * Analisa o título, categoria, descrição e tags para determinar com precisão:
 * - A categoria aduaneira neutra correta (ex: Óculos de Sol, Camiseta Dry-Fit, Jaqueta Corta-Vento, etc.)
 * - O material real específico (ex: Acetato/Policarbonato para óculos, Poliéster Tecnológico para Dry-Fit, Denim para jeans)
 * - Se possui tamanho vestuário (M/G) ou se é Tamanho Único (One Size / Ajustável)
 */
export function detectStandardCategory(text: string, product?: Partial<PublicProduct>): DetectedCategoryInfo {
  const fullText = `${text} ${product?.description || ""} ${product?.declarationCategoryPt || ""} ${(product?.tags || []).join(" ")}`.toLowerCase();

  // 1. ÓCULOS / SUNGLASSES / EYEWEAR (Nunca pode ser algodão!)
  if (fullText.match(/óculos|oculos|sunglasses|glasses|armação|armacao|lente\b|lentes|eyewear|spectacles|rayban|oakley|gentle monster|cartier|millionaire|óculos de sol|oculos de sol/)) {
    const isMetal = fullText.match(/metal|titânio|titanio|aço|aco|gold|prata|silver|wire/);
    return {
      categoryPt: "Óculos de Sol Proteção UV",
      categoryEn: "Fashion Sunglasses UV Protection",
      categoryZh: "时尚防紫外线太阳镜",
      materialPt: isMetal ? "Metal e Policarbonato Resistente" : "Acetato e Policarbonato com Filtro UV",
      materialEn: isMetal ? "Metal Alloy and Polycarbonate UV Lenses" : "Acetate and Polycarbonate UV Lenses",
      materialZh: isMetal ? "金属合金与聚碳酸酯防紫外线镜片" : "板材醋酸纤维与聚碳酸酯UV镜片",
      defaultSizePt: "Tamanho Único",
      defaultSizeEn: "One Size",
      defaultSizeZh: "均码",
      isOneSize: true,
      kind: "oculos",
    };
  }

  // 2. RELÓGIOS / WATCHES (Aço, quartzo, vidro mineral)
  if (fullText.match(/relógio|relogio|watch\b|wrist watch|quartz|cronógrafo|cronografo|rolex|casio|g-shock|omega|patek|audemars/)) {
    const isLeather = fullText.match(/couro|leather|pulseira de couro/);
    return {
      categoryPt: "Relógio de Pulso Quartz Casual",
      categoryEn: "Casual Quartz Wristwatch",
      categoryZh: "时尚休闲石英腕表",
      materialPt: isLeather ? "Aço Inoxidável e Pulseira de Couro PU" : "Aço Inoxidável e Vidro Mineral",
      materialEn: isLeather ? "Stainless Steel and PU Leather Strap" : "Stainless Steel and Mineral Crystal Glass",
      materialZh: isLeather ? "不锈钢与皮质表带" : "不锈钢与矿物强化玻璃",
      defaultSizePt: "Tamanho Único",
      defaultSizeEn: "One Size",
      defaultSizeZh: "均码",
      isOneSize: true,
      kind: "relogios",
    };
  }

  // 3. JOIAS / CORRENTES / ANÉIS / PULSEIRAS (Titânio, aço inox)
  if (fullText.match(/corrente|colar\b|necklace|ring\b|anel\b|pulseira|bracelet|pingente|pendant|brinco|earring|choker|chain\b|jewelry|joia|bijuteria/)) {
    return {
      categoryPt: "Acessório de Joalheria de Moda",
      categoryEn: "Fashion Jewelry Accessory",
      categoryZh: "时尚饰品配件",
      materialPt: "Liga Metálica de Titânio e Aço Inox",
      materialEn: "Titanium Alloy and Stainless Steel",
      materialZh: "高光泽钛钢合金",
      defaultSizePt: "Tamanho Único",
      defaultSizeEn: "One Size",
      defaultSizeZh: "均码",
      isOneSize: true,
      kind: "joias",
    };
  }

  // 4. BOLSAS / MOCHILAS / SHOULDER BAGS / CARTEIRAS (Nylon, cordura, couro PU)
  if (fullText.match(/shoulder|backpack|mochila|carteira|wallet|tote bag|crossbody|pouch|bolsa|duffle|clutch/)) {
    const isLeather = fullText.match(/couro|leather/);
    return {
      categoryPt: "Bolsa Tiracolo Casual",
      categoryEn: "Casual Crossbody Shoulder Bag",
      categoryZh: "便携式多功能单肩斜挎包",
      materialPt: isLeather ? "Couro Sintético PU de Alta Resistência" : "Nylon Poliéster Resistente à Água",
      materialEn: isLeather ? "Durable Synthetic PU Leather" : "Water Resistant Polyester Cordura Nylon",
      materialZh: isLeather ? "耐磨环保PU合成革" : "高密度耐磨防水尼龙聚酯纤维",
      defaultSizePt: "Tamanho Único",
      defaultSizeEn: "One Size",
      defaultSizeZh: "均码",
      isOneSize: true,
      kind: "bolsas",
    };
  }

  // 5. BONÉS / GORROS / CHAPÉUS (Algodão sarjado ajustável ou lã acrílica)
  if (fullText.match(/boné|bone\b|cap\b|baseball cap|gorro|beanie|bucket hat|bucket\b|chapéu|chapeu|fitted cap/)) {
    const isBeanie = fullText.match(/gorro|beanie|lã|trico|knit/);
    if (isBeanie) {
      return {
        categoryPt: "Gorro Tricotado de Inverno",
        categoryEn: "Knitted Winter Beanie Hat",
        categoryZh: "针织保暖毛线帽",
        materialPt: "Fio Acrílico e Lã Macia Térmica",
        materialEn: "Soft Knitted Thermal Acrylic Yarn",
        materialZh: "高弹保暖晴纶针织毛线",
        defaultSizePt: "Tamanho Único",
        defaultSizeEn: "One Size",
        defaultSizeZh: "均码",
        isOneSize: true,
        kind: "bones",
      };
    }
    return {
      categoryPt: "Boné Casual Ajustável",
      categoryEn: "Adjustable Casual Baseball Cap",
      categoryZh: "休闲时尚棒球遮阳帽",
      materialPt: "Algodão Sarjado com Fecho Ajustável",
      materialEn: "Breathable Cotton Twill with Adjustable Strap",
      materialZh: "高密透气纯棉斜纹布",
      defaultSizePt: "Ajustável",
      defaultSizeEn: "Adjustable",
      defaultSizeZh: "均码可调节",
      isOneSize: true,
      kind: "bones",
    };
  }

  // 6. CHINELOS / SLIDES / FOAM RUNNER (EVA injetado)
  if (fullText.match(/slide|chinelo|slipper|foam runner|yeezy slide|tamanco|sandália|sandalia/)) {
    return {
      categoryPt: "Chinelo Slide Casual Confort",
      categoryEn: "Casual Comfort Slide Sandals",
      categoryZh: "休闲舒适轻便拖鞋",
      materialPt: "Espuma EVA Injetada Macia",
      materialEn: "Soft Injected High Density EVA Foam",
      materialZh: "高弹轻便发泡EVA环保材质",
      defaultSizePt: "42 BR",
      defaultSizeEn: "Size 42",
      defaultSizeZh: "42码",
      isOneSize: false,
      kind: "slides",
    };
  }

  // 7. TÊNIS / SNEAKERS / CALÇADOS
  if (fullText.match(/shoe|sneaker|tênis|tenis|calçado|calcado|dunk|jordan|yeezy|bapesta|runner|boot|bota|air force|af1|sola/)) {
    const isLeather = fullText.match(/couro|leather|camurça|suede/);
    return {
      categoryPt: "Calçado Esportivo Casual",
      categoryEn: "Casual Sports Walking Shoes",
      categoryZh: "时尚运动休闲慢跑鞋",
      materialPt: isLeather ? "Couro Sintético e Sola de Borracha Antiderrapante" : "Tecido Sintético Respirável e Sola de Borracha",
      materialEn: isLeather ? "Synthetic Leather Upper with Rubber Sole" : "Breathable Synthetic Fabric with Rubber Sole",
      materialZh: isLeather ? "耐磨合成革鞋面与耐磨防滑橡胶底" : "透气织物鞋面与防滑减震橡胶底",
      defaultSizePt: "42 BR",
      defaultSizeEn: "Size 42",
      defaultSizeZh: "42码",
      isOneSize: false,
      kind: "calcados",
    };
  }

  // 8. ROUPAS DRY-FIT / TECIDO TÉCNICO ESPORTIVO (Poliéster / Poliamida / Elastano)
  if (fullText.match(/dry fit|dry-fit|dryfit|dri-fit|dri fit|dry\b|polyester|poliester|poliamida|esportiv|treino|gym|futebol|jersey|ciclismo|tecido técnico|tecido tecnico|tactel|running|aeroready|therma-fit|breathable|academia/)) {
    const isShorts = fullText.match(/short|bermuda|calção|calcao/);
    if (isShorts) {
      return {
        categoryPt: "Shorts Esportivo Dry-Fit Respirável",
        categoryEn: "Breathable Dry-Fit Sports Shorts",
        categoryZh: "速干透气高弹运动短裤",
        materialPt: "Poliéster Tecnológico e Elastano Respirável",
        materialEn: "Breathable Polyester and Spandex Synthetic Fabric",
        materialZh: "吸湿排汗速干聚酯纤维与氨纶",
        defaultSizePt: "M",
        defaultSizeEn: "Size M",
        defaultSizeZh: "M码",
        isOneSize: false,
        kind: "dryfit",
      };
    }
    return {
      categoryPt: "Camiseta Esportiva Respirável Dry-Fit",
      categoryEn: "Breathable Dry-Fit Sports T-Shirt",
      categoryZh: "透气速干运动短袖T恤",
      materialPt: "Poliéster Tecnológico e Elastano Respirável",
      materialEn: "Breathable Polyester and Spandex Synthetic Fabric",
      materialZh: "高弹速干透气聚酯纤维与氨纶",
      defaultSizePt: "M",
      defaultSizeEn: "Size M",
      defaultSizeZh: "M码",
      isOneSize: false,
      kind: "dryfit",
    };
  }

  // 9. CORTA-VENTO / WINDBREAKER / NYLON (Repelente à água)
  if (fullText.match(/windbreaker|corta vento|corta-vento|nylon|impermeável|impermeavel|waterproof|anorak|tactel jacket/)) {
    return {
      categoryPt: "Jaqueta Corta-Vento Leve",
      categoryEn: "Lightweight Windbreaker Outerwear Jacket",
      categoryZh: "轻便防风运动夹克",
      materialPt: "Nylon Poliamida Corta-Vento Repelente à Água",
      materialEn: "Water Repellent Windproof Polyamide Nylon",
      materialZh: "防风防泼水高密尼龙锦纶面料",
      defaultSizePt: "M",
      defaultSizeEn: "Size M",
      defaultSizeZh: "M码",
      isOneSize: false,
      kind: "jaquetas_windbreaker",
    };
  }

  // 10. PUFFER / DOWN / JAQUETA TÉRMICA ACOLCHOADA
  if (fullText.match(/puffer|down jacket|acolchoado|plumagem|moncler|nuptse|thermal jacket|casaco pesado/)) {
    return {
      categoryPt: "Jaqueta Térmica Acolchoada",
      categoryEn: "Thermal Quilted Puffer Jacket",
      categoryZh: "保暖防风羽绒棉服外套",
      materialPt: "Poliéster com Enchimento Térmico Sintético",
      materialEn: "Polyester with Thermal Synthetic Down Filling",
      materialZh: "高密防风聚酯纤维与保暖羽绒棉",
      defaultSizePt: "M",
      defaultSizeEn: "Size M",
      defaultSizeZh: "M码",
      isOneSize: false,
      kind: "jaquetas_puffer",
    };
  }

  // 11. JAQUETAS / CASACOS / MOLETONS / HOODIES
  if (fullText.match(/hoodie|moletom|crewneck|sweatshirt|pullover|jacket|jaqueta|coat|fleece|bomber|parka|cardigan|casaco/)) {
    return {
      categoryPt: "Agasalho Moletom Casual com Capuz",
      categoryEn: "Casual Fleece Pullover Hoodie",
      categoryZh: "男女通用加厚保暖连帽卫衣",
      materialPt: "Algodão e Poliéster Flanelado Macio",
      materialEn: "Soft Cotton Polyester Fleece Blend",
      materialZh: "加厚保暖抓绒纯棉混纺面料",
      defaultSizePt: "M",
      defaultSizeEn: "Size M",
      defaultSizeZh: "M码",
      isOneSize: false,
      kind: "jaquetas",
    };
  }

  // 12. JEANS / DENIM / SARJA
  if (fullText.match(/jeans|denim|calça jeans|calca jeans|sarja|twill/)) {
    return {
      categoryPt: "Calça Jeans Casual",
      categoryEn: "Casual Denim Jeans Trousers",
      categoryZh: "经典百搭牛仔长裤",
      materialPt: "Tecido Denim Algodão Resistente",
      materialEn: "Durable Cotton Denim Fabric",
      materialZh: "高耐磨高克重纯棉牛仔布",
      defaultSizePt: "42",
      defaultSizeEn: "Size 42",
      defaultSizeZh: "42码",
      isOneSize: false,
      kind: "jeans",
    };
  }

  // 13. CALÇAS CASUAIS / CARGO / SHORTS / BERMUDAS (Não Jeans)
  if (fullText.match(/pant|cargo|calça|calca|sweatpant|track pant|short\b|bermuda/)) {
    const isShort = fullText.match(/short|bermuda/);
    if (isShort) {
      return {
        categoryPt: "Bermuda Casual Confort",
        categoryEn: "Casual Comfort Shorts",
        categoryZh: "休闲舒适透气短裤",
        materialPt: "Algodão e Poliéster Respirável",
        materialEn: "Breathable Cotton Polyester Blend",
        materialZh: "舒适透气棉质混纺面料",
        defaultSizePt: "M",
        defaultSizeEn: "Size M",
        defaultSizeZh: "M码",
        isOneSize: false,
        kind: "calcas",
      };
    }
    return {
      categoryPt: "Calça Casual Confort",
      categoryEn: "Casual Comfort Trousers",
      categoryZh: "休闲百搭运动长裤",
      materialPt: "Algodão Sarjado e Poliéster Confort",
      materialEn: "Cotton Twill Polyester Blend",
      materialZh: "耐磨抗皱纯棉混纺斜纹布",
      defaultSizePt: "M",
      defaultSizeEn: "Size M",
      defaultSizeZh: "M码",
      isOneSize: false,
      kind: "calcas",
    };
  }

  // 14. MEIAS / CUECAS / UNDERWEAR
  if (fullText.match(/meia\b|meias|sock|socks|cueca|cuecas|underwear|boxer/)) {
    return {
      categoryPt: "Meias Casuais de Cano Médio",
      categoryEn: "Casual Cotton Crew Socks",
      categoryZh: "舒适高弹中筒纯棉袜",
      materialPt: "Algodão Penteado com Elastano Macio",
      materialEn: "Combed Cotton with Elastic Spandex",
      materialZh: "高弹透气精梳棉混纺",
      defaultSizePt: "Tamanho Único",
      defaultSizeEn: "One Size",
      defaultSizeZh: "均码",
      isOneSize: true,
      kind: "meias_underwear",
    };
  }

  // 15. ELETRÔNICOS / GADGETS / CÂMERAS
  if (fullText.match(/camera|câmera|eletrônico|eletronico|phone|headphone|earphone|fone|digital|gadget|charger|carregador|cabo/)) {
    return {
      categoryPt: "Dispositivo Eletrônico Portátil Utilitário",
      categoryEn: "Compact Portable Utility Electronic Gadget",
      categoryZh: "便携式小型电子设备配件",
      materialPt: "Plástico ABS e Componentes Eletrônicos Básicos",
      materialEn: "ABS Plastic and Basic Electronic Components",
      materialZh: "阻燃ABS工程塑料与电子元件",
      defaultSizePt: "Tamanho Único",
      defaultSizeEn: "One Size",
      defaultSizeZh: "均码",
      isOneSize: true,
      kind: "eletronicos",
    };
  }

  // 16. CAMISETAS STREETWEAR 100% ALGODÃO (Default para Vestuário)
  return {
    categoryPt: "Camiseta Casual Unissex Gola Redonda",
    categoryEn: "Unisex Casual Crewneck Short Sleeve T-Shirt",
    categoryZh: "男女通用圆领短袖纯棉休闲T恤",
    materialPt: "100% Algodão Malha Penteada Fio 30.1",
    materialEn: "100% High Quality Combed Cotton Knit",
    materialZh: "100% 精梳高密纯棉针织面料",
    defaultSizePt: "M",
    defaultSizeEn: "Size M",
    defaultSizeZh: "M码",
    isOneSize: false,
    kind: "camisetas",
  };
}

/**
 * 2. VALOR DECLARADO OTIMIZADO (ESTRATÉGIA FISCAL COM MARGENS VARIADAS):
 * - Camisetas / Dry-Fit: $2.00 a $3.50 USD
 * - Tênis / Calçados: $6.00 a $8.00 USD
 * - Jaquetas Puffer: $5.50 a $8.00 USD
 * - Jaquetas Corta-Vento / Moletons: $4.20 a $5.90 USD
 * - Calças / Jeans: $3.30 a $5.50 USD
 * - Óculos: $2.50 a $4.50 USD (ex: $2.80, $3.20, $3.60, $4.10)
 * - Relógios: $5.00 a $9.50 USD
 * - Joias / Colares: $1.20 a $2.50 USD
 * - Bonés / Meias / Acessórios: $1.10 a $2.20 USD
 * - Eletrônicos: $8.00 a $14.50 USD
 * Os preços variam entre os itens da mesma categoria para não repetir o mesmo valor!
 */
export function getOptimizedUnitPrice(kind: string, index: number): number {
  switch (kind) {
    case "oculos": {
      const options = [2.80, 3.20, 3.60, 4.10, 2.90, 3.50, 4.30];
      return options[index % options.length];
    }
    case "dryfit":
    case "camisetas": {
      const options = [2.10, 2.40, 2.70, 3.00, 3.30, 2.20, 2.60, 2.90, 3.20, 3.50];
      return options[index % options.length];
    }
    case "calcados": {
      const options = [6.20, 6.60, 7.10, 6.40, 7.50, 6.80, 7.80];
      return options[index % options.length];
    }
    case "slides": {
      const options = [3.20, 3.60, 4.10, 3.80, 4.50];
      return options[index % options.length];
    }
    case "jaquetas_puffer": {
      const options = [5.60, 6.20, 6.80, 7.40, 6.10, 7.80];
      return options[index % options.length];
    }
    case "jaquetas_windbreaker":
    case "jaquetas": {
      const options = [4.30, 4.80, 5.20, 5.60, 4.50, 5.80];
      return options[index % options.length];
    }
    case "jeans":
    case "calcas": {
      const options = [3.30, 3.80, 4.30, 4.70, 5.20, 3.60];
      return options[index % options.length];
    }
    case "relogios": {
      const options = [5.50, 6.80, 7.90, 8.60, 9.20];
      return options[index % options.length];
    }
    case "joias":
    case "bones":
    case "meias_underwear": {
      const options = [1.20, 1.40, 1.60, 1.80, 1.30, 1.90];
      return options[index % options.length];
    }
    case "bolsas": {
      const options = [2.80, 3.40, 3.90, 4.50, 3.10];
      return options[index % options.length];
    }
    case "eletronicos": {
      const options = [9.50, 11.30, 12.80, 10.40, 14.20];
      return options[index % options.length];
    }
    default: {
      const options = [2.30, 2.80, 3.10, 2.50];
      return options[index % options.length];
    }
  }
}

/**
 * 3. DESCRIÇÃO TÉCNICA INDIVIDUAL:
 * Neutra, sem marcas registradas, indicando produto, cor, tamanho, material real e uso pessoal.
 * Sem caractere '+' e sem parênteses '()'.
 */
function generateTechnicalDescriptions(
  item: DeclarationCartItem,
  categoryInfo: DetectedCategoryInfo
): { pt: string; en: string; zh: string } {
  const cleanColor = (item.color || "Preto").replace(/[\+\(\)]/g, " ").trim();
  
  // Se for acessório/óculos/relógio, tamanho deve ser Tamanho Único
  const effectiveSizePt = categoryInfo.isOneSize ? categoryInfo.defaultSizePt : (item.size || categoryInfo.defaultSizePt).replace(/[\+\(\)]/g, " ").trim();
  const effectiveSizeEn = categoryInfo.isOneSize ? categoryInfo.defaultSizeEn : (item.size || categoryInfo.defaultSizeEn).replace(/[\+\(\)]/g, " ").trim();
  const effectiveSizeZh = categoryInfo.isOneSize ? categoryInfo.defaultSizeZh : (item.size || categoryInfo.defaultSizeZh).replace(/[\+\(\)]/g, " ").trim();

  let ptDesc = `${categoryInfo.categoryPt} unissex em ${categoryInfo.materialPt} Cor ${cleanColor} Tamanho ${effectiveSizePt} para uso pessoal`;
  let enDesc = `Unisex ${categoryInfo.categoryEn} in ${categoryInfo.materialEn} Color ${cleanColor} Size ${effectiveSizeEn} for personal use`;
  let zhDesc = `${categoryInfo.categoryZh} ${categoryInfo.materialZh} 颜色 ${cleanColor} 尺码 ${effectiveSizeZh} 个人自用`;

  return {
    pt: cleanDeclarationText(ptDesc),
    en: cleanDeclarationText(enDesc),
    zh: cleanDeclarationText(zhDesc),
  };
}

/**
 * Função Principal de Otimização Aduaneira
 */
export function generateOptimizedCustomsDeclaration(
  cartItems: DeclarationCartItem[]
): OptimizedDeclarationResult {
  const outputItems: DeclarationItemOutput[] = [];
  const cssbuyLinesPt: string[] = [];
  const cssbuyLinesEn: string[] = [];
  const cssbuyLinesZh: string[] = [];

  let totalValueUsd = 0;
  let totalWeightGrams = 0;
  let totalPiecesCount = 0;

  cartItems.forEach((cartItem, idx) => {
    const product = cartItem.product;
    const qty = cartItem.quantity || 1;
    totalPiecesCount += qty;

    const weightPerUnit = cartItem.weightGrams || product.estimatedWeightGrams || 500;
    totalWeightGrams += weightPerUnit * qty;

    // 1. Classificação e detecção precisa do material real do produto
    const categoryInfo = detectStandardCategory(
      `${product.title} ${product.category} ${product.declarationCategoryPt || ""}`,
      product
    );

    // 2. Preço Otimizado (com variação para cada item, respeitando o teto da categoria)
    const unitPrice = getOptimizedUnitPrice(categoryInfo.kind, idx);
    const totalPrice = parseFloat((unitPrice * qty).toFixed(2));
    totalValueUsd += totalPrice;

    // 3. Descrição Técnica Neutra Completa
    const techDescs = generateTechnicalDescriptions(cartItem, categoryInfo);

    outputItems.push({
      id: product.id,
      technicalDescription: techDescs.pt,
      unitPrice,
      totalPrice,
      standardCategory: categoryInfo.categoryPt,
      ncmCode: "",
    });

    // 4. Formatação Padrão CSSBUY:
    // [Nome Comercial do Site] | [Quantidade][Categoria Aduaneira], [Cor] [Tamanho Adequado], [Material Real Específico], Uso Pessoal. $[Preço]
    const cleanOriginalTitle = cleanDeclarationText(product.title || categoryInfo.categoryPt);
    const qtyPrefix = qty === 1 ? "" : `${qty}u `;
    const cleanColor = (cartItem.color || "Preto").replace(/[\+\(\)]/g, " ").trim();
    
    // Tratamento de Tamanho: Óculos, relógios, bolsas e joias recebem "Tamanho Único" em vez de P/M/G
    const effectiveSizePt = categoryInfo.isOneSize ? categoryInfo.defaultSizePt : (cartItem.size || categoryInfo.defaultSizePt).replace(/[\+\(\)]/g, " ").trim();
    const effectiveSizeEn = categoryInfo.isOneSize ? categoryInfo.defaultSizeEn : (cartItem.size || categoryInfo.defaultSizeEn).replace(/[\+\(\)]/g, " ").trim();
    const effectiveSizeZh = categoryInfo.isOneSize ? categoryInfo.defaultSizeZh : (cartItem.size || categoryInfo.defaultSizeZh).replace(/[\+\(\)]/g, " ").trim();

    // Linha Português
    const linePt = `${cleanOriginalTitle} | ${qtyPrefix}${categoryInfo.categoryPt}, ${cleanColor} ${effectiveSizePt}, ${categoryInfo.materialPt}, Uso Pessoal. $${totalPrice.toFixed(2)}`;
    cssbuyLinesPt.push(cleanDeclarationText(linePt));

    // Linha Inglês (Padrão Oficial de Envio das Redirecionadoras)
    const lineEn = `${cleanOriginalTitle} | ${qtyPrefix}${categoryInfo.categoryEn}, ${cleanColor} ${effectiveSizeEn}, ${categoryInfo.materialEn}, Personal Use. $${totalPrice.toFixed(2)}`;
    cssbuyLinesEn.push(cleanDeclarationText(lineEn));

    // Linha Chinês
    const lineZh = `${cleanOriginalTitle} | ${qtyPrefix}${categoryInfo.categoryZh}, ${cleanColor} ${effectiveSizeZh}, ${categoryInfo.materialZh}, 个人自用. $${totalPrice.toFixed(2)}`;
    cssbuyLinesZh.push(cleanDeclarationText(lineZh));
  });

  const totalWeightKg = parseFloat((totalWeightGrams / 1000).toFixed(2));
  totalValueUsd = parseFloat(totalValueUsd.toFixed(2));

  // 5. Radar Aduaneiro de Risco de Taxação
  let alertLevel: "baixo" | "medio" | "alto" = "baixo";
  let alertExplanation = "";
  let taxPossibility = "Baixa (5% a 15%)";
  const recommendations: string[] = [];

  const hasHighRepetition = cartItems.some((item) => item.quantity >= 3);

  if (totalWeightKg > 5 || totalValueUsd > 50 || (totalPiecesCount >= 8 && hasHighRepetition)) {
    alertLevel = "alto";
    alertExplanation = `O pacote possui ${totalWeightKg}kg e ${totalPiecesCount} peças (ou valor declarado de $${totalValueUsd} USD). Volumes com mais de 5kg ou muitas peças repetidas chamam a atenção da Receita Federal por suspeita de revenda/comércio.`;
    taxPossibility = "Alta (60% a 85%)";
    recommendations.push("Divida o envio em 2 pacotes menores (ex: 2 volumes de até 3kg a 4kg cada).");
    recommendations.push("Evite enviar caixas de calçados originais volumosas (solicite 'drop shoe box' no agente).");
    recommendations.push("Solicite embalagem discreta (reforço plástico preto e fita anti-violação).");
  } else if (totalWeightKg >= 2 || totalValueUsd >= 40 || totalPiecesCount >= 4) {
    alertLevel = "medio";
    alertExplanation = `Pacote equilibrado de ${totalWeightKg}kg e ${totalPiecesCount} itens, totalizando $${totalValueUsd} USD. Dentro da faixa recomendada para uso pessoal, com risco moderado de conferência por amostragem.`;
    taxPossibility = "Moderada (20% a 35%)";
    recommendations.push("Mantenha a declaração detalhada e sem nomes de marcas famosas.");
    recommendations.push("Remova tags plásticas externas e cabides se houver opção no agente.");
  } else {
    alertLevel = "baixo";
    alertExplanation = `Pacote leve com ${totalWeightKg}kg, ${totalPiecesCount} peças e total de $${totalValueUsd} USD (abaixo de 2kg e < 4 unidades). Configuração ideal para remessas com baixo índice de fiscalização física.`;
    taxPossibility = "Baixa (< 10%)";
    recommendations.push("Configuração excelente. Pode prosseguir com o despacho normal pela linha preferencial.");
  }

  const legalObservations = [
    "Conforme as normativas aduaneiras brasileiras, remessas internacionais de pessoa física destinam-se exclusivamente a uso pessoal e sem fins comerciais.",
    "A declaração em língua estrangeira neutra (sem logotipos ou patentes industriais protegidas) protege a carga contra retenções de propriedade intelectual.",
    "Certifique-se de que o CPF informado no frete internacional coincide exatamente com o titular do cadastro nos Correios / Minhas Importações."
  ];

  return {
    items: outputItems,
    totals: {
      totalValueUsd,
      totalWeightKg,
      itemCount: totalPiecesCount,
    },
    riskAnalysis: {
      taxPossibility,
      explanation: alertExplanation,
      recommendations,
    },
    customsAlertLevel: alertLevel,
    customsAlertExplanation: alertExplanation,
    declarationText: cleanDeclarationText(cssbuyLinesPt.join("\n")),
    declarationTextEn: cleanDeclarationText(cssbuyLinesEn.join("\n")),
    declarationTextZh: cleanDeclarationText(cssbuyLinesZh.join("\n")),
    legalObservations,
  };
}
