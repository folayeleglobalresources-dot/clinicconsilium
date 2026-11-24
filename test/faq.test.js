const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const faq = fs.readFileSync(path.join(__dirname, '..', 'faq.html'), 'utf8');

test('FAQ page preserves ClinicConsilium identity and clear service boundaries', () => {
  assert.ok(faq.includes('clinicconsilium-logo-optimized.png'));
  assert.ok(faq.includes('Open now'));
  assert.ok(faq.includes('In preparation'));
  assert.ok(faq.includes('Planned'));
  assert.ok(faq.toLowerCase().includes('not an emergency service'));
});

test('consultation photo has a public-domain source, attribution and local fallback', () => {
  assert.ok(faq.includes('https://upload.wikimedia.org/wikipedia/commons/9/9e/Doctor_consults_with_patient.jpg'));
  assert.ok(faq.includes('National Cancer Institute (NIH) / Wikimedia Commons'));
  assert.ok(faq.includes('https://commons.wikimedia.org/wiki/File:Doctor_consults_with_patient.jpg'));
  assert.ok(faq.includes("this.src='assets/img/illus-chat.svg'"));
});

test('FAQ search, category filters and answer disclosures are present', () => {
  assert.ok(faq.includes('id="faq-search-input"'));
  assert.ok(faq.includes('aria-label="Filter questions by category"'));
  assert.ok(faq.includes('data-filter="all"'));
  assert.ok(faq.includes('aria-live="polite"'));
  assert.ok(faq.includes('<details class="faq-item">'));
});

test('mobile navigation has explicit open and closed states', () => {
  assert.ok(faq.includes('.links{display:none!important'));
  assert.ok(faq.includes('.links.open{display:flex!important'));
  assert.ok(faq.includes("setMenuOpen(menu.getAttribute('aria-expanded')!=='true')"));
  assert.ok(faq.includes("menu.setAttribute('aria-expanded',String(open))"));
  assert.ok(faq.includes("if(e.target.closest('a'))setMenuOpen(false)"));
});
