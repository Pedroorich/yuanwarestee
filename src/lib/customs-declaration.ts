import { DeclarationCartItem, OptimizedDeclarationResult, DeclarationItemOutput } from "@/types";

/**
 * Limpa o texto da declaração aduaneira para o padrão exigido pelas redirecionadoras:
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

/**
 * 1. CLASSIFICAÇÃO:
 * Identifica a categoria padrão para cada item:
 * - camisetas, calçados, calça jeans, jaquetas, eletrônicos, câmeras, utilidades, etc.
 */
export function detectStandardCategory(text: string): {
  categoryPt: string;
  categoryEn: string;
  categoryZh: string;
  kind: "camisetas" | "calcados" | "jaquetas" | "calcas" | "acessorios" | "eletronicos" | "outros";
} {
  const lower = text.toLowerCase();

  // Tênis / Calçados / Sneakers
  if (lower.match(/shoe|sneaker|tênis|tenis|calçado|calcado|dunk|jordan|yeezy|bapesta|runner|boot|slide|foam|air force|af1/)) {
    return {
      categoryPt: "Calçado Esportivo",
      categoryEn: "Sports Casual Shoes",
      categoryZh: "运动休闲鞋",
      kind: "calcados",
    };
  }

  // Jaquetas / Casacos / Hoodies / Moletons
  if (lower.match(/hoodie|moletom|crewneck|sweatshirt|pullover|jacket|jaqueta|puffer|coat|fleece|windbreaker|bomber|parka/)) {
    return {
      categoryPt: "Casaco de Algodão",
      categoryEn: "Cotton Jacket Outerwear",
      categoryZh: "棉质夹克外套",
      kind: "jaquetas",
    };
  }

  // Calças / Bermudas / Jeans
  if (lower.match(/pant|cargo|calça|calca|jeans|sweatpant|track|denim|short\b|bermuda/)) {
    return {
      categoryPt: "Calça Casual",
      categoryEn: "Casual Pants Trousers",
      categoryZh: "休闲长裤",
      kind: "calcas",
    };
  }

  // Cintos / Acessórios / Bonés
  if (lower.match(/bag|cap|boné|bone|belt|cinto|wallet|watch|carteira|óculos|oculos|beanie|meia|sock|backpack|necklace|ring|acessório|acessorio/)) {
    return {
      categoryPt: "Acessório Casual",
      categoryEn: "Fashion Accessory",
      categoryZh: "时尚配饰",
      kind: "acessorios",
    };
  }

  // Eletrônicos / Câmeras
  if (lower.match(/camera|câmera|eletrônico|eletronico|phone|headphone|earphone|fone|digital|gadget/)) {
    return {
      categoryPt: "Dispositivo Eletrônico",
      categoryEn: "Electronic Device Gadget",
      categoryZh: "便携电子设备",
      kind: "eletronicos",
    };
  }

  // Camisetas / Tops / Básicas (Default)
  return {
    categoryPt: "Camiseta de Algodão",
    categoryEn: "Cotton Short Sleeve T-shirt",
    categoryZh: "棉质短袖T恤",
    kind: "camisetas",
  };
}

/**
 * 2. VALOR DECLARADO OTIMIZADO (ESTRATÉGIA FISCAL):
 * - Camisetas / Tops / Básicas: Proponha entre $2.00 e $2.50 USD (preferencialmente $2.00).
 * - Tênis / Calçados / Sneakers: Proponha entre $6.00 e $8.00 USD (ex: $6.00, $6.40, $6.80).
 * - Jaquetas / Casacos / Hoodies: Proponha entre $4.00 e $6.00 USD (ex: $5.00).
 * - Calças / Bermudas / Jeans: Proponha entre $3.00 e $6.00 USD (ex: $3.70, $4.00).
 * - Cintos / Acessórios / Bonés: Proponha entre $1.00 e $2.00 USD (ex: $1.10).
 * - Outros produtos (Eletrônicos, Câmeras, Utilidades): Proponha entre $5.00 e $15.00 USD.
 */
