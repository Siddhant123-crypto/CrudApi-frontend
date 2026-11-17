import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAiAnswer } from './aiAnswerParser.ts';

test('parseAiAnswer: parses structured backend answer matching screenshot 2', () => {
  const rawText = `Tamatar ke peele patte

• Mukhya Kaaran (Likely Causes): Nitrogen ki kami, jadon mein zyada paani, ya safed makhi jaise ras choosak keede.
• Khet Mein Kya Dekhein (What to Check): Peele patte neeche ke hain ya upar ke? Pattiyon ke neeche keede aur jad ke paas nami check karein.
• Abhi Kya Karein (Safe Cultural Actions): Nikasi theek karein, bahut peele patte hatayein, sadi hui gobar ki khad dalein, aur peele sticky trap lagayein.
• Visheshagya Salah (Expert Advisory): Patte mudne lagein to sample lekar najdeeki KVK se jaanch karayein.`;

  const parsed = parseAiAnswer(rawText);

  assert.equal(parsed.isStructured, true);
  assert.equal(parsed.title, 'Tamatar ke peele patte');
  assert.equal(parsed.cards.length, 3);
  assert.equal(parsed.cards[0].label, 'MUKHYA KAARAN');
  assert.equal(parsed.cards[0].content, 'Nitrogen ki kami, jadon mein zyada paani, ya safed makhi jaise ras choosak keede.');
  assert.equal(parsed.cards[1].label, 'KHET MEIN KYA DEKHEIN');
  assert.equal(parsed.cards[2].label, 'ABHI KYA KAREIN');
  assert.equal(parsed.footerAdvisory, 'Patte mudne lagein to sample lekar najdeeki KVK se jaanch karayein.');
});

test('parseAiAnswer: parses sowing structured advice', () => {
  const rawText = `Tamatar ki Buwai ki Salah

• Buwai ka Sahi Samay (Best Time to Sow): Kharif fasal ke liye June-July aur Rabi ke liye October-November.
• Khet aur Beej ki Taiyari (What to Prepare): Mitti ki gehri jutai karein aur beejopchar zaroor karein.
• Ropayi aur Shuruati Dekhbhal (Care at Planting): Paudhon ke beech 60x45 cm ki doori rakhein.
• Visheshagya Salah (Ask an Expert): KVK se salah lein.`;

  const parsed = parseAiAnswer(rawText);

  assert.equal(parsed.isStructured, true);
  assert.equal(parsed.title, 'Tamatar ki Buwai ki Salah');
  assert.equal(parsed.cards.length, 3);
  assert.equal(parsed.cards[0].label, 'BUWAI KA SAHI SAMAY');
  assert.equal(parsed.cards[1].label, 'KHET AUR BEEJ KI TAIYARI');
  assert.equal(parsed.cards[2].label, 'ROPAYI AUR SHURUATI DEKHBHAL');
  assert.equal(parsed.footerAdvisory, 'KVK se salah lein.');
});

test('parseAiAnswer: falls back cleanly to plain text when no bullets exist', () => {
  const rawText = 'Namaste! Tamatar ki fasal mein abhi nami banaye rakhein aur keet prabandhan par dhyan dein.';
  const parsed = parseAiAnswer(rawText);

  assert.equal(parsed.isStructured, false);
  assert.equal(parsed.title, null);
  assert.equal(parsed.cards.length, 0);
  assert.equal(parsed.footerAdvisory, null);
  assert.equal(parsed.plainText, rawText);
});

test('parseAiAnswer: handles null, undefined, and empty string safely without crashing', () => {
  assert.equal(parseAiAnswer(null).isStructured, false);
  assert.equal(parseAiAnswer(undefined).isStructured, false);
  assert.equal(parseAiAnswer('').isStructured, false);
  assert.equal(parseAiAnswer('   ').isStructured, false);
});

test('parseAiAnswer: handles bullets without colons or weird formatting safely', () => {
  const rawText = `General Crop Info
• First point without colon
• Second point: with colon description`;

  const parsed = parseAiAnswer(rawText);
  assert.equal(parsed.isStructured, true);
  assert.equal(parsed.cards.length, 2);
  assert.equal(parsed.cards[0].label, 'JAANKARI');
  assert.equal(parsed.cards[0].content, 'First point without colon');
  assert.equal(parsed.cards[1].label, 'SECOND POINT');
  assert.equal(parsed.cards[1].content, 'with colon description');
});
