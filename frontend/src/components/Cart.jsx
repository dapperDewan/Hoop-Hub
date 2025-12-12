import { useState } from "react";
import ShoppingCartIcon from "@heroicons/react/24/outline/ShoppingCartIcon";
import TrashIcon from "@heroicons/react/24/outline/TrashIcon";
import XMarkIcon from "@heroicons/react/24/outline/XMarkIcon";
import ArrowLeftIcon from "@heroicons/react/24/outline/ArrowLeftIcon";

function Cart({ cart, setCart, onCheckout, onClose, isAuthenticated = false }) {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    method: 'bkash',
    phoneNumber: '',
    transactionId: '',
    timestamp: ''
  });
  const [buyerPhone, setBuyerPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const fallbackImage = "https://via.placeholder.com/80x80?text=Hoop+Hub";

  const getItemId = (item) => item.id || item._id;

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => getItemId(item) !== id));
  };

  const handleProceedToPayment = () => {
    if (!isAuthenticated) {
      setError('Please log in to checkout.');
      return;
    }
    setError('');
    setShowPayment(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setError('');

    if (!paymentData.phoneNumber || !paymentData.transactionId) {
      setError('Please complete the payment information');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCheckout({
        items: cart,
        paymentInfo: paymentData,
        buyerPhone
      });
      setShowPayment(false);
      setPaymentData({ method: 'bkash', phoneNumber: '', transactionId: '', timestamp: '' });
      setBuyerPhone('');
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
            {showPayment ? (
              <button onClick={() => setShowPayment(false)} className="p-1 hover:bg-white/10 rounded-full mr-1">
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            ) : (
              <ShoppingCartIcon className="h-6 w-6 text-cyan-300" />
            )}
            {showPayment ? 'Payment' : 'Your cart'}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Close cart panel">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {!showPayment ? (
          // Cart Items View
          <>
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
              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                onClick={handleProceedToPayment}
                disabled={cart.length === 0}
                className={`w-full rounded-full px-4 py-3 text-sm font-semibold transition ${
                  cart.length === 0
                    ? 'bg-white/10 text-slate-400 cursor-not-allowed'
                    : 'bg-white text-slate-900 hover:-translate-y-0.5'
                }`}
              >
                Proceed to Payment
              </button>
            </div>
          </>
        ) : (
          // Payment Form View
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Order Summary */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                {cart.map((item) => (
                  <div key={getItemId(item)} className="flex justify-between">
                    <span className="text-slate-400">{item.name} × {item.quantity}</span>
                    <span className="text-white">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-2 mt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-cyan-300">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-3">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentData({ ...paymentData, method: 'bkash' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentData.method === 'bkash'
                      ? 'border-pink-500 bg-pink-500/20 shadow-lg'
                      : 'border-white/10 hover:border-pink-500/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-400 mb-1">bKash</div>
                    <div className="text-xs text-slate-400">Mobile Banking</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentData({ ...paymentData, method: 'nagad' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentData.method === 'nagad'
                      ? 'border-orange-500 bg-orange-500/20 shadow-lg'
                      : 'border-white/10 hover:border-orange-500/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400 mb-1">Nagad</div>
                    <div className="text-xs text-slate-400">Digital Payment</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Payment Portal Interface */}
            <div className={`rounded-2xl shadow-2xl overflow-hidden ${
              paymentData.method === 'bkash' 
                ? 'bg-gradient-to-br from-pink-500 to-pink-600' 
                : 'bg-gradient-to-br from-orange-500 to-orange-600'
            }`}>
              <div className="p-4 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl font-bold">
                    {paymentData.method === 'bkash' ? 'bKash' : 'Nagad'}
                  </div>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-xs opacity-90 mb-1">Amount to Pay</div>
                  <div className="text-2xl font-bold">${total.toFixed(2)}</div>
                </div>
              </div>

              <div className="bg-slate-900 p-4">
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-2 text-sm">
                      {paymentData.method === 'bkash' ? 'bKash' : 'Nagad'} Account Number *
                    </label>
                    <input
                      type="tel"
                      value={paymentData.phoneNumber}
                      onChange={(e) => setPaymentData({ ...paymentData, phoneNumber: e.target.value })}
                      className="w-full bg-slate-800 text-white border-2 border-slate-600 rounded-lg px-4 py-3 focus:border-cyan-500 focus:outline-none text-sm"
                      placeholder="01XXXXXXXXX"
                      pattern="[0-9]{11}"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-2 text-sm">Transaction ID *</label>
                    <input
                      type="text"
                      value={paymentData.transactionId}
                      onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                      className="w-full bg-slate-800 text-white border-2 border-slate-600 rounded-lg px-4 py-3 focus:border-cyan-500 focus:outline-none text-sm"
                      placeholder="Enter transaction ID"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Example: 8A5B9C2D or 123456789
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-2 text-sm">Your Contact Number</label>
                    <input
                      type="tel"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full bg-slate-800 text-white border-2 border-slate-600 rounded-lg px-4 py-3 focus:border-cyan-500 focus:outline-none text-sm"
                      placeholder="For delivery updates"
                    />
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-cyan-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-xs text-slate-400">
                        <p className="font-semibold mb-1 text-slate-300">Payment Instructions:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Send ${total.toFixed(2)} to merchant</li>
                          <li>Save your transaction ID</li>
                          <li>Enter details above</li>
                          <li>Admin will verify &amp; approve</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full text-white py-3 rounded-lg font-bold shadow-lg transition-all ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' :
                      paymentData.method === 'bkash'
                        ? 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                    }`}
                  >
                    {isSubmitting ? 'Processing...' : 'Submit Order'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
