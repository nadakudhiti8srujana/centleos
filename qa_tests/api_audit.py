import urllib.request
import urllib.parse
import json
import time

BASE_URL = "http://localhost:8000"
test_email = f"qa.test.{int(time.time())}@example.com"
test_password = "Password123!"
test_slug = f"qa-workspace-{int(time.time())}"

results = {
    "Working Features": [],
    "Broken Features": [],
    "Missing Features": [],
    "Security Issues": [],
    "Performance Issues": [],
    "Errors": []
}

def request(method, path, data=None, token=None):
    url = BASE_URL + path
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    data_encoded = json.dumps(data).encode('utf-8') if data else None

    req = urllib.request.Request(url, data=data_encoded, headers=headers, method=method)
    try:
        start_time = time.time()
        with urllib.request.urlopen(req) as response:
            res_data = response.read()
            if time.time() - start_time > 2.0:
                results["Performance Issues"].append(f"Endpoint {path} took {time.time() - start_time:.2f}s")
            return response.status, json.loads(res_data) if res_data else {}
    except urllib.error.HTTPError as e:
        body = e.read()
        return e.code, body.decode('utf-8')
    except Exception as e:
        return 0, str(e)

# 1. Authentication
print("Testing Authentication...")
status, res = request("POST", "/api/v1/saas/register", {
    "admin_email": test_email,
    "admin_password": test_password,
    "admin_full_name": "QA Tester",
    "company_name": "QA Company",
    "workspace_slug": test_slug
})
if status in [200, 201]:
    results["Working Features"].append("Authentication: SaaS Register")
else:
    results["Broken Features"].append("Authentication: SaaS Register")
    results["Errors"].append(f"Register failed: {status} {res}")

status, res = request("POST", "/api/v1/auth/login", {
    "email": test_email,
    "password": test_password,
    "company_slug": test_slug
})
token = None
if status == 200 and isinstance(res, dict) and "access_token" in res:
    results["Working Features"].append("Authentication: Login")
    token = res["access_token"]
else:
    results["Broken Features"].append("Authentication: Login")
    results["Errors"].append(f"Login failed: {status} {res}")

if not token:
    print("Cannot proceed without token. Using default Super Admin token if possible or aborting.")
    with open("qa_audit_report.json", "w") as f:
        json.dump(results, f, indent=2)
    exit(1)

# Now iterate through basic crud endpoints
modules = {
    "Leads": {
        "url": "/api/v1/leads",
        "create_payload": {"first_name": "John", "last_name": "Doe", "email": "john@example.com", "status": "NEW"}
    },
    "Contacts": {
        "url": "/api/v1/contacts",
        "create_payload": {"first_name": "Jane", "last_name": "Doe", "email": "jane@example.com"}
    },
    "Deals": {
        "url": "/api/v1/deals",
        "create_payload": {"name": "Big Deal", "amount": 10000.0, "stage_id": 1}
    },
    "Invoices": {
        "url": "/api/v1/erp/invoices",
        "create_payload": {"client_id": 1, "amount": 500.0, "status": "DRAFT"}
    },
    "Referrals": {
        "url": "/api/v1/referrals",
        "create_payload": {"referrer_email": "ref@example.com"}
    },
    "Notifications": {
        "url": "/api/v1/notifications",
        "create_payload": None # Just get
    },
    "Email Templates": {
        "url": "/api/v1/email-templates",
        "create_payload": {"name": "Welcome", "subject": "Hi", "body": "Hello"}
    }
}

for mod, info in modules.items():
    print(f"Testing {mod}...")
    url = info["url"]
    
    # Test GET List
    status, res = request("GET", url, token=token)
    if status == 200:
        results["Working Features"].append(f"{mod}: List (GET)")
    elif status == 404:
        results["Missing Features"].append(f"{mod}: Endpoint {url} Not Found")
    else:
        results["Broken Features"].append(f"{mod}: List (GET) failed")
        results["Errors"].append(f"GET {url} failed: {status} {res}")

    # Test CREATE
    if info["create_payload"]:
        status, res = request("POST", url, data=info["create_payload"], token=token)
        if status in [200, 201]:
            results["Working Features"].append(f"{mod}: Create (POST)")
            item_id = None
            if isinstance(res, dict):
                item_id = res.get("id")
            
            # Test DELETE
            if item_id:
                del_status, del_res = request("DELETE", f"{url}/{item_id}", token=token)
                if del_status in [200, 204]:
                    results["Working Features"].append(f"{mod}: Delete (DELETE)")
                else:
                    results["Broken Features"].append(f"{mod}: Delete (DELETE) failed")
                    results["Errors"].append(f"DELETE {url}/{item_id} failed: {del_status} {del_res}")
        else:
            results["Broken Features"].append(f"{mod}: Create (POST) failed")
            results["Errors"].append(f"POST {url} failed: {status} {res}")

with open("qa_audit_report.json", "w") as f:
    json.dump(results, f, indent=2)

print("Audit complete.")
