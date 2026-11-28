export interface CustomerProductCard {
  id?: string;
  productName: string;
  farmName?: string;
  price?: number;
  unit?: string;
  location?: string;
  priceDisplay: string;
  stockDisplay: string;
  isOutOfStock: boolean;
  productPhoto?: string;
}

export interface CustomerParsedAnswer {
  introText?: string;
  productCards: CustomerProductCard[];
  numberedSteps: string[];
  trailingText?: string;
  plainText?: string;
  isProductCatalog: boolean;
  isNumberedSteps: boolean;
}

/**
 * Format price cleanly, e.g. 50.00 -> 50, 45.50 -> 45.50
 */
const formatPrice = (priceStr: string, unitStr: string): string => {
  const num = parseFloat(priceStr.replace(/,/g, ''));
  const unit = unitStr ? unitStr.toUpperCase().trim() : 'KG';
  if (isNaN(num)) {
    return `Rs. ${priceStr} / ${unit}`;
  }
  const formattedNum = Number.isInteger(num) ? num.toString() : num.toFixed(2);
  return `Rs. ${formattedNum} / ${unit}`;
};

/**
 * Format stock quantity cleanly
 */
const formatStock = (stockStr: string, unitStr: string, isOos: boolean): string => {
  if (isOos) {
    return 'Out of stock';
  }
  const num = parseFloat(stockStr.replace(/,/g, ''));
  const unit = unitStr ? unitStr.toUpperCase().trim() : 'KG';
  if (isNaN(num) || num <= 0) {
    return 'Out of stock';
  }
  const formattedNum = Number.isInteger(num) ? num.toString() : num.toFixed(1);
  return `${formattedNum} ${unit} in stock`;
};

/**
 * Parses raw bullet line into a CustomerProductCard.
 * Example line:
 * "• Tomato (mr wang farm, Sinner): Rs. 50.00 per KG (Available Stock: 10.0 KG)"
 * "• Potato: Rs. 30.00 per KG (Available Stock: 25.0 KG)"
 */
export const parseProductLine = (line: string): CustomerProductCard | null => {
  const trimmed = line.replace(/^[•*\-\s]+/, '').trim();
  if (!trimmed) return null;

  // Pattern matching: Name [ (Farm name) ] : Rs. <price> per <unit> (Available Stock: <stock> <unit>)
  // Regex is robust and forgiving
  const regex = /^([^(:]+?)(?:\s*\(([^)]+)\))?\s*:\s*Rs\.?\s*([\d,.]+)\s*(?:per|\/)\s*([a-zA-Z]+)(?:\s*\(Available Stock:\s*([\d,.]+)\s*([a-zA-Z]*)\))?/i;
  const match = trimmed.match(regex);

  if (match) {
    const rawName = match[1].trim();
    const farmName = match[2]?.trim();
    const price = match[3].trim();
    const unit = match[4].trim();
    const stock = match[5]?.trim();
    const stockUnit = match[6]?.trim() || unit;

    const parsedPrice = parseFloat(price.replace(/,/g, ''));
    const normalizedUnit = unit ? unit.toUpperCase().trim() : 'KG';
    const parsedStockNum = stock ? parseFloat(stock) : null;
    const isOutOfStock = parsedStockNum !== null && parsedStockNum <= 0;

    return {
      productName: rawName,
      farmName: farmName || undefined,
      price: isNaN(parsedPrice) ? undefined : parsedPrice,
      unit: normalizedUnit,
      priceDisplay: formatPrice(price, unit),
      stockDisplay: formatStock(stock || '0', stockUnit, isOutOfStock),
      isOutOfStock,
    };
  }

  return null;
};

/**
 * Parses AI answers for the Customer chat interface.
 */
