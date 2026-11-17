# Farm2Home Mobile App: 9-Language Visual Verification Test Plan

This document details the exact on-device test plan for physical Android phones covering all **9 languages**:
`en` (English), `hi` (Hindi), `mr` (Marathi), `ta` (Tamil), `bn` (Bengali), `kn` (Kannada), `or` (Odia), `sa` (Sanskrit), `te` (Telugu).

---

## 1. High-Risk Typography & Layout Inspection (Dravidian & Indic Expansion)

Languages like **Tamil (`ta`)**, **Telugu (`te`)**, **Kannada (`kn`)**, and **Bengali (`bn`)** regularly experience 25% to 45% text length expansion compared to concise English phrasing.

| Target Screen | Element / Action | What to Inspect | Script-Specific Focus |
|---|---|---|---|
| **Admin Dashboard** | Main Stat Cards (2x2 grid) | Titles must not overlap numbers; text uses `numberOfLines={1}` or wrapping gracefully. | `ta`, `te`, `kn`: Check "Platform Turnover", "Active Farmers", "Active Customers". |
| **Admin Dashboard** | Order Status & Quick Action chips | Button chips must wrap or scroll horizontally without clipping borders. | `mr`, `hi`, `sa`: Check status labels "Delivered", "Cancelled", "Pending". |
| **Admin Add/Edit Market** | Form Section Headers & Inputs | Section headings (`BASIC INFORMATION`, `LOCATION DETAILS`, etc.) and inputs (Latitude/Longitude, Timings). | `or`, `bn`: Check placeholder texts and coordinate input labels. |
| **Admin Add/Edit Market** | Sticky Bottom Bar | "Save Market" / "Update Market" button must not truncate or break into multiple rows unevenly. | `ta`, `te`: Button text must fit with `flexShrink`. |
| **Admin Farmer Details** | Status Badges & Action Buttons | "ACTIVE", "BLOCKED", "SELF-DEACTIVATED" gradients and "Unblock Farmer" / "Activate Farmer" buttons. | `sa`, `or`: Check Devanagari conjuncts and Odia rounded characters. |
| **Admin Farmer Details** | Block Farmer Modal | Multiline input, Date input (`DD-MM-YYYY`), "Confirm Block" and "Cancel" buttons. | `kn`, `te`: Check text alignment and modal overlay. |
| **Admin Farm Verification Details** | Verification Header & Sticky Bar | Sticky bar with "Reject" and "Approve Farm" buttons side-by-side. | `ta`, `bn`: Buttons must not collide or clip icons. |
| **Admin Farm Verification Details** | Video Player & Photo Gallery | "Open in External Player", "Retry", "Farm Photos (N)", "Official Verification Document". | `or`, `sa`: Verify custom glyphs and text rendering. |
| **Admin Farm Verification Details** | Approve / Reject Modals | Confirmation dialogue text with interpolation (`{{name}}`) and action buttons. | `hi`, `mr`: Confirm farmer name appears uncorrupted within sentence. |

---

## 2. Step-by-Step Screen Verification Walkthrough

Execute these steps for each language on your physical Android phone:

### Step 1: Language Selection & Live UI Update
1. Open Farm2Home mobile app.
2. From the Login screen or Profile -> Settings -> Language, select the target language (e.g. தமிழ் or संस्कृतम्).
3. **Verify:**
   - Entire screen updates instantly without requiring an app reload.
   - Header, navigation buttons, and bottom tab bars immediately reflect the chosen language.
   - Force close the app, reopen it, and confirm the selected language persists.

### Step 2: Admin Dashboard (`AdminDashboardScreen`)
1. Sign in as Admin.
2. **Verify:**
   - "Hello, [Name]" greeting and subtitle are localized.
   - Stat cards: "Farmers", "Customers", "Products", "Orders" localized.
   - Order status cards: "Pending", "Completed", "Cancelled" localized.
   - Section headers: "Recent orders" and "Quick actions" localized.
   - Tap "Support" button - badge and label correctly localized.

### Step 3: Admin Add/Edit Market (`AdminAddEditMarketScreen`)
1. Navigate to Admin -> Markets -> Tap "+" (Add Market).
2. **Verify:**
   - Header title: "Add Market", subtitle: "Register a new APMC / mandi".
   - Section headers: "BASIC INFORMATION", "LOCATION DETAILS", "MAP COORDINATES", "OPERATIONS & CONTACT", "MARKET STATUS".
   - All input labels & placeholders (Market Name, Description, Address, Village, Taluka, District, State, Pincode, Latitude, Longitude, Opening Time, Closing Time, Contact Person, Contact Number).
   - Market Status switch badge: "Active" / "Inactive" with appropriate color.
   - Tap "Save Market" with empty fields: Confirm validation alert appears in the target language ("Market Name is required.", "Latitude is required.").
   - Edit an existing market: Header shows "Edit Market" with market name.

