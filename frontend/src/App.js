import { useEffect, useState, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { ShoppingCart, User, Search, Menu, X, Package, Shield, Terminal, Trash2, Plus, Minus, LogOut, Bug } from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import VulnerabilitiesPage from "./VulnerabilitiesPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API}/auth/me`);
      setUser(res.data.user);
    } catch (e) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, tokenData) => {
    localStorage.setItem("token", tokenData);
    axios.defaults.headers.common["Authorization"] = `Bearer ${tokenData}`;
    setToken(tokenData);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Cart Context
const CartContext = createContext(null);

const useCart = () => useContext(CartContext);

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (productId, quantity) => {
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

// Navbar Component
const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#030304]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" data-testid="nav-logo">
            <Shield className="w-8 h-8 text-cyan-400" />
            <span className="font-rajdhani text-xl font-bold tracking-wider text-cyan-400">
              VULN<span className="text-white">SHOP</span>
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/50 border-white/20 text-white pl-10 font-mono focus:border-cyan-400"
                data-testid="search-input"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </form>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/products" className="text-gray-300 hover:text-cyan-400 transition-colors font-mono text-sm tracking-wide" data-testid="nav-products">
              PRODUCTS
            </Link>
            
            <Link to="/cart" className="relative p-2 text-gray-300 hover:text-cyan-400 transition-colors" data-testid="nav-cart">
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-cyan-400 text-black text-xs">
                  {cart.length}
                </Badge>
              )}
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-300 hover:text-cyan-400" data-testid="nav-user-menu">
                    <User className="w-5 h-5 mr-2" />
                    <span className="font-mono text-sm">{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#0A0A0C] border-white/10">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer font-mono" data-testid="nav-profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="cursor-pointer font-mono" data-testid="nav-orders">Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="cursor-pointer font-mono text-red-400" data-testid="nav-logout">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button className="btn-cyber text-sm" data-testid="nav-login">
                  LOGIN
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-300"
            data-testid="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0A0A0C] border-t border-white/10 animate-slide-up">
          <div className="px-4 py-4 space-y-4">
            <form onSubmit={handleSearch}>
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/50 border-white/20 text-white font-mono"
              />
            </form>
            <Link to="/products" className="block text-gray-300 hover:text-cyan-400 font-mono">PRODUCTS</Link>
            <Link to="/cart" className="block text-gray-300 hover:text-cyan-400 font-mono">CART ({cart.length})</Link>
            {user ? (
              <>
                <Link to="/profile" className="block text-gray-300 hover:text-cyan-400 font-mono">PROFILE</Link>
                <Link to="/orders" className="block text-gray-300 hover:text-cyan-400 font-mono">ORDERS</Link>
                <button onClick={logout} className="block text-red-400 font-mono">LOGOUT</button>
              </>
            ) : (
              <Link to="/login" className="block text-cyan-400 font-mono">LOGIN</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// Home Page
const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
    initData();
  }, []);

  const initData = async () => {
    try {
      await axios.post(`${API}/init-data`);
    } catch (e) {
      console.log("Data init skipped");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API}/products`);
      setProducts(res.data.products);
    } catch (e) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden scanlines">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1613488329064-aafbeb1e4db1?crop=entropy&cs=srgb&fm=jpg&q=85)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030304]/50 to-[#030304]" />
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-rajdhani font-bold tracking-wider mb-6">
            <span className="text-cyan-400 text-glow-cyan">CYBER</span>
            <span className="text-white"> GEAR</span>
          </h1>
          <p className="text-base lg:text-lg text-gray-400 font-mono mb-8 max-w-2xl mx-auto">
            Underground marketplace for elite hackers. Encrypted devices, stealth hardware, and tactical gear.
          </p>
          <Link to="/products">
            <Button className="btn-cyber-primary text-lg px-8 py-4" data-testid="hero-cta">
              BROWSE INVENTORY
            </Button>
          </Link>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#030304] to-transparent" />
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl font-rajdhani font-bold text-white tracking-wider">
              FEATURED <span className="text-cyan-400">GEAR</span>
            </h2>
            <div className="h-0.5 w-24 bg-gradient-to-r from-cyan-400 to-transparent mt-2" />
          </div>
          <Link to="/products" className="text-cyan-400 font-mono text-sm hover:underline" data-testid="view-all-link">
            VIEW ALL →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card-cyber h-80 animate-pulse">
                <div className="bg-white/5 h-48" />
                <div className="p-4 space-y-2">
                  <div className="bg-white/10 h-4 w-3/4" />
                  <div className="bg-white/10 h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product, index) => (
              <div
                key={product.id}
                className="card-cyber cyber-border group animate-slide-up opacity-0"
                style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
                data-testid={`product-card-${product.id}`}
              >
                <Link to={`/product/${product.id}`}>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] to-transparent opacity-60" />
                    <Badge className="absolute top-2 right-2 badge-cyber">
                      {product.category}
                    </Badge>
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-rajdhani text-lg font-bold text-white group-hover:text-cyan-400 transition-colors tracking-wide">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-gray-500 text-sm font-mono mt-1 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-mono text-xl text-cyan-400">
                      ${product.price.toFixed(2)}
                    </span>
                    <Button
                      onClick={() => addToCart(product)}
                      className="btn-cyber text-xs px-3 py-1"
                      data-testid={`add-to-cart-${product.id}`}
                    >
                      ADD
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-[#0A0A0C] border-y border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <Terminal className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-rajdhani font-bold text-white tracking-wider mb-4">
            JOIN THE <span className="text-cyan-400">NETWORK</span>
          </h2>
          <p className="text-gray-400 font-mono mb-8">
            Create an account to access exclusive deals and track your orders.
          </p>
          <Link to="/register">
            <Button className="btn-cyber-primary" data-testid="cta-register">
              CREATE ACCOUNT
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

// Products Page
const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API}/products`);
      setProducts(res.data.products);
    } catch (e) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/categories`);
      setCategories(res.data.categories);
    } catch (e) {
      console.error("Failed to load categories");
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-rajdhani font-bold text-white tracking-wider">
            ALL <span className="text-cyan-400">PRODUCTS</span>
          </h1>
          <div className="h-0.5 w-24 bg-gradient-to-r from-cyan-400 to-transparent mt-2" />
        </div>

        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <Button
            onClick={() => setSelectedCategory("")}
            className={`text-xs font-mono ${!selectedCategory ? 'btn-cyber-primary' : 'btn-cyber'}`}
            data-testid="filter-all"
          >
            ALL
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-mono ${selectedCategory === cat ? 'btn-cyber-primary' : 'btn-cyber'}`}
              data-testid={`filter-${cat.toLowerCase()}`}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="card-cyber cyber-border group animate-slide-up opacity-0"
              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
              data-testid={`product-card-${product.id}`}
            >
              <Link to={`/product/${product.id}`}>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] to-transparent opacity-60" />
                  <Badge className="absolute top-2 right-2 badge-cyber">
                    {product.category}
                  </Badge>
                </div>
              </Link>
              <div className="p-4">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-rajdhani text-lg font-bold text-white group-hover:text-cyan-400 transition-colors tracking-wide">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-gray-500 text-sm font-mono mt-1 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-mono text-xl text-cyan-400">
                    ${product.price.toFixed(2)}
                  </span>
                  <Button
                    onClick={() => addToCart(product)}
                    className="btn-cyber text-xs px-3 py-1"
                    data-testid={`add-to-cart-${product.id}`}
                  >
                    ADD
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Product Detail Page
const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`${API}/products/${id}`);
      setProduct(res.data.product);
    } catch (e) {
      toast.error("Product not found");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${API}/reviews/${id}`);
      setReviews(res.data.reviews);
    } catch (e) {
      console.error("Failed to load reviews");
    }
  };

  const submitReview = async () => {
    if (!user) {
      toast.error("Please login to submit a review");
      return;
    }
    try {
      await axios.post(`${API}/reviews`, {
        product_id: id,
        rating,
        comment: reviewText
      });
      toast.success("Review submitted!");
      setReviewText("");
      fetchReviews();
    } catch (e) {
      toast.error("Failed to submit review");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 font-mono">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="card-cyber cyber-border overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-96 lg:h-[500px] object-cover"
          />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <Badge className="badge-cyber">{product.category}</Badge>
          <h1 className="text-3xl lg:text-4xl font-rajdhani font-bold text-white tracking-wider" data-testid="product-name">
            {product.name}
          </h1>
          <p className="text-gray-400 font-mono">{product.description}</p>
          
          <div className="font-mono text-4xl text-cyan-400 text-glow-cyan" data-testid="product-price">
            ${product.price.toFixed(2)}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-[#0A0A0C] border border-white/10 p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="text-cyan-400 hover:bg-cyan-400/10"
                data-testid="qty-decrease"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-16 text-center bg-transparent border-none font-mono text-white"
                data-testid="qty-input"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                className="text-cyan-400 hover:bg-cyan-400/10"
                data-testid="qty-increase"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={() => addToCart(product, quantity)}
              className="btn-cyber-primary flex-1"
              data-testid="add-to-cart-detail"
            >
              ADD TO CART
            </Button>
          </div>

          <div className="border-t border-white/10 pt-6 mt-8">
            <p className="text-gray-500 font-mono text-sm">
              <span className="text-cyan-400">Stock:</span> {product.stock} units
            </p>
            <p className="text-gray-500 font-mono text-sm">
              <span className="text-cyan-400">ID:</span> {product.id}
            </p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-rajdhani font-bold text-white tracking-wider mb-6">
          CUSTOMER <span className="text-cyan-400">REVIEWS</span>
        </h2>

        {/* Add Review */}
        <div className="card-cyber p-6 mb-8">
          <h3 className="font-rajdhani text-lg text-white mb-4">WRITE A REVIEW</h3>
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-gray-400 font-mono text-sm">Rating:</span>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-2xl ${star <= rating ? 'text-cyan-400' : 'text-gray-600'}`}
                data-testid={`rating-star-${star}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full h-24 p-3 bg-black/50 border border-white/20 text-white font-mono focus:border-cyan-400 focus:outline-none resize-none"
            data-testid="review-input"
          />
          <Button onClick={submitReview} className="btn-cyber mt-4" data-testid="submit-review">
            SUBMIT REVIEW
          </Button>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-gray-500 font-mono text-center py-8">No reviews yet. Be the first!</p>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="card-cyber p-4" data-testid={`review-${review.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-cyan-400">{review.username}</span>
                  <span className="text-cyan-400">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                </div>
                {/* VULNERABLE: XSS - rendering raw HTML */}
                <div 
                  className="text-gray-300 font-mono text-sm"
                  dangerouslySetInnerHTML={{ __html: review.comment }}
                />
                <p className="text-gray-600 text-xs font-mono mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Search Results Page
const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    if (query) {
      searchProducts();
    }
  }, [query]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/products/search?q=${encodeURIComponent(query)}`);
      if (res.data.error) {
        setError(res.data.error);
        setResults([]);
      } else {
        setResults(res.data.products);
        setError(null);
      }
    } catch (e) {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-rajdhani font-bold text-white tracking-wider">
          SEARCH <span className="text-cyan-400">RESULTS</span>
        </h1>
        {/* VULNERABLE: Reflected XSS if query is displayed unsanitized */}
        <p className="text-gray-400 font-mono mt-2">
          Showing results for: <span className="text-cyan-400" data-testid="search-query">{query}</span>
        </p>
        <div className="h-0.5 w-24 bg-gradient-to-r from-cyan-400 to-transparent mt-2" />
      </div>

      {error && (
        <div className="card-cyber p-4 mb-6 border-red-500/50">
          <p className="text-red-400 font-mono text-sm" data-testid="search-error">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 font-mono">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((product, index) => (
            <div
              key={product.id}
              className="card-cyber cyber-border group animate-slide-up opacity-0"
              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
              data-testid={`search-result-${product.id}`}
            >
              <Link to={`/product/${product.id}`}>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] to-transparent opacity-60" />
                </div>
              </Link>
              <div className="p-4">
                <h3 className="font-rajdhani text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-mono text-xl text-cyan-400">${product.price.toFixed(2)}</span>
                  <Button onClick={() => addToCart(product)} className="btn-cyber text-xs px-3 py-1">
                    ADD
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Cart Page
const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      toast.error("Please login to checkout");
      navigate("/login");
      return;
    }
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-rajdhani font-bold text-white tracking-wider mb-8">
        YOUR <span className="text-cyan-400">CART</span>
      </h1>

      {cart.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 font-mono mb-4">Your cart is empty</p>
          <Link to="/products">
            <Button className="btn-cyber">BROWSE PRODUCTS</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <div key={item.id} className="card-cyber p-4 flex items-center space-x-4" data-testid={`cart-item-${item.id}`}>
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-20 h-20 object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-rajdhani text-lg text-white">{item.name}</h3>
                  <p className="font-mono text-cyan-400">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="text-cyan-400 hover:bg-cyan-400/10"
                    data-testid={`cart-decrease-${item.id}`}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                    className="w-16 text-center bg-transparent border border-white/20 font-mono text-white"
                    data-testid={`cart-qty-${item.id}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="text-cyan-400 hover:bg-cyan-400/10"
                    data-testid={`cart-increase-${item.id}`}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="font-mono text-white w-24 text-right">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-400 hover:bg-red-400/10"
                  data-testid={`cart-remove-${item.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="card-cyber p-6 h-fit">
            <h2 className="font-rajdhani text-xl text-white mb-6">ORDER SUMMARY</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between font-mono text-gray-400">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-mono text-gray-400">
                <span>Shipping</span>
                <span>FREE</span>
              </div>
              <div className="border-t border-white/10 pt-4 flex justify-between font-mono text-lg">
                <span className="text-white">Total</span>
                <span className="text-cyan-400" data-testid="cart-total">${total.toFixed(2)}</span>
              </div>
            </div>
            <Button onClick={handleCheckout} className="btn-cyber-primary w-full" data-testid="checkout-btn">
              PROCEED TO CHECKOUT
            </Button>
            <Button onClick={clearCart} variant="ghost" className="w-full mt-2 text-gray-400 hover:text-red-400" data-testid="clear-cart-btn">
              Clear Cart
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Checkout Page
const CheckoutPage = () => {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponValid, setCouponValid] = useState(null);
  const [address, setAddress] = useState("");
  const [processing, setProcessing] = useState(false);

  const applyCoupon = async () => {
    try {
      const res = await axios.get(`${API}/coupons/validate/${couponCode}`);
      if (res.data.valid) {
        const coupon = res.data.coupon;
        if (coupon.type === 'percentage') {
          setDiscount(total * (coupon.value / 100));
        } else {
          setDiscount(coupon.value);
        }
        setCouponValid(true);
        toast.success(`Coupon applied: ${coupon.description}`);
      } else {
        setCouponValid(false);
        setDiscount(0);
        toast.error("Invalid coupon code");
      }
    } catch (e) {
      toast.error("Failed to validate coupon");
    }
  };

  const handleCheckout = async () => {
    if (!address.trim()) {
      toast.error("Please enter shipping address");
      return;
    }

    setProcessing(true);
    try {
      const res = await axios.post(`${API}/checkout`, {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        })),
        coupon_code: couponValid ? couponCode : null,
        shipping_address: address
      });

      if (res.data.success) {
        clearCart();
        toast.success("Order placed successfully!");
        navigate(`/orders`);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Checkout failed");
    } finally {
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 font-mono mb-4">Please login to checkout</p>
          <Link to="/login">
            <Button className="btn-cyber">LOGIN</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-rajdhani font-bold text-white tracking-wider mb-8">
        CHECK<span className="text-cyan-400">OUT</span>
      </h1>

      <div className="space-y-6">
        {/* Order Items */}
        <div className="card-cyber p-6">
          <h2 className="font-rajdhani text-xl text-white mb-4">ORDER ITEMS</h2>
          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between font-mono text-sm">
                <span className="text-gray-400">
                  {item.name} x {item.quantity}
                </span>
                <span className="text-white">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coupon */}
        <div className="card-cyber p-6">
          <h2 className="font-rajdhani text-xl text-white mb-4">COUPON CODE</h2>
          <div className="flex space-x-2">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter code..."
              className="flex-1 bg-black/50 border-white/20 text-white font-mono"
              data-testid="coupon-input"
            />
            <Button onClick={applyCoupon} className="btn-cyber" data-testid="apply-coupon-btn">
              APPLY
            </Button>
          </div>
          {couponValid === true && (
            <p className="text-green-400 font-mono text-sm mt-2">Coupon applied! Discount: ${discount.toFixed(2)}</p>
          )}
          {couponValid === false && (
            <p className="text-red-400 font-mono text-sm mt-2">Invalid coupon code</p>
          )}
        </div>

        {/* Shipping Address */}
        <div className="card-cyber p-6">
          <h2 className="font-rajdhani text-xl text-white mb-4">SHIPPING ADDRESS</h2>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your shipping address..."
            className="w-full h-24 p-3 bg-black/50 border border-white/20 text-white font-mono focus:border-cyan-400 focus:outline-none resize-none"
            data-testid="address-input"
          />
        </div>

        {/* Order Total */}
        <div className="card-cyber p-6">
          <h2 className="font-rajdhani text-xl text-white mb-4">ORDER TOTAL</h2>
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-gray-400">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between font-mono text-green-400">
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-white/10 pt-2 flex justify-between font-mono text-lg">
              <span className="text-white">Total</span>
              <span className="text-cyan-400" data-testid="checkout-total">
                ${(total - discount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleCheckout}
          disabled={processing}
          className="btn-cyber-primary w-full py-4 text-lg"
          data-testid="place-order-btn"
        >
          {processing ? "PROCESSING..." : "PLACE ORDER"}
        </Button>
      </div>
    </div>
  );
};

// Login Page
const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, { username, password });
      if (res.data.success) {
        login(res.data.user, res.data.token);
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card-cyber cyber-border p-8 w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-2xl font-rajdhani font-bold text-white tracking-wider">
            ACCESS <span className="text-cyan-400">TERMINAL</span>
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-400 font-mono text-sm mb-2">USERNAME</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/50 border-white/20 text-white font-mono focus:border-cyan-400"
              required
              data-testid="login-username"
            />
          </div>
          <div>
            <label className="block text-gray-400 font-mono text-sm mb-2">PASSWORD</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border-white/20 text-white font-mono focus:border-cyan-400"
              required
              data-testid="login-password"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="btn-cyber-primary w-full"
            data-testid="login-submit"
          >
            {loading ? "AUTHENTICATING..." : "LOGIN"}
          </Button>
        </form>

        <p className="text-center text-gray-500 font-mono text-sm mt-6">
          No account?{" "}
          <Link to="/register" className="text-cyan-400 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

// Register Page
const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/register`, { username, email, password });
      if (res.data.success) {
        login(res.data.user, res.data.token);
        toast.success("Account created!");
        navigate("/");
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card-cyber cyber-border p-8 w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-2xl font-rajdhani font-bold text-white tracking-wider">
            CREATE <span className="text-cyan-400">ACCOUNT</span>
          </h1>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-gray-400 font-mono text-sm mb-2">USERNAME</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/50 border-white/20 text-white font-mono focus:border-cyan-400"
              required
              data-testid="register-username"
            />
          </div>
          <div>
            <label className="block text-gray-400 font-mono text-sm mb-2">EMAIL</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border-white/20 text-white font-mono focus:border-cyan-400"
              required
              data-testid="register-email"
            />
          </div>
          <div>
            <label className="block text-gray-400 font-mono text-sm mb-2">PASSWORD</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border-white/20 text-white font-mono focus:border-cyan-400"
              required
              data-testid="register-password"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="btn-cyber-primary w-full"
            data-testid="register-submit"
          >
            {loading ? "CREATING..." : "CREATE ACCOUNT"}
          </Button>
        </form>

        <p className="text-center text-gray-500 font-mono text-sm mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

// Profile Page
const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      // VULNERABLE: IDOR - fetching profile by ID without proper auth
      const res = await axios.get(`${API}/profile/${user.id}`);
      setProfile(res.data.profile);
      setEmail(res.data.profile.email || "");
      setRole(res.data.profile.role || "user");
    } catch (e) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      // VULNERABLE: Mass assignment - can update role
      const res = await axios.put(`${API}/profile/update`, { email, role });
      if (res.data.success) {
        setProfile(res.data.profile);
        toast.success("Profile updated!");
      }
    } catch (e) {
      toast.error("Failed to update profile");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 font-mono">Please login to view profile</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-rajdhani font-bold text-white tracking-wider mb-8">
        USER <span className="text-cyan-400">PROFILE</span>
      </h1>

      <div className="card-cyber p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
            <User className="w-10 h-10 text-cyan-400" />
          </div>
          <div>
            <h2 className="font-rajdhani text-2xl text-white">{profile?.username}</h2>
            <Badge className={`badge-cyber ${profile?.role === 'admin' ? 'border-purple-400 text-purple-400' : ''}`}>
              {profile?.role?.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 space-y-4">
          <div>
            <label className="block text-gray-400 font-mono text-sm mb-2">USER ID</label>
            <Input
              value={profile?.id || ""}
              readOnly
              className="w-full bg-black/30 border-white/10 text-gray-500 font-mono"
              data-testid="profile-id"
            />
          </div>
          <div>
            <label className="block text-gray-400 font-mono text-sm mb-2">EMAIL</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border-white/20 text-white font-mono focus:border-cyan-400"
              data-testid="profile-email"
            />
          </div>
          <div>
            <label className="block text-gray-400 font-mono text-sm mb-2">ROLE</label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-black/50 border-white/20 text-white font-mono focus:border-cyan-400"
              data-testid="profile-role"
            />
            <p className="text-gray-600 text-xs font-mono mt-1">
              Try changing your role to "admin" 😉
            </p>
          </div>
          <div>
            <label className="block text-gray-400 font-mono text-sm mb-2">BALANCE</label>
            <Input
              value={`$${profile?.balance?.toFixed(2) || "0.00"}`}
              readOnly
              className="w-full bg-black/30 border-white/10 text-cyan-400 font-mono"
              data-testid="profile-balance"
            />
          </div>
        </div>

        <Button onClick={updateProfile} className="btn-cyber-primary" data-testid="update-profile-btn">
          UPDATE PROFILE
        </Button>
      </div>
    </div>
  );
};

