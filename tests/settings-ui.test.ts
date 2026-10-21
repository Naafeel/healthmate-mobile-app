import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('Settings About retains product information without academic attribution', () => {
 const source=readFileSync('src/features/settings/SettingsScreen.tsx','utf8');
 assert.doesNotMatch(source,/Kingston|ESOFT|coursework/i);
 for(const text of ['ABOUT HEALTHMATE','Personal Health & Wellness Tracker','Version 1.0.1']) assert.ok(source.includes(text));
});
