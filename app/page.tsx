"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Trophy, ArrowRight, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/utils/supabase";

// --- Types ---
type ViewState = "LOADING" | "QUIZ" | "COMPLETED" | "LEADERBOARD" | "ALREADY_PLAYED";

interface Option {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options_json: Option[];
  correct_id: string;
}

export default function DailyChallenge() {
  // App State
  const [view, setView] = useState<ViewState>("LOADING");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  
  // Quiz Logic
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Leaderboard & User
  const [showNameModal, setShowNameModal] = useState(false);
  const [userName, setUserName] = useState("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Helper: Get Today's Date String (YYYY-MM-DD)
  const getTodayString = () => new Date().toISOString().split('T')[0];

  // 1. INITIAL LOAD: Fetch Quiz & Check LocalStorage
  useEffect(() => {
    async function init() {
      // A. Check if user already played today
      const lastPlayed = localStorage.getItem("physio_last_played");
      const today = getTodayString();
      const savedScore = localStorage.getItem("physio_today_score");

      // B. Fetch Questions from Supabase
      const { data, error } = await supabase
        .from('daily_quiz')
        .select('*')
        .eq('date', today); // Only fetch TODAY'S questions

      if (error) {
          console.error("Error fetching:", error);
      }

      if (!data || data.length === 0) {
        console.log("No quiz found for today:", today);
        // Fallback: Load any questions if today is empty (for demo purposes)
        const { data: backupData } = await supabase.from('daily_quiz').select('*').limit(5);
        setQuestions(backupData || []);
        setView("QUIZ");
      } else {
        setQuestions(data);
        
        // C. Decide View based on history
        if (lastPlayed === today) {
          // User already played today
          if (savedScore) setScore(parseInt(savedScore));
          setView("ALREADY_PLAYED");
        } else {
          // New user for today
          setView("QUIZ");
        }
      }
    }
    init();
  }, []);

  // 2. Fetch Leaderboard
  useEffect(() => {
    async function fetchLeaderboard() {
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(20);
      if (data) setLeaderboard(data);
    }
    fetchLeaderboard();
  }, []);

  // 3. Handle Answer
  const handleAnswer = (optionId: string) => {
    if (selectedOption) return; 
    
    const currentQuestion = questions[currentIndex];
    const correct = optionId === currentQuestion.correct_id;
    
    setSelectedOption(optionId);

    if (correct) setScore((prev) => prev + 1000);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
      } else {
        // --- QUIZ FINISHED LOGIC ---
        finishQuiz(correct ? score + 1000 : score);
      }
    }, 1200);
  };

  const finishQuiz = (finalScore: number) => {
    // 1. Save state to LocalStorage so they can't refresh and retry
    const today = getTodayString();
    localStorage.setItem("physio_last_played", today);
    localStorage.setItem("physio_today_score", finalScore.toString());

    setScore(finalScore);
    setView("COMPLETED");
    
    // Small delay before asking for name
    setTimeout(() => setShowNameModal(true), 800);
  };

  const handleJoinLeaderboard = async () => {
    if (!userName) return;
    
    // Insert into Supabase
    await supabase.from('leaderboard').insert({ username: userName, score: score });
    
    // Refresh local list briefly
    setLeaderboard((prev) => [...prev, { username: userName, score: score }].sort((a, b) => b.score - a.score));
    
    setShowNameModal(false);
    setView("LEADERBOARD");
  };

  // --- ANIMATION VARIANTS ---
  const slideVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  return (
    <main className="w-full max-w-lg px-4 relative flex flex-col justify-center mx-auto min-h-[80vh]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <AnimatePresence mode="wait">
        
        {view === "LOADING" && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center text-zinc-500 gap-4"
          >
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-xs font-mono uppercase tracking-widest">Syncing Protocol...</p>
          </motion.div>
        )}

        {/* --- VIEW: QUIZ --- */}
        {view === "QUIZ" && questions[currentIndex] && (
          <motion.div
            key={questions[currentIndex].id}
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6 text-xs font-mono text-zinc-500">
              <span>QUESTION {currentIndex + 1} / {questions.length}</span>
              <div className="text-blue-400">SCORE: {score}</div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-zinc-800 rounded-full mb-8 overflow-hidden">
              <motion.div 
                className="h-full bg-blue-500"
                initial={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            <h2 className="text-xl font-medium leading-tight text-white mb-8">
              {questions[currentIndex].question}
            </h2>

            <div className="space-y-3">
              {questions[currentIndex].options_json.map((opt) => {
                const isSelected = selectedOption === opt.id;
                const isCorrect = opt.id === questions[currentIndex].correct_id;
                
                let style = "bg-zinc-900/40 border-white/10 hover:border-white/20 text-zinc-300";
                if (selectedOption) {
                    if (isSelected && isCorrect) style = "bg-green-500/10 border-green-500/50 text-green-100";
                    else if (isSelected && !isCorrect) style = "bg-red-500/10 border-red-500/50 text-red-100";
                    else if (!isSelected && isCorrect) style = "bg-green-500/5 border-green-500/30 text-green-200/50"; 
                    else style = "opacity-30 border-transparent";
                }

                return (
                  <button
                    key={opt.id}
                    disabled={!!selectedOption}
                    onClick={() => handleAnswer(opt.id)}
                    className={`w-full p-4 rounded-xl text-left border transition-all duration-200 flex justify-between items-center ${style}`}
                  >
                    <span className="text-sm font-medium">{opt.text}</span>
                    {isSelected && (isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />)}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* --- VIEW: ALREADY PLAYED --- */}
        {(view === "ALREADY_PLAYED" || view === "COMPLETED") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center pt-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 mb-6">
                {view === "COMPLETED" ? <Trophy className="w-8 h-8 text-yellow-500" /> : <Clock className="w-8 h-8 text-blue-500" />}
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
                {view === "COMPLETED" ? "Session Complete" : "You've played today"}
            </h2>
            <p className="text-zinc-400 mb-8 max-w-xs mx-auto leading-relaxed">
                {view === "COMPLETED" 
                    ? "Great work. Your stats have been recorded." 
                    : "Daily protocols reset at midnight. Come back tomorrow for a new set of questions."}
            </p>

            <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl mb-8">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Your Score</div>
                <div className="text-4xl font-mono font-bold text-white">{score}</div>
            </div>

            <div className="flex flex-col gap-3">
                <Button onClick={() => setView("LEADERBOARD")} className="w-full bg-white text-black hover:bg-zinc-200">
                    View Leaderboard
                </Button>
                <Button variant="ghost" className="text-zinc-500" disabled>
                    Next Quiz in: {24 - new Date().getHours()}h {60 - new Date().getMinutes()}m
                </Button>
            </div>
          </motion.div>
        )}

        {/* --- VIEW: LEADERBOARD --- */}
        {view === "LEADERBOARD" && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
            >
                <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                    <h3 className="font-semibold text-white">Today's Top Physios</h3>
                    <Button variant="ghost" size="sm" onClick={() => setView("ALREADY_PLAYED")} className="h-6 text-xs">Back</Button>
                </div>
                <div className="p-2 max-h-[400px] overflow-y-auto">
                    {leaderboard.map((user, i) => (
                        <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors px-4">
                            <div className="flex items-center gap-4">
                                <span className={`text-xs font-mono w-4 ${i < 3 ? 'text-yellow-500' : 'text-zinc-600'}`}>{i + 1}</span>
                                <span className="text-sm text-zinc-300">{user.username || user.name}</span>
                            </div>
                            <span className="text-xs font-mono text-zinc-500">{user.score}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        )}

      </AnimatePresence>

      {/* --- NAME INPUT DIALOG --- */}
      <Dialog open={showNameModal} onOpenChange={(open) => { if(!open && userName) setShowNameModal(false); }}>
        <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Record your performance</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Input 
                placeholder="Enter your name" 
                className="bg-zinc-900 border-white/10 text-white"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
            />
            <Button onClick={handleJoinLeaderboard} className="bg-white text-black hover:bg-zinc-200">
              Save & View Leaderboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
