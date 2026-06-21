import sys
import os
import json
import urllib.request
import urllib.error

API_URL = "http://localhost:8000/api/v1"

def make_post_request(url, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            return response.getcode(), json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))
    except Exception as e:
        return 500, str(e)

print("1. Testing Super Admin Login")
status, res = make_post_request(f"{API_URL}/auth/login", {
    "email": "superadmin@centleos.com",
    "password": "SuperAdmin@123"
})
if status == 200:
    print("Super Admin Login: SUCCESS")
else:
    print(f"Super Admin Login: FAILED - {res}")

print("\n2. Testing Company Admin Login")
status, res = make_post_request(f"{API_URL}/auth/login", {
    "email": "admin@saasum.com",
    "password": "CompanyAdmin@123",
    "company_slug": "saasum"
})
if status == 200:
    print("Company Admin Login: SUCCESS")
else:
    print(f"Company Admin Login: FAILED - {res}")

print("\n3. Testing User Registration (manual)")
# Generate unique email for registration to avoid conflicts if already exists
status, res = make_post_request(f"{API_URL}/saas/register-user", {
    "workspace_slug": "saasum",
    "email": "newuser@centleos.com",
    "password": "User@1234",
    "full_name": "New Registered User"
})
if status == 201:
    print("User Registration: SUCCESS")
elif status == 409:
    print("User Registration: ALREADY EXISTS (SUCCESS)")
else:
    print(f"User Registration: FAILED - {res}")

print("\n4. Testing Registered User Login")
status, res = make_post_request(f"{API_URL}/auth/login", {
    "email": "newuser@centleos.com",
    "password": "User@1234",
    "company_slug": "saasum"
})
if status == 200:
    print("User Login: SUCCESS")
else:
    print(f"User Login: FAILED - {res}")
