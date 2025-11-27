"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Activity, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Leaderboard with Real-time Updates
  // With ledger-based architecture, user_id is PRIMARY KEY so no duplicates possible
  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      
      // Fetch all entries - already deduplicated by schema (user_id is PK)
      const { data } = await supabase
        .from('leaderboard')
        .select('user_id, username, avatar_url, total_score, games_played, last_played_at')
        .order('total_score', { ascending: false })
        .limit(50);
      
      if (data) {
        setLeaderboard(data);
      }
      setLoading(false);
    }
    
    // Initial fetch
    fetchLeaderboard();

    // Set up real-time subscription
    const channel = supabase
      .channel('leaderboard_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard' },
        (payload) => {
          console.log('Leaderboard change detected:', payload);
          // Re-fetch the entire leaderboard when any change happens
          fetchLeaderboard();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="w-full px-4 sm:px-6 relative flex flex-col justify-center items-center mx-auto min-h-screen pt-2 transition-all duration-500 max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header with Trophy Icon */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-yellow-500/10 via-white/5 to-blue-500/10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base sm:text-lg">Career Leaderboard</h3>
                <p className="text-[10px] sm:text-xs text-zinc-400">Cumulative Scores • Updated in Real-time</p>
              </div>
            </div>
            <Link href="/">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Back
              </Button>
            </Link>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="p-3 sm:p-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-12 text-zinc-500">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse" />
              <p className="text-sm">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No entries yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((user, i) => {
                const isTopThree = i < 3;
                
                return (
                    <motion.div
                    key={user.user_id || i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`
                      group relative flex items-center justify-between p-3 sm:p-4 rounded-xl transition-all duration-300
                      ${isTopThree 
                        ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 hover:border-yellow-500/40' 
                        : 'bg-zinc-800/30 border border-transparent hover:border-white/10 hover:bg-zinc-800/50'
                      }
                      cursor-pointer transform hover:scale-[1.02] hover:shadow-lg
                    `}
                  >
                    {/* Rank Badge */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-1">
                      <div className={`
                        flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-bold text-xs sm:text-sm
                        ${isTopThree 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                          : 'bg-zinc-700/50 text-zinc-500 border border-zinc-600/30'
                        }
                      `}>
                        #{i + 1}
                      </div>

                      {/* Avatar + Username */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/10 overflow-hidden flex-shrink-0 bg-white">
                          <img 
                            src={getAvatarForRank(i)} 
                            alt="" 
                            className="w-full h-full object-cover object-center scale-110"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-sm sm:text-base truncate ${isTopThree ? 'text-white' : 'text-zinc-300'} group-hover:text-white transition-colors`}>
                            {user.username}
                          </div>
                          <div className="text-[10px] sm:text-xs text-zinc-500">
                            {user.games_played} {user.games_played === 1 ? 'game' : 'games'} played
                          </div>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className={`
                        px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg font-mono font-bold text-xs sm:text-sm
                        ${isTopThree 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                          : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600/30'
                        }
                        group-hover:scale-110 transition-transform
                      `}>
                        {Math.floor(user.total_score / 1000)} pts
                      </div>
                    </div>

                    {/* Animated Shine Effect for Top 3 */}
                    {isTopThree && (
                      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3" />
              <span>{leaderboard.length} players ranked</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-3 h-3" />
              <span>Play daily to climb!</span>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}


