"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Activity, ChevronLeft } from "lucide-react";
import { supabase } from "@/utils/supabase";
import Link from "next/link";

// Avatar icons from /public/avatars folder
const AVATARS = [
  '/avatars/user1.png',
  '/avatars/user2.png',
  '/avatars/user3.png',
  '/avatars/user4.png',
  '/avatars/user5.png',
];

// Get avatar based on rank - ensures first 5 users all have unique avatars
const getAvatarForRank = (rank: number) => {
  return AVATARS[rank % AVATARS.length];
};

// Rank colors for top 3
const getRankStyle = (rank: number) => {
  if (rank === 0) return { color: 'text-yellow-400', bg: 'from-yellow-500/15' }; // Gold
  if (rank === 1) return { color: 'text-zinc-300', bg: 'from-zinc-400/10' };     // Silver
  if (rank === 2) return { color: 'text-amber-600', bg: 'from-amber-600/10' };   // Bronze
  return { color: 'text-zinc-500', bg: '' };
};

// Animation variants for staggered entrance
const listContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const listItem = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

// Fake users for preview
const FAKE_USERS = [
  { user_id: 'fake-1', username: 'Dr. Sarah Chen', total_score: 48500, games_played: 12 },
  { user_id: 'fake-2', username: 'PhysioMaster', total_score: 42000, games_played: 10 },
  { user_id: 'fake-3', username: 'Alex Thompson', total_score: 38750, games_played: 9 },
  { user_id: 'fake-4', username: 'MuscleMedic', total_score: 31200, games_played: 7 },
  { user_id: 'fake-5', username: 'RehabRookie', total_score: 24500, games_played: 6 },
  { user_id: 'fake-6', username: 'JointJunkie', total_score: 18000, games_played: 4 },
];

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Leaderboard with Real-time Updates
  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      
      const { data } = await supabase
        .from('leaderboard')
        .select('user_id, username, avatar_url, total_score, games_played, last_played_at')
        .order('total_score', { ascending: false })
        .limit(50);
      
      // Use real data from Supabase
      if (data) {
        setLeaderboard(data);
      }
      setLoading(false);
    }
    
    fetchLeaderboard();

    const channel = supabase
      .channel('leaderboard_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard' },
        () => fetchLeaderboard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="w-full px-4 sm:px-6 relative flex flex-col justify-center items-center mx-auto min-h-screen py-8">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 blur-[150px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            {/* Back Button - Top Left */}
            <Link href="/">
              <button className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-all duration-200">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </Link>
            
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center border border-yellow-500/20">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h1 className="font-semibold text-white text-lg tracking-tight">Leaderboard</h1>
                <p className="text-xs text-zinc-500">Updated in real-time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Leaderboard List */}
        <div className="p-4 sm:p-5 max-h-[480px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-zinc-500">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-30 animate-pulse" />
              <p className="text-sm">Loading...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No entries yet. Be the first!</p>
            </div>
          ) : (
            <motion.div 
              variants={listContainer}
              initial="hidden"
              animate="show"
              className="space-y-1.5"
            >
              {leaderboard.map((user, i) => {
                const isTopThree = i < 3;
                const rankStyle = getRankStyle(i);
                
                return (
                  <motion.div
                    key={user.user_id || i}
                    variants={listItem}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`
                      group relative overflow-hidden flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl 
                      transition-all duration-300 ease-out
                      hover:scale-[1.02] hover:border-white/10
                      ${i === 0 
                        ? `bg-gradient-to-r ${rankStyle.bg} to-transparent border border-white/[0.06] border-t-yellow-500/25` 
                        : isTopThree 
                          ? `bg-gradient-to-r ${rankStyle.bg} to-transparent border border-white/[0.06]` 
                          : 'hover:bg-white/[0.04] border border-transparent'
                      }
                    `}
                  >
                    {/* Golden Shimmer - Rank #1 Only */}
                    {i === 0 && (
                      <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2.5, 
                          ease: "linear", 
                          repeatDelay: 3 
                        }}
                        className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent skew-x-12"
                      />
                    )}

                    {/* Rank - Clean circular badge */}
                    <div className={`
                      relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm
                      ${isTopThree 
                        ? `${rankStyle.color} bg-white/[0.06]` 
                        : 'text-zinc-600 bg-white/[0.03]'
                      }
                    `}>
                      {i + 1}
                    </div>

                    {/* Avatar */}
                    <div className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800">
                      <img 
                        src={getAvatarForRank(i)} 
                        alt="" 
                        className="w-full h-full object-cover object-center scale-125"
                      />
                    </div>

                    {/* Name & Games */}
                    <div className="relative z-10 flex-1 min-w-0">
                      <div className={`font-medium text-sm sm:text-base truncate ${isTopThree ? 'text-white' : 'text-zinc-300'}`}>
                        {user.username}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {user.games_played} {user.games_played === 1 ? 'game' : 'games'}
                      </div>
                    </div>

                    {/* Score - Ghost style badge */}
                    <div className={`
                      relative z-10 px-3 py-1.5 rounded-full font-mono text-xs sm:text-sm font-medium
                      ${isTopThree 
                        ? `border ${i === 0 ? 'border-yellow-500/30 text-yellow-400' : i === 1 ? 'border-zinc-400/20 text-zinc-300' : 'border-amber-600/30 text-amber-500'} bg-transparent` 
                        : 'border border-white/[0.06] text-zinc-500 bg-transparent'
                      }
                    `}>
                      {Math.floor(user.total_score / 1000)} pts
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Footer - Seamless */}
        <div className="px-5 py-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-[11px] text-zinc-600">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              <span>{leaderboard.length} ranked</span>
            </div>
            <span className="text-zinc-700">Play daily to climb</span>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
