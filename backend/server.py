from fastapi import FastAPI, APIRouter, HTTPException, Query, Request, Depends, Body, Header
from fastapi.responses import HTMLResponse, PlainTextResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import sqlite3
import subprocess
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Any
import uuid
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
import json
import re
import requests
import xml.etree.ElementTree as ET
import urllib.parse
import pickle
import base64
import hashlib
import hmac
import yaml

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# SQLite setup for SQL Injection vulnerabilities
SQLITE_DB = ROOT_DIR / 'vulnerable.db'

def init_sqlite():
    conn = sqlite3.connect(SQLITE_DB)
    cursor = conn.cursor()
    
    # Products table for SQL Injection
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            category TEXT,
            image_url TEXT,
            stock INTEGER DEFAULT 100
        )
    ''')
    
    # Legacy users table for SQL Injection (login bypass)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS legacy_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email TEXT,
            is_admin INTEGER DEFAULT 0
        )
    ''')
    
    # Check if products exist
    cursor.execute('SELECT COUNT(*) FROM products')
    if cursor.fetchone()[0] == 0:
        products = [
            ('Ghost Phone X1', 'Untraceable encrypted communication device', 999.99, 'Communication', 'https://images.unsplash.com/photo-1643186042811-63a2b94c7f98?crop=entropy&cs=srgb&fm=jpg&q=85'),
            ('Neon Decor Light', 'Cyberpunk aesthetic LED display', 149.50, 'Lifestyle', 'https://images.unsplash.com/photo-1573761449626-1b80629dafc3?crop=entropy&cs=srgb&fm=jpg&q=85'),
            ('Encrypted Drive 2TB', 'Military-grade encrypted storage', 299.99, 'Storage', 'https://images.unsplash.com/photo-1754301735329-660c07c97b17?crop=entropy&cs=srgb&fm=jpg&q=85'),
            ('Shadow Router Pro', 'Anonymous network routing device', 599.00, 'Network', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?crop=entropy&cs=srgb&fm=jpg&q=85'),
            ('Stealth Keyboard MK7', 'Anti-keylogger mechanical keyboard', 189.99, 'Hardware', 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?crop=entropy&cs=srgb&fm=jpg&q=85'),
            ('Privacy Screen Filter', 'Anti-surveillance monitor filter', 79.99, 'Security', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?crop=entropy&cs=srgb&fm=jpg&q=85'),
            ('Faraday Bag XL', 'Signal blocking storage bag', 49.99, 'Security', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?crop=entropy&cs=srgb&fm=jpg&q=85'),
            ('Crypto Hardware Wallet', 'Cold storage for digital assets', 129.99, 'Finance', 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?crop=entropy&cs=srgb&fm=jpg&q=85'),
        ]
        cursor.executemany('INSERT INTO products (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)', products)
    
    # Check if legacy admin exists
    cursor.execute('SELECT COUNT(*) FROM legacy_users')
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO legacy_users (username, password, email, is_admin) VALUES ('admin', 'admin123', 'admin@vulnshop.local', 1)")
        cursor.execute("INSERT INTO legacy_users (username, password, email, is_admin) VALUES ('guest', 'guest', 'guest@vulnshop.local', 0)")
    
    conn.commit()
    conn.close()

init_sqlite()

# JWT Secret (intentionally weak for lab)
JWT_SECRET = "vulnerable_secret_key_123"
JWT_ALGORITHM = "HS256"

app = FastAPI(title="VulnShop - Cyber Security Lab")
api_router = APIRouter(prefix="/api")

# Hidden admin router (challenge: find this endpoint)
admin_router = APIRouter(prefix="/api/c0ntr0l-p4n3l")

# ============== MODELS ==============

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class ProductReview(BaseModel):
    product_id: str
    rating: int
    comment: str  # VULNERABLE: Stored XSS

class CartItem(BaseModel):
    product_id: int
    quantity: int  # VULNERABLE: No validation for negative

class ApplyCoupon(BaseModel):
    code: str

class CheckoutRequest(BaseModel):
    items: List[CartItem]
    coupon_code: Optional[str] = None
    shipping_address: str

class ProfileUpdate(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None  # VULNERABLE: Privilege escalation

class ExportRequest(BaseModel):
    format: str  # VULNERABLE: Command injection
    filename: str

class SSRFRequest(BaseModel):
    url: str  # VULNERABLE: SSRF

class XMLImportRequest(BaseModel):
    xml_data: str  # VULNERABLE: XXE

class DeserializeRequest(BaseModel):
    data: str  # VULNERABLE: Pickle deserialization
    format: str = "pickle"  # pickle, yaml, json

class JWTDecodeRequest(BaseModel):
    token: str

class JWTCreateRequest(BaseModel):
    payload: dict
    algorithm: str = "HS256"  # VULNERABLE: Algorithm confusion

# ============== AUTH HELPERS ==============

# VULNERABLE: Weak and predictable secret
JWT_SECRET = "vulnerable_secret_key_123"
JWT_ALGORITHM = "HS256"

# VULNERABLE: Additional weak secrets for brute force
WEAK_SECRETS = ["secret", "password", "123456", "admin", "key", JWT_SECRET]

def create_token(user_id: str, username: str, role: str = "user"):
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except:
        return None

def decode_token_vulnerable(token: str, algorithms: List[str] = None):
    """VULNERABLE: Accepts algorithm from token header"""
    try:
        if algorithms is None:
            # VULNERABLE: Accept any algorithm including 'none'
            header = jwt.get_unverified_header(token)
            alg = header.get('alg', 'HS256')
            if alg.lower() == 'none':
                # VULNERABLE: Accept unsigned tokens
                parts = token.split('.')
                if len(parts) >= 2:
                    payload_b64 = parts[1]
                    # Add padding if needed
                    padding = 4 - len(payload_b64) % 4
                    if padding != 4:
                        payload_b64 += '=' * padding
                    payload = json.loads(base64.urlsafe_b64decode(payload_b64))
                    return payload
            algorithms = [alg]
        return jwt.decode(token, JWT_SECRET, algorithms=algorithms)
    except Exception as e:
        return {"error": str(e)}

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.replace("Bearer ", "")
    return decode_token(token)

# ============== VULNERABLE ENDPOINTS ==============

# --- SQL INJECTION: Product Search ---
@api_router.get("/products/search")
async def search_products(q: str = Query("")):
    """VULNERABLE: SQL Injection in search query"""
    conn = sqlite3.connect(SQLITE_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # VULNERABLE: Direct string concatenation
    query = f"SELECT * FROM products WHERE name LIKE '%{q}%' OR description LIKE '%{q}%' OR category LIKE '%{q}%'"
    
    try:
        cursor.execute(query)
        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"products": results, "query": q}
    except Exception as e:
        conn.close()
        return {"error": str(e), "query": q}

# --- SQL INJECTION: Legacy Login ---
@api_router.post("/auth/legacy-login")
async def legacy_login(username: str = Query(...), password: str = Query(...)):
    """VULNERABLE: SQL Injection in login"""
    conn = sqlite3.connect(SQLITE_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # VULNERABLE: Direct string concatenation
    query = f"SELECT * FROM legacy_users WHERE username='{username}' AND password='{password}'"
    
    try:
        cursor.execute(query)
        user = cursor.fetchone()
        conn.close()
        
        if user:
            return {
                "success": True,
                "user": dict(user),
                "token": create_token(str(user['id']), user['username'], "admin" if user['is_admin'] else "user")
            }
        return {"success": False, "message": "Invalid credentials"}
    except Exception as e:
        conn.close()
        return {"error": str(e)}

# --- NoSQL INJECTION: User Lookup ---
@api_router.get("/users/lookup")
async def lookup_user(filter: str = Query("{}")):
    """VULNERABLE: NoSQL Injection - filter is parsed as JSON"""
    try:
        # VULNERABLE: Direct JSON parsing from user input
        filter_dict = json.loads(filter)
        users = await db.users.find(filter_dict, {"_id": 0, "password": 0}).to_list(100)
        return {"users": users}
    except Exception as e:
        return {"error": str(e)}

# --- COMMAND INJECTION: Export Feature ---
@api_router.post("/export/orders")
async def export_orders(request: ExportRequest, user = Depends(get_current_user)):
    """VULNERABLE: Command Injection in export"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # VULNERABLE: User input directly in shell command
    filename = request.filename
    format_type = request.format
    
    try:
        # VULNERABLE: Command injection possible via filename or format
        cmd = f"echo 'Order export for {user['username']}' > /tmp/{filename}.{format_type}"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return {"message": f"Export created: {filename}.{format_type}", "output": result.stdout}
    except Exception as e:
        return {"error": str(e)}

# --- REFLECTED XSS: Search Results ---
@api_router.get("/search/render", response_class=HTMLResponse)
async def render_search(q: str = Query("")):
    """VULNERABLE: Reflected XSS - query is reflected without encoding"""
    # VULNERABLE: Direct reflection of user input in HTML
    html = f"""
    <html>
    <head><title>Search Results</title></head>
    <body style="background:#030304;color:#fff;font-family:monospace;">
        <h1>Search Results for: {q}</h1>
        <p>No products found matching your query.</p>
        <a href="/" style="color:#00F0FF;">Back to Home</a>
    </body>
    </html>
    """
    return HTMLResponse(content=html)

# --- STORED XSS: Product Reviews ---
@api_router.post("/reviews")
async def add_review(review: ProductReview, user = Depends(get_current_user)):
    """VULNERABLE: Stored XSS in review comments"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    review_doc = {
        "id": str(uuid.uuid4()),
        "product_id": review.product_id,
        "user_id": user['user_id'],
        "username": user['username'],
        "rating": review.rating,
        "comment": review.comment,  # VULNERABLE: No sanitization
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review_doc)
    return {"success": True, "review": {k: v for k, v in review_doc.items() if k != '_id'}}

@api_router.get("/reviews/{product_id}")
async def get_reviews(product_id: str):
    """Returns reviews with potentially malicious content"""
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(100)
    return {"reviews": reviews}

# --- IDOR: User Profile Access ---
@api_router.get("/profile/{user_id}")
async def get_profile(user_id: str):
    """VULNERABLE: IDOR - No authorization check"""
    # VULNERABLE: Any user can access any profile
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"profile": user}

# --- IDOR: Order Access ---
@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """VULNERABLE: IDOR - No authorization check"""
    # VULNERABLE: Any user can access any order
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"order": order}

# --- PRIVILEGE ESCALATION: Profile Update ---
@api_router.put("/profile/update")
async def update_profile(update: ProfileUpdate, user = Depends(get_current_user)):
    """VULNERABLE: Mass assignment / Privilege escalation"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # VULNERABLE: User can update their own role
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    if update_data:
        await db.users.update_one(
            {"id": user['user_id']},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"id": user['user_id']}, {"_id": 0, "password": 0})
    return {"success": True, "profile": updated_user}

# --- BUSINESS LOGIC: Checkout with vulnerabilities ---
@api_router.post("/checkout")
async def checkout(request: CheckoutRequest, user = Depends(get_current_user)):
    """VULNERABLE: Multiple business logic flaws"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    conn = sqlite3.connect(SQLITE_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    total = 0.0
    order_items = []
    
    for item in request.items:
        cursor.execute("SELECT * FROM products WHERE id = ?", (item.product_id,))
        product = cursor.fetchone()
        
        if product:
            # VULNERABLE: No validation for negative quantity
            item_total = product['price'] * item.quantity
            total += item_total
            order_items.append({
                "product_id": item.product_id,
                "name": product['name'],
                "price": product['price'],
                "quantity": item.quantity,  # Can be negative!
                "subtotal": item_total
            })
    
    conn.close()
    
    discount = 0.0
    coupon_applied = None
    
    if request.coupon_code:
        # VULNERABLE: Coupon can be reused (no tracking)
        coupon = await db.coupons.find_one({"code": request.coupon_code.upper()})
        if coupon:
            if coupon['type'] == 'percentage':
                discount = total * (coupon['value'] / 100)
            else:
                discount = coupon['value']
            coupon_applied = coupon['code']
    
    # VULNERABLE: Rounding error exploitation
    # Discount applied per item can cause precision issues
    final_total = total - discount
    
    # VULNERABLE: No check if final_total is negative
    order = {
        "id": str(uuid.uuid4()),
        "user_id": user['user_id'],
        "items": order_items,
        "subtotal": total,
        "discount": discount,
        "coupon_used": coupon_applied,
        "total": round(final_total, 2),  # Rounding can be exploited
        "shipping_address": request.shipping_address,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order)
    
    return {
        "success": True,
        "order": {k: v for k, v in order.items() if k != '_id'}
    }

# --- COUPON SYSTEM ---
@api_router.get("/coupons/validate/{code}")
async def validate_coupon(code: str):
    """Check if coupon is valid"""
    coupon = await db.coupons.find_one({"code": code.upper()}, {"_id": 0})
    if coupon:
        return {"valid": True, "coupon": coupon}
    return {"valid": False}

# ============== SSRF VULNERABILITY ==============

@api_router.post("/webhook/test")
async def test_webhook(request: SSRFRequest):
    """VULNERABLE: Server-Side Request Forgery (SSRF)
    Allows attacker to make requests from the server to internal services
    """
    try:
        # VULNERABLE: No URL validation - can access internal services
        response = requests.get(request.url, timeout=5)
        return {
            "status_code": response.status_code,
            "content_length": len(response.text),
            "content": response.text[:2000],  # Limit response size
            "headers": dict(response.headers)
        }
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

@api_router.get("/fetch-image")
async def fetch_image(url: str = Query(...)):
    """VULNERABLE: SSRF via image fetching
    Can be used to scan internal network
    """
    try:
        # VULNERABLE: No URL validation
        response = requests.get(url, timeout=5)
        return {
            "url": url,
            "status": response.status_code,
            "content_type": response.headers.get("Content-Type", "unknown"),
            "size": len(response.content)
        }
    except Exception as e:
        return {"error": str(e), "url": url}

# ============== XXE VULNERABILITY ==============

@api_router.post("/import/products")
async def import_products_xml(request: XMLImportRequest):
    """VULNERABLE: XML External Entity (XXE) Injection
    Allows reading local files and SSRF via XML entities
    """
    try:
        # VULNERABLE: Using unsafe XML parser that processes external entities
        # This is intentionally vulnerable - in production, use defusedxml
        parser = ET.XMLParser()
        root = ET.fromstring(request.xml_data, parser=parser)
        
        products = []
        for product in root.findall('.//product'):
            prod_data = {
                "name": product.findtext('name', ''),
                "price": product.findtext('price', '0'),
                "description": product.findtext('description', ''),
                "category": product.findtext('category', '')
            }
            products.append(prod_data)
        
        return {
            "success": True,
            "parsed_products": products,
            "raw_text": ET.tostring(root, encoding='unicode')
        }
    except ET.ParseError as e:
        return {"error": f"XML Parse Error: {str(e)}"}
    except Exception as e:
        return {"error": str(e)}

@api_router.post("/config/import")
async def import_config(xml_content: str = Body(..., media_type="application/xml")):
    """VULNERABLE: XXE via config import
    Another XXE vector via raw XML body
    """
    try:
        # VULNERABLE: Unsafe XML parsing
        root = ET.fromstring(xml_content)
        
        config = {}
        for elem in root:
            config[elem.tag] = elem.text
        
        return {"success": True, "config": config}
    except Exception as e:
        return {"error": str(e)}

# ============== DOCUMENTATION ENDPOINT ==============

@api_router.get("/vulnerabilities")
async def get_vulnerabilities():
    """Get list of all vulnerabilities in this lab"""
    return {
        "vulnerabilities": [
            {
                "id": "sqli-search",
                "name": "SQL Injection - Product Search",
                "category": "Injection",
                "severity": "Critical",
                "endpoint": "/api/products/search?q=",
                "method": "GET",
                "description": "Search parameter is directly concatenated into SQL query without sanitization",
                "example_payload": "' OR '1'='1' --",
                "impact": "Data exfiltration, authentication bypass, database manipulation",
                "cwe": "CWE-89"
            },
            {
                "id": "sqli-login",
                "name": "SQL Injection - Legacy Login",
                "category": "Injection",
                "severity": "Critical",
                "endpoint": "/api/auth/legacy-login",
                "method": "POST",
                "description": "Username and password are directly used in SQL query",
                "example_payload": "admin'--",
                "impact": "Authentication bypass, access to admin account",
                "cwe": "CWE-89"
            },
            {
                "id": "nosqli",
                "name": "NoSQL Injection - User Lookup",
                "category": "Injection",
                "severity": "High",
                "endpoint": "/api/users/lookup?filter=",
                "method": "GET",
                "description": "Filter parameter is parsed as JSON and used directly in MongoDB query",
                "example_payload": '{"$ne": null}',
                "impact": "Data exfiltration, query manipulation",
                "cwe": "CWE-943"
            },
            {
                "id": "cmdi",
                "name": "Command Injection - Export",
                "category": "Injection",
                "severity": "Critical",
                "endpoint": "/api/export/orders",
                "method": "POST",
                "description": "Filename parameter is used in shell command without sanitization",
                "example_payload": "test; cat /etc/passwd",
                "impact": "Remote code execution, server compromise",
                "cwe": "CWE-78"
            },
            {
                "id": "ssrf-webhook",
                "name": "SSRF - Webhook Test",
                "category": "Server-Side Request Forgery",
                "severity": "High",
                "endpoint": "/api/webhook/test",
                "method": "POST",
                "description": "URL parameter is fetched by server without validation",
                "example_payload": "http://localhost:8001/api/c0ntr0l-p4n3l/system",
                "impact": "Internal network scanning, access to internal services, cloud metadata exposure",
                "cwe": "CWE-918"
            },
            {
                "id": "ssrf-image",
                "name": "SSRF - Image Fetch",
                "category": "Server-Side Request Forgery",
                "severity": "High",
                "endpoint": "/api/fetch-image?url=",
                "method": "GET",
                "description": "Image URL is fetched without validation",
                "example_payload": "http://169.254.169.254/latest/meta-data/",
                "impact": "Cloud metadata access, internal service discovery",
                "cwe": "CWE-918"
            },
            {
                "id": "xxe-import",
                "name": "XXE - Product Import",
                "category": "XML External Entity",
                "severity": "High",
                "endpoint": "/api/import/products",
                "method": "POST",
                "description": "XML parser processes external entities without restriction",
                "example_payload": '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><products><product><name>&xxe;</name></product></products>',
                "impact": "Local file disclosure, SSRF, denial of service",
                "cwe": "CWE-611"
            },
            {
                "id": "xxe-config",
                "name": "XXE - Config Import",
                "category": "XML External Entity",
                "severity": "High",
                "endpoint": "/api/config/import",
                "method": "POST",
                "description": "Raw XML body parsed unsafely",
                "example_payload": '<?xml version="1.0"?><!DOCTYPE config [<!ENTITY xxe SYSTEM "file:///etc/hostname">]><config><setting>&xxe;</setting></config>',
                "impact": "Local file disclosure, server information leakage",
                "cwe": "CWE-611"
            },
            {
                "id": "idor-profile",
                "name": "IDOR - Profile Access",
                "category": "Broken Access Control",
                "severity": "Medium",
                "endpoint": "/api/profile/{user_id}",
                "method": "GET",
                "description": "No authorization check - any user can access any profile by ID",
                "example_payload": "Try different user IDs",
                "impact": "Unauthorized access to user data",
                "cwe": "CWE-639"
            },
            {
                "id": "idor-orders",
                "name": "IDOR - Order Access",
                "category": "Broken Access Control",
                "severity": "Medium",
                "endpoint": "/api/orders/{order_id}",
                "method": "GET",
                "description": "No authorization check on order retrieval",
                "example_payload": "Enumerate order UUIDs",
                "impact": "Access to other users' order information",
                "cwe": "CWE-639"
            },
            {
                "id": "privesc",
                "name": "Privilege Escalation - Role Update",
                "category": "Broken Access Control",
                "severity": "Critical",
                "endpoint": "/api/profile/update",
                "method": "PUT",
                "description": "User can update their own role field to gain admin privileges",
                "example_payload": '{"role": "admin"}',
                "impact": "Elevation to admin privileges",
                "cwe": "CWE-269"
            },
            {
                "id": "xss-stored",
                "name": "Stored XSS - Reviews",
                "category": "Cross-Site Scripting",
                "severity": "High",
                "endpoint": "/api/reviews",
                "method": "POST",
                "description": "Review comments are stored and rendered without sanitization",
                "example_payload": "<script>alert('XSS')</script>",
                "impact": "Session hijacking, phishing, malware distribution",
                "cwe": "CWE-79"
            },
            {
                "id": "xss-reflected",
                "name": "Reflected XSS - Search Render",
                "category": "Cross-Site Scripting",
                "severity": "Medium",
                "endpoint": "/api/search/render?q=",
                "method": "GET",
                "description": "Search query is reflected in HTML response without encoding",
                "example_payload": "<script>alert(document.cookie)</script>",
                "impact": "Session theft, credential harvesting",
                "cwe": "CWE-79"
            },
            {
                "id": "biz-logic-negative",
                "name": "Business Logic - Negative Quantity",
                "category": "Business Logic",
                "severity": "High",
                "endpoint": "/api/checkout",
                "method": "POST",
                "description": "No validation for negative quantities in cart items",
                "example_payload": '{"quantity": -10}',
                "impact": "Price manipulation, free products, credit to account",
                "cwe": "CWE-20"
            },
            {
                "id": "biz-logic-coupon",
                "name": "Business Logic - Coupon Reuse",
                "category": "Business Logic",
                "severity": "Medium",
                "endpoint": "/api/checkout",
                "method": "POST",
                "description": "Coupons are not marked as used after application",
                "example_payload": "Use WELCOME10 multiple times",
                "impact": "Unlimited discounts",
                "cwe": "CWE-837"
            },
            {
                "id": "hidden-admin",
                "name": "Hidden Admin Panel",
                "category": "Security Misconfiguration",
                "severity": "Info",
                "endpoint": "/api/c0ntr0l-p4n3l/",
                "method": "GET",
                "description": "Admin panel hidden at non-obvious endpoint",
                "example_payload": "Directory enumeration or code review",
                "impact": "Access to admin functionality",
                "cwe": "CWE-200"
            }
        ],
        "total_count": 16,
        "categories": {
            "Injection": 4,
            "Server-Side Request Forgery": 2,
            "XML External Entity": 2,
            "Broken Access Control": 3,
            "Cross-Site Scripting": 2,
            "Business Logic": 2,
            "Security Misconfiguration": 1
        }
    }

# ============== NORMAL ENDPOINTS ==============

@api_router.get("/")
async def root():
    return {"message": "VulnShop API - Cyber Security Lab", "version": "1.0.0"}

@api_router.get("/products")
async def get_products():
    """Get all products from SQLite"""
    conn = sqlite3.connect(SQLITE_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products")
    products = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"products": products}

@api_router.get("/products/{product_id}")
async def get_product(product_id: int):
    """Get single product"""
    conn = sqlite3.connect(SQLITE_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    product = cursor.fetchone()
    conn.close()
    
    if product:
        return {"product": dict(product)}
    raise HTTPException(status_code=404, detail="Product not found")

@api_router.post("/auth/register")
async def register(user: UserRegister):
    """Register new user"""
    existing = await db.users.find_one({"$or": [{"username": user.username}, {"email": user.email}]})
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    hashed_password = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "username": user.username,
        "email": user.email,
        "password": hashed_password,
        "role": "user",
        "balance": 1000.00,  # Starting balance
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_doc['id'], user_doc['username'], user_doc['role'])
    
    return {
        "success": True,
        "user": {k: v for k, v in user_doc.items() if k not in ['_id', 'password']},
        "token": token
    }

@api_router.post("/auth/login")
async def login(user: UserLogin):
    """Login user"""
    db_user = await db.users.find_one({"username": user.username})
    
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(user.password.encode(), db_user['password'].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(db_user['id'], db_user['username'], db_user.get('role', 'user'))
    
    return {
        "success": True,
        "user": {k: v for k, v in db_user.items() if k not in ['_id', 'password']},
        "token": token
    }

@api_router.get("/auth/me")
async def get_me(user = Depends(get_current_user)):
    """Get current user"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db_user = await db.users.find_one({"id": user['user_id']}, {"_id": 0, "password": 0})
    return {"user": db_user}

@api_router.get("/orders")
async def get_user_orders(user = Depends(get_current_user)):
    """Get current user's orders"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    orders = await db.orders.find({"user_id": user['user_id']}, {"_id": 0}).to_list(100)
    return {"orders": orders}

@api_router.get("/categories")
async def get_categories():
    """Get all product categories"""
    conn = sqlite3.connect(SQLITE_DB)
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT category FROM products")
    categories = [row[0] for row in cursor.fetchall()]
    conn.close()
    return {"categories": categories}

# ============== HIDDEN ADMIN PANEL (Challenge) ==============

@admin_router.get("/")
async def admin_home(user = Depends(get_current_user)):
    """Hidden admin dashboard"""
    return {
        "message": "🎉 Congratulations! You found the hidden admin panel!",
        "hint": "Try the /stats, /users, and /system endpoints",
        "challenge_complete": True
    }

@admin_router.get("/stats")
async def admin_stats(user = Depends(get_current_user)):
    """Admin statistics"""
    user_count = await db.users.count_documents({})
    order_count = await db.orders.count_documents({})
    review_count = await db.reviews.count_documents({})
    
    return {
        "stats": {
            "total_users": user_count,
            "total_orders": order_count,
            "total_reviews": review_count
        }
    }

@admin_router.get("/users")
async def admin_users(user = Depends(get_current_user)):
    """List all users (admin only)"""
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return {"users": users}

@admin_router.get("/system")
async def admin_system():
    """System information"""
    return {
        "system": {
            "database": "MongoDB + SQLite",
            "vulnerabilities_enabled": True,
            "lab_version": "1.0.0",
            "flag": "FLAG{y0u_f0und_th3_4dm1n_p4n3l}"
        }
    }

@admin_router.post("/execute")
async def admin_execute(cmd: str = Query(...)):
    """VULNERABLE: Direct command execution (ultimate challenge)"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
        return {"output": result.stdout, "error": result.stderr}
    except Exception as e:
        return {"error": str(e)}

# ============== INIT DATA ==============

@api_router.post("/init-data")
async def init_data():
    """Initialize sample data"""
    # Create sample coupons
    coupons = [
        {"code": "WELCOME10", "type": "percentage", "value": 10, "description": "10% off for new users"},
        {"code": "FLAT50", "type": "fixed", "value": 50, "description": "$50 off"},
        {"code": "CYBER25", "type": "percentage", "value": 25, "description": "25% off cyber monday"},
    ]
    
    for coupon in coupons:
        existing = await db.coupons.find_one({"code": coupon['code']})
        if not existing:
            await db.coupons.insert_one(coupon)
    
    return {"message": "Data initialized", "coupons_created": len(coupons)}

# Include routers
app.include_router(api_router)
app.include_router(admin_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
