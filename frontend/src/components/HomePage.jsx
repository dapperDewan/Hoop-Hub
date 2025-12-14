import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SparklesIcon from '@heroicons/react/24/outline/SparklesIcon';
import TrophyIcon from '@heroicons/react/24/outline/TrophyIcon';
import GlobeAltIcon from '@heroicons/react/24/outline/GlobeAltIcon';
import DevicePhoneMobileIcon from '@heroicons/react/24/outline/DevicePhoneMobileIcon';
import ShieldCheckIcon from '@heroicons/react/24/outline/ShieldCheckIcon';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import apiClient from '../services/api';

const heroStats = [
    { label: 'Players tracked', value: '320+' },
    { label: 'Community dream teams', value: '1.8k' },
    { label: 'Verified fixtures', value: '480+' }
];

const promiseHighlights = [
    {
        title: 'All eyes on the game',
        description: 'Hoop Hub is a basketball-focused space that keeps team, player, and news updates under one roof so fans never miss a beat.'
    },
    {
        title: 'Stories beyond box scores',
        description: 'From dream team building to match recaps and highlights, every surface keeps fans close to the narratives unfolding across the league.'
    },
    {
        title: 'Gear up with confidence',
        description: 'Browse curated merchandise, manage your cart, and check out with the same calm flow used throughout the experience.'
    }
];

const featurePromises = [
    'Player profile viewing keeps bios, stats, and roles handy.',
    'Team hubs share rosters, hometown stories, and season context.',
    'Match fixtures highlight dates, venues, and rivalries worth circling.',
    'Favorite trackers save players and teams for quick returns.',
    'Dream Team management invites fans to craft and share their best lineups.',
    'Merchandise browsing and carts make supporting your team effortless.',
    'Fun facts sprinkle trivia into every visit for extra delight.'
];

const journeyCards = [
    {
        title: 'Home & News',
        detail: 'The homepage now reads like a magazine cover—introductions, summaries, and highlights that focus on why Hoop Hub exists.'
    },
    {
        title: 'Players & Teams',
        detail: 'Dedicated pages surface rosters, positions, and quick context so research feels lightweight.'
    },
    {
        title: 'Favorites & Dream Teams',
        detail: 'Track favorites, assemble dream fives, and peek into community builds with a single ID.'
    },
    {
        title: 'Merch & Cart',
        detail: 'Browse gear, manage selections, and check out without leaving the basketball mindset.'
    },
    {
        title: 'Fun Facts & Fixtures',
        detail: 'Spin up trivia or plan your watch list with fixtures that spotlight the next big clash.'
    }
];

const engagementBlocks = [
    {
        title: 'Dream Team Studio',
        text: 'Craft lineups, compare with friends, and keep everything synced to your profile.'
    },
    {
        title: 'Favorite Trackers',
        text: 'Jump straight to the players and teams you care about thanks to personalized collections.'
    },
    {
        title: 'Merch Corner',
        text: 'Outfit yourself with vetted basketball gear complete with availability and pricing.'
    },
    {
        title: 'Fixture Radar',
        text: 'Scan upcoming games, mark key venues, and decide what to stream next.'
    }
];

const navPreviewLinks = [
    {
        label: 'Home',
        description: 'Animated hero stories, featured players, and onboarding tiles greet every visitor.',
        callouts: ['Hero stats', 'Featured players', 'Profile jump']
    },
    {
        label: 'Players',
        description: 'Individual bios, roles, and stat capsules for every athlete in the database.',
        callouts: ['Max scoring data', 'Season context', 'Quick compare']
    },
    {
        label: 'Teams',
        description: 'Rosters, hometown notes, and momentum snapshots for club-level scouting.',
        callouts: ['Depth charts', 'Taglines', 'Local stories']
    },
    {
        label: 'Merch',
        description: 'Curated drops, price tracking, and cart syncing so gear shopping stays easy.',
        callouts: ['Verified stock', 'Cart memory', 'Wishlist ready']
    },
    {
        label: 'Fixtures',
        description: 'Upcoming clashes with venues and rivalry notes so you never miss tip-off.',
        callouts: ['Dates & venues', 'Storylines', 'Watchlist tools']
    }
];

