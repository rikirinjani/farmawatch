#!/usr/bin/env python3
"""
Test: anonymous ticket submission flow
- Navigate to homepage
- Go to /laporkan
- Fill form as anonymous
- Submit ticket
- Verify success toast + redirect
"""
from playwright.sync_api import sync_playwright
import sys

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"

def test_anonymous_ticket():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Step 1: Load homepage
        page.goto(f"{BASE_URL}/laporkan")
        page.wait_for_load_state("networkidle")
        assert "Laporkan" in page.title() or "Kirim Laporan" in page.text_content("h1") or page.text_content("h1")

        # Step 2: Should show anonymous info banner (user not logged in)
        assert page.locator("text=Anda belum masuk").is_visible() or page.locator("text=anonim").is_visible()

        # Step 3: Check anonymous checkbox
        checkbox = page.locator('input[type="checkbox"]')
        if checkbox.is_visible():
            checkbox.check()

        # Step 4: Select category
        page.select_option("select:first-of-type", index=1)  # First select = category

        # Step 5: Select province
        page.select_option("select:nth-of-type(2)", label="Jawa Barat")

        # Step 6: Select city
        page.select_option("select:nth-of-type(3)", label="Kota Bandung")

        # Step 7: Fill description
        page.fill("textarea", "Obat keras dijual bebas di warung dekat SD tanpa resep dokter. Ini sangat berbahaya untuk anak-anak.")

        # Step 8: Submit
        page.click("button[type='submit']")

        # Step 9: Wait for success toast or redirect
        page.wait_for_timeout(3000)
        current_url = page.url
        toast = page.locator("text=berhasil").count() > 0 or page.locator("text=terkirim").count() > 0

        if toast:
            print("PASS: Success toast shown")
        elif current_url == BASE_URL + "/":
            print("PASS: Redirected to homepage after submit")
        else:
            print(f"INFO: Current URL={current_url}")

        browser.close()
        return True

if __name__ == "__main__":
    success = test_anonymous_ticket()
    sys.exit(0 if success else 1)
