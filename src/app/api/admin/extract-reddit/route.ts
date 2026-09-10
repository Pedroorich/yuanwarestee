import { NextRequest, NextResponse } from "next/server";

interface ExtractedProduct {
  title: string;
  priceCny: number;
  category: string;
  targetUrl: string;
  images: string[];
  description?: string;
  tags?: string[];
  estimatedWeightGrams?: number;
}

// Decode HTML entities
function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#38;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&#60;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#62;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

// Clean Reddit image URL
function cleanRedditImageUrl(rawUrl: string): string {
  return decodeHtmlEntities(rawUrl).replace(/&amp;/g, "&");
}

// Detect clothing category based on title or keywords
function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.match(/shoe|sneaker|tênis|tenis|dunk|jordan|yeezy|bapesta|runner|boot|slide|foam|air force|af1/)) return "Tênis";
  if (lower.match(/tee|t-shirt|short sleeve|camiseta|shirt|camisa|top|jersey/)) return "Camisetas";
  if (lower.match(/hoodie|moletom|crewneck|sweatshirt|pullover/)) return "Moletons";
  if (lower.match(/jacket|jaqueta|puffer|coat|fleece|windbreaker|bomber|parka/)) return "Jaquetas";
  if (lower.match(/pant|cargo|calça|calca|jeans|sweatpant|track|denim|short\b|bermuda/)) return "Calças";
  if (lower.match(/bag|cap|boné|bone|belt|cinto|wallet|watch|carteira|óculos|oculos|beanie|meia|sock|backpack|necklace|ring/)) return "Acessórios";
  return "Camisetas";
}

// Extract price in Yuan from text
function extractPriceCny(text: string): number {
  const matchYuan =
    text.match(/(?:¥|￥|元|cny|yuan|rmb)\s*(\d+(\.\d+)?)/i) ||
    text.match(/(\d+(\.\d+)?)\s*(?:¥|￥|元|cny|yuan|rmb)/i) ||
    text.match(/\bP(\d{2,4})\b/i) || // Yupoo format P280
    text.match(/[-–:]\s*(\d{2,4})\s*(?:[-–:]|$)/);
  if (matchYuan && matchYuan[1]) {
    return Math.round(parseFloat(matchYuan[1]));
  }
  return 150; // default estimated price in Yuan
}

// Unwrap agent URLs (Pandabuy, Sugargoo, Cssbuy, Mulebuy, CNfans, Superbuy, AllChinaBuy, etc.)
function unwrapAgentUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    
    // Check for direct embedded product URL param
    const directUrl = parsed.searchParams.get("url") || parsed.searchParams.get("itemUrl");
    if (directUrl && (directUrl.includes("weidian.com") || directUrl.includes("taobao.com") || directUrl.includes("1688.com") || directUrl.includes("yupoo.com"))) {
      return directUrl;
    }

    // Check shop_type + id (common in cnfans, mulebuy, allchinabuy)
    const shopType = (parsed.searchParams.get("shop_type") || "").toLowerCase();
    const id = parsed.searchParams.get("id") || parsed.searchParams.get("item_id");
    if (id) {
      if (shopType.includes("weidian") || shopType === "wd") {
        return `https://weidian.com/item.html?itemID=${id}`;
      }
      if (shopType.includes("taobao") || shopType === "tb") {
        return `https://item.taobao.com/item.htm?id=${id}`;
      }
      if (shopType.includes("1688") || shopType === "ali_1688") {
        return `https://detail.1688.com/offer/${id}.html`;
      }
    }
  } catch (e) {
    // ignore
  }
  return rawUrl;
}

