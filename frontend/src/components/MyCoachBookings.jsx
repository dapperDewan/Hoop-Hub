import { useEffect, useState } from 'react';
import apiClient from '../services/api';

const MyCoachBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get('coaches/my/bookings');
        setBookings(res.data);
      } catch (err) {
        console.error('Failed to fetch bookings', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen py-12 px-4 bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">My Coach Bookings</h2>
        {loading ? <div>Loading...</div> : (
          <div className="space-y-4">
            {bookings.length === 0 && <div className="text-slate-300">No bookings found.</div>}
            {bookings.map(b => (
              <div key={b.id} className="p-4 rounded border border-white/10 bg-white/5 flex justify-between items-start">
                <div>
                  <div className="font-semibold">{b.coach?.name || 'Coach'}</div>
                  <div className="text-sm text-slate-300">{b.coach?.title}</div>
                  <div className="text-sm text-slate-200 mt-2">{new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">${b.pricePaid?.toFixed ? b.pricePaid.toFixed(2) : b.pricePaid}</div>
                  <div className="text-xs text-slate-300">{b.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCoachBookings;
