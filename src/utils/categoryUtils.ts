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
  const lower = String(category).toLowerCase().trim();

  if (lower.includes('fruit')) {
    return t('categories.fruits', 'Fruits');
  }
  if (lower.includes('veg')) {
    return t('categories.vegetables', 'Vegetables');
  }
  if (lower.includes('dairy') || lower.includes('milk')) {
    return t('categories.dairy', 'Dairy & Milk');
  }
  if (lower.includes('grain') || lower.includes('cereal') || lower.includes('wheat') || lower.includes('rice')) {
    return t('categories.grains', 'Grains & Cereals');
  }
  if (lower.includes('pulse') || lower.includes('dal') || lower.includes('lentil')) {
    return t('categories.pulses', 'Pulses & Dal');
  }
  if (lower.includes('spice') || lower.includes('masala') || lower.includes('herb')) {
    return t('categories.spices', 'Spices & Herbs');
  }
  if (lower.includes('organic')) {
    return t('categories.organic', 'Organic Produce');
  }
  if (lower.includes('exotic')) {
    return t('categories.exotic', 'Exotic Produce');
  }
  if (lower.includes('flower') || lower.includes('plant')) {
    return t('categories.flowers', 'Flowers & Plants');
  }
  if (lower.includes('seed') || lower.includes('sapling')) {
    return t('categories.seeds', 'Seeds & Saplings');
  }

  // Fallback to original category name (e.g. user-created or specific category)
  return category;
};