// Scrape actual destination product webpage directly
async function scrapeProductPage(targetUrl: string): Promise<{
  title?: string;
  priceCny?: number;
  images: string[];
  resolvedUrl: string;
}> {
  const cleanUrl = unwrapAgentUrl(targetUrl);
  const resultImages: string[] = [];
  let foundTitle = "";
  let foundPrice = 0;

  try {
    const res = await fetch(cleanUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(7000), // 7s timeout
    });

    const html = await res.text();

    // 1. Check Weidian Rocker Render Injection data-obj
    const weidianMatch =
      html.match(/id=["']__rocker-render-inject__["'][^>]+data-obj=["']([\s\S]*?)["']\s+src=/i) ||
      html.match(/data-obj=["']([\s\S]*?)["']/i);

    if (weidianMatch && weidianMatch[1]) {
      try {
        const decoded = decodeHtmlEntities(weidianMatch[1]);
        const data = JSON.parse(decoded);
        const itemInfo = data.result?.default_model?.item_info || data.result;

        if (itemInfo) {
          foundTitle =
            itemInfo.item_name ||
            itemInfo.itemShareDesc ||
            itemInfo.itemName ||
            itemInfo.title ||
            "";

          // Price can be itemLowPrice in cents (e.g. 17200 -> 172), origin_price, or price
          if (itemInfo.itemLowPrice && typeof itemInfo.itemLowPrice === "number") {
            foundPrice = itemInfo.itemLowPrice / 100;
          } else if (itemInfo.origin_price) {
            foundPrice = parseFloat(itemInfo.origin_price) || 0;
          } else if (itemInfo.price) {
            foundPrice = parseFloat(itemInfo.price) || 0;
          }

          // Images: item_head, imgs array, topImages, mainImages
          if (itemInfo.item_head && typeof itemInfo.item_head === "string") {
            resultImages.push(itemInfo.item_head);
          }
          if (Array.isArray(itemInfo.imgs)) {
            itemInfo.imgs.forEach((img: string) => {
              if (typeof img === "string" && img.startsWith("http") && !resultImages.includes(img)) {
                resultImages.push(img);
              }
            });
          }
          if (Array.isArray(itemInfo.topImages)) {
            itemInfo.topImages.forEach((img: string) => {
              if (typeof img === "string" && img.startsWith("http") && !resultImages.includes(img)) {
                resultImages.push(img);
              }
            });
          }
          if (Array.isArray(itemInfo.mainImages)) {
            itemInfo.mainImages.forEach((img: string) => {
              if (typeof img === "string" && img.startsWith("http") && !resultImages.includes(img)) {
                resultImages.push(img);
              }
            });
          }
        }
      } catch (e: any) {
        console.error("Error parsing Weidian JSON:", e.message);
      }
    }

    // 2. Check Yupoo album
    if (cleanUrl.includes("yupoo.com")) {
      const yupooTitle =
        html.match(/<h2[^>]*class=["'][^"']*showalbumheader__gallerytitle[^"']*["'][^>]*>([\s\S]*?)<\/h2>/i)?.[1] ||
        html.match(/<span[^>]*class=["'][^"']*showalbumheader__gallerytitle[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1];
      if (yupooTitle) {
        foundTitle = yupooTitle.replace(/<[^>]+>/g, "").trim();
      }

      const imgRegex = /(?:data-origin-src|data-src|src)=["']([^"']+\.yupoo\.com\/[^\s"']+)["']/gi;
      let m;
      while ((m = imgRegex.exec(html)) !== null) {
        let imgUrl = m[1];
        if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;
        if (!resultImages.includes(imgUrl) && !imgUrl.includes("small") && !imgUrl.includes("icon")) {
          resultImages.push(imgUrl);
        }
      }
    }

    // 3. Check OpenGraph meta tags
    if (!foundTitle) {
      const ogTitle =
        html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1] ||
        html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i)?.[1] ||
        html.match(/<title>([^<]+)<\/title>/i)?.[1] || "";
      if (ogTitle && !ogTitle.includes("商品详情") && !ogTitle.includes("Taobao") && !ogTitle.includes("Weidian")) {
        foundTitle = decodeHtmlEntities(ogTitle).replace(/[-|–].*$/, "").trim();
      }
    }

    if (resultImages.length === 0) {
      const ogImg =
        html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1] ||
        html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i)?.[1];
      if (ogImg) {
        const clean = ogImg.startsWith("//") ? "https:" + ogImg : ogImg;
        resultImages.push(clean);
      }
    }

    // 4. Price extraction from page
    if (!foundPrice) {
      const priceMatch =
        html.match(/"price"\s*:\s*"?(\d+(\.\d+)?)"?/i) ||
        html.match(/(?:¥|￥|元|cny)\s*(\d+(\.\d+)?)/i) ||
        html.match(/(\d+(\.\d+)?)\s*(?:¥|￥|元|cny)/i);
      if (priceMatch && priceMatch[1]) {
        foundPrice = parseFloat(priceMatch[1]);
      }
    }
  } catch (err: any) {
    // If fetching Chinese store directly timed out or errored, continue with fallback
    console.warn(`Scrape warning for ${cleanUrl}:`, err.message);
  }

  return {
    title: foundTitle || undefined,
    priceCny: foundPrice || undefined,
    images: resultImages,
    resolvedUrl: cleanUrl,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, rawText } = body;

    let productsToReturn: ExtractedProduct[] = [];

    // CASE 1: REDDIT POST URL
    if (url && url.includes("reddit.com")) {
      let jsonUrl = url.split("?")[0];
      if (!jsonUrl.endsWith(".json")) {
        jsonUrl = jsonUrl.replace(/\/$/, "") + ".json";
      }

      const res = await fetch(jsonUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Yuanware/2.0",
        },
      });

      if (!res.ok) {
        return NextResponse.json(
          {
            error: `O Reddit bloqueou a requisição direta (Código 403 Anti-bot). Clique na aba ao lado "Colar Links Diretos" ou "Texto Completo Copiado" para colar os links do post. O robô entrará automaticamente em cada loja chinesa para puxar o nome, preço e foto real.`
          },
          { status: 400 }
        );
      }

      const redditData = await res.json();
      const postData = redditData[0]?.data?.children[0]?.data;

      if (!postData) {
        return NextResponse.json({ error: "Estrutura do post não identificada." }, { status: 400 });
      }

      const postTitle = postData.title || "Reddit Haul";
      const selftext = postData.selftext || "";

      // Map media_id -> full-res image URL
      const redditGalleryImages: Record<string, string> = {};
      if (postData.media_metadata) {
        for (const key of Object.keys(postData.media_metadata)) {
          const item = postData.media_metadata[key];
          if (item?.s?.u) {
            redditGalleryImages[key] = cleanRedditImageUrl(item.s.u);
          } else if (item?.s?.gif) {
            redditGalleryImages[key] = cleanRedditImageUrl(item.s.gif);
          }
        }
      }

      // 1. Process gallery_data items (the most common format in FashionReps hauls)
      if (postData.gallery_data?.items && Array.isArray(postData.gallery_data.items)) {
        for (let i = 0; i < postData.gallery_data.items.length; i++) {
          const item = postData.gallery_data.items[i];
          const mediaId = item.media_id;
          const caption = item.caption || "";
          const outboundUrl = item.outbound_url || "";

          // The real photo from the Reddit slide
          const slideImage = redditGalleryImages[mediaId] || Object.values(redditGalleryImages)[i];

          // Extract link from outbound_url or from caption
          const linkInCaption = caption.match(/(https?:\/\/[^\s]+)/)?.[0];
          const rawProductUrl = outboundUrl || linkInCaption;

          if (rawProductUrl) {
            // Entrar no link para entender o produto
            const scraped = await scrapeProductPage(rawProductUrl);

            // Determine best title
            let title = caption
              .replace(/(https?:\/\/[^\s]+)/g, "")
              .replace(/[\[\]\(\)\*\#\-\:\>]/g, " ")
              .trim();

            if (!title || title.length < 3) {
              title = scraped.title || `${postTitle} - Item ${i + 1}`;
            }

            // Determine best price in Yuan
            const price = scraped.priceCny || extractPriceCny(caption) || extractPriceCny(postTitle) || 160;

            // Determine image: slide image from Reddit post is the real photo of that haul item!
            // Or scraped images from store page
            const images = slideImage ? [slideImage, ...scraped.images.filter(img => img !== slideImage)] : (scraped.images.length ? scraped.images : ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"]);

            const category = detectCategory(title);

            productsToReturn.push({
              title,
              priceCny: price,
              category,
              targetUrl: scraped.resolvedUrl || rawProductUrl,
              images,
              description: `Importado de post Reddit (${postTitle}). ${caption}`,
              tags: [category, "Streetwear", "Curadoria Reddit"],
              estimatedWeightGrams: category === "Tênis" ? 1100 : category === "Moletons" ? 750 : 350,
            });
          }
        }
      }

      // 2. If no gallery items, parse selftext for product links
      if (productsToReturn.length === 0 && selftext) {
        const urlRegex = /(https?:\/\/[^\s\)\],]+)/g;
        const matches = selftext.match(urlRegex) || [];
        const uniqueProductUrls: string[] = Array.from(
          new Set(
            matches.filter((u: string) =>
              u.match(/(taobao|weidian|1688|yupoo|pandabuy|cssbuy|basetao|sugargoo|mulebuy|superbuy|allchinabuy|cnfans)/i)
            )
          )
        );

        const allImagesList = Object.values(redditGalleryImages);

        for (let i = 0; i < uniqueProductUrls.length; i++) {
          const rawUrl: string = uniqueProductUrls[i];
          const scraped = await scrapeProductPage(rawUrl);

          // Try to find context line in selftext
          const contextLine = selftext.split("\n").find((line: string) => line.includes(rawUrl)) || "";
          let title = contextLine
            .replace(urlRegex, "")
            .replace(/[\[\]\(\)\*\#\-\:\>]/g, " ")
            .replace(/\b(w2c|link|wcop|cop|buy|here|fornecedor|wtc)\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();

          if (!title || title.length < 3) {
            title = scraped.title || `${postTitle} - Item ${i + 1}`;
          }

          const price = scraped.priceCny || extractPriceCny(contextLine) || 160;
          const slideImg = allImagesList[i] || allImagesList[0];
          const images = slideImg ? [slideImg, ...scraped.images] : (scraped.images.length ? scraped.images : ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"]);
          const category = detectCategory(title);

          productsToReturn.push({
            title,
            priceCny: price,
            category,
            targetUrl: scraped.resolvedUrl || rawUrl,
            images,
            description: contextLine || postTitle,
            tags: [category, "Streetwear", "Reddit Import"],
            estimatedWeightGrams: category === "Tênis" ? 1100 : category === "Moletons" ? 750 : 350,
          });
        }
      }
    } 
    // CASE 2: DIRECT LINKS OR RAW TEXT PASTED
    else if (rawText || (url && !url.includes("reddit.com"))) {
      const inputText = rawText || url;
      const urlRegex = /(https?:\/\/[^\s\)\],]+)/g;
      const foundUrls = inputText.match(urlRegex) || [];

      // Deduplicate
      const uniqueUrls: string[] = Array.from(new Set(foundUrls));

      for (let i = 0; i < uniqueUrls.length; i++) {
        const targetUrl: string = uniqueUrls[i];
        const scraped = await scrapeProductPage(targetUrl);

        // Priority 1: Official name extracted directly from the supplier page (Weidian, Taobao, Yupoo)
        // If the store returned a clean product title, ALWAYS use it!
        let title = "";
        if (scraped.title && scraped.title.length >= 3 && !scraped.title.includes("商品详情")) {
          title = scraped.title;
        } else {
          // Check if there is a short, clean line with title description
          const line = inputText.split("\n").find((l: string) => l.includes(targetUrl)) || "";
          let cleanedLine = line
            .replace(urlRegex, "")
            .replace(/[\[\]\(\)\*\#\-\:\>\|]/g, " ")
            .replace(/\b(https?|w2c|wcop|cop|buy|here|link|fornecedor|wtc|review|size|batch|agent)\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();

          // Avoid taking huge paragraphs as titles
          if (cleanedLine.length > 80) {
            cleanedLine = cleanedLine.slice(0, 80).replace(/\s+\S*$/, "");
          }

          if (cleanedLine && cleanedLine.length >= 3) {
            title = cleanedLine;
          } else {
            title = scraped.title || `Produto Importado #${i + 1}`;
          }
        }

        const price = scraped.priceCny || 150;
        const category = detectCategory(title);

        productsToReturn.push({
          title,
          priceCny: price,
          category,
          targetUrl: scraped.resolvedUrl || targetUrl,
          images: scraped.images.length ? scraped.images : ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"],
          description: `Fornecedor Oficial Yuanware. ${title}`,
          tags: [category, "Streetwear", "Importação Direta"],
          estimatedWeightGrams: category === "Tênis" ? 1100 : category === "Moletons" ? 750 : 350,
        });
      }
    } else {
      return NextResponse.json(
        { error: "Forneça o link de um post do Reddit ou uma lista de links de produtos." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      count: productsToReturn.length,
      products: productsToReturn,
    });
  } catch (err: any) {
    console.error("Scraper handler error:", err);
    return NextResponse.json(
      { error: `Erro na extração dos links: ${err.message}` },
      { status: 500 }
    );
  }
}
