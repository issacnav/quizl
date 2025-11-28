"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Trophy, ArrowRight, Loader2, Clock, Activity, Book, RotateCcw, Archive } from "lucide-react";
import Lottie from "lottie-react";
import hiAnimation from "@/components/Hi.json";
import deadAnimation from "@/components/Dead.json";
import cryAnimation from "@/components/Cry.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/utils/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- Types ---
type ViewState = "LOADING" | "QUIZ" | "COMPLETED" | "ALREADY_PLAYED" | "PRACTICE_CONFIG" | "PRACTICE_COMPLETED";

// The "Linear" Blur-In Effect
const blurIn = {
  hidden: { filter: "blur(10px)", opacity: 0, y: -20 },
  visible: { filter: "blur(0px)", opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } },
};

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
  const router = useRouter();
  
  // App State
  const [view, setView] = useState<ViewState>("LOADING");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceCount, setPracticeCount] = useState(5);
  
  // Quiz Logic
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Timing for Score Calculation
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // User
  const [showNameModal, setShowNameModal] = useState(false);
  const [userName, setUserName] = useState("");
  const lottieRef = useRef<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [totalScore, setTotalScore] = useState(0); // Cumulative score across all days

  // Helper: Get Today's Date String (YYYY-MM-DD)
  const getTodayString = () => new Date().toISOString().split('T')[0];

  // ============================================
  // SCORE HISTORY SYSTEM - Persists across days
  // ============================================
  
  // Get all scores from localStorage history
  const getScoreHistory = (): Record<string, number> => {
    try {
      const historyStr = localStorage.getItem("physio_score_history");
      return historyStr ? JSON.parse(historyStr) : {};
    } catch {
      return {};
    }
  };

  // Save score for a specific date
  const saveScoreForDate = (date: string, scoreValue: number) => {
    const history = getScoreHistory();
    history[date] = scoreValue;
    localStorage.setItem("physio_score_history", JSON.stringify(history));
  };

  // Get score for a specific date
  const getScoreForDate = (date: string): number | null => {
    const history = getScoreHistory();
    return history[date] ?? null;
  };

  // Calculate total cumulative score
  const getTotalCumulativeScore = (): number => {
    const history = getScoreHistory();
    return Object.values(history).reduce((sum, s) => sum + s, 0);
  };

  // Check if user already played on a specific date
  const hasPlayedOnDate = (date: string): boolean => {
    const history = getScoreHistory();
    return date in history;
  };

  // Migrate old localStorage format to new history format
  const migrateOldScores = () => {
    const oldScore = localStorage.getItem("physio_today_score");
    const oldDate = localStorage.getItem("physio_last_played");
    
    if (oldScore && oldDate) {
      const history = getScoreHistory();
      // Only migrate if this date isn't already in history
      if (!(oldDate in history)) {
        history[oldDate] = parseInt(oldScore);
        localStorage.setItem("physio_score_history", JSON.stringify(history));
        console.log(`Migrated old score: ${oldScore} for date ${oldDate}`);
      }
      // Clean up old keys
      localStorage.removeItem("physio_today_score");
    }
  };

  useEffect(() => {
    // Migrate any old scores first
    migrateOldScores();
    
    const initUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data.user);
      
      // If logged in, fetch career total from the leaderboard (source of truth)
      if (data.user) {
        const { data: leaderboardEntry } = await supabase
          .from('leaderboard')
          .select('total_score')
          .eq('user_id', data.user.id)
          .single();
        
        if (leaderboardEntry && leaderboardEntry.total_score) {
          // Database is the source of truth for logged-in users
          setTotalScore(leaderboardEntry.total_score);
        } else {
          // New user or no DB entry yet - use local for display
          setTotalScore(getTotalCumulativeScore());
        }
      } else {
        // Guest user - use local storage
        setTotalScore(getTotalCumulativeScore());
      }
    };
    
    initUser();
  }, []);

  useEffect(() => {
    async function init() {
      const today = getTodayString();
      
      // A. Check if user FINISHED today (using new history system)
      if (hasPlayedOnDate(today)) {
        const savedScore = getScoreForDate(today);
        if (savedScore !== null) setScore(savedScore);
        setView("ALREADY_PLAYED");
        return; // Stop here
      }

      // B. Check if user has PROGRESS (Mid-game)
      const savedProgress = localStorage.getItem("physio_progress");
      let startFromIndex = 0;
      let startFromScore = 0;

      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        // Only restore if it matches today's date
        if (parsed.date === today) {
            startFromIndex = parsed.index;
            startFromScore = parsed.score;
        }
      }

      // C. Fetch Questions
      const { data, error } = await supabase
        .from('daily_quiz')
        .select('*')
        .eq('date', today)
        .order('id', { ascending: true }); // Ensure consistent order

      if (error || !data || data.length === 0) {
        console.error("No quiz found");
        // Optional: Fallback logic if needed, or just stay in loading
      } else {
        setQuestions(data);
        
        // RESTORE STATE
        if (startFromIndex > 0 && startFromIndex < data.length) {
            setCurrentIndex(startFromIndex);
            setScore(startFromScore);
        }
        
        setView("QUIZ");
      }
    }
    init();
  }, []);

  // 2. Reset Timer when Question Changes
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentIndex, view]);

  // 4. Handle Answer
  const handleAnswer = (optionId: string) => {
    if (selectedOption) return; 
    if (!questions || questions.length === 0) return; // Safety check
    
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    const correct = optionId === currentQuestion.correct_id;
    
    // --- SCORING MATH ---
    // Base: 10,000 internal points = 10 Visual Points
    // Bonus: 0 to 100 internal points based on speed (100 - seconds)
    // Max Internal Score per Q: 10,100
    // Max Total Internal Score (5 Qs): 50,500
    // Max Total Visual Score: floor(50,500 / 1000) = 50.
    
    const timeTakenSec = (Date.now() - questionStartTime) / 1000;
    const speedBonus = Math.max(0, 100 - Math.floor(timeTakenSec));
    const pointsEarned = correct ? (10000 + speedBonus) : 0;

    setSelectedOption(optionId);

    // Calculate new total score immediately for saving
    const newTotalScore = score + pointsEarned;
    if (correct) setScore(newTotalScore);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        // --- SAVE PROGRESS HERE (Only for Daily) ---
        const nextIndex = currentIndex + 1;
        
        if (!isPracticeMode) {
           localStorage.setItem("physio_progress", JSON.stringify({
               date: getTodayString(),
               index: nextIndex,
               score: newTotalScore
           }));
        }
        
        setCurrentIndex(nextIndex);
        setSelectedOption(null);
        // Timer resets via useEffect
      } else {
        // Quiz Finished
        if (isPracticeMode) {
           finishPractice(newTotalScore);
        } else {
           finishQuiz(newTotalScore);
        }
      }
    }, 1200);
  };

  // --- PRACTICE FINISH LOGIC ---
  const finishPractice = (finalScore: number) => {
     // No saving to leaderboard or local history
     setScore(finalScore);
     setView("PRACTICE_COMPLETED");
  };

  // ============================================
  // LEDGER-BASED SAVE: Just INSERT into quiz_history
  // The database trigger handles leaderboard updates automatically
  // ============================================
  const saveScoreToDb = async (todayScore: number, user: any) => {
    if (!user) return;
    
    const today = getTodayString();
    
    // Simply INSERT into quiz_history - the DB trigger handles the rest
    const { error } = await supabase
      .from('quiz_history')
      .insert({
        user_id: user.id,
        date: today,
        score: todayScore
      });
    
    if (error) {
      // Check if it's a duplicate key error (user already played today)
      if (error.code === '23505') { // PostgreSQL unique_violation
        console.log('Score already recorded for today - ignoring duplicate');
        return;
      }
      console.error("Error saving to quiz_history:", error);
      return;
    }
    
    console.log(`Quiz history recorded: ${todayScore} points for ${today}`);
    
    // Fetch updated total from leaderboard (trigger has updated it)
    const { data: leaderboardEntry } = await supabase
      .from('leaderboard')
      .select('total_score')
      .eq('user_id', user.id)
      .single();
    
    if (leaderboardEntry) {
      setTotalScore(leaderboardEntry.total_score);
    }
  };

  const finishQuiz = async (finalScore: number) => {
    const today = getTodayString();
    
    // 1. Save to score history (persists across days)
    saveScoreForDate(today, finalScore);
    
    // 2. Update cumulative total
    const newTotal = getTotalCumulativeScore();
    setTotalScore(newTotal);

    // 3. CLEAR the temporary progress so it doesn't conflict tomorrow
    localStorage.removeItem("physio_progress");

    setScore(finalScore);
    setView("COMPLETED");

    // 4. LOG ATTEMPT ANONYMOUSLY (For Analytics)
    // We do this for EVERYONE who finishes, regardless of leaderboard
    await supabase.from('quiz_attempts').insert({
      score: finalScore,
      date: today
    });

    // 5. AUTO-SAVE if logged in (Leaderboard)
    if (currentUser) {
      await saveScoreToDb(finalScore, currentUser);
    } 
    // If NOT logged in, we show the "Sign in to Claim" UI
  };

  const handleJoinLeaderboard = async () => {
    // With ledger-based system, we require authentication
    // Redirect to Google sign-in which will then sync scores
    setShowNameModal(false);
    await supabase.auth.signInWithOAuth({ 
      provider: 'google', 
      options: { redirectTo: window.location.href } 
    });
  };

  // ============================================
  // LEDGER-BASED SYNC: Upload all local history to quiz_history
  // Database handles duplicates via UNIQUE constraint
  // ============================================
  useEffect(() => {
    const syncLocalHistoryToDb = async () => {
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      // 2. Get ALL local score history
      const scoreHistory = getScoreHistory();
      const historyDates = Object.keys(scoreHistory);
      
      if (historyDates.length === 0) return;

      console.log(`Syncing ${historyDates.length} local quiz records...`);

      // 3. Attempt to insert each day's score
      // The UNIQUE(user_id, date) constraint will reject duplicates safely
      let successCount = 0;
      let duplicateCount = 0;

      for (const date of historyDates) {
        const { error } = await supabase
          .from('quiz_history')
          .insert({
            user_id: user.id,
            date: date,
            score: scoreHistory[date]
          });

        if (error) {
          if (error.code === '23505') { // unique_violation - already synced
            duplicateCount++;
          } else {
            console.error(`Error syncing ${date}:`, error);
          }
        } else {
          successCount++;
        }
      }

      console.log(`Sync complete: ${successCount} new, ${duplicateCount} already synced`);

      // 4. Fetch the authoritative total from leaderboard
      if (successCount > 0 || duplicateCount > 0) {
        const { data: leaderboardEntry } = await supabase
          .from('leaderboard')
          .select('total_score')
          .eq('user_id', user.id)
          .single();

        if (leaderboardEntry) {
          setTotalScore(leaderboardEntry.total_score);
          console.log(`Career total from DB: ${leaderboardEntry.total_score}`);
        }
      }
    };
    
    syncLocalHistoryToDb();
  }, []);

  // --- FEEDBACK HELPER ---
  const getFeedbackMessage = (score: number) => {
    const visualScore = Math.floor(score / 1000);
    if (visualScore <= 10) return "Clinical review recommended. Time to brush up on the basics.";
    if (visualScore <= 20) return "Good warmup. Consistency is the key to clinical mastery.";
    if (visualScore <= 30) return "Solid performance. Your diagnostic reflexes are getting sharper.";
    if (visualScore <= 40) return "Excellent work. Your clinical reasoning is elite.";
    return "World-class precision. You are ready for the toughest cases.";
  };

  // --- MASCOT HELPER ---
  const getMascotAnimation = (finalScore: number) => {
    const visualScore = Math.floor(finalScore / 1000);
    if (visualScore === 0) return deadAnimation;
    if (visualScore <= 20) return cryAnimation; // 10 or 20 pts
    return hiAnimation; // 30, 40, 50 pts
  };

  // --- ANIMATION VARIANTS ---
  const slideVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  // --- PRACTICE MODE HELPERS ---
  const startPractice = async () => {
    setQuestions([]); // Clear previous
    setIsPracticeMode(true);
    
    // Fetch past questions from Supabase
    // Logic: Date < TODAY, limit by practiceCount
    // Since we want random, we can't easily do random() in Supabase without a function
    // So we'll fetch a larger batch of past IDs and pick randomly, or just fetch recent past.
    // For now: Fetch past 100, shuffle client side, take N.
    
    const today = getTodayString();
    const { data, error } = await supabase
      .from('daily_quiz')
      .select('*')
      .lt('date', today)
      .order('date', { ascending: false })
      .limit(50); // Fetch last 50 questions to sample from

    if (error || !data || data.length === 0) {
       alert("No past questions available in The Vault yet!");
       return;
    }

    // Shuffle and slice
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, practiceCount);
    
    setQuestions(selected);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setView("QUIZ");
  };

  return (
    <main className="w-full px-4 sm:px-6 relative flex flex-col justify-center items-center mx-auto min-h-screen pt-2 transition-all duration-500 max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* --- SITE HEADER (Only on first question of QUIZ) --- */}
      <AnimatePresence>
        {currentIndex === 0 && view === "QUIZ" && (
          <motion.div 
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            variants={blurIn}
            className="absolute top-16 left-0 right-0 flex flex-col items-center z-50"
          >
            <div className="flex items-center gap-3 mb-2">
              {/* Text with Linear Gradient */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
                {isPracticeMode ? "The Vault" : "PhysioQuiz"}
              </h1>
            </div>
            
            {/* Subtitle tag */}
            <div className={`px-4 py-1.5 rounded-full border bg-white/5 text-sm font-medium tracking-widest uppercase ${
               isPracticeMode ? "border-amber-500/20 text-amber-400" : "border-white/5 text-zinc-400"
            }`}>
              {isPracticeMode ? "Practice Session" : "Test Your Knowledge"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        
        {view === "LOADING" && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center text-zinc-500 gap-4"
          >
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-xs font-mono uppercase tracking-widest">Syncing Quiz...</p>
          </motion.div>
        )}

        {/* --- VIEW: PRACTICE CONFIG (THE VAULT) --- */}
        {view === "PRACTICE_CONFIG" && (
           <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.95 }}
             className="w-full max-w-md mx-auto"
           >
              <div className="text-center mb-8">
                 <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20">
                    <Archive className="w-8 h-8" />
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-2">The Vault</h2>
                 <p className="text-zinc-400 text-sm">Access the archive of past clinical questions.</p>
              </div>

              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 space-y-8 backdrop-blur-sm">
                 
                 {/* Slider Section */}
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <label className="text-sm font-medium text-zinc-300">Session Length</label>
                       <span className="text-amber-400 font-mono font-bold text-lg">{practiceCount} Qs</span>
                    </div>
                    
                    <Slider 
                       defaultValue={[5]} 
                       max={20} 
                       min={5} 
                       step={5} 
                       onValueChange={(vals) => setPracticeCount(vals[0])}
                       className="py-2"
                    />
                    
                    <p className="text-xs text-zinc-500 text-center">
                       {practiceCount === 5 && "Quick Review • ~2 mins"}
                       {practiceCount === 10 && "Standard Set • ~5 mins"}
                       {practiceCount === 15 && "Extended • ~8 mins"}
                       {practiceCount === 20 && "Deep Dive • ~12 mins"}
                    </p>
                 </div>

                 {/* Actions */}
                 <div className="space-y-3">
                    <Button 
                       onClick={startPractice}
                       className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-12 text-base"
                    >
                       Open The Vault
                    </Button>
                    <Button 
                       variant="ghost" 
                       onClick={() => setView("ALREADY_PLAYED")} // Go back to dashboard basically
                       className="w-full text-zinc-500 hover:text-white"
                    >
                       Return to Dashboard
                    </Button>
                 </div>
              </div>
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
            <div className="flex items-center justify-between mb-4 sm:mb-6 text-xs sm:text-sm font-mono text-zinc-500">
              <span className={isPracticeMode ? "text-amber-500/80" : ""}>
                 {isPracticeMode ? "PRACTICE" : "QUESTION"} {currentIndex + 1} / {questions.length}
              </span>
              <div className={`${isPracticeMode ? "text-zinc-600" : "text-blue-400 font-bold"}`}>
                 SCORE: {Math.floor(score / 1000)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 sm:h-1.5 bg-zinc-800 rounded-full mb-6 sm:mb-8 overflow-hidden">
              <motion.div 
                className={`h-full ${isPracticeMode ? "bg-amber-500" : "bg-blue-500"}`}
                initial={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            <h2 className="text-lg sm:text-xl md:text-2xl font-medium leading-tight text-white mb-6 sm:mb-8">
              {questions[currentIndex].question}
            </h2>

            <div className="space-y-2 sm:space-y-3 md:space-y-4">
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
                    className={`w-full p-3 sm:p-4 md:p-5 rounded-xl text-left border transition-all duration-200 flex justify-between items-center ${style}`}
                  >
                    <span className="text-sm sm:text-base font-medium">{opt.text}</span>
                    {isSelected && (isCorrect ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <X className="w-4 h-4 sm:w-5 sm:h-5" />)}
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
            className="text-center pt-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 mb-6">
                {view === "COMPLETED" ? <Trophy className="w-8 h-8 text-yellow-500" /> : <Clock className="w-8 h-8 text-blue-500" />}
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                {view === "COMPLETED" ? "Session Complete" : "You've played today"}
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 mb-6 sm:mb-8 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
                {view === "COMPLETED" 
                    ? getFeedbackMessage(score)
                    : "Daily Quiz reset at midnight. Come back tomorrow for a new set of questions."}
            </p>

            <div 
              className="w-40 h-40 mx-auto mb-[-12px] cursor-pointer hover:scale-105 transition-transform relative z-20"
              onClick={() => lottieRef.current?.goToAndPlay(0)}
            >
               <Lottie 
                 lottieRef={lottieRef} 
                 animationData={getMascotAnimation(score)} 
                 loop={false} 
               />
            </div>

            <div className="p-4 sm:p-6 md:p-8 bg-zinc-900/50 border border-white/5 rounded-2xl mb-6 sm:mb-8 relative z-10 backdrop-blur-sm">
                <div className="flex justify-center gap-6 sm:gap-10">
                  <div className="text-center">
                    <div className="text-xs sm:text-sm text-zinc-500 uppercase tracking-widest mb-1">Today</div>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-white tracking-tighter">
                        {Math.floor(score / 1000)}
                    </div>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div className="text-center">
                    <div className="text-xs sm:text-sm text-yellow-500/80 uppercase tracking-widest mb-1">Career Total</div>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-yellow-400 tracking-tighter">
                        {Math.floor(totalScore / 1000)}
                    </div>
                  </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 max-w-xs sm:max-w-sm md:max-w-md mx-auto w-full">
                {!currentUser ? (
                  <div className="space-y-3 w-full">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                      <p className="text-xs text-blue-200 mb-3 leading-relaxed">
                        Sign in to save your <strong>{Math.floor(totalScore/1000)} career points</strong> to the leaderboard.
                      </p>
                      <Button 
                        onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } })}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold h-9"
                      >
                        Claim Points & Sign Up
                      </Button>
                    </div>
                    
                    <Link href="/leaderboard" className="w-full">
                      <Button variant="secondary" className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs h-9">
                        View Leaderboard
                      </Button>
                    </Link>
                    
                    {/* Vault Entry Point */}
                    <Button 
                       variant="outline" 
                       className="w-full border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs h-9"
                       onClick={() => setView("PRACTICE_CONFIG")}
                    >
                       <Archive className="w-3 h-3 mr-2" />
                       Enter The Vault (Practice)
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 w-full">
                    <div className="text-center text-xs text-green-400 mb-1 flex items-center justify-center gap-2">
                       <Check className="w-3 h-3" /> Score Saved to Profile
                    </div>
                    <Link href="/leaderboard" className="w-full">
                      <Button className="w-full bg-white text-black hover:bg-zinc-200 font-medium">
                        View Global Rankings
                      </Button>
                    </Link>
                    
                    <Button variant="ghost" className="text-zinc-500 text-xs" disabled>
                        Next Quiz in: {24 - new Date().getHours()}h {60 - new Date().getMinutes()}m
                    </Button>

                    {/* Vault Entry Point */}
                    <Button 
                       variant="outline" 
                       className="w-full border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs h-9"
                       onClick={() => setView("PRACTICE_CONFIG")}
                    >
                       <Archive className="w-3 h-3 mr-2" />
                       Enter The Vault (Practice)
                    </Button>
                  </div>
                )}
            </div>
          </motion.div>
        )}

        {/* --- VIEW: PRACTICE COMPLETED --- */}
        {view === "PRACTICE_COMPLETED" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center pt-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6 text-amber-500">
                <Book className="w-8 h-8" />
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                Session Complete
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 mb-6 sm:mb-8 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
                Practice makes perfect. These scores are just for you and don&apos;t affect your leaderboard ranking.
            </p>

            <div className="p-4 sm:p-6 md:p-8 bg-zinc-900/50 border border-white/5 rounded-2xl mb-6 sm:mb-8 relative z-10 backdrop-blur-sm">
                <div className="text-center">
                   <div className="text-xs sm:text-sm text-zinc-500 uppercase tracking-widest mb-1">Practice Score</div>
                   <div className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-amber-500 tracking-tighter">
                       {Math.floor(score / 1000)}
                   </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 max-w-xs sm:max-w-sm md:max-w-md mx-auto w-full">
               <Button 
                  onClick={() => setView("PRACTICE_CONFIG")}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
               >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Practice Again
               </Button>
               
               <Button 
                  variant="ghost"
                  onClick={() => {
                     // Re-init daily view logic to see if we played today
                     window.location.reload(); // lazy way to reset state back to main logic
                  }}
                  className="w-full text-zinc-500 hover:text-white"
               >
                  Return to Dashboard
               </Button>
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
