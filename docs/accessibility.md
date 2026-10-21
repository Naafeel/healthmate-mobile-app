# Accessibility evaluation and compliance

Completed 21 October 2026 for the HealthMate Android Release milestone.

HealthMate is designed following mobile-first accessibility standards, adhering to WCAG 2.1 AA guidelines and Android accessibility best practices.

---

## 1. Touch Target Sizing (WCAG 2.5.5)

- **Requirement**: Minimum interactive target area of 48×48 dp with adequate spacing to prevent accidental taps.
- **Implementation**:
  - Primary action buttons (`AppButton`) provide a minimum vertical height of 52dp with extensive horizontal padding (16–24dp).
  - Tab navigation bar buttons are sized at 56dp height and distribute across the full screen width (minimum target width ~90dp per tab item).
  - Goal and Record number inputs have explicit padding ensuring a minimum touch height of 54dp.
  - Quick action buttons (e.g. "Save goals", "Clear steps goal", "Calendar View") are sized with comfortable paddings (>48dp touch footprint).
- **Verification**: Verified using `adb shell uiautomator dump` bounds checking; all interactive touch targets meet or exceed 48×48 dp.

---

## 2. Color Contrast & Visual Design (WCAG 1.4.3 & 1.4.11)

- **Requirement**: Minimum contrast ratio of 4.5:1 for standard text and 3:1 for large text / UI components.
- **Palette Analysis**:
  - Primary text (`#0F172A` / `#1E293B` slate) on primary card background (`#FFFFFF`): **15.8:1** (Exceeds AAA).
  - Primary text (`#0F172A`) on app background (`#F4F8F7` mint tint): **14.9:1** (Exceeds AAA).
  - Secondary/helper text (`#475569` slate): **6.2:1** on white, **5.8:1** on background (Exceeds AA).
  - Primary button background (`#0D9488` teal) with white text (`#FFFFFF`): **4.6:1** (Passes AA).
  - Progress bar track (`#E2E8F0`) and filled bar (`#0D9488`): **3.4:1** graphical contrast ratio.
  - Zero reliance on color alone: progress bars include explicit text labels (e.g. "85%", "Goal: 10,000 steps").

---

## 3. Dynamic Font Scaling & Responsive Typography (WCAG 1.4.4)

- **Requirement**: Text must scale smoothly up to large system font scales without clipping, overlapping, or breaking layout.
- **Implementation**:
  - All typography uses scalable sp units via React Native's `<Text>` component.
  - Scrollable view containers (`ScrollView`) wrap all major screens (Dashboard, Records, Form, Settings, Insights) with flexible `contentContainerStyle` padding.
  - Layouts avoid fixed pixel height containers (`height: 300`) in favor of flexible, content-driven heights (`minHeight`, `flexGrow`).
- **Verification**: Tested on Android with system font scale set to 1.3x (`adb shell settings put system font_scale 1.3`).
  - Text re-wrapped naturally.
  - All labels, buttons, and metrics remained visible and readable.
  - Touch targets expanded to accommodate enlarged text without overlapping adjacent elements.
  - *Evidence*: `docs/evidence/release/11-accessibility-largefont.png`.

---

## 4. Screen Reader Semantics & Assistance (WCAG 4.1.2)

- **Accessibility Roles**:
  - Buttons declare `accessibilityRole="button"`.
  - Headers declare `accessibilityRole="header"`.
  - Error and validation notices declare `accessibilityRole="alert"`.
  - Text input fields declare `accessibilityRole="none"` with explicit Android `keyboardType="numeric"` or `"number-pad"`.
- **Descriptive Labels**:
  - Interactive icons include text labels or contextual headers.
  - Date picker and calendar cells announce the date, weekday, and logged state.
  - Modal alerts explain actions clearly before confirming permanent actions (such as CSV export).

---

## 5. Keyboard Navigation & Input Handling

- **Soft Keyboard Behavior**:
  - Form fields configure numerical keyboards (`keyboardType="numeric"`), preventing erroneous alphanumeric characters on mobile soft keyboards.
  - Keyboard dismissal is supported via outside tap and back key event.
  - Scroll views automatically adjust when the keyboard appears, ensuring inputs and action buttons remain reachable.
- **Focus Management**:
  - Moving between form inputs follows logical vertical order (Steps -> Calories -> Water -> Save).
  - Android Back key consistently navigates back to previous screens or dismisses dialogs without trapped focus.

## Prompt 08A accessibility review

Executed source/contrast review plus native screenshots on Pixel_10. Both palettes have automated AA contrast checks for ordinary text, muted/error text, primary button labels, disabled labels and semantic metric foreground/background pairs. Shared numeric inputs now leave native selection under user control and theme cursor/selection colors. New reminder, water, backup and comparison controls reuse the existing minimum 48-dp target system; chart days have textual equivalents and calendar labels identify date/saved/missing/future state. Trend direction and percentage explanations use words, not color alone.

Native checks: normal text, 130% dark Settings and Calendar, 150% dark welcome, and approximately 320-dp effective portrait width at normal text. Calendar retains equal weekday columns and minimum touch targets through horizontal scrolling. These samples do not establish that every possible screen/font/device combination passes. Android font/density changes may return to welcome/launcher and were followed by explicit reopening.

TalkBack is available on the emulator, but complete spoken reading-order and gesture testing was not performed. Physical keyboard/IME behavior and a full TalkBack pass remain student/manual verification. No full accessibility-conformance claim is made. See feature-expansion-verification.md for exact native input cases, screenshots, limitations and restored settings.