export const parseCustomerAiAnswer = (
  rawAnswer?: string | null,
  structuredProducts?: any[] | null
): CustomerParsedAnswer => {
  if (!rawAnswer && (!structuredProducts || structuredProducts.length === 0)) {
    return {
      productCards: [],
      numberedSteps: [],
      isProductCatalog: false,
      isNumberedSteps: false,
      plainText: '',
    };
  }

  // 1. If structured products list is passed directly from backend
  if (structuredProducts && Array.isArray(structuredProducts) && structuredProducts.length > 0) {
    const cards: CustomerProductCard[] = structuredProducts.map((p) => {
      const price = p.price != null ? Number(p.price) : 0;
      const unit = p.unit || 'KG';
      const hasQty = p.quantity !== undefined && p.quantity !== null;
      const qty = hasQty ? Number(p.quantity) : null;
      const rawStockStatus = typeof p.stockStatus === 'string' ? p.stockStatus.trim() : '';
      const isOos = hasQty
        ? (qty !== null && qty <= 0)
        : rawStockStatus.toLowerCase().includes('out of stock');
      const stockDisplay = hasQty
        ? (isOos ? 'Out of stock' : `${Number.isInteger(qty) ? qty : qty!.toFixed(1)} ${unit} in stock`)
        : (rawStockStatus || 'In stock');

      return {
        id: p.productId || p.id,
        productName: p.productName || p.name || 'Product',
        farmName: p.farmName || p.farmer?.farmName || undefined,
        price: !isNaN(price) ? price : undefined,
        unit,
        location: p.location || undefined,
        priceDisplay: `Rs. ${Number.isInteger(price) ? price : price.toFixed(2)} / ${unit}`,
        stockDisplay,
        isOutOfStock: isOos,
        productPhoto: p.productPhoto || p.imageUrl || undefined,
      };
    });

    return {
      introText: rawAnswer ? rawAnswer.trim() : undefined,
      productCards: cards,
      numberedSteps: [],
      isProductCatalog: true,
      isNumberedSteps: false,
    };
  }

  const text = (rawAnswer || '').trim();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  // Check for bullet product catalog lines
  const productCards: CustomerProductCard[] = [];
  const introLines: string[] = [];
  const trailingLines: string[] = [];
  let foundFirstProduct = false;

  for (const line of lines) {
    const isBullet = line.startsWith('•') || line.startsWith('*') || line.startsWith('-');
    if (isBullet) {
      const card = parseProductLine(line);
      if (card) {
        foundFirstProduct = true;
        productCards.push(card);
        continue;
      }
    }

    if (!foundFirstProduct) {
      introLines.push(line);
    } else {
      trailingLines.push(line);
    }
  }

  if (productCards.length > 0) {
    return {
      introText: introLines.join('\n').trim() || undefined,
      productCards,
      numberedSteps: [],
      trailingText: trailingLines.join('\n').trim() || undefined,
      isProductCatalog: true,
      isNumberedSteps: false,
    };
  }

  // Check for numbered how-to steps (e.g. "1. ..." or "• step" from FAQ)
  const isNumbered = lines.some((l) => /^\d+\.\s+/.test(l));
  const isFaqBullets = lines.length >= 2 && lines.every((l) => l.startsWith('•') || l.startsWith('-'));

  if (isNumbered) {
    const steps: string[] = [];
    const nonSteps: string[] = [];

    for (const line of lines) {
      if (/^\d+\.\s+/.test(line)) {
        steps.push(line.replace(/^\d+\.\s+/, '').trim());
      } else {
        nonSteps.push(line);
      }
    }

    if (steps.length > 0) {
      return {
        introText: nonSteps.length > 0 ? nonSteps.join('\n').trim() : undefined,
        productCards: [],
        numberedSteps: steps,
        isProductCatalog: false,
        isNumberedSteps: true,
      };
    }
  } else if (isFaqBullets) {
    const steps = lines.map((l) => l.replace(/^[•*\-\s]+/, '').trim());
    return {
      productCards: [],
      numberedSteps: steps,
      isProductCatalog: false,
      isNumberedSteps: true,
    };
  }

  // Fallback to plain text
  return {
    productCards: [],
    numberedSteps: [],
    plainText: text,
    isProductCatalog: false,
    isNumberedSteps: false,
  };
};

/**
 * Matches a parsed CustomerProductCard (from live AI DTO or parsed history text)
 * against catalog products so clicking "View" always resolves the exact price/farm item.
 */
export const findMatchingProductForAiCard = (
  products: any[],
  card: CustomerProductCard
): any | null => {
  if (!Array.isArray(products) || products.length === 0 || !card) {
    return null;
  }

  if (card.id) {
    const byId = products.find(
      (p) => p?.productId === card.id || p?.id === card.id
    );
    if (byId) return byId;
  }

  const targetName = (card.productName || '').trim().toLowerCase();
  if (!targetName) return null;

  const activeCandidates = products.filter(
    (p) =>
      p &&
      p.isDelete !== true &&
      p.status !== 'DELETED' &&
      (p.productName || p.name || '').trim().toLowerCase() === targetName
  );
  const candidates =
    activeCandidates.length > 0
      ? activeCandidates
      : products.filter(
          (p) =>
            p &&
            (p.productName || p.name || '').trim().toLowerCase() === targetName
        );

  if (candidates.length === 0) return null;

  const targetPrice = typeof card.price === 'number' ? card.price : null;
  const priceMatches =
    targetPrice !== null
      ? candidates.filter(
          (p) => p.price !== undefined && p.price !== null && Math.abs(Number(p.price) - targetPrice) < 0.01
        )
      : candidates;

  const pool = priceMatches.length > 0 ? priceMatches : candidates;

  const targetFarm = (card.farmName || '').split(',')[0].trim().toLowerCase();
  if (targetFarm) {
    const farmMatch = pool.find((p) => {
      const fName = (p.farmName || p.farmerName || '').trim().toLowerCase();
      return fName && (fName.includes(targetFarm) || targetFarm.includes(fName));
    });
    if (farmMatch) return farmMatch;
  }

  return pool[0] || null;
};
