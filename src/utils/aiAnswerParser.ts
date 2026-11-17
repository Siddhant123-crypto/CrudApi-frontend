export interface AiCard {
  label: string;
  content: string;
}

export interface ParsedAiResponse {
  isStructured: boolean;
  title: string | null;
  cards: AiCard[];
  footerAdvisory: string | null;
  plainText: string;
}

/**
 * Pure function to parse AI agricultural advisory answers.
 * Extracts:
 * - First line/intro as `title`
 * - Bullets with "• Label (English Bracket): text" into structured `cards` with uppercase labels (label before the bracket)
 * - Last expert advisory bullet into `footerAdvisory` text (matching the screenshot)
 * - If text is unstructured or empty, gracefully falls back to plainText without crashing.
 */
export function parseAiAnswer(rawText?: string | null): ParsedAiResponse {
  if (!rawText || typeof rawText !== 'string' || rawText.trim() === '') {
    return {
      isStructured: false,
      title: null,
      cards: [],
      footerAdvisory: null,
      plainText: rawText || '',
    };
  }

  const trimmed = rawText.trim();

  try {
    // Check if text has bullets starting with '•' or '\n•'
    const bulletMatch = trimmed.match(/(?:^|\n)\s*•\s*/);
    if (!bulletMatch || bulletMatch.index === undefined) {
      return {
        isStructured: false,
        title: null,
        cards: [],
        footerAdvisory: null,
        plainText: trimmed,
      };
    }

    const firstBulletIdx = bulletMatch.index;
    const titlePart = trimmed.substring(0, firstBulletIdx).trim();
    const title = titlePart.length > 0 ? titlePart : null;

    const bulletsContent = trimmed.substring(firstBulletIdx);
    // Split on bullet markers
    const rawBullets = bulletsContent
      .split(/(?:^|\n)\s*•\s*/)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    const cards: AiCard[] = [];
    let footerAdvisory: string | null = null;

    for (let i = 0; i < rawBullets.length; i++) {
      const bullet = rawBullets[i];
      const colonIdx = bullet.indexOf(':');

      if (colonIdx === -1) {
        // Bullet without colon
        cards.push({
          label: 'JAANKARI',
          content: bullet,
        });
        continue;
      }

      const rawLabel = bullet.substring(0, colonIdx).trim();
      const content = bullet.substring(colonIdx + 1).trim();

      // Extract text before english bracket, e.g. "Mukhya Kaaran (Likely Causes)" -> "Mukhya Kaaran"
      const bracketMatch = rawLabel.match(/^([^(]+)/);
      const cleanLabel = (bracketMatch ? bracketMatch[1] : rawLabel)
        .trim()
        .toUpperCase();

      // Check if this is an expert advisory item (typically the last bullet)
      const isExpertAdvisory =
        /(visheshagya|expert|advisory|salah|तज्ञांचा|सल्ला)/i.test(rawLabel);

      if (isExpertAdvisory && i === rawBullets.length - 1 && content.length > 0) {
        footerAdvisory = content;
      } else {
        cards.push({
          label: cleanLabel || 'JAANKARI',
          content,
        });
      }
    }

    if (cards.length === 0 && !footerAdvisory) {
      return {
        isStructured: false,
        title: null,
        cards: [],
        footerAdvisory: null,
        plainText: trimmed,
      };
    }

    return {
      isStructured: true,
      title,
      cards,
      footerAdvisory,
      plainText: trimmed,
    };
  } catch {
    return {
      isStructured: false,
      title: null,
      cards: [],
      footerAdvisory: null,
      plainText: trimmed,
    };
  }
}
