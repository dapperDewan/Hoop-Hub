import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../services/api';

const BlogDetailsPage = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await apiClient.get(`blog/${id}`);
        setBlog(res.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load blog post.');
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id]);

  // Parse CSV images
  const getImages = () => {
    if (!blog?.imageUrl) return [];
    return blog.imageUrl.split(',').map(url => url.trim()).filter(url => url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            <span className="ml-4 text-lg text-slate-300">Loading blog post...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-12 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold mb-2 text-red-200">Blog Not Found</h3>
            <p className="text-slate-400 mb-6">{error || 'The blog post you are looking for does not exist.'}</p>
            <Link
              to="/"
              className="inline-block rounded-full bg-cyan-500 text-white px-6 py-3 text-sm font-semibold hover:bg-cyan-600 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = getImages();
  const firstImage = images[0];
  const middleImages = images.slice(1, -1);
  const lastImage = images.length > 1 ? images[images.length - 1] : null;

  // Split content into paragraphs for image distribution
  const paragraphs = blog.details.split('\n\n').filter(p => p.trim());
  const midPoint = Math.floor(paragraphs.length / 2);

  return (
    <div className="min-h-screen bg-slate-950 text-white py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Link */}
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition"
        >
          ← Back to Home
        </Link>

        {/* Blog Header with Hero Image */}
        <article className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/50 via-slate-900 to-slate-950 shadow-2xl overflow-hidden">
          {/* Hero Image - First Image */}
          {firstImage && (
            <div className="relative w-full flex items-center justify-center bg-slate-900 p-4">
              <img 
                src={firstImage} 
                alt={blog.title} 
                className="max-w-full max-h-[350px] w-auto h-auto object-contain rounded-xl"
              />
            </div>
          )}
          
          <div className="p-8">
            <header className="space-y-4 mb-8">
              <p className="text-xs uppercase tracking-[0.4em] text-cyan-200">Blog Post</p>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">{blog.title}</h1>
              <div className="flex items-center gap-4 text-slate-400 text-sm">
                <span>
                  Published: {new Date(blog.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                {blog.updatedAt && blog.updatedAt !== blog.createdAt && (
                  <span>
                    • Updated: {new Date(blog.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </div>
            </header>

            {/* Blog Content with distributed images */}
            <div className="prose prose-invert prose-lg max-w-none space-y-6">
              {/* First half of content */}
              <div className="text-slate-200 leading-relaxed whitespace-pre-wrap text-lg">
                {paragraphs.slice(0, midPoint).join('\n\n') || blog.details}
              </div>

              {/* Middle Images - displayed in a gallery */}
              {middleImages.length > 0 && (
                <div className={`my-8 flex flex-wrap gap-4 justify-center`}>
                  {middleImages.map((url, idx) => (
                    <div key={idx} className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900 p-2">
                      <img 
                        src={url} 
                        alt={`${blog.title} - Image ${idx + 2}`} 
                        className="max-w-full max-h-[280px] w-auto h-auto object-contain rounded-xl"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Second half of content */}
              {paragraphs.length > 1 && midPoint > 0 && (
                <div className="text-slate-200 leading-relaxed whitespace-pre-wrap text-lg">
                  {paragraphs.slice(midPoint).join('\n\n')}
                </div>
              )}

              {/* Last Image - as a featured closing image */}
              {lastImage && images.length > 2 && (
                <div className="mt-8 flex justify-center">
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900 p-2">
                    <img 
                      src={lastImage} 
                      alt={`${blog.title} - Featured`} 
                      className="max-w-full max-h-[320px] w-auto h-auto object-contain rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Footer Action */}
        <div className="rounded-3xl border border-cyan-400/30 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 p-8 text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-200">Enjoyed this post?</p>
          <h2 className="text-2xl font-semibold">Explore more from Hoop Hub</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/players"
              className="px-6 py-3 rounded-full border border-white/40 text-white hover:bg-white/10 transition"
            >
              View Players
            </Link>
            <Link
              to="/teams"
              className="px-6 py-3 rounded-full border border-white/40 text-white hover:bg-white/10 transition"
            >
              View Teams
            </Link>
            <Link
              to="/fixtures"
              className="px-6 py-3 rounded-full border border-white/40 text-white hover:bg-white/10 transition"
            >
              View Fixtures
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetailsPage;