// Orders Page
const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API}/orders`);
      setOrders(res.data.orders);
    } catch (e) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 font-mono">Please login to view orders</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-rajdhani font-bold text-white tracking-wider mb-8">
        YOUR <span className="text-cyan-400">ORDERS</span>
      </h1>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 font-mono">No orders yet</p>
          <Link to="/products">
            <Button className="btn-cyber mt-4">START SHOPPING</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="card-cyber p-6" data-testid={`order-${order.id}`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <p className="font-mono text-xs text-gray-500">ORDER ID</p>
                  <p className="font-mono text-cyan-400">{order.id}</p>
                </div>
                <div className="mt-2 md:mt-0">
                  <Badge className={`badge-cyber ${order.status === 'pending' ? 'border-yellow-400 text-yellow-400' : 'border-green-400 text-green-400'}`}>
                    {order.status?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between font-mono text-sm">
                    <span className="text-gray-400">{item.name} x {item.quantity}</span>
                    <span className="text-white">${item.subtotal?.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="flex justify-between font-mono">
                  <span className="text-gray-400">Total</span>
                  <span className="text-cyan-400 text-xl">${order.total?.toFixed(2)}</span>
                </div>
                {order.coupon_used && (
                  <p className="text-green-400 font-mono text-sm mt-1">
                    Coupon applied: {order.coupon_used}
                  </p>
                )}
              </div>

              <p className="text-gray-600 text-xs font-mono mt-4">
                Placed on: {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Footer
const Footer = () => (
  <footer className="bg-[#0A0A0C] border-t border-white/10 py-12 mt-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-2 mb-4 md:mb-0">
          <Shield className="w-6 h-6 text-cyan-400" />
          <span className="font-rajdhani text-lg font-bold tracking-wider text-cyan-400">
            VULN<span className="text-white">SHOP</span>
          </span>
        </div>
        <p className="text-gray-600 font-mono text-sm">
          Cyber Security Lab Environment - For Educational Purposes Only
        </p>
      </div>
      <div className="mt-6 pt-6 border-t border-white/10 text-center">
        <p className="text-gray-700 font-mono text-xs">
          ⚠️ This application contains intentional security vulnerabilities.
        </p>
      </div>
    </div>
  </footer>
);

// Main App
function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[#030304] grid-pattern">
            <div className="noise-overlay" />
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/orders" element={<OrdersPage />} />
              </Routes>
            </main>
            <Footer />
            <Toaster 
              position="top-right"
              toastOptions={{
                style: {
                  background: '#0A0A0C',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  color: '#EDEDED',
                  fontFamily: 'JetBrains Mono, monospace',
                }
              }}
            />
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
