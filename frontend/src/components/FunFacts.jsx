import { useState } from "react";
import apiClient from "../services/api";
import SparklesIcon from "@heroicons/react/24/outline/SparklesIcon";
import FireIcon from "@heroicons/react/24/outline/FireIcon";
import FaceSmileIcon from "@heroicons/react/24/outline/FaceSmileIcon";

function FunFacts() {
  const [fact, setFact] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const getFact = async () => {
    setLoading(true);
    setShowConfetti(false);
    try {
      const res = await apiClient.get("funFacts");
      setFact(res.data.fact);
      setHistory(prev => [res.data.fact, ...prev.slice(0, 4)]);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1200);
    } catch {
      setFact("Could not fetch a fun fact. Try again!");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 rounded-3xl shadow-2xl mt-8 text-center animate-fade-in relative">
      <div className="mb-6 flex justify-center">
        <img
          src="https://media.gettyimages.com/id/71213032/photo/new-york-first-round-nba-draft-pick-kobe-bryant-poses-for-a-photo-note-to-user-user-expressly.jpg?s=612x612&w=0&k=20&c=ZSlrW0_YGThSsM4YhHMr2zFQZhVhM4kmatMC8K8K-kw="
          alt="NBA Cap"
          className="rounded-xl shadow-lg w-48 h-48 object-cover border-4 border-indigo-300"
          loading="lazy"
          decoding="async"
          width="192"
          height="192"
        />
      </div>
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10 animate-bounce">
          <span className="text-5xl select-none">🎉</span>
          <span className="text-5xl select-none">🏀</span>
          <span className="text-5xl select-none">✨</span>
        </div>
      )}
      <h2 className="text-4xl font-extrabold text-indigo-700 mb-6 flex items-center justify-center gap-2 font-fun">
        <SparklesIcon className="h-8 w-8 text-yellow-500 inline-block" />
        NBA Fun Facts
  <FaceSmileIcon className="h-7 w-7 text-pink-400 inline-block" />
      </h2>
      <button
        onClick={getFact}
        className="px-8 py-3 bg-gradient-to-r from-indigo-500 via-pink-500 to-yellow-400 text-white rounded-full font-extrabold shadow-lg hover:scale-105 transition-transform mb-6 text-lg tracking-wide"
        disabled={loading}
      >
        {loading ? "Loading..." : "Get a Fun Fact!"}
      </button>
      {fact && (
        <div className="text-xl text-indigo-700 font-bold bg-white rounded-2xl p-6 shadow-lg mt-4 animate-fade-in border-2 border-yellow-200 flex items-center justify-center gap-2">
          <FireIcon className="h-6 w-6 text-orange-400" />
          {fact}
        </div>
      )}
      {history.length > 1 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-pink-600 mb-2">Recent Fun Facts:</h3>
          <ul className="space-y-2">
            {history.slice(1).map((h, i) => (
              <li key={i} className="text-base text-gray-600 bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-100">{h}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FunFacts;
