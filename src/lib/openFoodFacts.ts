import { Category, DEFAULT_CATEGORIES } from './types';

interface OFFProduct {
  product_name?: string;
  categories_tags?: string[];
  image_url?: string;
  brands?: string;
}

interface OFFResponse {
  status: number;
  product?: OFFProduct;
}

// Map Open Food Facts category tags to local categories
const CATEGORY_MAP: Record<string, Category> = {
  'en:dairy': 'dairy',
  'en:milks': 'dairy',
  'en:cheeses': 'dairy',
  'en:yogurts': 'dairy',
  'en:butter': 'dairy',
  'en:cream': 'dairy',
  'en:fruits': 'fruits',
  'en:vegetables': 'fruits',
  'en:fresh-fruits': 'fruits',
  'en:fresh-vegetables': 'fruits',
  'en:meats': 'meat',
  'en:poultry': 'meat',
  'en:beef': 'meat',
  'en:pork': 'meat',
  'en:fish': 'meat',
  'en:seafood': 'meat',
  'en:breads': 'bread',
  'en:pastries': 'bread',
  'en:cereals': 'bread',
  'en:beverages': 'beverages',
  'en:juices': 'beverages',
  'en:sodas': 'beverages',
  'en:waters': 'beverages',
  'en:coffees': 'beverages',
  'en:teas': 'beverages',
  'en:alcoholic-beverages': 'beverages',
  'en:cleaning-products': 'cleaning',
  'en:personal-care': 'personal',
  'en:frozen-foods': 'frozen',
  'en:ice-creams': 'frozen',
  'en:snacks': 'snacks',
  'en:chips': 'snacks',
  'en:chocolate': 'snacks',
  'en:candies': 'snacks',
  'en:biscuits': 'snacks',
};

function mapCategory(tags?: string[]): Category {
  if (!tags || tags.length === 0) return 'other';
  for (const tag of tags) {
    const mapped = CATEGORY_MAP[tag];
    if (mapped) return mapped;
    // Try partial match
    for (const [key, val] of Object.entries(CATEGORY_MAP)) {
      if (tag.includes(key.replace('en:', ''))) return val;
    }
  }
  return 'other';
}

export interface OFFResult {
  name: string;
  category: Category;
  imageUrl?: string;
  brand?: string;
}

export async function lookupBarcode(barcode: string): Promise<OFFResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,categories_tags,image_url,brands`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) return null;

    const data: OFFResponse = await response.json();
    if (data.status !== 1 || !data.product?.product_name) return null;

    return {
      name: data.product.product_name,
      category: mapCategory(data.product.categories_tags),
      imageUrl: data.product.image_url,
      brand: data.product.brands,
    };
  } catch {
    clearTimeout(timeout);
    return null; // Silent fail
  }
}
