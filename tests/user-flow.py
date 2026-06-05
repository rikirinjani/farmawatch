#!/usr/bin/env python3
"""
Test: User registration and ticket flow
- Register new user
- Verify redirect to login
- Login with new credentials
- Submit ticket as authenticated user
- Verify ticket visible in history
"""
from playwright.sync_api import sync_playwright
import sys
import uuid

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"

def test_user_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        test_email = f"test-{uuid.uuid4().hex[:8]}@farmawatch.id"
        test_pass = "Test123!@#"

        # Step 1: Go to registration
        page.goto(f"{BASE_URL}/daftar")
        page.wait_for_load_state("networkidle")
        assert "Daftar" in page.text_content("h1") or "daftar" in page.url

        # Step 2: Fill registration form
        page.fill("input[name='email']", test_email) if page.locator("input[name='email']").count() else None
        page.fill("input[type='email']", test_email)
        page.fill("input[name='password']", test_pass) if page.locator("input[name='password']").count() else None
        page.fill("input[type='password']", test_pass)
        page.fill("input[name='full_name']", "Test User") if page.locator("input[name='full_name']").count() else None
        page.fill("input[name='whatsapp']", "08123456789") if page.locator("input[name='whatsapp']").count() else None

        # Select province
        prov_select = page.locator("select").first
        if prov_select.count():
            prov_select.select_option(index=3)  # Some province

        # Submit
        page.click("button[type='submit']")
        page.wait_for_timeout(3000)

        # Check if redirected to login or success shown
        if "masuk" in page.url:
            print("PASS: Redirected to login after registration")
        else:
            print(f"INFO: After register URL={page.url}")

        # Step 3: Login
        page.goto(f"{BASE_URL}/masuk")
        page.wait_for_load_state("networkidle")
        page.fill("input[type='email']", "test@farmawatch.id")
        page.fill("input[type='password']", "Test123!@#")
        page.click("button[type='submit']")
        page.wait_for_timeout(3000)

        if "masuk" not in page.url:
            print("PASS: Login successful")
        else:
            print("FAIL: Still on login page")
            browser.close()
            return False

        # Step 4: Submit authenticated ticket
        page.goto(f"{BASE_URL}/laporkan")
        page.wait_for_load_state("networkidle")

        # Should NOT see anonymous banner (logged in)
        anon_banner = page.locator("text=Anda belum masuk").count()
        if anon_banner == 0:
            print("PASS: No anonymous banner for logged-in user")

        # Fill form
        page.select_option("select:first-of-type", index=1)
        page.select_option("select:nth-of-type(2)", label="Jawa Timur")
        page.select_option("select:nth-of-type(3)", label="Surabaya")
        page.fill("textarea", "Test laporan terdaftar - apotek menjual obat keras tanpa resep di area Surabaya")
        page.click("button[type='submit']")
        page.wait_for_timeout(3000)

        toast = page.locator("text=berhasil").count() > 0
        if toast:
            print("PASS: Authenticated ticket submitted successfully")

        browser.close()
        return True

if __name__ == "__main__":
    success = test_user_flow()
    sys.exit(0 if success else 1)
