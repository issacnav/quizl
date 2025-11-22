"use client";

import { useState, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";

import { Check, Trophy, ArrowRight, Activity, User } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Card } from "@/components/ui/card";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";



// --- Types ---

type QuizState = "QUIZ" | "SCORE" | "LEADERBOARD";



// --- Mock Data (In real app, fetch from DB) ---

const MOCK_QUIZ = {

  id: 1,

  question: "A patient presents with limited dorsiflexion. Which mobilization technique is most appropriate?",

  options: [

    { id: "a", text: "Posterior Talar Glide" },

    { id: "b", text: "Anterior Talar Glide" }, // Correct

    { id: "c", text: "Distal Tibiofibular Glide" },

    { id: "d", text: "Subtalar Lateral Glide" },

  ],

  correctId: "a", // Posterior glide increases dorsiflexion

};



const MOCK_LEADERBOARD = [

  { name: "Sarah Physio", score: 980, time: "12s" },

  { name: "Mike Recovery", score: 950, time: "15s" },

  { name: "Dr. J", score: 890, time: "18s" },

];



export default function DailyChallenge() {

  const [view, setView] = useState<QuizState>("QUIZ");

  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [showNameModal, setShowNameModal] = useState(false);

  const [userName, setUserName] = useState("");

  

  // Animation variants

  const containerVariants = {

    hidden: { opacity: 0, y: 20 },

    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },

    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }

  };



  const handleAnswer = (id: string) => {

    setSelectedOption(id);

    const correct = id === MOCK_QUIZ.correctId;

    setIsCorrect(correct);

    

    // Delay to show result then move to score

    setTimeout(() => {

      setView("SCORE");

      setTimeout(() => setShowNameModal(true), 500); // Trigger popup shortly after score

    }, 1200);

  };



  const handleJoinLeaderboard = () => {

    if (!userName) return;

    setShowNameModal(false);

    setView("LEADERBOARD");

  };



  return (

    <main className="w-full max-w-lg px-4 relative">

      {/* Background Ambient Effect */}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />



      <AnimatePresence mode="wait">

        

        {/* VIEW 1: THE QUIZ */}

        {view === "QUIZ" && (

          <motion.div

            key="quiz"

            variants={containerVariants}

            initial="hidden"

            animate="visible"

            exit="exit"

          >

            <div className="mb-6 text-center">

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-400 mb-4">

                <Activity className="w-3 h-3 text-green-500" />

                <span>DAILY CHALLENGE #124</span>

              </div>

              <h2 className="text-2xl font-medium leading-tight text-white">

                {MOCK_QUIZ.question}

              </h2>

            </div>



            <div className="space-y-3">

              {MOCK_QUIZ.options.map((opt) => (

                <motion.button

                  key={opt.id}

                  whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.08)" }}

                  whileTap={{ scale: 0.98 }}

                  onClick={() => !selectedOption && handleAnswer(opt.id)}

                  className={`

                    w-full p-5 rounded-xl text-left border transition-all duration-200 flex justify-between items-center

                    ${selectedOption === opt.id 

                      ? opt.id === MOCK_QUIZ.correctId 

                        ? "bg-green-500/10 border-green-500/50 text-green-100" 

                        : "bg-red-500/10 border-red-500/50 text-red-100"

                      : "bg-zinc-900/40 border-white/10 hover:border-white/20 text-zinc-300"

                    }

                  `}

                >

                  <span className="text-sm font-medium">{opt.text}</span>

                  {selectedOption === opt.id && (

                    opt.id === MOCK_QUIZ.correctId ? <Check className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-red-500" />

                  )}

                </motion.button>

              ))}

            </div>

          </motion.div>

        )}



        {/* VIEW 2: SCORE / TRANSITION */}

        {view === "SCORE" && (

          <motion.div

            key="score"

            variants={containerVariants}

            initial="hidden"

            animate="visible"

            exit="exit"

            className="text-center pt-10"

          >

            <motion.div 

              initial={{ scale: 0.8, opacity: 0 }}

              animate={{ scale: 1, opacity: 1 }}

              className="w-24 h-24 mx-auto bg-gradient-to-b from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-[0_0_40px_-10px_rgba(74,222,128,0.5)]"

            >

              <Trophy className="w-10 h-10 text-black" />

            </motion.div>

            

            <h1 className="mt-8 text-4xl font-bold text-white glow-text">

              {isCorrect ? "Perfect Score" : "Nice Try"}

            </h1>

            <p className="text-zinc-400 mt-2">

              {isCorrect ? "+1000 pts" : "+200 pts for participation"}

            </p>

          </motion.div>

        )}



        {/* VIEW 3: LEADERBOARD */}

        {view === "LEADERBOARD" && (

          <motion.div

            key="leaderboard"

            variants={containerVariants}

            initial="hidden"

            animate="visible"

            className="glass-card rounded-2xl overflow-hidden"

          >

            <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">

              <h3 className="font-semibold text-white">Global Rankings</h3>

              <span className="text-xs text-zinc-500 font-mono">TOP 100</span>

            </div>

            

            <div className="p-2">

              {/* Current User (You) */}

              <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4 mx-2">

                <div className="flex items-center gap-3">

                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">

                    {userName.charAt(0)}

                  </div>

                  <span className="font-medium text-blue-100">{userName} (You)</span>

                </div>

                <span className="font-mono text-blue-200">{isCorrect ? "1000" : "200"} pts</span>

              </div>



              {/* Public List */}

              <div className="space-y-1">

                {MOCK_LEADERBOARD.map((user, i) => (

                  <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors px-4">

                    <div className="flex items-center gap-4">

                      <span className="text-xs font-mono text-zinc-500 w-4">0{i + 1}</span>

                      <span className="text-sm text-zinc-300">{user.name}</span>

                    </div>

                    <span className="text-xs font-mono text-zinc-500">{user.score} pts</span>

                  </div>

                ))}

              </div>

            </div>

          </motion.div>

        )}

      </AnimatePresence>



      {/* NAME INPUT POPUP */}

      <Dialog open={showNameModal} onOpenChange={setShowNameModal}>

        <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-md">

          <DialogHeader>

            <DialogTitle className="text-center text-xl">Claim your spot</DialogTitle>

          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">

            <div className="relative">

              <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />

              <Input 

                placeholder="Enter your name" 

                className="pl-9 bg-zinc-900 border-white/10 focus-visible:ring-white/20"

                value={userName}

                onChange={(e) => setUserName(e.target.value)}

                onKeyDown={(e) => e.key === 'Enter' && handleJoinLeaderboard()}

              />

            </div>

            <Button onClick={handleJoinLeaderboard} className="w-full bg-white text-black hover:bg-zinc-200">

              View Leaderboard <ArrowRight className="w-4 h-4 ml-2" />

            </Button>

        </div>

        </DialogContent>

      </Dialog>

      </main>

  );

}
