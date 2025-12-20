import { useEffect, useState } from 'react';
import apiClient, { getCoaches } from '../services/api';

const AdminCoaches = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', title: '', price: '', image: '', description: '' });
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getCoaches();
        setCoaches(data);
      } catch (err) {
        console.error('Failed to load coaches', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    setNotice('');
    try {
      const res = await apiClient.post('coaches', {
        name: form.name,
        title: form.title,
        price: form.price ? Number(form.price) : 0,
        image: form.image,
        description: form.description
      });
      setCoaches([res.data, ...coaches]);
      setForm({ name: '', title: '', price: '', image: '', description: '' });
      setNotice('Coach created.');
    } catch (err) {
      console.error('Create coach failed', err);
      setNotice(err?.response?.data?.error || 'Create failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coach?')) return;
    try {
      await apiClient.delete(`coaches/${id}`);
      setCoaches(coaches.filter(c => c.id !== id));
      setNotice('Coach deleted.');
    } catch (err) {
      console.error(err);
      setNotice('Delete failed.');
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Admin — Coaches</h2>
        {notice && <div className="mb-4 p-3 rounded bg-amber-500/10 text-amber-200">{notice}</div>}

        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="p-2 rounded bg-white/5" required />
          <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="p-2 rounded bg-white/5" />
          <input name="price" value={form.price} onChange={handleChange} placeholder="Price" className="p-2 rounded bg-white/5" />
          <input name="image" value={form.image} onChange={handleChange} placeholder="Image URL" className="p-2 rounded bg-white/5" />
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="p-2 rounded bg-white/5 col-span-1 sm:col-span-2" />
          <div>
            <button className="mt-2 rounded-full bg-emerald-500 px-4 py-2 font-semibold">Create Coach</button>
          </div>
        </form>

        <section>
          <h3 className="text-lg font-semibold mb-3">Existing coaches</h3>
          {loading ? <div>Loading...</div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coaches.map((c) => (
                <div key={c.id} className="p-4 rounded border border-white/10 bg-white/5">
                  <div className="flex items-start gap-3">
                    <img src={c.image || '/placeholder.png'} className="h-16 w-16 rounded" alt="" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{c.name}</h4>
                          <div className="text-sm text-slate-300">{c.title}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-200">${c.price?.toFixed ? c.price.toFixed(2) : c.price}</div>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{c.description}</p>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => navigator.clipboard.writeText(c.id)} className="text-sm px-3 py-1 rounded bg-white/5">Copy ID</button>
                        <button onClick={() => handleDelete(c.id)} className="text-sm px-3 py-1 rounded bg-red-600/20">Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminCoaches;
