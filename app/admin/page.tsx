"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import { Card } from "@/components/ui/card";

import { Plus, Save, CheckCircle2 } from "lucide-react";

import { supabase } from "@/lib/supabase";



export default function AdminPanel() {

  const [question, setQuestion] = useState("");

  const [options, setOptions] = useState(["", "", "", ""]);

  const [correctOption, setCorrectOption] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);



  const handleOptionChange = (index: number, value: string) => {

    const newOptions = [...options];

    newOptions[index] = value;

    setOptions(newOptions);

  };



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    

    // Validation

    if (!question.trim()) {

      alert("Please enter a question");

      return;

    }

    if (options.some(opt => !opt.trim())) {

      alert("Please fill in all options");

      return;

    }

    if (correctOption === null) {

      alert("Please select the correct answer");

      return;

    }



    setIsSubmitting(true);



    try {

      // Get today's date in YYYY-MM-DD format

      const today = new Date().toISOString().split('T')[0];



      // Format options as JSON for Supabase

      const optionsJson = options.map((opt, index) => ({

        id: String.fromCharCode(97 + index), // a, b, c, d

        text: opt.trim(),

      }));



      const correctId = String.fromCharCode(97 + correctOption); // a, b, c, or d



      // Insert into Supabase daily_quiz table

      const { data, error: insertError } = await supabase

        .from('daily_quiz')

        .insert({

          question: question.trim(),

          options_json: optionsJson,

          correct_id: correctId,

          date: today,

        })

        .select()

        .single();



      if (insertError) {

        console.error("Error inserting quiz:", insertError);

        

        // Check if it's a unique constraint violation (quiz already exists for today)

        if (insertError.code === '23505') {

          // Try to update instead

          const { error: updateError } = await supabase

            .from('daily_quiz')

            .update({

              question: question.trim(),

              options_json: optionsJson,

              correct_id: correctId,

            })

            .eq('date', today);



          if (updateError) {

            console.error("Error updating quiz:", updateError);

            alert("Failed to publish quiz. A quiz already exists for today and the update failed. Please try again.");

            return;

          }

        } else {

          alert("Failed to publish quiz. Please try again.");

          return;

        }

      }



      console.log("Quiz published successfully:", data);

      

      // Show success message

      setIsSuccess(true);

      setTimeout(() => setIsSuccess(false), 3000);



      // Reset form

      setQuestion("");

      setOptions(["", "", "", ""]);

      setCorrectOption(null);

    } catch (error) {

      console.error("Error publishing quiz:", error);

      alert("Failed to publish quiz. Please try again.");

    } finally {

      setIsSubmitting(false);

    }

  };



  const handleCancel = () => {

    setQuestion("");

    setOptions(["", "", "", ""]);

    setCorrectOption(null);

    setIsSuccess(false);

  };



  return (

    <div className="min-h-screen w-full bg-black p-8 flex flex-col items-center">

      <header className="w-full max-w-2xl flex justify-between items-center mb-12">

        <h1 className="text-xl font-bold tracking-tight text-white">PhysioFlow Admin</h1>

        <div className="text-xs text-zinc-500 font-mono">LOGGED IN</div>

      </header>



      <Card className="w-full max-w-2xl bg-zinc-900/50 border-white/10 p-8 backdrop-blur-md">

        <div className="mb-8">

          <h2 className="text-lg font-medium text-white mb-1">New Daily Quiz</h2>

          <p className="text-sm text-zinc-500">This will update the homepage immediately.</p>

        </div>



        {isSuccess && (

          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">

            <CheckCircle2 className="w-5 h-5 text-green-500" />

            <span className="text-sm text-green-200">Quiz published successfully!</span>

          </div>

        )}



        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Question */}

          <div className="space-y-2">

            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Question</label>

            <Textarea 

              className="bg-black/50 border-white/10 min-h-[100px] text-base resize-none focus-visible:ring-white/20 text-white placeholder:text-zinc-500" 

              placeholder="Type the clinical question here..."

              value={question}

              onChange={(e) => setQuestion(e.target.value)}

              required

            />

          </div>



          {/* Options */}

          <div className="space-y-3">

            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Answer Options</label>

            {[0, 1, 2, 3].map((index) => (

              <div key={index} className="flex gap-3 items-center">

                <div className="flex items-center justify-center w-8 h-10 rounded border border-white/10 bg-white/5 text-xs font-mono text-zinc-500">

                  {String.fromCharCode(65 + index)}

                </div>

                <Input 

                  className="bg-black/50 border-white/10 focus-visible:ring-white/20 text-white placeholder:text-zinc-500 flex-1"

                  placeholder={`Option ${index + 1}`}

                  value={options[index]}

                  onChange={(e) => handleOptionChange(index, e.target.value)}

                  required

                />

                <div className="flex items-center">

                  <input 

                    type="radio" 

                    name="correctOption" 

                    checked={correctOption === index}

                    onChange={() => setCorrectOption(index)}

                    className="appearance-none w-4 h-4 rounded-full border border-zinc-600 checked:bg-green-500 checked:border-green-500 cursor-pointer" 

                    required

                  />

                </div>

              </div>

            ))}

          </div>



          <div className="pt-6 border-t border-white/10 flex justify-end gap-4">

            <Button 

              type="button"

              variant="ghost" 

              className="text-zinc-400 hover:text-white"

              onClick={handleCancel}

              disabled={isSubmitting}

            >

              Cancel

            </Button>

            <Button 

              type="submit"

              className="bg-white text-black hover:bg-zinc-200 px-6 disabled:opacity-50 disabled:cursor-not-allowed"

              disabled={isSubmitting}

            >

              <Save className="w-4 h-4 mr-2" />

              {isSubmitting ? "Publishing..." : "Publish Live"}

            </Button>

          </div>

        </form>

      </Card>

    </div>

  );

}