const fallbackFeaturedPlayers = [
    { name: 'Maya Thornton', team: 'Seattle Orbit', position: 'G', maxScore: 31.2 },
    { name: 'Anika Duarte', team: 'Austin Flight', position: 'F', maxScore: 28.4 },
    { name: 'Ryo Tanaka', team: 'Tokyo Voltage', position: 'G', maxScore: 27.1 },
    { name: 'Devon Hart', team: 'Brooklyn Pulse', position: 'C', maxScore: 25.6 }
];

const useReveal = (threshold = 0.2) => {
    const prefersReducedMotion = usePrefersReducedMotion();
    const [isVisible, setIsVisible] = useState(prefersReducedMotion);
    const [skipAnimation, setSkipAnimation] = useState(prefersReducedMotion);
    const ref = useRef(null);

    useEffect(() => {
        if (prefersReducedMotion) {
            setSkipAnimation(true);
            return;
        }
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            setSkipAnimation(false);
            return;
        }

        const media = window.matchMedia('(max-width: 640px)');
        const update = () => setSkipAnimation(media.matches);
        update();
        media.addEventListener('change', update);

        return () => media.removeEventListener('change', update);
    }, [prefersReducedMotion]);

    useEffect(() => {
        if (skipAnimation) {
            setIsVisible(true);
            return;
        }

        const node = ref.current;
        if (!node || typeof IntersectionObserver === 'undefined') {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            });
        }, { threshold });

        observer.observe(node);

        return () => observer.disconnect();
    }, [skipAnimation, threshold]);

    return { ref, isVisible };
};

const useIsMobile = (query = '(max-width: 768px)') => {
    const getMatch = () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia(query).matches
        : false);
    const [matches, setMatches] = useState(getMatch);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return undefined;
        }
        const media = window.matchMedia(query);
        const handler = (event) => setMatches(event.matches);
        setMatches(media.matches);
        media.addEventListener('change', handler);
        return () => media.removeEventListener('change', handler);
    }, [query]);

    return matches;
};

const MotionSection = ({ children, delay = 0, className = '' }) => {
    const { ref, isVisible } = useReveal();
    return (
        <section
            ref={ref}
            style={{ transitionDelay: `${delay}s` }}
            data-visible={isVisible}
            className={`reveal-section ${className}`.trim()}
        >
            {children}
        </section>
    );
};

