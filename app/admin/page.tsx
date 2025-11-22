"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import { Card } from "@/components/ui/card";

import { Plus, Save } from "lucide-react";



export default function AdminPanel() {

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



        <form className="space-y-6">

          {/* Question */}

          <div className="space-y-2">

            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Question</label>

            <Textarea 

              className="bg-black/50 border-white/10 min-h-[100px] text-base resize-none focus-visible:ring-white/20" 

              placeholder="Type the clinical question here..."

            />

          </div>



          {/* Options */}

          <div className="space-y-3">

            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Answer Options</label>

            {[1, 2, 3, 4].map((num) => (

              <div key={num} className="flex gap-3">

                <div className="flex items-center justify-center w-8 h-10 rounded border border-white/10 bg-white/5 text-xs font-mono text-zinc-500">

                  {String.fromCharCode(64 + num)}

                </div>

                <Input 

                  className="bg-black/50 border-white/10 focus-visible:ring-white/20"

                  placeholder={`Option ${num}`}

                />

                <div className="flex items-center">

                  <input 

                    type="radio" 

                    name="correctOption" 

                    className="appearance-none w-4 h-4 rounded-full border border-zinc-600 checked:bg-green-500 checked:border-green-500 cursor-pointer" 

                  />

                </div>

              </div>

            ))}

          </div>



          <div className="pt-6 border-t border-white/10 flex justify-end gap-4">

            <Button variant="ghost" className="text-zinc-400 hover:text-white">Cancel</Button>

            <Button className="bg-white text-black hover:bg-zinc-200 px-6">

              <Save className="w-4 h-4 mr-2" />

              Publish Live

            </Button>

          </div>

        </form>

      </Card>

    </div>

  );

}
