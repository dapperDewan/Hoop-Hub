import ShoppingCartIcon from "@heroicons/react/24/outline/ShoppingCartIcon";
import TrashIcon from "@heroicons/react/24/outline/TrashIcon";
import XMarkIcon from "@heroicons/react/24/outline/XMarkIcon";

function Cart({ cart, setCart, onCheckout, onClose }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const fallbackImage = "https://via.placeholder.com/80x80?text=Hoop+Hub";

  const getItemId = (item) => item.id || item._id;

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => getItemId(item) !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <button
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close cart"
        onClick={onClose}
      />
      <div className="relative h-full w-full max-w-md bg-slate-950 text-white shadow-2xl border-l border-white/10 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <ShoppingCartIcon className="h-6 w-6 text-cyan-300" />
            Your cart
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Close cart panel">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-slate-400">Your cart is empty.</div>
          ) : (
            cart.map((item) => (
              <div key={getItemId(item)} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <img
                  src={item.image || fallbackImage}
                  alt={item.name}
                  className="h-14 w-14 rounded-xl object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = fallbackImage;
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                  <p className="text-sm text-cyan-200 font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <button onClick={() => removeItem(getItemId(item))} className="text-red-300 hover:text-red-200" aria-label={`Remove ${item.name}`}>
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-white/10 px-6 py-4 space-y-3">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Total</span>
            <span className="text-xl font-semibold text-white">${total.toFixed(2)}</span>
          </div>
          <button
            onClick={onCheckout}
            disabled={cart.length === 0}
            className={`w-full rounded-full px-4 py-3 text-sm font-semibold transition ${
              cart.length === 0
                ? 'bg-white/10 text-slate-400 cursor-not-allowed'
                : 'bg-white text-slate-900 hover:-translate-y-0.5'
            }`}
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
