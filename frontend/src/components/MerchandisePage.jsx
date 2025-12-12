import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/api";
import ShoppingBagIcon from "@heroicons/react/24/outline/ShoppingBagIcon";
import CurrencyDollarIcon from "@heroicons/react/24/outline/CurrencyDollarIcon";
import ShoppingCartIcon from "@heroicons/react/24/outline/ShoppingCartIcon";
import PlusIcon from "@heroicons/react/24/outline/PlusIcon";
import XMarkIcon from "@heroicons/react/24/outline/XMarkIcon";
import UserCircleIcon from "@heroicons/react/24/outline/UserCircleIcon";
import PencilSquareIcon from "@heroicons/react/24/outline/PencilSquareIcon";
import Cart from "./Cart";

function MerchandisePage({ isAuthenticated = false, isAdmin = false }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isTeamOwner, setIsTeamOwner] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    stock: "",
    category: ""
  });
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [showMyListings, setShowMyListings] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    stock: "",
    category: ""
  });
  // Orders state for buyer and seller views
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [showBuyerOrders, setShowBuyerOrders] = useState(false);
  const [showSellerOrders, setShowSellerOrders] = useState(false);
  const [loadingBuyerOrders, setLoadingBuyerOrders] = useState(false);
  const [loadingSellerOrders, setLoadingSellerOrders] = useState(false);

  const placeholderImage = "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=600&q=80";
  const basketballImg = "https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg";

  const visibleItems = useMemo(() => {
    const userId = userProfile?._id || userProfile?.id;
    if (showMyListings && userId) {
      return items.filter((item) => item.ownerId === userId);
    }
    return items.filter((item) => item.verified || isAdmin);
  }, [items, isAdmin, showMyListings, userProfile]);
  const verifiedCount = useMemo(() => items.filter((item) => item.verified).length, [items]);
  const totalStock = useMemo(
    () => visibleItems.reduce((sum, item) => sum + (Number(item.stock) || 0), 0),
    [visibleItems]
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const skeletonCards = Array.from({ length: 6 });

  const announceStatus = (tone, text) => setStatus({ tone, text });

  useEffect(() => {
    if (!status) return undefined;
    const timer = setTimeout(() => setStatus(null), 2600);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get("merchandise");
        if (active) {
          setItems(Array.isArray(data) ? data : []);
        }
        
        // Fetch user profile if authenticated
        if (isAuthenticated) {
          try {
            const profileRes = await apiClient.get("profile/me");
            if (active && profileRes.data) {
              setUserProfile(profileRes.data);
            }
          } catch {
            // Profile fetch failed, user may need to complete profile
          }
          
          // Check if user is a team owner
          try {
            const teamOwnerRes = await apiClient.get("team-owner/my-profile");
            if (active && teamOwnerRes.data?.teamOwner) {
              setIsTeamOwner(true);
            }
          } catch {
            // Not a team owner
            setIsTeamOwner(false);
          }
        }
      } catch {
        if (active) {
          setItems([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", image: "", stock: "", category: "" });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.name || !form.price || !form.image) {
      setFormError("Name, price, and image URL are required.");
      return;
    }
    
    // Check if profile is complete for non-admin users
    const hasCompleteProfile = userProfile?.profile?.displayName || userProfile?.profile?.bio;
    if (!isAdmin && !hasCompleteProfile) {
      setFormError("Please complete your profile before listing products.");
      return;
    }
    
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock) || 10,
        isAdmin: isAdmin // Pass admin status to auto-verify
      };
      
      // Add owner info if user is authenticated
      if (userProfile) {
        payload.ownerId = userProfile._id || userProfile.id;
        payload.ownerName = userProfile.profile?.displayName || userProfile.username;
        payload.ownerEmail = userProfile.email;
      }
      
      const res = await apiClient.post("merchandise", payload);
      setItems((prev) => [...prev, res.data]);
      announceStatus('success', isAdmin ? 'Product listed successfully!' : 'Product submitted for review!');
      setShowForm(false);
      resetForm();
    } catch (err) {
      if (err.response?.data?.profileIncomplete) {
        setFormError("Please complete your profile before listing products.");
      } else {
        setFormError("Failed to list product. Try again.");
      }
      announceStatus('error', 'Failed to list product.');
    }
  };

  const fetchOwnerInfo = async (itemId) => {
    try {
      const { data } = await apiClient.get(`merchandise/${itemId}/owner`);
      setSelectedOwner(data.owner);
      setShowOwnerModal(true);
    } catch {
      announceStatus('error', 'Failed to fetch seller info.');
    }
  };

  const getImageSrc = (item) => {
    if (item.name?.toLowerCase() === 'nba basketball') {
      return basketballImg;
    }
    return item.image || placeholderImage;
  };

  // Helper to get item ID (handles both Prisma 'id' and MongoDB '_id')
  const getItemId = (item) => item.id || item._id;

  const addToCart = (item) => {
    setCart((prev) => {
      const itemId = getItemId(item);
      const exists = prev.find((i) => getItemId(i) === itemId);
      if (exists) {
        return prev.map((i) => (getItemId(i) === itemId ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    announceStatus('success', `${item.name} added to cart.`);
  };

  // Fetch buyer orders
  const fetchBuyerOrders = async () => {
    try {
      setLoadingBuyerOrders(true);
      const res = await apiClient.get('/merchandise/orders/my');
      setBuyerOrders(res.data.orders || res.data || []);
    } catch (err) {
      console.error('fetchBuyerOrders', err);
      announceStatus('error', 'Failed to load your purchases');
    } finally {
      setLoadingBuyerOrders(false);
    }
  };

  // Fetch seller (owner) orders
  const fetchSellerOrders = async () => {
    try {
      setLoadingSellerOrders(true);
      const res = await apiClient.get('/merchandise/orders/owner');
      setSellerOrders(res.data.orders || res.data || []);
    } catch (err) {
      console.error('fetchSellerOrders', err);
      announceStatus('error', 'Failed to load your sales');
    } finally {
      setLoadingSellerOrders(false);
    }
  };

  const handleCheckout = async (checkoutData) => {
    try {
      const response = await apiClient.post('merchandise/checkout', checkoutData);
      announceStatus('success', response.data.message || 'Order placed! Awaiting admin approval.');
      setCart([]);
      const { data } = await apiClient.get("merchandise");
      setItems(Array.isArray(data) ? data : []);
      if (showBuyerOrders) fetchBuyerOrders();
      if (showSellerOrders) fetchSellerOrders();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Checkout failed. Please try again.';
      announceStatus('error', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleVerify = async (id) => {
    try {
      await apiClient.post(`merchandise/${id}/verify`);
      setItems((prev) => prev.map((item) => (getItemId(item) === id ? { ...item, verified: true } : item)));
      announceStatus('success', 'Listing verified');
    } catch (err) {
      console.error('Verify error:', err);
      announceStatus('error', 'Failed to verify listing');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`merchandise/${id}`);
      setItems((prev) => prev.filter((item) => getItemId(item) !== id));
      announceStatus('success', 'Listing removed');
    } catch (err) {
      console.error('Delete error:', err);
      announceStatus('error', 'Failed to delete listing');
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name || "",
      description: item.description || "",
      price: item.price?.toString() || "",
      image: item.image || "",
      stock: item.stock?.toString() || "",
      category: item.category || ""
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    
    try {
      const itemId = getItemId(editingItem);
      const payload = {
        ...editForm,
        price: Number(editForm.price),
        stock: Number(editForm.stock) || 10
      };
      
      const res = await apiClient.put(`merchandise/${itemId}`, payload);
      setItems((prev) => prev.map((item) => 
        getItemId(item) === itemId ? res.data : item
      ));
      setShowEditModal(false);
      setEditingItem(null);
      announceStatus('success', isAdmin ? 'Listing updated!' : 'Listing updated! Pending re-verification.');
    } catch (err) {
      console.error('Edit error:', err);
      announceStatus('error', 'Failed to update listing');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-slate-900 p-8 shadow-2xl">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%)]" />
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200">Merch hub</p>
            <h1 className="text-4xl font-bold leading-tight">Deck out your hoops life without leaving Hoop Hub.</h1>
            <p className="text-slate-200 max-w-2xl">
              Browse verified drops, add them to your cart, and check out with the same calm flow that powers the rest of Hoop Hub.
              {(isAdmin || isTeamOwner) && " As a team owner, you can list your own products and get them verified by our team."}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-full bg-white text-slate-900 px-5 py-2 text-sm font-semibold shadow-lg shadow-cyan-500/20 hover:-translate-y-0.5 transition"
              onClick={() => setShowCart(true)}
            >
              <ShoppingCartIcon className="h-5 w-5" />
              Cart ({cartCount})
            </button>
            {isAuthenticated && (
              <button
                className={`inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10 transition ${showBuyerOrders ? 'bg-indigo-500 text-white shadow-lg' : ''}`}
                onClick={() => { const next = !showBuyerOrders; setShowBuyerOrders(next); if (next) fetchBuyerOrders(); }}
              >
                My Purchases
              </button>
            )}
            {isTeamOwner && (
              <button
                className={`inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10 transition ${showSellerOrders ? 'bg-indigo-500 text-white shadow-lg' : ''}`}
                onClick={() => { const next = !showSellerOrders; setShowSellerOrders(next); if (next) fetchSellerOrders(); }}
              >
                My Sales
              </button>
            )}
            {(isAdmin || isTeamOwner) && (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                onClick={() => setShowForm((prev) => !prev)}
              >
                <PlusIcon className="h-5 w-5" />
                {showForm ? 'Close form' : 'List a product'}
              </button>
            )}
            {(isAdmin || isTeamOwner) && userProfile && (
              <button
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
                  showMyListings 
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                    : 'border border-white/30 text-white hover:bg-white/10'
                }`}
                onClick={() => setShowMyListings((prev) => !prev)}
              >
                <ShoppingBagIcon className="h-5 w-5" />
                {showMyListings ? 'Show all' : 'My Listings'}
              </button>
            )}
            {!isAuthenticated && (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                onClick={() => navigate('/auth')}
              >
                Sign in to shop
              </button>
            )}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Active listings</p>
              <p className="text-2xl font-semibold">{visibleItems.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Verified sellers</p>
              <p className="text-2xl font-semibold">{verifiedCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Units ready to ship</p>
              <p className="text-2xl font-semibold">{totalStock}</p>
            </div>
          </div>
        </section>

        {/* List Product Form - Available to team owners and admins only */}
        {showForm && (isAdmin || isTeamOwner) && (
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 via-indigo-950/80 to-slate-900/95 p-8 shadow-2xl">
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">List a new product</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {isAdmin ? "Your listing will be published immediately." : "Your listing will be reviewed before publishing."}
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-full p-2 hover:bg-white/10 transition"
                >
                  <XMarkIcon className="h-6 w-6 text-slate-400" />
                </button>
              </div>
              
              {!isAdmin && !(userProfile?.profile?.displayName || userProfile?.profile?.bio) && (
                <div className="mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-200">
                  <p className="font-semibold">Complete your profile first</p>
                  <p className="mt-1 text-amber-300/80">You need to add a display name or bio to your profile before listing products.</p>
                  <button 
                    onClick={() => navigate('/profile')}
                    className="mt-2 text-amber-200 underline hover:text-amber-100"
                  >
                    Go to Profile →
                  </button>
                </div>
              )}
              
              {formError && (
                <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
                  {formError}
                </div>
              )}
              
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Product Name *</label>
                    <input 
                      name="name" 
                      value={form.name} 
                      onChange={handleFormChange} 
                      placeholder="e.g., Lakers Championship Jersey" 
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Category</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleFormChange}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    >
                      <option value="" className="bg-slate-900">Select category</option>
                      <option value="Jerseys" className="bg-slate-900">Jerseys</option>
                      <option value="Footwear" className="bg-slate-900">Footwear</option>
                      <option value="Accessories" className="bg-slate-900">Accessories</option>
                      <option value="Collectibles" className="bg-slate-900">Collectibles</option>
                      <option value="Equipment" className="bg-slate-900">Equipment</option>
                      <option value="Other" className="bg-slate-900">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Price ($) *</label>
                    <input 
                      name="price" 
                      value={form.price} 
                      onChange={handleFormChange} 
                      placeholder="29.99" 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Stock Quantity</label>
                    <input 
                      name="stock" 
                      value={form.stock} 
                      onChange={handleFormChange} 
                      placeholder="10" 
                      type="number" 
                      min="1" 
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Image URL *</label>
                  <input 
                    name="image" 
                    value={form.image} 
                    onChange={handleFormChange} 
                    placeholder="https://example.com/product-image.jpg" 
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                    required 
                  />
                  {form.image && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-white/10 w-32 h-24">
                      <img src={form.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Description</label>
                  <textarea 
                    name="description" 
                    value={form.description} 
                    onChange={handleFormChange} 
                    placeholder="Describe your product, condition, authenticity, etc..." 
                    rows="4" 
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none" 
                  />
                </div>
                
                <div className="flex items-center gap-4 pt-2">
                  <button 
                    type="submit" 
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-500 hover:to-purple-500 transition-all"
                  >
                    <ShoppingBagIcon className="h-5 w-5" />
                    {isAdmin ? 'Publish Listing' : 'Submit for Review'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="px-6 py-3 text-sm font-semibold text-slate-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* My Listings Header */}
        {showMyListings && (
          <div className="flex items-center justify-between rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-white">My Listings</h2>
              <p className="text-sm text-slate-400">
                {visibleItems.length === 0 
                  ? "You haven't listed any products yet." 
                  : `You have ${visibleItems.length} listing${visibleItems.length === 1 ? '' : 's'}.`}
              </p>
            </div>
            <button
              onClick={() => setShowMyListings(false)}
              className="text-sm text-indigo-300 hover:text-white transition"
            >
              ← Back to all products
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skeletonCards.map((_, idx) => (
              <div key={idx} className="rounded-3xl border border-white/10 bg-white/5 p-6 h-72 animate-pulse" />
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
            {showMyListings 
              ? "You haven't listed any products yet. Click 'List a product' to get started!" 
              : isAuthenticated ? "Nothing is live yet. Be the first to list a product!" : "Nothing is live yet. Check back soon!"}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleItems.map((item) => {
              const itemId = getItemId(item);
              const imgSrc = getImageSrc(item);
              const formattedPrice = Number.isFinite(Number(item.price))
                ? Number(item.price).toFixed(2)
                : item.price;
              const stockLevel = Number(item.stock) || 0;
              const stockClass = stockLevel > 5 ? 'text-emerald-300' : stockLevel > 0 ? 'text-amber-300' : 'text-red-300';
              return (
                <article key={itemId} className="group rounded-3xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4 shadow-lg shadow-indigo-900/20 transition hover:-translate-y-1 hover:border-white/30">
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-900/40">
                    <img
                      src={imgSrc}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = placeholderImage;
                      }}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-slate-400">
                    <span>{item.category || 'NBA'}</span>
                    <div className="flex items-center gap-2">
                      {!item.verified && <span className="text-amber-300">Pending</span>}
                      {item.verified && <span className="text-emerald-300">Verified</span>}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{item.name}</h3>
                    {item.description && <p className="mt-1 text-sm text-slate-300 line-clamp-2">{item.description}</p>}
                  </div>
                  
                  {/* Seller info */}
                  {item.ownerName && (
                    <button
                      onClick={() => fetchOwnerInfo(itemId)}
                      className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition"
                    >
                      <UserCircleIcon className="h-4 w-4" />
                      <span>Seller: {item.ownerName}</span>
                    </button>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-2xl font-bold">
                      <CurrencyDollarIcon className="h-5 w-5 text-cyan-300" />
                      {formattedPrice}
                    </div>
                    <p className="text-sm text-slate-300">
                      Stock: <span className={`font-semibold ${stockClass}`}>{stockLevel}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    disabled={stockLevel <= 0}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                      stockLevel > 0
                        ? 'bg-white text-slate-900 hover:-translate-y-0.5'
                        : 'bg-white/10 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {stockLevel > 0 ? 'Add to cart' : 'Sold out'}
                  </button>
                  
                  {/* Admin controls */}
                  {isAdmin && (
                    <div className="space-y-2">
                      {!item.verified && item.ownerName && (
                        <div className="rounded-xl bg-slate-800/50 p-3 text-xs">
                          <p className="text-slate-400 mb-1">Review seller info before verifying:</p>
                          <p className="text-white font-medium">{item.ownerName}</p>
                          {item.ownerEmail && <p className="text-slate-400">{item.ownerEmail}</p>}
                        </div>
                      )}
                      <div className="flex gap-2 text-xs">
                        {!item.verified && (
                          <button
                            onClick={() => handleVerify(itemId)}
                            className="flex-1 rounded-full bg-emerald-500/20 px-3 py-2 font-semibold text-emerald-200 hover:bg-emerald-500/30 transition"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => handleEditClick(item)}
                          className="flex-1 rounded-full bg-indigo-500/20 px-3 py-2 font-semibold text-indigo-200 hover:bg-indigo-500/30 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(itemId)}
                          className="flex-1 rounded-full bg-red-500/20 px-3 py-2 font-semibold text-red-200 hover:bg-red-500/30 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Owner controls - show in My Listings view */}
                  {showMyListings && !isAdmin && item.ownerId === (userProfile?.id || userProfile?._id) && (
                    <div className="flex gap-2 text-xs">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="flex-1 rounded-full bg-indigo-500/20 px-3 py-2 font-semibold text-indigo-200 hover:bg-indigo-500/30 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(itemId)}
                        className="flex-1 rounded-full bg-red-500/20 px-3 py-2 font-semibold text-red-200 hover:bg-red-500/30 transition"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {status && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 rounded-2xl px-4 py-3 text-sm font-semibold shadow-2xl border ${
            status.tone === 'error'
              ? 'bg-red-500/90 border-red-300'
              : 'bg-emerald-500/90 border-emerald-300'
          }`}
        >
          {status.text}
        </div>
      )}

      {showCart && (
        <Cart
          cart={cart}
          setCart={setCart}
          onCheckout={handleCheckout}
          onClose={() => setShowCart(false)}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Owner Info Modal */}
      {showOwnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => { setShowOwnerModal(false); setSelectedOwner(null); }}
              className="absolute top-4 right-4 rounded-full p-2 hover:bg-white/10 transition"
            >
              <XMarkIcon className="h-5 w-5 text-slate-400" />
            </button>
            
            <h3 className="text-xl font-bold text-white mb-4">Seller Information</h3>
            
            {selectedOwner ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {selectedOwner.profile?.avatar ? (
                    <img src={selectedOwner.profile.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <UserCircleIcon className="h-10 w-10 text-indigo-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {selectedOwner.profile?.displayName || selectedOwner.username}
                    </p>
                    {selectedOwner.email && (
                      <p className="text-sm text-slate-400">{selectedOwner.email}</p>
                    )}
                  </div>
                </div>
                
                {selectedOwner.profile?.bio && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Bio</p>
                    <p className="text-sm text-slate-300">{selectedOwner.profile.bio}</p>
                  </div>
                )}
                
                {selectedOwner.profile?.location && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Location</p>
                    <p className="text-sm text-slate-300">{selectedOwner.profile.location}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-400">No seller information available.</p>
            )}
          </div>
        </div>
      )}

      {/* Buyer Orders Modal */}
      {showBuyerOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowBuyerOrders(false)}
              className="absolute top-4 right-4 rounded-full p-2 hover:bg-white/10 transition"
            >
              <XMarkIcon className="h-5 w-5 text-slate-400" />
            </button>
            <h3 className="text-xl font-bold text-white mb-4">My Purchases</h3>
            {loadingBuyerOrders ? (
              <p className="text-slate-400">Loading...</p>
            ) : buyerOrders.length === 0 ? (
              <p className="text-slate-400">No purchases yet.</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-auto">
                {buyerOrders.map((order) => (
                  <div key={order.id || order._id} className="rounded-xl border border-white/10 p-4 bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Order</p>
                        <p className="text-white font-semibold">{order.id || order._id}</p>
                      </div>
                      <div className="text-sm">
                        <p className={`px-3 py-1 rounded-full text-xs ${order.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : order.status === 'rejected' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>{order.status || 'pending'}</p>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-slate-300">
                      <p>Placed: {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</p>
                      {order.paymentInfo && (
                        <p>Payment: {order.paymentInfo.method || order.paymentInfo.type} • {order.paymentInfo.txnId || order.paymentInfo.transactionId}</p>
                      )}
                      <p className="mt-2 font-semibold">Items:</p>
                      <ul className="mt-1 list-disc list-inside text-slate-300">
                        {(order.items || []).map((it, idx) => (
                          <li key={idx}>{it.name} × {it.quantity || it.qty} — ${Number(it.price).toFixed(2)}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-white font-semibold">Total: ${Number(order.totalAmount || order.total || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seller Orders Modal */}
      {showSellerOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowSellerOrders(false)}
              className="absolute top-4 right-4 rounded-full p-2 hover:bg-white/10 transition"
            >
              <XMarkIcon className="h-5 w-5 text-slate-400" />
            </button>
            <h3 className="text-xl font-bold text-white mb-4">My Sales</h3>
            {loadingSellerOrders ? (
              <p className="text-slate-400">Loading...</p>
            ) : sellerOrders.length === 0 ? (
              <p className="text-slate-400">No sales yet.</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-auto">
                {sellerOrders.map((order) => (
                  <div key={order.id || order._id} className="rounded-xl border border-white/10 p-4 bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Order</p>
                        <p className="text-white font-semibold">{order.id || order._id}</p>
                      </div>
                      <div className="text-sm">
                        <p className={`px-3 py-1 rounded-full text-xs ${order.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : order.status === 'rejected' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>{order.status || 'pending'}</p>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-slate-300">
                      <p>Placed: {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</p>
                      <p>Buyer: {order.buyerName || order.buyerEmail || order.buyerId}</p>
                      <p className="mt-2 font-semibold">Items:</p>
                      <ul className="mt-1 list-disc list-inside text-slate-300">
                        {(order.items || []).map((it, idx) => (
                          <li key={idx}>{it.name} × {it.quantity || it.qty} — ${Number(it.price).toFixed(2)}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-white font-semibold">Total: ${Number(order.totalAmount || order.total || 0).toFixed(2)}</p>
                      {order.paymentInfo && (
                        <div className="mt-2 text-sm text-slate-300">
                          <p>Payment method: {order.paymentInfo.method || order.paymentInfo.type}</p>
                          <p>Transaction: {order.paymentInfo.txnId || order.paymentInfo.transactionId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => { setShowEditModal(false); setEditingItem(null); }}
              className="absolute top-4 right-4 rounded-full p-2 hover:bg-white/10 transition"
            >
              <XMarkIcon className="h-5 w-5 text-slate-400" />
            </button>
            
            <h3 className="text-xl font-bold text-white mb-2">Edit Listing</h3>
            <p className="text-sm text-slate-400 mb-6">
              {isAdmin 
                ? "Update this listing. Changes will be saved immediately." 
                : "Update your listing. It will need to be re-verified by an admin."}
            </p>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Name *</label>
                  <input
                    name="name"
                    value={editForm.name}
                    onChange={handleEditFormChange}
                    placeholder="Product name"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Category</label>
                  <select
                    name="category"
                    value={editForm.category}
                    onChange={handleEditFormChange}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="" className="bg-slate-900">Select category</option>
                    <option value="Jerseys" className="bg-slate-900">Jerseys</option>
                    <option value="Footwear" className="bg-slate-900">Footwear</option>
                    <option value="Accessories" className="bg-slate-900">Accessories</option>
                    <option value="Collectibles" className="bg-slate-900">Collectibles</option>
                    <option value="Equipment" className="bg-slate-900">Equipment</option>
                    <option value="Other" className="bg-slate-900">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Price ($) *</label>
                  <input
                    name="price"
                    value={editForm.price}
                    onChange={handleEditFormChange}
                    placeholder="29.99"
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Stock</label>
                  <input
                    name="stock"
                    value={editForm.stock}
                    onChange={handleEditFormChange}
                    placeholder="10"
                    type="number"
                    min="0"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Image URL *</label>
                  <input
                    name="image"
                    value={editForm.image}
                    onChange={handleEditFormChange}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  placeholder="Product description..."
                  rows="3"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                />
              </div>
              
              {!isAdmin && editingItem.verified && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-200">
                  ⚠️ Editing will reset verification status. Your listing will need admin approval again.
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-500 hover:to-purple-500 transition-all"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingItem(null); }}
                  className="px-6 py-3 text-sm font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MerchandisePage;
