"use client";

import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

import { Card } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { CheckCircle2, XCircle } from "lucide-react";



// Mock Data - In a real app, fetch this from your DB

const dummyQuiz = {

  question: "Which muscle is primarily responsible for knee extension?",

  options: [

    { id: 1, text: "Hamstrings" },

    { id: 2, text: "Quadriceps" },

    { id: 3, text: "Gastrocnemius" },

    { id: 4, text: "Gluteus Maximus" },

  ],

  correctId: 2,

};



export default function DailyQuiz() {

  const [selected, setSelected] = useState<number | null>(null);

  const [submitted, setSubmitted] = useState(false);



  const handleSelect = (id: number) => {

    if (submitted) return;

    setSelected(id);

  };



  const handleSubmit = () => {

    if (selected) setSubmitted(true);

  };



  return (

    <div className="w-full max-w-md mx-auto">

      <div className="mb-4 flex items-center justify-between">

        <span className="text-xs font-mono text-primary/50 uppercase tracking-widest">Daily Challenge</span>

        <span className="text-xs text-muted-foreground">Nov 22, 2025</span>

      </div>



      <Card className="relative overflow-hidden border-white/10 bg-white/5 backdrop-blur-md p-6">

        {/* Background Glow */}

        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />



        <div className="relative z-10">

          <h3 className="mb-6 text-xl font-medium leading-relaxed">

            {dummyQuiz.question}

          </h3>



          <div className="space-y-3">

            {dummyQuiz.options.map((option) => (

              <motion.div

                key={option.id}

                whileHover={{ scale: submitted ? 1 : 1.02 }}

                whileTap={{ scale: submitted ? 1 : 0.98 }}

              >

                <div

                  onClick={() => handleSelect(option.id)}

                  className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 

                    ${

                      submitted && option.id === dummyQuiz.correctId

                        ? "border-green-500/50 bg-green-500/10 text-green-200"

                        : submitted && selected === option.id && selected !== dummyQuiz.correctId

                        ? "border-red-500/50 bg-red-500/10 text-red-200"

                        : selected === option.id

                        ? "border-primary bg-primary/10"

                        : "border-white/5 bg-white/5 hover:bg-white/10"

                    }

                  `}

                >

                  <div className="flex items-center justify-between">

                    <span className="text-sm">{option.text}</span>

                    {submitted && option.id === dummyQuiz.correctId && (

                      <CheckCircle2 className="h-4 w-4 text-green-500" />

                    )}

                    {submitted && selected === option.id && selected !== dummyQuiz.correctId && (

                      <XCircle className="h-4 w-4 text-red-500" />

                    )}

                  </div>

                </div>

              </motion.div>

            ))}

          </div>



          <div className="mt-6 flex justify-end">

             <AnimatePresence>

                {!submitted && selected && (

                    <motion.div

                        initial={{ opacity: 0, y: 10 }}

                        animate={{ opacity: 1, y: 0 }}

                        exit={{ opacity: 0, y: 10 }}

                    >

                        <Button onClick={handleSubmit} className="bg-primary text-primary-foreground hover:bg-white/90">

                            Submit Answer

                        </Button>

                    </motion.div>

                )}

             </AnimatePresence>

             

             {submitted && (

                 <motion.p 

                    initial={{ opacity: 0 }} 

                    animate={{ opacity: 1 }}

                    className="text-sm text-muted-foreground"

                 >

                    {selected === dummyQuiz.correctId ? "Correct! Great job." : "Incorrect. Review the quadriceps anatomy."}

                 </motion.p>

             )}

          </div>

        </div>

      </Card>

    </div>

  );

}

