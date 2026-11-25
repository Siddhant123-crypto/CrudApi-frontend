import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseProductLine,
  parseCustomerAiAnswer,
} from './customerAiAnswerParser.ts';

test('parseProductLine: parses full product line with farm name and stock', () => {
  const line = '• Tomato (mr wang farm, Sinner): Rs. 50.00 per KG (Available Stock: 10.0 KG)';
  const card = parseProductLine(line);

  assert.ok(card);
  assert.equal(card.productName, 'Tomato');
  assert.equal(card.farmName, 'mr wang farm, Sinner');
  assert.equal(card.priceDisplay, 'Rs. 50 / KG');
  assert.equal(card.stockDisplay, '10 KG in stock');
  assert.equal(card.isOutOfStock, false);
});

test('parseProductLine: parses product line without farm name', () => {
  const line = '• Potato: Rs. 35.50 / KG (Available Stock: 25.5 KG)';
  const card = parseProductLine(line);

  assert.ok(card);
  assert.equal(card.productName, 'Potato');
  assert.equal(card.farmName, undefined);
  assert.equal(card.priceDisplay, 'Rs. 35.50 / KG');
  assert.equal(card.stockDisplay, '25.5 KG in stock');
  assert.equal(card.isOutOfStock, false);
});

test('parseProductLine: parses out-of-stock product line correctly', () => {
  const line = '• Onion: Rs. 40.00 per KG (Available Stock: 0 KG)';
  const card = parseProductLine(line);

  assert.ok(card);
  assert.equal(card.productName, 'Onion');
  assert.equal(card.stockDisplay, 'Out of stock');
  assert.equal(card.isOutOfStock, true);
});

test('parseCustomerAiAnswer: parses full catalog answer matching backend format', () => {
  const rawText = `Abhi ye taaza sabziyan uplabdh hain:
• Tomato (mr wang farm, Sinner): Rs. 50.00 per KG (Available Stock: 10.0 KG)
• Potato (Green Acres, Nashik): Rs. 28.00 per KG (Available Stock: 50.0 KG)
Aap kisi bhi product par click karke direct order kar sakte hain.`;

  const parsed = parseCustomerAiAnswer(rawText);

  assert.equal(parsed.isProductCatalog, true);
  assert.equal(parsed.introText, 'Abhi ye taaza sabziyan uplabdh hain:');
  assert.equal(parsed.productCards.length, 2);
  assert.equal(parsed.productCards[0].productName, 'Tomato');
  assert.equal(parsed.productCards[0].priceDisplay, 'Rs. 50 / KG');
  assert.equal(parsed.productCards[1].productName, 'Potato');
  assert.equal(parsed.trailingText, 'Aap kisi bhi product par click karke direct order kar sakte hain.');
});

test('parseCustomerAiAnswer: parses structuredProducts array if provided', () => {
  const products = [
    {
      id: 'p1',
      productName: 'Organic Tomato',
      farmName: 'Desi Farm',
      price: 60,
      unit: 'KG',
      quantity: 15,
    },
    {
      id: 'p2',
      productName: 'Fresh Spinach',
      farmName: 'Desi Farm',
      price: 20,
      unit: 'BUNCH',
      quantity: 0,
    },
  ];

  const parsed = parseCustomerAiAnswer('Special recommendation:', products);

  assert.equal(parsed.isProductCatalog, true);
  assert.equal(parsed.introText, 'Special recommendation:');
  assert.equal(parsed.productCards.length, 2);
  assert.equal(parsed.productCards[0].id, 'p1');
  assert.equal(parsed.productCards[0].productName, 'Organic Tomato');
  assert.equal(parsed.productCards[0].priceDisplay, 'Rs. 60 / KG');
  assert.equal(parsed.productCards[0].stockDisplay, '15 KG in stock');
  assert.equal(parsed.productCards[1].id, 'p2');
  assert.equal(parsed.productCards[1].isOutOfStock, true);
  assert.equal(parsed.productCards[1].stockDisplay, 'Out of stock');
});

test('parseCustomerAiAnswer: parses backend AiProductCardDto with stockStatus and productPhoto', () => {
  const backendCards = [
    {
      id: 'uuid-1',
      name: 'Tomato',
      price: 35,
      unit: 'KG',
      stockStatus: '25.0 KG in stock',
      farmName: 'Green Valley Farm',
      location: 'Nashik',
      productPhoto: 'https://cdn.farm2home.com/tomato.jpg',
    },
    {
      id: 'uuid-2',
      name: 'Onion',
      price: 30,
      unit: 'KG',
      stockStatus: 'Out of stock',
      farmName: 'Green Valley Farm',
      location: 'Nashik',
    },
  ];

  const parsed = parseCustomerAiAnswer('Here are the available products:', backendCards);

  assert.equal(parsed.isProductCatalog, true);
  assert.equal(parsed.productCards.length, 2);
  assert.equal(parsed.productCards[0].id, 'uuid-1');
  assert.equal(parsed.productCards[0].productName, 'Tomato');
  assert.equal(parsed.productCards[0].priceDisplay, 'Rs. 35 / KG');
  assert.equal(parsed.productCards[0].stockDisplay, '25.0 KG in stock');
  assert.equal(parsed.productCards[0].isOutOfStock, false);
  assert.equal(parsed.productCards[0].productPhoto, 'https://cdn.farm2home.com/tomato.jpg');
  assert.equal(parsed.productCards[1].id, 'uuid-2');
  assert.equal(parsed.productCards[1].isOutOfStock, true);
  assert.equal(parsed.productCards[1].stockDisplay, 'Out of stock');
});

test('parseCustomerAiAnswer: parses numbered steps for how-to questions', () => {
  const rawText = `Order karne ke aasan tareeqe:
1. Product chunein aur quantity select karein
2. Add to Cart karein
3. Delivery address confirm karein aur payment karein`;

  const parsed = parseCustomerAiAnswer(rawText);

  assert.equal(parsed.isNumberedSteps, true);
  assert.equal(parsed.introText, 'Order karne ke aasan tareeqe:');
  assert.equal(parsed.numberedSteps.length, 3);
  assert.equal(parsed.numberedSteps[0], 'Product chunein aur quantity select karein');
  assert.equal(parsed.numberedSteps[1], 'Add to Cart karein');
  assert.equal(parsed.numberedSteps[2], 'Delivery address confirm karein aur payment karein');
});

test('parseCustomerAiAnswer: falls back cleanly to plain text', () => {
  const rawText = 'Farm2Home mein aapka swaagat hai! Main aapki fresh sabziyon aur phalon ki khareedari mein madad kar sakta hun.';
  const parsed = parseCustomerAiAnswer(rawText);

  assert.equal(parsed.isProductCatalog, false);
  assert.equal(parsed.isNumberedSteps, false);
  assert.equal(parsed.plainText, rawText);
});

test('parseCustomerAiAnswer: handles null, undefined, empty safely', () => {
  const parsed1 = parseCustomerAiAnswer(null);
  assert.equal(parsed1.isProductCatalog, false);
  assert.equal(parsed1.plainText, '');

  const parsed2 = parseCustomerAiAnswer(undefined);
  assert.equal(parsed2.isProductCatalog, false);

  const parsed3 = parseCustomerAiAnswer('');
  assert.equal(parsed3.isProductCatalog, false);
});
