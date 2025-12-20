import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

const FIXED_APPLICATION_FEE = 50000; // Fixed fee: BDT 50,000

const TeamOwnerApplicationPage = () => {
  const [teamOwner, setTeamOwner] = useState(null);
  const [application, setApplication] = useState(null);
  const [merchandiseSales, setMerchandiseSales] = useState([]);
  const [formData, setFormData] = useState({
    teamName: '',
    requestedBudget: '10000000'
  });
  const [paymentData, setPaymentData] = useState({
    method: 'bkash', // bkash or nagad
    phoneNumber: '',
    transactionId: '',
    timestamp: ''
  });
  const [showPayment, setShowPayment] = useState(false);
  const [showSales, setShowSales] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!username) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [username, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, appRes] = await Promise.all([
        apiClient.get('team-owner/my-profile'),
        apiClient.get('team-owner/my-application')
      ]);
      
      setTeamOwner(profileRes.data.teamOwner);
      setApplication(appRes.data.application);
      
      // Fetch merchandise sales if team owner
      if (profileRes.data.teamOwner) {
        try {
          const salesRes = await apiClient.get('merchandise/orders/owner');
          setMerchandiseSales(salesRes.data || []);
        } catch {
          // Sales fetch failed, might not have any
        }
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate payment data
    if (!paymentData.phoneNumber || !paymentData.transactionId) {
      setError('Please complete the payment information');
      return;
    }

    try {
      await apiClient.post('team-owner/apply', {
        ...formData,
        applicationFee: FIXED_APPLICATION_FEE,
        paymentInfo: paymentData
      });
      setSuccess('Application submitted successfully! Please wait for admin approval.');
      setShowPayment(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application');
    }
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!formData.teamName || !formData.requestedBudget) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    setShowPayment(true);
  };

  if (!username) {
    return <div className="p-8 text-center text-red-500">Please <a href="/auth" className="text-blue-600 underline">log in</a> to continue.</div>;
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><div className="text-lg text-white">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Team Owner Application</h1>
          <p className="text-gray-400">Join the elite league of team owners</p>
        </div>

      {/* Team Owner Profile (if approved) */}
      {teamOwner && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <div className="flex items-center mb-6">
            <div className="bg-white/20 backdrop-blur rounded-full p-3 mr-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">You are a Team Owner!</h2>
              <p className="text-indigo-100">Manage your dream team and compete</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <p className="text-indigo-100 text-sm mb-1">Team Name</p>
              <p className="font-bold text-xl">{teamOwner.teamName}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <p className="text-indigo-100 text-sm mb-1">Current Budget</p>
              <p className="font-bold text-xl">${teamOwner.currentBudget?.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <p className="text-indigo-100 text-sm mb-1">Initial Budget</p>
              <p className="font-bold text-xl">${teamOwner.initialBudget?.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <p className="text-indigo-100 text-sm mb-1">Approved At</p>
              <p className="font-bold text-lg">{new Date(teamOwner.approvedAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/dream-team')}
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg hover:bg-indigo-50 font-semibold shadow-lg transition-all hover:scale-105"
            >
              Manage My Dream Team →
            </button>
            <button
              onClick={() => navigate('/coaches')}
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg hover:bg-indigo-50 font-semibold shadow-lg transition-all hover:scale-105"
            >
              Browse Coaches →
            </button>
            <button
              onClick={() => navigate('/coaches/my-bookings')}
              className="bg-white/20 text-white px-8 py-3 rounded-lg hover:bg-white/30 font-semibold shadow-lg transition-all hover:scale-105 border border-white/30"
            >
              My Coach Bookings →
            </button>
            <button
              onClick={() => navigate('/merchandise')}
              className="bg-white/20 text-white px-8 py-3 rounded-lg hover:bg-white/30 font-semibold shadow-lg transition-all hover:scale-105 border border-white/30"
            >
              List Products →
            </button>
            {merchandiseSales.length > 0 && (
              <button
                onClick={() => setShowSales(!showSales)}
                className="bg-emerald-500 text-white px-8 py-3 rounded-lg hover:bg-emerald-600 font-semibold shadow-lg transition-all hover:scale-105"
              >
                View Sales ({merchandiseSales.length}) →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Merchandise Sales Section (for team owners) */}
      {teamOwner && showSales && merchandiseSales.length > 0 && (
        <div className="bg-slate-800 rounded-2xl shadow-xl p-6 mb-8 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Your Merchandise Sales</h2>
              <p className="text-sm text-slate-400">Approved orders from your products</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Total Earnings</p>
              <p className="text-2xl font-bold text-emerald-400">
                ${merchandiseSales.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {merchandiseSales.map(order => (
              <div key={order.id || order._id} className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-white">${order.totalAmount?.toFixed(2)}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-200">
                        Paid
                      </span>
                    </div>
                    
                    {/* Buyer Info */}
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-slate-400">Buyer: </span>
                        <span className="text-white">{order.buyerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Email: </span>
                        <span className="text-white">{order.buyerEmail || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Phone: </span>
                        <span className="text-white">{order.buyerPhone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Date: </span>
                        <span className="text-white">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {/* Items Purchased */}
                    <div className="rounded-lg bg-slate-800/50 p-3">
                      <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Items Purchased</p>
                      <div className="space-y-1">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-slate-300">{item.name} × {item.quantity}</span>
                            <span className="text-white">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Status (if pending or rejected) */}
      {application && !teamOwner && (
        <div className={`border rounded-xl p-6 mb-8 ${
          application.status === 'pending' ? 'bg-slate-800 border-yellow-500/50' :
          application.status === 'rejected' ? 'bg-slate-800 border-red-500/50' :
          'bg-slate-800 border-slate-700'
        }`}>
          <h2 className="text-xl font-semibold mb-4 text-white">Application Status: {application.status.toUpperCase()}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Team Name</p>
              <p className="font-semibold text-white">{application.teamName}</p>
            </div>
            <div>
              <p className="text-gray-400">Requested Budget</p>
              <p className="font-semibold text-white">${application.requestedBudget?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400">Application Fee</p>
              <p className="font-semibold text-white">৳{application.applicationFee?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400">Submitted At</p>
              <p className="font-semibold text-white">{new Date(application.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          {application.status === 'pending' && (
            <p className="mt-4 text-yellow-400">Your application is under review by the admin.</p>
          )}
          {application.status === 'rejected' && (
            <p className="mt-4 text-red-400">Your application was rejected. You can submit a new application below.</p>
          )}
        </div>
      )}

      {/* Application Form (if not applied or rejected) */}
      {!teamOwner && (!application || application.status === 'rejected') && (
        <>
          <div className="bg-slate-800 rounded-2xl shadow-xl p-8 mb-8 border border-slate-700">
            <div className="flex items-center mb-6">
              <div className="bg-indigo-900/50 rounded-full p-3 mr-4 border border-indigo-500/50">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Apply to Become a Team Owner</h2>
                <p className="text-gray-400">Fill in your details and complete payment</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border-l-4 border-red-500 text-red-400 p-4 rounded mb-6 flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-900/30 border-l-4 border-green-500 text-green-400 p-4 rounded mb-6 flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            )}

            {!showPayment ? (
              <form onSubmit={handleProceedToPayment} className="space-y-6">
                <div>
                  <label className="block text-white font-semibold mb-2">Team Name *</label>
                  <input
                    type="text"
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    className="w-full bg-slate-900 border-2 border-slate-600 text-white rounded-lg px-4 py-3 focus:border-indigo-500 focus:outline-none transition-colors"
                    required
                    placeholder="Enter your team name"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Requested Budget *</label>
                  <input
                    type="number"
                    value={formData.requestedBudget}
                    onChange={(e) => setFormData({ ...formData, requestedBudget: e.target.value })}
                    className="w-full bg-slate-900 border-2 border-slate-600 text-white rounded-lg px-4 py-3 focus:border-indigo-500 focus:outline-none transition-colors"
                    required
                    min="1000000"
                    step="100000"
                    placeholder="e.g., 10000000"
                  />
                  <p className="text-sm text-gray-400 mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Budget amount: ${parseFloat(formData.requestedBudget || 0).toLocaleString()}
                  </p>
                </div>

                <div className="bg-indigo-900/30 border border-indigo-500/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Application Fee</span>
                    <span className="text-2xl font-bold text-indigo-400">৳{FIXED_APPLICATION_FEE.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">One-time registration fee (non-refundable)</p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-bold text-lg shadow-lg transition-all hover:scale-[1.02]"
                >
                  Proceed to Payment →
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Payment Method Selection */}
                <div>
                  <label className="block text-white font-semibold mb-3">Select Payment Method</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentData({ ...paymentData, method: 'bkash' })}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        paymentData.method === 'bkash'
                          ? 'border-pink-500 bg-pink-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-4xl font-bold text-pink-600 mb-2">bKash</div>
                        <div className="text-sm text-gray-600">Mobile Banking</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentData({ ...paymentData, method: 'nagad' })}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        paymentData.method === 'nagad'
                          ? 'border-orange-500 bg-orange-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-4xl font-bold text-orange-600 mb-2">Nagad</div>
                        <div className="text-sm text-gray-600">Digital Payment</div>
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
                  <div className="p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl font-bold">
                        {paymentData.method === 'bkash' ? 'bKash' : 'Nagad'}
                      </div>
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-4">
                      <div className="text-sm opacity-90 mb-1">Amount to Pay</div>
                      <div className="text-3xl font-bold">৳{FIXED_APPLICATION_FEE.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="bg-white p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          {paymentData.method === 'bkash' ? 'bKash' : 'Nagad'} Account Number *
                        </label>
                        <input
                          type="tel"
                          value={paymentData.phoneNumber}
                          onChange={(e) => setPaymentData({ ...paymentData, phoneNumber: e.target.value })}
                          className="w-full bg-white text-gray-900 border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
                          placeholder="01XXXXXXXXX"
                          pattern="[0-9]{11}"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">Transaction ID *</label>
                        <input
                          type="text"
                          value={paymentData.transactionId}
                          onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                          className="w-full bg-white text-gray-900 border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
                          placeholder="Enter transaction ID"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Example: 8A5B9C2D or 123456789
                        </p>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">Transaction Time (Optional)</label>
                        <input
                          type="datetime-local"
                          value={paymentData.timestamp}
                          onChange={(e) => setPaymentData({ ...paymentData, timestamp: e.target.value })}
                          className="w-full bg-white text-gray-900 border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div className="text-sm text-gray-700">
                            <p className="font-semibold mb-1">Payment Instructions:</p>
                            <ol className="list-decimal list-inside space-y-1 text-xs">
                              <li>Send ৳{FIXED_APPLICATION_FEE.toLocaleString()} to merchant number</li>
                              <li>Save your transaction ID from the confirmation message</li>
                              <li>Enter the transaction details above</li>
                              <li>Click submit to complete your application</li>
                            </ol>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowPayment(false)}
                          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                        >
                          ← Back
                        </button>
                        <button
                          type="submit"
                          className={`flex-1 text-white py-3 rounded-lg font-bold shadow-lg transition-all hover:scale-[1.02] ${
                            paymentData.method === 'bkash'
                              ? 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700'
                              : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                          }`}
                        >
                          Submit Application
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Info Section */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl shadow-xl p-8 text-white border border-indigo-500/30">
        <h3 className="text-2xl font-bold mb-4 flex items-center">
          <svg className="w-7 h-7 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Team Owner Benefits
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Create and manage your dream team by purchasing players</span>
          </div>
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Each player has a fixed price and limited availability</span>
          </div>
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Players purchased by you become unavailable to others for 30 days</span>
          </div>
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>View detailed player ownership and pricing information</span>
          </div>
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Compete with other team owners to build the best roster</span>
          </div>
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Access exclusive features and statistics</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default TeamOwnerApplicationPage;
