import { TFunction } from 'i18next';

/**
 * Localizes category names based on category name or key.
 * Falls back to the original category name if unknown or custom.
 */
export const formatCategory = (
  category: string | undefined | null,
  t: TFunction
): string => {
  if (!category) return '';
  const trimmed = String(category).trim();
  const lower = trimmed.toLowerCase();

  // Exact matches for standard built-in categories so custom admin-added categories
  // like "Exotic Fruit", "Dry Fruits", or "Organic Honey" keep their exact name.
  if (lower === 'fruit' || lower === 'fruits') {
    return t('categories.fruits', 'Fruits');
  }
  if (lower === 'wild forest' || lower === 'wild forest vegetable' || lower === 'wild forest vegetables') {
    return t('categories.wildForestVegetable', 'Wild Forest Vegetable');
  }
  if (lower === 'root' || lower === 'root vegetable' || lower === 'root vegetables') {
    return t('categories.rootVegetable', 'Root Vegetable');
  }
  if (lower === 'leafy' || lower === 'leafy vegetable' || lower === 'leafy vegetables') {
    return t('categories.leafyVegetable', 'Leafy Vegetable');
  }
  if (lower === 'veg' || lower === 'vegetable' || lower === 'vegetables') {
    return t('categories.vegetables', 'Vegetables');
  }
  if (lower === 'dairy' || lower === 'milk' || lower === 'dairy & milk') {
    return t('categories.dairy', 'Dairy & Milk');
  }
  if (lower === 'grain' || lower === 'grains' || lower === 'cereal' || lower === 'cereals' || lower === 'grains & cereals') {
    return t('categories.grains', 'Grains & Cereals');
  }
  if (lower === 'pulse' || lower === 'pulses' || lower === 'dal' || lower === 'pulses & dal') {
    return t('categories.pulses', 'Pulses & Dal');
  }
  if (lower === 'spice' || lower === 'spices' || lower === 'herb' || lower === 'herbs' || lower === 'spices & herbs') {
    return t('categories.spices', 'Spices & Herbs');
  }
  if (lower === 'organic' || lower === 'organic produce') {
    return t('categories.organic', 'Organic Produce');
  }
  if (lower === 'exotic' || lower === 'exotic produce') {
    return t('categories.exotic', 'Exotic Produce');
  }
  if (lower === 'flower' || lower === 'flowers' || lower === 'flowers & plants') {
    return t('categories.flowers', 'Flowers & Plants');
  }
  if (lower === 'seed' || lower === 'seeds' || lower === 'seeds & saplings') {
    return t('categories.seeds', 'Seeds & Saplings');
  }

  // Fallback to exact admin-created category name (e.g., "Exotic Fruit")
  return trimmed;
};
