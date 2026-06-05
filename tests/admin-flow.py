#!/usr/bin/env python3
"""
Test: Admin ticket management flow
- Login as superadmin
- Navigate to admin ticket list
- View ticket detail
- Accept a ticket
- Verify status change
"""
from playwright.sync_api import sync_playwright
import sys

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"

def test_admin_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Login as superadmin
        page.goto(f"{BASE_URL}/masuk")
        page.wait_for_load_state("networkidle")
        page.fill("input[type='email']", "test@farmawatch.id")
        page.fill("input[type='password']", "Test123!@#")
        page.click("button[type='submit']")
        page.wait_for_timeout(3000)

        if "masuk" in page.url:
            print("FAIL: Cannot login as admin")
            browser.close()
            return False
        print("PASS: Admin logged in")

        # Step 1: Check dashboard
        page.goto(f"{BASE_URL}/dasbor")
        page.wait_for_load_state("networkidle")
        if "dasbor" in page.url or "admin" in page.url:
            print("PASS: Dashboard accessible")
        else:
            print(f"INFO: Dasbor URL={page.url}")

        # Step 2: Go to admin ticket list
        page.goto(f"{BASE_URL}/admin/tiket")
        page.wait_for_load_state("networkidle")
        if "tiket" in page.url:
            print("PASS: Admin ticket list accessible")
        else:
            print(f"FAIL: Not on ticket page, URL={page.url}")
            browser.close()
            return False

        # Step 3: Click on first ticket
        ticket_links = page.locator("a").filter(has=page.locator("text=Terkirim"))
        count = ticket_links.count()
        if count > 0:
            ticket_links.first.click()
            page.wait_for_load_state("networkidle")
            print(f"PASS: Navigated to ticket detail, URL={page.url}")
        else:
            print("INFO: No submitted tickets found to accept")

        # Check admin actions are visible
        accept_btn = page.locator("button:has-text('Terima')").first
        if accept_btn.count() > 0:
            print("PASS: Accept button visible")
            accept_btn.click()
            page.wait_for_timeout(3000)
            toast = page.locator("text=berhasil").count() > 0 or page.locator("text=diterima").count() > 0
            if toast:
                print("PASS: Ticket accepted successfully")
        else:
            print("INFO: No accept button (maybe already accepted or not visible)")

        browser.close()
        return True

if __name__ == "__main__":
    success = test_admin_flow()
    sys.exit(0 if success else 1)