### Step 4: Admin Farmer Details (`AdminFarmerDetailsScreen`)
1. Navigate to Admin -> Farmers -> Select a farmer.
2. **Verify:**
   - Status badge: "ACTIVE", "BLOCKED", or "SELF-DEACTIVATED" rendered in native script.
   - Action buttons: "Block Farmer", "Unblock Farmer", or "Activate Farmer".
   - Sections: "Full Information" (Name, Email, Phone, Address, State & Village, Postal Code), "Sales Statistics" (Total Products, Products Sold, Total Orders, Revenue), "Products Catalog", "Recent Orders".
   - Tap "Block Farmer": Confirm modal opens with "Block Reason", "Block Until Date", "Cancel", and "Confirm Block".
   - Farmer's own name and entered farm description remain in their original text.

### Step 5: Admin Farm Verification Details (`AdminFarmVerificationDetailsScreen`)
1. Navigate to Admin -> Farm Verification -> Select a pending verification request.
2. **Verify:**
   - Header title: "Farm Verification", status badge: "Verified" / "Pending".
   - Farm Information table: "Farm Name", "Farm Size", "Farming Type", "Experience", "Location".
   - Farm Video player: "Farm Video" badge, "Open in External Player" / "Retry" (if decoder fails).
   - Farm Photos section: "Farm Photos (N)", tap any photo to open full-screen viewer ("Pinch to zoom • Double-tap to zoom • Tap to close").
   - Certificate & Documents: "Farm Certificate", "Official Verification Document", "View".
   - Bottom Sticky Bar: "Reject" and "Approve Farm" buttons.
   - Tap "Reject": Modal opens with "Reject Verification", "Reason for Rejection", placeholder, "Cancel", and "Send Reason".
   - Tap "Approve Farm": Modal opens with "Approve Farm?", confirmation message with farmer's name, "Cancel", and "Confirm Farm".

---

## 3. Persistent Storage & Authentication Continuity Checklist
- [x] Language stored in `AsyncStorage` key `farm2home_app_language`.
- [x] Switching language immediately re-renders all active screens via `useTranslation()`.
- [x] Logging out and logging back in retains user-selected language.
- [x] Cold app restart retains user-selected language.



---

## Language Selection Screen — Redesign (Nov 2026)

**Screen route:** `LanguageSelection`  
**Entry points:** First launch (WelcomeScreen `replace`), NewUserLoginScreen, CustomerMenuScreen, FarmerMenuScreen, AdminMenuScreen, ProfileScreen (all via `navigate` with `fromSettings: true`).

### For each of the 9 languages, verify the following on a physical Android phone:

| Check | What to look for | Pass criterion |
|---|---|---|
| **Hero title** | Tap each language tile to switch live; read the title | Fits on ONE line, Fraunces Bold, white, no overflow |
| **Count chip** | Top-right of sheet card | Shows "9 languages" (in native language), terracotta chip background |
| **Native script glyphs** | Each tile's large top text | No boxes/tofu — all 9 scripts render cleanly |
| **Selected tile** | Hindi selected by default on first launch | Green gradient, gold check badge top-right, orange ring outside, no clipping |
| **Unselected tile** | All other tiles | Cream background, grey border |
| **Live preview** | Tap Marathi → check title/subtitle/footnote | All UI text updates immediately without reload |
| **Continue label** | Long translations (e.g. Tamil/Sanskrit) | Does not overlap the gold arrow circle; fits within button |
| **Back arrow** | From Settings (fromSettings=true) | Shows glass back button top-left |
| **No back arrow** | First launch | Placeholder space shown, wordmark centred |
| **Back revert** | Select Marathi, press hardware back | Language reverts to previously saved language |
| **Width 360 px** | Narrow device | 3-column grid intact, button not covered by content |
| **Width 411 px** | Wider device | Same layout, proportionally wider tiles |
| **Short screen** | Scroll the sheet | Can scroll to footnote; Continue button stays pinned |
| **Persist after restart** | Select Tamil, Continue, force-kill and reopen | App opens in Tamil |
| **Persist after logout** | Select Marathi, log out, log back in | Login screen in Marathi |

### Language-specific script rendering check

| Language | Native name shown on tile | Noto font | Expected glyph sample |
|---|---|---|---|
| Hindi | हिन्दी | NotoSansDevanagari_700Bold | Devanagari, conjuncts visible |
| Marathi | मराठी | NotoSansDevanagari_700Bold | Same as Hindi |
| Tamil | தமிழ் | NotoSansTamil_700Bold | Pulli marks correct |
| Bengali | বাংলা | NotoSansBengali_700Bold | Hasanta, vowel marks |
| Kannada | ಕನ್ನಡ | NotoSansKannada_700Bold | Virama stack correct |
| Odia | ଓଡ଼ିଆ | NotoSansOriya_700Bold | ḍa with nukta correct |
| Sanskrit | संस्कृतम् | NotoSansDevanagari_700Bold | Anusvara + visarga correct |
| Telugu | తెలుగు | NotoSansTelugu_700Bold | Gunintam marks correct |
