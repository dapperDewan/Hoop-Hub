import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthForms from '../components/AuthForms';

function AuthPage({ onAuthSuccess }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const leftReveal = isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6';
  const rightReveal = isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-white flex items-center justify-center px-4 py-20 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-20 left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-700 to-purple-600 opacity-40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[40vh] w-[40vh] bg-cyan-500/30 blur-3xl" />
      </div>
      <div className="max-w-6xl w-full grid gap-12 lg:grid-cols-[0.95fr_1.05fr] items-center">
        <div
          className={`transition duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-x-0 order-1 ${rightReveal}`}
          style={{ transitionDelay: isMounted ? '80ms' : '0ms' }}
        >
          <AuthForms
            onAuth={onAuthSuccess}
            redirectOnSuccess
            defaultMode="login"
            postAuthRoute="/profile"
          />
        </div>
        <div
          className={`space-y-6 transition duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-x-0 order-2 ${leftReveal}`}
        >
          <p className="text-xs uppercase tracking-[0.4em] text-slate-300">Sign in first</p>
          <h1 className="text-4xl font-bold leading-tight">
            Logging in pulls your dream teams, fixtures, and cart into one dashboard.
          </h1>
          <p className="text-slate-300 max-w-xl">
            The modal now leads with the sign-in view on every screen so returning fans can jump back into their saved data without extra taps.
            Swap to sign up in one click if you still need an account.
          </p>
          <div className="space-y-3 text-sm text-slate-200">
            <p className="font-semibold text-white">Once you are in you can:</p>
            <ul className="space-y-2">
              <li>• Resume favorite players and teams instantly.</li>
              <li>• Edit Dream Teams and share IDs with your crew.</li>
              <li>• Keep merch carts, fixtures, and trivia streaks synced.</li>
              <li>• Update your profile bio, email, and hometown details.</li>
            </ul>
          </div>
          <Link to="/" className="inline-flex text-indigo-300 hover:text-white font-semibold">← Back to Hoop Hub</Link>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