/**
 * 2. VALOR DECLARADO OTIMIZADO (ESTRATÉGIA FISCAL COM MARGENS VARIADAS):
 * - Camisetas / Tops: $2.00 a $3.50 USD (ex: $2.10, $2.40, $2.70, $3.00, $3.40).
 * - Tênis / Calçados / Sneakers: $6.00 a $8.00 USD (ex: $6.10, $6.50, $6.90, $7.30, $7.80).
 * - Jaquetas / Casacos / Hoodies: $4.00 a $6.00 USD (ex: $4.20, $4.60, $5.10, $5.60, $5.90).
 * - Calças / Bermudas / Jeans: $3.00 a $6.00 USD (ex: $3.20, $3.70, $4.20, $4.80, $5.40).
 * - Cintos / Acessórios / Bonés: $1.00 a $2.00 USD (ex: $1.10, $1.30, $1.50, $1.80).
 * - Outros produtos (Eletrônicos, Câmeras, Utilidades): $5.00 a $15.00 USD (ex: $10.50, $12.40, $14.20).
 * Os preços variam entre os itens da mesma categoria para não repetir o mesmo valor!
 */
export function getOptimizedUnitPrice(kind: string, index: number): number {
  switch (kind) {
    case "camisetas": {
      // Margem entre $2.00 e $3.50 USD com variação
      const options = [2.10, 2.40, 2.70, 3.00, 3.30, 2.20, 2.60, 2.90, 3.20, 3.50];
      return options[index % options.length];
    }
    case "calcados": {
      // Margem entre $6.00 e $8.00 USD
      const options = [6.20, 6.60, 7.10, 6.40, 7.50, 6.80, 7.80];
      return options[index % options.length];
    }
    case "jaquetas": {
      // Margem entre $4.00 e $6.00 USD
      const options = [4.30, 4.80, 5.20, 5.60, 4.50, 5.80];
      return options[index % options.length];
    }
    case "calcas": {
      // Margem entre $3.00 e $6.00 USD
      const options = [3.30, 3.80, 4.30, 4.70, 5.20, 3.60];
      return options[index % options.length];
    }
    case "acessorios": {
      // Margem entre $1.00 e $2.00 USD
      const options = [1.10, 1.30, 1.50, 1.70, 1.40, 1.80];
      return options[index % options.length];
    }
    case "eletronicos": {
      // Margem entre $5.00 e $15.00 USD
      const options = [10.50, 12.30, 13.80, 11.20, 14.50];
      return options[index % options.length];
    }
    default: {
      const options = [2.30, 2.80, 3.10, 2.50];
      return options[index % options.length];
    }
  }
}

/**
 * 5. DESCRIÇÃO TÉCNICA INDIVIDUAL:
 * Neutra, sem marcas, indicando tipo, cor, tamanho, material e uso pessoal.
 * Sem caractere '+' e sem parênteses '()'.
 */
