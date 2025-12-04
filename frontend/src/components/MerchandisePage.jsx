import { useEffect, useMemo, useState } from "react";
import apiClient from "../services/api";
import ShoppingBagIcon from "@heroicons/react/24/outline/ShoppingBagIcon";
import CurrencyDollarIcon from "@heroicons/react/24/outline/CurrencyDollarIcon";
import ShoppingCartIcon from "@heroicons/react/24/outline/ShoppingCartIcon";
import Cart from "./Cart";

function MerchandisePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showForm, setShowForm] = useState(false);
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
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

  const placeholderImage = "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=600&q=80";
  const basketballImg = "https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg";

  const visibleItems = useMemo(() => items.filter((item) => item.verified || isAdmin), [items, isAdmin]);
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
    const fetchMerchandise = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get("merchandise");
        if (active) {
          setItems(Array.isArray(data) ? data : []);
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
    fetchMerchandise();
    setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    return () => {
      active = false;
    };
  }, []);

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
    try {
      const res = await apiClient.post("merchandise", {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock) || 10
      });
      setItems((prev) => [...prev, res.data]);
      announceStatus('success', 'Product listed successfully!');
      setShowForm(false);
      resetForm();
    } catch {
      setFormError("Failed to list product. Try again.");
      announceStatus('error', 'Failed to list product.');
    }
  };

  const getImageSrc = (item) => {
    if (item.name?.toLowerCase() === 'nba basketball') {
      return basketballImg;
    }
    return item.image || placeholderImage;
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const exists = prev.find((i) => i._id === item._id);
      if (exists) {
        return prev.map((i) => (i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    announceStatus('success', `${item.name} added to cart.`);
  };

  const handleCheckout = async () => {
    let success = true;
    for (const cartItem of cart) {
      for (let i = 0; i < cartItem.quantity; i++) {
        try {
          await apiClient.post(`merchandise/${cartItem._id}/buy`);
        } catch {
          success = false;
        }
      }
    }
    if (success) {
      announceStatus('success', 'Purchase successful!');
      setCart([]);
      const { data } = await apiClient.get("merchandise");
      setItems(Array.isArray(data) ? data : []);
    } else {
      announceStatus('error', 'Some items could not be purchased.');
    }
  };

  const handleVerify = async (id) => {
    await apiClient.post(`merchandise/${id}/verify`);
    setItems((prev) => prev.map((item) => (item._id === id ? { ...item, verified: true } : item)));
    announceStatus('success', 'Listing verified');
  };

  const handleDelete = async (id) => {
    await apiClient.delete(`merchandise/${id}`);
    setItems((prev) => prev.filter((item) => item._id !== id));
    announceStatus('success', 'Listing removed');
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
              Everything stays synced to your profile so you can plan game-day fits while scouting lineups.
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
            {isAdmin && (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10"
                onClick={() => setShowForm((prev) => !prev)}
              >
                {showForm ? 'Close form' : 'List a product'}
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

        {showForm && isAdmin && (
          <form onSubmit={handleFormSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl space-y-4">
            <h3 className="text-2xl font-semibold">List a new product</h3>
            {formError && <div className="rounded-2xl bg-red-500/20 border border-red-500/40 px-4 py-2 text-sm text-red-200">{formError}</div>}
            <div className="grid gap-4 md:grid-cols-2">
              <input name="name" value={form.name} onChange={handleFormChange} placeholder="Product name" className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-400" required />
              <input name="category" value={form.category} onChange={handleFormChange} placeholder="Category" className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-400" />
              <input name="price" value={form.price} onChange={handleFormChange} placeholder="Price" type="number" min="0" step="0.01" className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-400" required />
              <input name="stock" value={form.stock} onChange={handleFormChange} placeholder="Stock" type="number" min="0" className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-400" />
            </div>
            <input name="image" value={form.image} onChange={handleFormChange} placeholder="Image URL" className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-400" required />
            <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Description" rows="3" className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-400" />
            <button type="submit" className="inline-flex items-center justify-center rounded-full bg-white text-slate-900 px-6 py-3 text-sm font-semibold shadow-lg shadow-cyan-500/20">
              Publish listing
            </button>
          </form>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skeletonCards.map((_, idx) => (
              <div key={idx} className="rounded-3xl border border-white/10 bg-white/5 p-6 h-72 animate-pulse" />
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
            Nothing is live yet. Check back soon or, if you're an admin, list the first drop.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleItems.map((item) => {
              const imgSrc = getImageSrc(item);
              const formattedPrice = Number.isFinite(Number(item.price))
                ? Number(item.price).toFixed(2)
                : item.price;
              const stockLevel = Number(item.stock) || 0;
              const stockClass = stockLevel > 5 ? 'text-emerald-300' : stockLevel > 0 ? 'text-amber-300' : 'text-red-300';
              return (
                <article key={item._id} className="group rounded-3xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4 shadow-lg shadow-indigo-900/20 transition hover:-translate-y-1 hover:border-white/30">
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
                    {item.verified && <span className="text-emerald-300">Verified</span>}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{item.name}</h3>
                    {item.description && <p className="mt-1 text-sm text-slate-300">{item.description}</p>}
                  </div>
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
                  {isAdmin && (
                    <div className="flex gap-2 text-xs">
                      {!item.verified && (
                        <button
                          onClick={() => handleVerify(item._id)}
                          className="flex-1 rounded-full bg-emerald-500/20 px-3 py-2 font-semibold text-emerald-200"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="flex-1 rounded-full bg-red-500/20 px-3 py-2 font-semibold text-red-200"
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
        />
      )}
    </div>
  );
}

export default MerchandisePage;
