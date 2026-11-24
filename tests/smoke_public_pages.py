"""Playwright smoke checks for every sitemap-listed public page."""
from __future__ import annotations
import json, os, socket, subprocess, sys, time, unittest
import xml.etree.ElementTree as ET
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = os.environ.get("CLINICCONSILIUM_TEST_URL", "http://127.0.0.1:4173")
EXPECTED_MENU = [
    ("index.html", "Home"), ("services.html", "Services"),
    ("how-it-works.html", "How it works"), ("providers.html", "For providers"),
    ("international-care.html", "International care"), ("about.html", "About"),
    ("contact.html", "Contact"),
]

def public_pages():
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    sitemap = ET.parse(ROOT / "sitemap.xml")
    paths = ["/"]
    for node in sitemap.findall(".//sm:loc", ns):
        value = node.text or ""
        if value.endswith(".html"):
            paths.append("/" + Path(value).name)
    paths.append("/account.html")
    return sorted(set(paths))

class PublicSiteSmokeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = None
        if not os.environ.get("CLINICCONSILIUM_TEST_URL"):
            cls.server = subprocess.Popen(
                [sys.executable, "-m", "http.server", "4173", "--bind", "127.0.0.1"],
                cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            deadline = time.time() + 15
            while time.time() < deadline:
                try:
                    with socket.create_connection(("127.0.0.1", 4173), timeout=0.5):
                        break
                except OSError:
                    time.sleep(0.2)
            else:
                raise RuntimeError("Local test server did not start")
        cls.playwright = sync_playwright().start()
        launch = {"headless": True, "args": ["--no-sandbox"]}
        if os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE"):
            launch["executable_path"] = os.environ["PLAYWRIGHT_CHROMIUM_EXECUTABLE"]
        cls.browser = cls.playwright.chromium.launch(**launch)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        if cls.server:
            cls.server.terminate()
            cls.server.wait(timeout=5)

    def fill_contact_form(self, page):
        page.locator("#name").fill("Playwright Smoke Test")
        page.locator("#email").fill("smoke-test@example.com")
        page.locator("#role").select_option(label="Other healthcare partner")
        page.locator("#interest").fill("Automated browser smoke test. No clinical information.")
        page.locator("#privacyConsent").check()

    def test_every_public_page_at_desktop_and_mobile(self):
        problems = []
        for width, height in ((1360, 900), (390, 844)):
            for path in public_pages():
                page = self.browser.new_page(viewport={"width": width, "height": height})
                errors = []
                page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
                page.on("pageerror", lambda error: errors.append(str(error)))
                try:
                    page.route("**/api/healthcare-network?**", lambda route: route.fulfill(
                        status=200, content_type="application/json",
                        body=json.dumps({"ok": True, "listings": [], "count": 0})))
                    response = page.goto(BASE_URL + path, wait_until="domcontentloaded", timeout=30000)
                    if response is None or not response.ok:
                        problems.append(f"{width}px {path}: page response was not successful")
                        continue
                    page.evaluate("""async () => {
                      for (const img of document.images) img.loading = 'eager';
                      await Promise.all(Array.from(document.images).map(img => img.decode().catch(() => null)));
                    }""")
                    page.wait_for_timeout(150)
                    if "images.unsplash.com" in page.content().lower():
                        problems.append(f"{width}px {path}: remote images.unsplash.com URL remains")
                    images = page.locator("img").evaluate_all(
                        "els => els.map(img => ({src: img.currentSrc || img.src, ok: img.complete && img.naturalWidth > 0}))")
                    for image in images:
                        if not image["ok"]:
                            problems.append(f"{width}px {path}: broken image {image['src']}")
                    logo = page.locator('img[src*="clinicconsilium-logo-optimized.png"]')
                    if logo.count() == 0 or not logo.evaluate_all(
                        "els => els.some(img => img.complete && img.naturalWidth > 0)"):
                        problems.append(f"{width}px {path}: official logo missing or broken")
                    menu = page.locator("nav.links a").evaluate_all(
                        "els => els.map(a => [a.getAttribute('href'), a.textContent.trim().replace(/\\s+/g, ' ')])")
                    if menu != [list(item) for item in EXPECTED_MENU]:
                        problems.append(f"{width}px {path}: header menu differs from standard: {menu}")
                    if width == 390:
                        toggle, nav = page.locator("button.menu"), page.locator("nav.links")
                        if toggle.count() != 1:
                            problems.append(f"{width}px {path}: standard mobile menu toggle missing")
                        else:
                            toggle.click()
                            if not nav.is_visible():
                                problems.append(f"{width}px {path}: mobile menu did not open")
                            toggle.click()
                            if nav.is_visible():
                                problems.append(f"{width}px {path}: mobile menu did not close")
                    overflow = page.evaluate("""() => {
                      const width = window.innerWidth;
                      const offenders = Array.from(document.querySelectorAll('body *')).map(el => {
                        const r = el.getBoundingClientRect();
                        return {tag: el.tagName.toLowerCase(), id: el.id, className: String(el.className || '').slice(0, 90), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth};
                      }).filter(x => x.right > width + 1 || x.left < -1).slice(0, 12);
                      return {scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, offenders};
                    }""")
                    if overflow["scrollWidth"] > overflow["clientWidth"]:
                        problems.append(f"{width}px {path}: sideways scrolling detected: {json.dumps(overflow)}")
                    for error in errors:
                        problems.append(f"{width}px {path}: console error: {error}")
                except Exception as exc:
                    problems.append(f"{width}px {path}: browser check failed: {exc}")
                finally:
                    page.close()
        self.assertEqual(problems, [], "Public page smoke-test failures:\\n" + "\\n".join(problems))

    def test_contact_form_shows_error_when_api_fails(self):
        page = self.browser.new_page(viewport={"width": 1360, "height": 900})
        page.route("**/api/enquiries", lambda route: route.fulfill(
            status=503, content_type="application/json",
            body=json.dumps({"ok": False, "message": "Test service unavailable"})))
        page.goto(BASE_URL + "/contact.html", wait_until="domcontentloaded")
        self.fill_contact_form(page)
        page.locator("#enquirySubmit").click()
        status = page.locator("#enquiryStatus")
        status.wait_for(state="visible")
        self.assertIn("error", status.get_attribute("class") or "")
        self.assertIn("Test service unavailable", status.inner_text())
        self.assertEqual(page.locator("#enquiryStatus.success").count(), 0)
        page.close()

    def test_contact_form_shows_success_only_after_api_confirms(self):
        page = self.browser.new_page(viewport={"width": 1360, "height": 900})
        page.route("**/api/enquiries", lambda route: route.fulfill(
            status=201, content_type="application/json",
            body=json.dumps({"ok": True, "message": "Your enquiry has been received.",
                             "reference": "CC-2026-000001"})))
        page.goto(BASE_URL + "/contact.html", wait_until="domcontentloaded")
        self.fill_contact_form(page)
        status = page.locator("#enquiryStatus")
        self.assertNotIn("success", status.get_attribute("class") or "")
        page.locator("#enquirySubmit").click()
        status.wait_for(state="visible")
        self.assertIn("success", status.get_attribute("class") or "")
        self.assertIn("CC-2026-000001", status.inner_text())
        page.close()


    def test_faq_search_category_filter_and_answer_disclosure(self):
        page = self.browser.new_page(viewport={"width": 390, "height": 844})
        page.goto(BASE_URL + "/faq.html", wait_until="domcontentloaded")
        search = page.locator("#faq-search-input")
        search.fill("registration")
        visible = page.locator(".faq-item:visible")
        self.assertGreaterEqual(visible.count(), 2)
        self.assertTrue(page.locator(".faq-group h3", has_text="Services, availability and accounts").is_visible())
        self.assertFalse(page.locator(".faq-group h3", has_text="About ClinicConsilium").is_visible())
        search.fill("")
        page.get_by_role("button", name="Providers", exact=True).click()
        self.assertEqual(page.locator(".faq-group:visible").count(), 1)
        self.assertTrue(page.locator(".faq-group h3", has_text="Healthcare providers and network participation").is_visible())
        first = page.locator(".faq-item:visible").first
        first.locator("summary").click()
        self.assertTrue(first.evaluate("(el) => el.open"))
        page.close()

if __name__ == "__main__":
    unittest.main(verbosity=2)