function generateTechnicalDescriptions(
  item: DeclarationCartItem,
  categoryInfo: ReturnType<typeof detectStandardCategory>
): { pt: string; en: string; zh: string } {
  const color = (item.color || "Preto").replace(/[\+\(\)]/g, " ").trim();
  const size = (item.size || "M").replace(/[\+\(\)]/g, " ").trim();

  let ptDesc = "";
  let enDesc = "";
  let zhDesc = "";

  switch (categoryInfo.kind) {
    case "calcados":
      ptDesc = `Calçado esportivo casual unissex em tecido sintético e sola de borracha Cor ${color} Tamanho ${size} para uso pessoal`;
      enDesc = `Unisex casual sports shoes synthetic fabric and rubber sole Color ${color} Size ${size} for personal use`;
      zhDesc = `休闲运动鞋 橡胶底 颜色 ${color} 尺码 ${size} 个人自用`;
      break;
    case "jaquetas":
      ptDesc = `Casaco agasalho unissex em malha de algodão e poliéster Cor ${color} Tamanho ${size} para uso pessoal`;
      enDesc = `Unisex outerwear jacket in cotton polyester blend Color ${color} Size ${size} for personal use`;
      zhDesc = `男女通用休闲夹克 棉混纺 颜色 ${color} 尺码 ${size} 个人自用`;
      break;
    case "calcas":
      ptDesc = `Calça casual unissex em tecido algodão com bolsos Cor ${color} Tamanho ${size} para uso pessoal`;
      enDesc = `Unisex casual trousers cotton fabric with pockets Color ${color} Size ${size} for personal use`;
      zhDesc = `男女休闲长裤 棉质带口袋 颜色 ${color} 尺码 ${size} 个人自用`;
      break;
    case "acessorios":
      ptDesc = `Acessório de vestuário casual em tecido e metal Cor ${color} Tamanho ${size} para uso pessoal`;
      enDesc = `Casual clothing fashion accessory fabric and metal Color ${color} Size ${size} for personal use`;
      zhDesc = `日常服装服饰配件 颜色 ${color} 尺码 ${size} 个人自用`;
      break;
    case "eletronicos":
      ptDesc = `Dispositivo eletrônico portátil utilitário compacto Cor ${color} Tamanho ${size} para uso pessoal`;
      enDesc = `Compact portable utility electronic gadget device Color ${color} Size ${size} for personal use`;
      zhDesc = `便携式多功能电子设备 颜色 ${color} 尺码 ${size} 个人自用`;
      break;
    default:
      // Camisetas
      ptDesc = `Camiseta casual unissex gola redonda 100% algodão Cor ${color} Tamanho ${size} para uso pessoal`;
      enDesc = `Unisex casual round neck 100% cotton short sleeve t-shirt Color ${color} Size ${size} for personal use`;
      zhDesc = `男女通用圆领纯棉短袖T恤 颜色 ${color} 尺码 ${size} 个人自用`;
      break;
  }

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

    // 1. Classificação
    const categoryInfo = detectStandardCategory(`${product.title} ${product.category} ${product.declarationCategoryPt || ""}`);

    // 2. Preço Otimizado (com variação para cada item, respeitando o teto da categoria)
    const unitPrice = getOptimizedUnitPrice(categoryInfo.kind, idx);
    const totalPrice = parseFloat((unitPrice * qty).toFixed(2));
    totalValueUsd += totalPrice;

    // 5. Descrição Técnica
    const techDescs = generateTechnicalDescriptions(cartItem, categoryInfo);

    // Salvar item com EXATAMENTE o mesmo ID original da entrada (Regra de Exclusividade Absoluta)
    outputItems.push({
      id: product.id,
      technicalDescription: techDescs.pt,
      unitPrice,
      totalPrice,
      standardCategory: categoryInfo.categoryPt,
      ncmCode: "",
    });

    // 6. Formatação CSSBUY:
    // [Nome Comercial / Nome Original do Site] | [Quantidade][Produto], [Cor] [Tamanho], [Material], [Atributo]. $[Preço Otimizado]
    // Regra do Usuário: Nome da peça original do site SEMPRE na frente, antes da "|" e depois da barra a declaração do devido produto!
    const cleanOriginalTitle = cleanDeclarationText(product.title || categoryInfo.categoryPt);
    const qtyPrefix = qty === 1 ? "" : `${qty}u `;
    const cleanColor = (cartItem.color || "Preto").replace(/[\+\(\)]/g, " ").trim();
    const cleanSize = (cartItem.size || "M").replace(/[\+\(\)]/g, " ").trim();

    // Linha Português
    const linePt = `${cleanOriginalTitle} | ${qtyPrefix}${categoryInfo.categoryPt}, ${cleanColor} ${cleanSize}, Algodão e Sintético, Uso Pessoal. $${totalPrice.toFixed(2)}`;
    cssbuyLinesPt.push(cleanDeclarationText(linePt));

    // Linha Inglês (Para redirecionadora)
    const lineEn = `${cleanOriginalTitle} | ${qtyPrefix}${categoryInfo.categoryEn}, ${cleanColor} ${cleanSize}, Cotton Synthetic, Personal Use. $${totalPrice.toFixed(2)}`;
    cssbuyLinesEn.push(cleanDeclarationText(lineEn));

    // Linha Chinês
    const lineZh = `${cleanOriginalTitle} | ${qtyPrefix}${categoryInfo.categoryZh}, ${cleanColor} ${cleanSize}, 混纺棉质, 个人日常. $${totalPrice.toFixed(2)}`;
    cssbuyLinesZh.push(cleanDeclarationText(lineZh));
  });

  const totalWeightKg = parseFloat((totalWeightGrams / 1000).toFixed(2));
  totalValueUsd = parseFloat(totalValueUsd.toFixed(2));

  // 4. ALERTA DE FISCALIZAÇÃO (RADAR ADUANEIRO):
  // - 'baixo': Peso total < 2kg, quantidade de itens < 4 un, valor total < $50 USD.
  // - 'medio': Peso entre 2kg e 5kg, itens variados de grife (réplicas), ou valor próximo de $50 USD.
  // - 'alto': Peso > 5kg, indícios de destinação comercial (peças repetidas), ou valor excedendo $50 USD.
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
