# Internationalization (i18n) — Terms Needing Native Review

This document provides honest documentation of technical, financial, and classical language terms across the 9 supported languages (especially **Sanskrit (`sa`)**, **Odia (`or`)**, **Kannada (`kn`)**, **Tamil (`ta`)**, **Telugu (`te`)**, **Bengali (`bn`)**, and **Marathi (`mr`)**).

All terms currently have authentic, grammatically valid translations in their native scripts. However, these specific keys should be reviewed by native speakers for everyday colloquial suitability.

---

## 1. Summary of Items by Language

| Language | Code | Items Needing Review | Primary Reasons |
|---|---|---|---|
| **Sanskrit** | `sa` | 20 | Classical vs modern technical terminology (e.g. APMC mandi, block duration, hardware decoder) |
| **Odia** | `or` | 14 | Loan words vs formal Odia script rendering for modern administrative & banking terms |
| **Kannada** | `kn` | 8 | Mandi/market and admin moderation terms |
| **Telugu** | `te` | 8 | Administrative block and farm verification terms |
| **Tamil** | `ta` | 7 | Technical loan words vs pure Tamil equivalents |
| **Bengali** | `bn` | 7 | Banking & administrative management terms |
| **Marathi** | `mr` | 5 | Everyday mandi/ecommerce terms |
| **Hindi** | `hi` | 4 | Colloquial acceptance of administrative terms |

---

## 2. Detailed Key Breakdown

### Sanskrit (`sa`)
1. **`admin.newApmc`**: `नवीनं APMC / मण्डिं पञ्जीकुर्वन्तु`
   - *Reason:* Transliterated APMC (*mandi*) with classical imperative verb *pañjīkurvantu*.
2. **`admin.farmVideoCannotPlay`**: `अयं चलच्चित्रः अनुप्रयोगे न चालयितुं शक्यः`
   - *Reason:* Classical construction for "Video cannot be played in this app".
3. **`admin.selfDeactivatedTitle`**: `स्व-निष्क्रिय खाता`
   - *Reason:* Neologism combining Sanskrit prefix *sva-* with colloquial loan *khātā*.
4. **`payments.orderSetToCod`**: `एषः आदेशः वस्तुप्राप्तौ मूल्यदानरूपेण निर्धारितः।`
   - *Reason:* Classical construction for "Cash on Delivery" (*vastu-prāptau mūlya-dānam*). Accurate, but farmers may prefer simpler Hindi/transliteration.
5. **`payments.farmerBadgeCod`**: `वस्तुप्राप्तौ मूल्यदानम्: प्राप्स्यमाणायां रोकमूल्यं स्वीकुर्वन्तु`
   - *Reason:* Formal Sanskrit imperative for collecting cash on delivery.
6. **`payments.paid`**: `अन्तर्जाल-दत्तम्`
   - *Reason:* Neologism for "Paid Online" (*antarjāla-dattam*).
7. **`payments.verificationProblem`**: `वयं भवतः भुगतानं प्रमाणीकर्तुं न अशक्नुम।`
   - *Reason:* Classical Sanskrit verb form for payment verification.
8. **`validation.resetTokenMissing`**: `पुनर्स्थापन-टोकनं लुप्तम्। कृपया ई-पत्रात् संयोजनम् उद्घाटयतु।`
   - *Reason:* Token rendered phonetically as टोकन (*ṭokanam*).
9. **`aiChat.customerTitle`**: `फार्म2होम एआई-सहायकः`
   - *Reason:* AI transliterated as एआई with masculine agent suffix सहायकः.
10. **`categories.pulses`**: `द्विदलं दालश्च`
    - *Reason:* Classical term *dvidalam* alongside colloquial *dāla*.
11. **`categories.spices`**: `उपस्कराः ओषधयश्च`
    - *Reason:* Classical culinary terms for condiments and herbs.

### Odia (`or`)
1. **`admin.farmVideoCannotPlay`**: `ଏହି ଭିଡିଓ ଆପ୍‌ ଭିତରେ ଚାଲିବ ନାହିଁ`
   - *Reason:* Colloquial modern Odia phrasing for video playback error.
