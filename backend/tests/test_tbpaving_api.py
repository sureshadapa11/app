"""T&B Paving backend API tests.
Covers: enquiries (public+auth), paving-estimate (public AI), admin auth seed.
"""
import os
import pytest
import requests

BASE = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://buildflow-156.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"

ADMIN_EMAIL = "admin@tbpaving.co.uk"
ADMIN_PASSWORD = "paving2009"


@pytest.fixture(scope="module")
def admin_token():
    """Ensure admin user exists and return its JWT token."""
    # Try login first
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    if r.status_code == 200:
        return r.json()["token"]
    # Otherwise register
    r2 = requests.post(
        f"{API}/auth/register",
        json={"name": "T&B Admin", "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD, "role": "contractor"},
        timeout=15,
    )
    assert r2.status_code == 200, f"Could not register admin: {r2.status_code} {r2.text}"
    return r2.json()["token"]


# ----- Public enquiry submission -----
class TestEnquiriesPublic:
    def test_create_enquiry_public_no_auth(self):
        payload = {
            "name": "TEST_Pytest Customer",
            "phone": "07700 900111",
            "email": "TEST_pytest@example.com",
            "service": "Block Paving",
            "message": "TEST pytest enquiry - please ignore.",
        }
        r = requests.post(f"{API}/enquiries", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j.get("ok") is True
        assert isinstance(j.get("id"), str) and len(j["id"]) > 10
        pytest.enquiry_id = j["id"]

    def test_create_enquiry_minimal_name_only(self):
        r = requests.post(f"{API}/enquiries", json={"name": "TEST_MinName"}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_list_enquiries_requires_auth(self):
        r = requests.get(f"{API}/enquiries", timeout=15)
        # Should fail without auth
        assert r.status_code in (401, 403), r.text


# ----- Authed enquiry listing + status update -----
class TestEnquiriesAdmin:
    def test_list_enquiries_with_auth_contains_created(self, admin_token):
        r = requests.get(f"{API}/enquiries", headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        # The earlier created enquiry should be present
        ids = [e.get("id") for e in data]
        assert getattr(pytest, "enquiry_id", None) in ids
        # No mongo _id leaks
        for e in data[:5]:
            assert "_id" not in e
            assert "id" in e and "created_at" in e and "status" in e

    def test_update_enquiry_status(self, admin_token):
        eid = getattr(pytest, "enquiry_id", None)
        assert eid, "Need an enquiry id from earlier test"
        r = requests.put(
            f"{API}/enquiries/{eid}/status",
            params={"status": "contacted"},
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True

        # Verify persisted by re-listing
        r2 = requests.get(f"{API}/enquiries", headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
        assert r2.status_code == 200
        match = [e for e in r2.json() if e["id"] == eid]
        assert match and match[0]["status"] == "contacted"


# ----- AI paving estimate (public) -----
class TestPavingEstimate:
    def test_paving_estimate_returns_gbp_text(self):
        payload = {"service": "Block Paving", "area": "40 sqm", "material": "Marshalls Drivesett"}
        r = requests.post(f"{API}/ai/paving-estimate", json=payload, timeout=120)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "estimate" in j
        text = j["estimate"]
        assert isinstance(text, str) and len(text) > 20
        # Should contain a £ figure / ESTIMATE marker
        assert "£" in text or "GBP" in text.upper(), f"Estimate missing £ figure: {text[:200]}"

    def test_paving_estimate_minimal(self):
        r = requests.post(f"{API}/ai/paving-estimate", json={"service": "Patios & Paving"}, timeout=120)
        assert r.status_code == 200
        assert "estimate" in r.json()


# ----- Auth sanity for admin -----
class TestAdminAuth:
    def test_admin_login_works(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200, r.text
        assert "token" in r.json()
        assert r.json()["user"]["email"] == ADMIN_EMAIL

    def test_admin_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrongpw"}, timeout=15)
        assert r.status_code == 401
