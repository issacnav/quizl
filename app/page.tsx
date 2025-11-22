"use client";

import { useState, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";

import { Check, X, Trophy, ArrowRight, Activity, User, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { supabase } from "@/utils/supabase";



// --- Types ---

type ViewState = "LOADING" | "QUIZ" | "COMPLETED" | "LEADERBOARD";



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

  

  // Quiz Logic State

  const [currentIndex, setCurrentIndex] = useState(0);

  const [score, setScore] = useState(0);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  

  // Leaderboard State

  const [showNameModal, setShowNameModal] = useState(false);

  const [userName, setUserName] = useState("");

  const [leaderboard, setLeaderboard] = useState<any[]>([]);



  // 1. Fetch Questions on Load

  useEffect(() => {

    async function fetchQuiz() {

      // Get all questions ordered by date or ID

      const { data, error } = await supabase

        .from('daily_quiz')

        .select('*')

        .order('id', { ascending: true });



      if (data && !error) {

        setQuestions(data);

        setView("QUIZ");

      } else {

        console.error("Error fetching quiz:", error);

      }

    }

    fetchQuiz();

  }, []);



  // 2. Fetch Real Leaderboard
  useEffect(() => {
    async function fetchLeaderboard() {
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(20); // Top 20

      if (data) {
        setLeaderboard(data);
      }
    }
    
    // Fetch immediately
    fetchLeaderboard();

    // Real-time subscription (Optional: updates list if someone else plays while you watch)
    const channel = supabase
      .channel('leaderboard_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leaderboard' }, (payload) => {
        setLeaderboard((prev) => [...prev, payload.new].sort((a, b) => b.score - a.score).slice(0, 20));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);



  // 3. Handle Answering a Question

  const handleAnswer = (optionId: string) => {

    if (selectedOption) return; // Prevent double clicks

    

    const currentQuestion = questions[currentIndex];

    const correct = optionId === currentQuestion.correct_id;

    

    setSelectedOption(optionId);

    setIsCorrect(correct);



    if (correct) setScore((prev) => prev + 1000);



    // Wait 1.5s then go to next question or finish

    setTimeout(() => {

      if (currentIndex < questions.length - 1) {

        // Next Question

        setCurrentIndex((prev) => prev + 1);

        setSelectedOption(null);

        setIsCorrect(null);

      } else {

        // Finish Quiz

        setView("COMPLETED");

        setTimeout(() => setShowNameModal(true), 800);

      }

    }, 1500);

  };



  // 4. Submit to Leaderboard
  const handleJoinLeaderboard = async () => {
    if (!userName) return;
    
    // 1. Save to Supabase
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase
        .from('leaderboard')
        .insert({ username: userName, score: score, date: today });

    if (error) {
        console.error(error);
        alert(`Error saving score: ${error.message}`);
        return;
    }

    // 2. Refresh local list (The subscription above will handles this, 
    // but we can manually add it to be instant for the user)
    const newEntry = { username: userName, score: score };
    setLeaderboard((prev) => [...prev, newEntry].sort((a: any, b: any) => b.score - a.score));
    
    setShowNameModal(false);
    setView("LEADERBOARD");
  };



  // Animation Variants
  const slideVariants = {
    hidden: { 
      x: 50, 
      opacity: 0 
    },
    visible: { 
      x: 0, 
      opacity: 1
    },
    exit: { 
      x: -50, 
      opacity: 0
    }
  };



  const currentQ = questions[currentIndex];



  return (

    <main className="w-full max-w-lg px-4 relative min-h-[600px] flex flex-col justify-center">

      {/* Ambient Background */}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />



      {view === "LOADING" && (

        <div className="flex flex-col items-center justify-center text-zinc-500 gap-4">

          <Loader2 className="w-8 h-8 animate-spin" />

          <p>Loading Protocol...</p>

        </div>

      )}



      <AnimatePresence mode="wait">

        

        {/* --- VIEW: QUIZ --- */}

        {view === "QUIZ" && currentQ && (

          <motion.div

            key={currentQ.id} // Key change triggers animation

            variants={slideVariants}

            initial="hidden"

            animate="visible"

            exit="exit"

            transition={{ duration: 0.3, ease: "easeOut" }}

          >

            {/* Progress Bar */}

            <div className="flex items-center justify-between mb-6 text-xs font-mono text-zinc-500">

              <div className="flex gap-1">

                 <span>QUESTION {currentIndex + 1}</span>

                 <span className="text-zinc-700">/</span>

                 <span>{questions.length}</span>

              </div>

              <div className="text-blue-400">SCORE: {score}</div>

            </div>



            {/* Progress Line */}

            <div className="w-full h-1 bg-zinc-800 rounded-full mb-8 overflow-hidden">

              <motion.div 

                className="h-full bg-blue-500"

                initial={{ width: `${((currentIndex) / questions.length) * 100}%` }}

                animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}

              />

            </div>



            <h2 className="text-xl md:text-2xl font-medium leading-tight text-white mb-8">

              {currentQ.question}

            </h2>



            <div className="space-y-3">

              {currentQ.options_json.map((opt) => {

                const isSelected = selectedOption === opt.id;

                const isTheCorrectAnswer = opt.id === currentQ.correct_id;

                

                // Dynamic Styles logic

                let styleClass = "bg-zinc-900/40 border-white/10 hover:border-white/20 text-zinc-300"; // Default

                

                if (selectedOption) {

                  if (isSelected && isTheCorrectAnswer) {

                    styleClass = "bg-green-500/10 border-green-500/50 text-green-100";

                  } else if (isSelected && !isTheCorrectAnswer) {

                    styleClass = "bg-red-500/10 border-red-500/50 text-red-100";

                  } else if (!isSelected && isTheCorrectAnswer) {

                    styleClass = "bg-green-500/5 border-green-500/30 text-green-200/50"; // Show correct answer even if wrong

                  } else {

                    styleClass = "opacity-50 border-transparent"; // Dim others

                  }

                }



                return (

                  <button

                    key={opt.id}

                    disabled={!!selectedOption}

                    onClick={() => handleAnswer(opt.id)}

                    className={`w-full p-5 rounded-xl text-left border transition-all duration-200 flex justify-between items-center ${styleClass}`}

                  >

                    <span className="text-sm font-medium">{opt.text}</span>

                    {isSelected && (isTheCorrectAnswer ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />)}

                  </button>

                );

              })}

            </div>

          </motion.div>

        )}



        {/* --- VIEW: COMPLETED --- */}

        {view === "COMPLETED" && (

          <motion.div

            key="completed"

            initial={{ scale: 0.9, opacity: 0 }}

            animate={{ scale: 1, opacity: 1 }}

            className="text-center pt-10"

          >

            <div className="w-24 h-24 mx-auto bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-[0_0_40px_-10px_rgba(234,179,8,0.5)] mb-8">

              <Trophy className="w-10 h-10 text-black" />

            </div>

            

            <h1 className="text-4xl font-bold text-white mb-2">Session Complete</h1>

            <p className="text-zinc-400 mb-8">You have completed today's protocol.</p>

            

            <div className="inline-block p-6 rounded-2xl bg-zinc-900 border border-zinc-800">

              <div className="text-sm text-zinc-500 uppercase tracking-widest mb-1">Final Score</div>

              <div className="text-5xl font-mono font-bold text-white">{score}</div>

            </div>

          </motion.div>

        )}



        {/* --- VIEW: LEADERBOARD --- */}

        {view === "LEADERBOARD" && (

          <motion.div

            key="leaderboard"

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden"

          >

            <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">

              <h3 className="font-semibold text-white">PhysioFlow Rankings</h3>

              <span className="text-xs text-zinc-500 font-mono">GLOBAL</span>

            </div>

            

            <div className="p-2 max-h-[400px] overflow-y-auto">

               {/* Header for user */}

               <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4 mx-2">

                <div className="flex items-center gap-3">

                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">

                    {userName.charAt(0).toUpperCase()}

                  </div>

                  <span className="font-medium text-blue-100">{userName} (You)</span>

                </div>

                <span className="font-mono text-blue-200 font-bold">{score} pts</span>

              </div>



              {leaderboard.map((user, i) => (

                <div key={user.id || i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors px-4">

                  <div className="flex items-center gap-4">

                    <span className={`text-xs font-mono w-4 ${i < 3 ? 'text-yellow-500' : 'text-zinc-600'}`}>

                      {i + 1}

                    </span>

                    <span className="text-sm text-zinc-300">{user.username || user.name}</span>

                  </div>

                  <span className="text-xs font-mono text-zinc-500">{user.score} pts</span>

                </div>

              ))}

            </div>

            

            <div className="p-4 border-t border-white/10 text-center">

               <Button 

                 variant="ghost" 

                 onClick={() => {

                    setCurrentIndex(0); 

                    setScore(0); 

                    setView("QUIZ");

                    setSelectedOption(null);

                    setIsCorrect(null);

                 }}

                 className="text-xs text-zinc-500 hover:text-white"

               >

                 Restart Challenge

               </Button>

            </div>

          </motion.div>

        )}

      </AnimatePresence>



      {/* NAME INPUT DIALOG */}

      <Dialog open={showNameModal} onOpenChange={setShowNameModal}>

        <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-md">

          <DialogHeader>

            <DialogTitle className="text-center text-xl text-white">Save your progress</DialogTitle>

          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">

            <div className="relative">

              <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />

              <Input 

                placeholder="Enter your name" 

                className="pl-9 bg-zinc-900 border-white/10 focus-visible:ring-blue-500/50 text-white"

                value={userName}

                onChange={(e) => setUserName(e.target.value)}

                onKeyDown={(e) => e.key === 'Enter' && handleJoinLeaderboard()}

              />

            </div>

            <Button onClick={handleJoinLeaderboard} className="w-full bg-white text-black hover:bg-zinc-200 font-semibold">

              Submit Score <ArrowRight className="w-4 h-4 ml-2" />

            </Button>

          </div>

        </DialogContent>

      </Dialog>

    </main>

  );

}