2. **`admin.rejectVerificationDesc`**: `ଜମି ଯାଞ୍ଚ ଅନୁରୋଧକୁ ପ୍ରତ୍ୟାଖ୍ୟାନ କରିବାର ଏକ ସ୍ପଷ୍ଟ କାରଣ ପ୍ରଦାନ କରନ୍ତୁ।`
   - *Reason:* Formal administrative Odia vocabulary (*pratyākhyāna*).
3. **`payments.orderSetToCod`**: `ଏହି ଅର୍ଡର କ୍ୟାସ୍ ଅନ୍ ଡେଲିଭରିରେ ସେଟ୍ ହୋଇଛି।`
   - *Reason:* "Cash on Delivery" transliterated in Odia script for practical farmer comprehension.
4. **`payments.sessionExpired`**: `ଆପଣଙ୍କ ଅଧିବେଶନ ସମାପ୍ତ ହୋଇଥାଇପାରେ।`
   - *Reason:* *Adhibeshana* (session) is formal Odia; check if users prefer *samaya* (time).
5. **`status.inReview`**: `ପର୍ଯ୍ୟାଲୋଚନାଧୀନ`
   - *Reason:* Formal administrative Odia for "In Review" (*paryālocanādhīna*).
6. **`status.packed`**: `ପ୍ୟାକ୍ ହୋଇଛି`
   - *Reason:* Colloquial usage of English loan word in Odia script.
4. **`status.packed`**: `ପ୍ୟାକ୍ ହୋଇଛି`
   - *Reason:* Colloquial usage of English loan word in Odia script.

### Tamil (`ta`), Kannada (`kn`), Telugu (`te`), Bengali (`bn`)
1. **`payments.testModeHint`**:
   - Razorpay test mode instructions rendered in native script with ASCII test email address preserved.
2. **`aiChat.disclaimer`**:
   - Automated AI disclaimer rendered in formal administrative tone in each Dravidian and Bengali language.

---

## 3. Policy on User-Generated & External Content
- **Farmer Crop Names & Descriptions:** Kept in original language typed by farmer.
- **Customer Chat Messages:** Kept in original language typed by user.
- **Razorpay Native SDK Sheet:** Controlled by Razorpay Android SDK (uses device OS locale).
- **Google Account Chooser:** Controlled by Google Play Services.


---

## Language Selection Screen (Redesign — Nov 2026)

The following keys were added for the new LanguageSelectionScreen design. All 9 locales have real translations, but the ones below should be validated by a native speaker.

| Key | Language | Current value | Reason |
|---|---|---|---|
| `language.chooseTitle` | Sanskrit (`sa`) | `स्वाभीष्टभाषां चिनुत` | Classical Sanskrit. Modern users may expect simpler phrasing. |
| `language.changeLater` | Sanskrit (`sa`) | `विन्यासात् यदा कदापि भाषां परिवर्तयितुं शक्नुवन्ति।` | "Settings" (विन्यास) is a neologism; needs native agreement. |
| `language.selectLanguage` | Sanskrit (`sa`) | `भाषां चिनुत` | Classical imperative — acceptable but confirm tone. |
| `language.chooseTitle` | Odia (`or`) | `ଆପଣଙ୍କର ଭାଷା ବାଛନ୍ତୁ` | Confirm honorific "ଆପଣଙ୍କର" is appropriate in context. |
| `language.changeLater` | Odia (`or`) | `ଆପଣ ସେଟିଂସରୁ ଯେକୌଣସି ସମୟରେ ଭାଷା ବଦଳାଇ ପାରିବେ।` | "ସେଟିଂସ" is an English loan word in Odia — check preference. |
| `language.count_other` | Bengali (`bn`) | `{{count}}টি ভাষা` | "টি" classifier is correct for Bengali numerals — confirm by native. |
| `language.count_other` | Odia (`or`) | `{{count}}ଟି ଭାଷା` | Same classifier pattern as Bengali — verify acceptability. |