const RevealCard = ({ children, delay = 0, className = '' }) => {
    const { ref, isVisible } = useReveal();
    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}s` }}
            data-visible={isVisible}
            className={`reveal-card ${className}`.trim()}
        >
            {children}
        </div>
    );
};

function HomePage({ isAuthenticated }) {
    const prefersReducedMotion = usePrefersReducedMotion();
    const [heroReady, setHeroReady] = useState(prefersReducedMotion);
    const [featuredPlayers, setFeaturedPlayers] = useState(fallbackFeaturedPlayers);
    const [playersLoading, setPlayersLoading] = useState(false);
    const [latestBlogs, setLatestBlogs] = useState([]);
    const [blogsLoading, setBlogsLoading] = useState(false);
    const [activeNavIndex, setActiveNavIndex] = useState(0);
    const isMobile = useIsMobile();
    const displayedFeaturePromises = isMobile ? featurePromises.slice(0, 4) : featurePromises;
    const displayedJourneyCards = isMobile ? journeyCards.slice(0, 3) : journeyCards;
    const displayedEngagementBlocks = isMobile ? engagementBlocks.slice(0, 2) : engagementBlocks;
    const activeNav = navPreviewLinks[activeNavIndex] ?? navPreviewLinks[0];

    useEffect(() => {
        document.title = 'Hoop Hub | Basketball stories & community';
    }, []);

    useEffect(() => {
        if (prefersReducedMotion) {
            setHeroReady(true);
            return;
        }
        const frame = requestAnimationFrame(() => setHeroReady(true));
        return () => cancelAnimationFrame(frame);
    }, [prefersReducedMotion]);

    useEffect(() => {
        if (prefersReducedMotion || isMobile) {
            setActiveNavIndex(0);
            return undefined;
        }
        const interval = setInterval(() => {
            setActiveNavIndex((prev) => (prev + 1) % navPreviewLinks.length);
        }, 3500);
        return () => clearInterval(interval);
    }, [prefersReducedMotion, isMobile]);

    useEffect(() => {
        let isMounted = true;
        setPlayersLoading(true);
        apiClient
            .get('players')
            .then(({ data }) => {
                if (!isMounted || !Array.isArray(data)) return;
                const ranked = [...data]
                    .sort((a, b) => (b?.stats?.pointsPerGame || 0) - (a?.stats?.pointsPerGame || 0))
                    .slice(0, 4)
                    .map((player) => ({
                        id: player._id || player.id || player.name,
                        name: player.name,
                        team: player.team,
                        position: player.position,
                        maxScore: player?.stats?.pointsPerGame || 0,
                        image: player.image
                    }));
                if (ranked.length) {
                    setFeaturedPlayers(ranked);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setFeaturedPlayers(fallbackFeaturedPlayers);
                }
            })
            .finally(() => {
                if (isMounted) {
                    setPlayersLoading(false);
                }
            });
        return () => {
            isMounted = false;
        };
    }, []);

    // Fetch latest blogs
    useEffect(() => {
        let isMounted = true;
        setBlogsLoading(true);
        apiClient
            .get('blog/latest?limit=3')
            .then(({ data }) => {
                if (!isMounted || !Array.isArray(data)) return;
                setLatestBlogs(data);
            })
            .catch(() => {
                if (isMounted) {
                    setLatestBlogs([]);
                }
            })
            .finally(() => {
                if (isMounted) {
                    setBlogsLoading(false);
                }
            });
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="relative overflow-hidden bg-slate-950 text-slate-100 pb-24">
            <div className="absolute inset-0 -z-10">
                <div className="hidden sm:block absolute -top-40 left-1/2 -translate-x-1/2 w-[110vw] h-[110vw] bg-gradient-to-br from-indigo-800 via-purple-800 to-slate-900 opacity-60 blur-3xl" />
                <div className="hidden sm:block absolute top-1/2 right-0 w-[50vw] h-[50vw] bg-gradient-to-br from-cyan-500/30 to-blue-800/20 blur-3xl" />
                <div className="sm:hidden absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black opacity-90" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
                <MotionSection>
                    <div className="grid gap-10 lg:grid-cols-2 pt-16">
                        <div className={`space-y-8 transition duration-700 ease-out ${heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                            <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-sm text-cyan-200 ring-1 ring-white/10">
                                <SparklesIcon className="h-4 w-4" /> Introduction
                            </p>
                            <h1 className="text-4xl sm:text-6xl font-bold leading-tight">
                                Hoop Hub keeps every basketball moment within reach.
                            </h1>
                            <p className="text-lg text-slate-300 max-w-xl">
                                Born as a centralized home for fans, Hoop Hub blends storytelling, player knowledge, shopping, and trivia into a single welcoming destination.
                                It is designed for anyone who wants to experience the sport, keep tabs on their heroes, and discover what is next without digging through multiple apps.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link
                                    to={isAuthenticated ? '/profile' : '/auth'}
                                    className="px-6 py-3 rounded-full bg-white text-slate-900 font-semibold shadow-xl shadow-cyan-500/20 hover:-translate-y-0.5 transition"
                                >
                                    {isAuthenticated ? 'Go to your profile' : 'Start your Hoop Hub journey'}
                                </Link>
                                <Link
                                    to="/fixtures"
                                    className="px-6 py-3 rounded-full border border-white/40 text-white hover:bg-white/10 transition"
                                >
                                    See upcoming fixtures
                                </Link>
                            </div>
                            <div className="grid grid-cols-3 gap-4 pt-4">
                                {heroStats.map(({ label, value }) => (
                                    <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                                        <p className="text-2xl font-bold text-white">{value}</p>
                                        <p className="text-xs uppercase tracking-wide text-slate-300">{label}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-3 pt-4">
                                {promiseHighlights.map(({ title, description }) => (
                                    <div key={title} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-slate-900/40 p-3">
                                        <ShieldCheckIcon className="mt-1 h-5 w-5 text-cyan-300" />
                                        <div>
                                            <p className="font-semibold text-white">{title}</p>
                                            <p className="text-sm text-slate-400">{description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {!isMobile && (
                            <RevealCard
                                delay={0.15}
                                className="relative hidden lg:block rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl overflow-hidden basketball-motion"
                            >
                                <div className="absolute -inset-x-6 -inset-y-10 bg-gradient-to-br from-indigo-500/20 to-cyan-400/15 blur-3xl" />
                                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                                    <div className="basketball-orb orb-one" />
                                    <div className="basketball-orb orb-two" />
                                </div>
                                <div className="relative space-y-6">
                                    <div className="rounded-full border border-white/10 bg-white/5 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-200">
                                        <div className="flex flex-wrap gap-2">
                                            {navPreviewLinks.map(({ label }, index) => (
                                                <button
                                                    key={label}
                                                    type="button"
                                                    onMouseEnter={() => setActiveNavIndex(index)}
                                                    className={`px-3 py-1 rounded-full transition duration-300 ${
                                                        index === activeNavIndex
                                                            ? 'bg-white text-slate-900 font-semibold shadow'
                                                            : 'bg-slate-900/70 text-slate-300'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs uppercase tracking-wide text-slate-400">Member</span>
                                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 text-sm font-semibold text-white">JD</span>
                                        </div>
                                    </div>
                                    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 min-h-[220px]">
                                        <div key={activeNav?.label || 'nav'} className="nav-info-card space-y-4">
                                            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Now exploring</p>
                                            <h3 className="text-2xl font-semibold text-white">{activeNav?.label}</h3>
                                            <p className="text-sm text-slate-300 leading-relaxed">{activeNav?.description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {activeNav?.callouts?.map((item) => (
                                                    <span
                                                        key={item}
                                                        className="text-xs uppercase tracking-wide px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/90"
                                                    >
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid gap-4 grid-cols-2">
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                                            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Upcoming focus</p>
                                            <p className="mt-3 text-sm text-slate-200">
                                                Next highlight: {navPreviewLinks[(activeNavIndex + 1) % navPreviewLinks.length].label}. Desktop visitors get a hands-free tour of every
                                                destination.
                                            </p>
                                            <div className="mt-4 flex items-center gap-2">
                                                <span className="moving-indicator" />
                                                <span className="moving-indicator delay" />
                                                <span className="moving-indicator delay-2" />
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-slate-200">
                                            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Live preview</p>
                                            <p className="mt-3 text-sm">
                                                This desktop-only view pairs animated basketball cues with callouts, while mobile devices skip it for a lighter hero.
                                            </p>
                                            <Link
                                                to="/profile"
                                                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
                                            >
                                                Profile preview →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </RevealCard>
                        )}
                    </div>
                </MotionSection>

                <MotionSection delay={0.08}>
                    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 space-y-6">
                        <header className="flex flex-col gap-3 text-center">
                            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200">Featured players</p>
                            <h2 className="text-3xl font-semibold">Top scorers lighting up Hoop Hub.</h2>
                            <p className="text-slate-300 max-w-3xl mx-auto">
                                Pulling from the live players collection, we spotlight four hoopers with the highest points-per-game averages so you know who is carrying the nightly highlight reels.
                            </p>
                        </header>
                        {playersLoading ? (
                            <p className="text-center text-slate-400">Loading player data…</p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {featuredPlayers.map(({ id, name, team, position, maxScore, image }, index) => {
                                    const initials = name
                                        .split(' ')
                                        .map((part) => part[0])
                                        .join('')
                                        .slice(0, 2);
                                    const displayScore = typeof maxScore === 'number' ? maxScore.toFixed(1) : maxScore;
                                    return (
                                        <div key={id || `${name}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-lg font-bold text-white flex items-center justify-center">
                                                    {image ? (
                                                        <img src={image} alt={name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        initials
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-lg font-semibold text-white">{name}</p>
                                                    <p className="text-sm text-slate-300">{team} · {position}</p>
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                                                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Points per game</p>
                                                <p className="text-3xl font-bold text-white">{displayScore}</p>
                                                <p className="text-sm text-slate-400">Season-high scoring pace</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </MotionSection>

                {/* Latest Blog Posts Section */}
                {latestBlogs.length > 0 && (
                    <MotionSection delay={0.09}>
                        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-8 space-y-6">
                            <header className="flex flex-col gap-3 text-center">
                                <p className="text-xs uppercase tracking-[0.4em] text-cyan-200">Latest News</p>
                                <h2 className="text-3xl font-semibold">From the Hoop Hub Blog</h2>
                                <p className="text-slate-300 max-w-3xl mx-auto">
                                    Stay updated with the latest stories, insights, and news from the basketball world.
                                </p>
                            </header>
                            {blogsLoading ? (
                                <p className="text-center text-slate-400">Loading blog posts…</p>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-3">
                                    {latestBlogs.map((blog) => {
                                        // Get the first image from CSV for background
                                        const firstImage = blog.imageUrl ? blog.imageUrl.split(',')[0].trim() : null;
                                        return (
                                            <Link 
                                                key={blog.id || blog._id} 
                                                to={`/blog/${blog.id || blog._id}`}
                                                className="group relative rounded-2xl border border-white/10 overflow-hidden hover:scale-[1.02] transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20"
                                            >
                                                {/* Background Image with Overlay */}
                                                <div className="absolute inset-0">
                                                    {firstImage ? (
                                                        <img 
                                                            src={firstImage} 
                                                            alt="" 
                                                            className="w-full h-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-indigo-600/30 to-purple-600/30" />
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
                                                </div>
                                                
                                                {/* Content */}
                                                <div className="relative p-6 min-h-[180px] flex flex-col justify-end">
                                                    <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors drop-shadow-lg">
                                                        {blog.title}
                                                    </h3>
                                                    <p className="text-xs text-slate-300 mt-2">
                                                        {new Date(blog.createdAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-sm text-cyan-400 mt-3 group-hover:text-cyan-300 flex items-center gap-1">
                                                        Read more 
                                                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                                                    </p>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </MotionSection>
                )}

                <MotionSection delay={0.1}>
                    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-8 space-y-6">
                        <header>
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-300">What you can do</p>
                            <h2 className="text-3xl font-semibold mt-3">Features shaped around real fan habits.</h2>
                            <p className="text-slate-300 mt-3">
                                Every capability listed below comes straight from the project narrative and focuses on enjoyable basketball moments instead of technical jargon.
                            </p>
                        </header>
                        <div className="grid gap-4 md:grid-cols-2">
                            {displayedFeaturePromises.map((item) => (
                                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-200 text-sm leading-relaxed">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </MotionSection>

                <MotionSection delay={0.15}>
                    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-6">
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Guided tour</p>
                            <h2 className="text-3xl font-semibold">Everything in Hoop Hub has a purpose.</h2>
                            <p className="text-slate-300">
                                The following sections recap the experience described in the project overview—think of them as chapters that tell you where to explore next.
                            </p>
                            <div className="space-y-4">
                                {displayedJourneyCards.map(({ title, detail }) => (
                                    <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                                        <h3 className="text-xl font-semibold">{title}</h3>
                                        <p className="mt-3 text-slate-300 text-sm leading-relaxed">{detail}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {!isMobile && (
                            <div className="grid gap-6">
                                {[TrophyIcon, GlobeAltIcon, DevicePhoneMobileIcon].map((Icon, index) => (
                                    <RevealCard key={index} className="rounded-3xl bg-white/5 border border-white/10 p-6">
                                        <Icon className="h-10 w-10 text-white" />
                                        <p className="mt-3 text-sm text-slate-300">
                                            Hoop Hub blends scouting, commerce, and entertainment so the experience feels unified on every screen size.
                                        </p>
                                    </RevealCard>
                                ))}
                            </div>
                        )}
                    </div>
                </MotionSection>

                <MotionSection delay={0.2}>
                    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 space-y-6">
                        <header className="flex flex-col gap-3 text-center">
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Engagement pillars</p>
                            <h2 className="text-3xl font-semibold">Built for daily visits.</h2>
                            <p className="text-slate-300 max-w-3xl mx-auto">
                                Favorites, lineups, trivia, and shopping all live side by side so Hoop Hub feels like a personal companion whether you watch every night or check in once a week.
                            </p>
                        </header>
                        <div className="grid gap-4 md:grid-cols-2">
                            {displayedEngagementBlocks.map(({ title, text }) => (
                                <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                                    <h3 className="text-xl font-semibold">{title}</h3>
                                    <p className="mt-2 text-slate-300 text-sm leading-relaxed">{text}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </MotionSection>

                {!isAuthenticated && (
                    <MotionSection delay={0.25}>
                        <div className="rounded-3xl border border-cyan-400/30 bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-pink-500/40 p-8 text-center space-y-4">
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-200">Become part of the story</p>
                            <h2 className="text-3xl font-semibold">Create an account and keep your hoops world organized.</h2>
                            <p className="text-slate-100 max-w-2xl mx-auto">
                                Sign up to save favorites, build dream teams, store cart items, and keep every discovery tied to your personal profile.
                            </p>
                            <Link
                                to="/auth"
                                className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-white text-slate-900 font-semibold shadow-xl shadow-cyan-500/30"
                            >
                                Join Hoop Hub
                            </Link>
                        </div>
                    </MotionSection>
                )}
            </div>
        </div>
    );
}

export default HomePage;
