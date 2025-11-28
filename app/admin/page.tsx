"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  Plus, Calendar, Save, CheckCircle2, Loader2, Trash2, 
  ArrowLeft, Edit, Search, Folder, ChevronRight
} from "lucide-react";

// --- Types ---
interface Question {
  id?: number;
  question: string;
  options_json: { id: string; text: string }[];
  correct_id: string;
  date: string; // YYYY-MM-DD
}

interface DateFolder {
  date: string;
  count: number;
  questions: Question[];
  color: string;
}

const FOLDER_COLORS = [
  "text-blue-500", "text-green-500", "text-purple-500", "text-orange-500", 
  "text-pink-500", "text-teal-500", "text-indigo-500", "text-cyan-500", 
  "text-rose-500", "text-emerald-500", "text-amber-500", "text-violet-500"
];

const getRandomColor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FOLDER_COLORS[Math.abs(hash) % FOLDER_COLORS.length];
};

const INITIAL_QUESTION: Question = {
  question: "",
  options_json: [
    { id: "a", text: "" },
    { id: "b", text: "" },
    { id: "c", text: "" },
    { id: "d", text: "" },
  ],
  correct_id: "a",
  date: new Date().toISOString().split("T")[0],
};

// Helper for safe date formatting
const formatDate = (dateStr: string) => {
  try {
    if (!dateStr) return { month: "-", day: "-" };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { month: "-", day: "-" };
    return {
        month: d.toLocaleString('default', { month: 'short' }),
        day: d.getDate()
    };
  } catch (e) {
    return { month: "-", day: "-" };
  }
};

export default function AdminPanel() {
  const [view, setView] = useState<"FOLDERS" | "LIST" | "EDIT">("FOLDERS");
  const [loading, setLoading] = useState(false);
  const [listData, setListData] = useState<Question[]>([]);
  const [folders, setFolders] = useState<DateFolder[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [formData, setFormData] = useState<Question>(INITIAL_QUESTION);
  
  // Refs for date inputs
  const dateInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  
  // Ref for scroll position
  const scrollPositionRef = useRef(0);

  // Effect to restore scroll position when switching back
  useEffect(() => {
    if (view === "LIST" || view === "FOLDERS") {
      setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current);
      }, 0);
    }
  }, [view]);

  // Effect to fetch questions only on mount or manual refresh
  useEffect(() => {
    fetchQuestions();
  }, []); 

  async function fetchQuestions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("daily_quiz")
      .select("*")
      .order("date", { ascending: false })
      .order("id", { ascending: false });

    if (error) {
      console.error("Error fetching full object:", error);
      alert("Error fetching data: " + (error.message || JSON.stringify(error)));
    } else {
      const questions = data || [];
      setListData(questions);
      
      // Group by date
      const grouped = questions.reduce((acc: { [key: string]: Question[] }, q: Question) => {
        if (!acc[q.date]) acc[q.date] = [];
        acc[q.date].push(q);
        return acc;
      }, {});
      
      const folderList = Object.keys(grouped).map(date => ({
        date,
        count: grouped[date].length,
        questions: grouped[date],
        color: getRandomColor(date)
      })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setFolders(folderList);
    }
      setLoading(false);
  }

  // --- Actions ---
  
  const handleOpenFolder = (date: string) => {
    scrollPositionRef.current = window.scrollY;
    setSelectedDate(date);
    setView("LIST");
    window.scrollTo(0, 0);
  };

  const handleBackToFolders = () => {
    setSelectedDate(null);
    setView("FOLDERS");
  };

  const handleEdit = (item: any) => {
    // Save current scroll position before switching views
    scrollPositionRef.current = window.scrollY;
    
    setFormData({
      id: item.id,
      question: item.question,
      options_json: item.options_json,
      correct_id: item.correct_id,
      date: item.date,
    });
    setView("EDIT");
  };

  const handleCreate = () => {
    // Save scroll position here too, just in case
    scrollPositionRef.current = window.scrollY;
    
    setFormData({
      ...INITIAL_QUESTION,
      date: selectedDate || new Date().toISOString().split("T")[0]
    });
    setView("EDIT");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    
    const { error } = await supabase.from("daily_quiz").delete().eq("id", id);
    if (error) {
      alert("Error deleting: " + error.message);
    } else {
      if (view === "EDIT") {
        setView("LIST");
        fetchQuestions(); 
      } else {
        fetchQuestions();
      }
    }
  };

  const handleSave = async () => {
    if (!formData.question.trim()) return alert("Question text is required");
    setLoading(true);

    const payload = {
      question: formData.question,
      options_json: formData.options_json,
      correct_id: formData.correct_id,
      date: formData.date,
    };

    let error;
    
    if (formData.id) {
      // Update
      const res = await supabase
        .from("daily_quiz")
        .update(payload)
        .eq("id", formData.id);
      error = res.error;
    } else {
      // Insert
      const res = await supabase.from("daily_quiz").insert([payload]);
      error = res.error;
    }

    setLoading(false);

    if (error) {
      alert("Error saving: " + error.message);
    } else {
      // If date changed, we might need to switch folders or just refresh
      if (selectedDate && formData.date !== selectedDate) {
         alert("Saved! Question moved to " + formData.date);
      }
      setView("LIST");
      fetchQuestions(); 
    }
  };

  const handleQuickDateUpdate = async (id: number, newDate: string) => {
    const { error } = await supabase
      .from("daily_quiz")
      .update({ date: newDate })
      .eq("id", id);
      
    if (error) {
      alert("Failed to update date: " + error.message);
    } else {
      fetchQuestions();
    }
  };

  // --- Form Helpers ---

  const updateOption = (index: number, text: string) => {
    const newOptions = [...formData.options_json];
    newOptions[index].text = text;
    setFormData({ ...formData, options_json: newOptions });
  };

  // Filtered List (Only show questions for selected date)
  const filteredList = listData.filter(q => {
    if (selectedDate && q.date !== selectedDate) return false;
    return (
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.date.includes(searchTerm)
    );
  });

  // Filter folders based on search
  const filteredFolders = folders.filter(f => 
    f.date.includes(searchTerm) || 
    f.questions.some(q => q.question.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full text-white font-sans selection:bg-zinc-800">

      {/* Header */}
      <header className="border-b border-white/10 bg-zinc-950/50 backdrop-blur sticky top-0 z-40">
        <div className="px-6 h-16 flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
             {view === "LIST" && selectedDate ? (
                 <Button 
                    variant="ghost" 
                    className="text-zinc-400 hover:text-white pl-0 pr-2" 
                    onClick={handleBackToFolders}
                 >
                    <ArrowLeft className="w-5 h-5" />
                 </Button>
             ) : null}
             
             <div>
               <h1 className="font-bold text-lg tracking-tight flex items-center gap-2">
                 {view === "LIST" && selectedDate ? (
                    <>
                       <span>{formatDate(selectedDate).month} {formatDate(selectedDate).day}</span>
                       <span className="text-zinc-600 text-sm font-normal">({filteredList.length})</span>
                    </>
                 ) : "Manage Quizzes"}
               </h1>
               <p className="text-xs text-zinc-500">
                 {view === "LIST" && selectedDate ? "Editing questions for this day" : "Create and edit daily questions"}
               </p>
             </div>
          </div>

          {view === "LIST" && (
            <Button onClick={handleCreate} className="bg-white text-black hover:bg-zinc-200 rounded-full px-6 font-medium">
              <Plus className="w-4 h-4 mr-2" /> Add Question
          </Button>
          )}
        </div>
      </header>

      <main className="px-6 py-8">

        {/* --- FOLDERS VIEW --- */}
        {view === "FOLDERS" && (
           <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <Input 
                  placeholder="Search dates or questions..." 
                  className="bg-zinc-900 border-white/10 pl-10 py-6 text-white placeholder:text-zinc-600 rounded-xl focus-visible:ring-zinc-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {loading && folders.length === 0 ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-500" /></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {filteredFolders.map((folder) => (
                      <div 
                        key={folder.date}
                        onClick={() => handleOpenFolder(folder.date)}
                        className="group bg-zinc-900/50 border border-white/5 hover:border-white/10 p-5 rounded-xl cursor-pointer transition-all hover:bg-zinc-900 hover:scale-[1.02] active:scale-[0.98]"
                      >
                         <div className="flex items-start justify-between mb-4">
                            <div className={`p-2.5 bg-zinc-800 rounded-lg ${folder.color} group-hover:bg-zinc-800/80 transition-colors`}>
                               <Folder className="w-6 h-6" fill="currentColor" fillOpacity={0.2} />
                            </div>
                            {/* You could put a status badge here if you had one */}
                         </div>
                         
                         <div>
                            <h3 className="text-lg font-bold text-white mb-1">
                                {new Date(folder.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </h3>
                            <p className="text-sm text-zinc-500">
                               {folder.count} question{folder.count !== 1 ? 's' : ''}
                            </p>
                         </div>
                         
                         <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500 group-hover:text-zinc-400">
                            <span>View Questions</span>
                            <ChevronRight className="w-4 h-4" />
                         </div>
                      </div>
                   ))}
                   
                   {/* New Day Card */}
                   <div 
                      onClick={() => {
                         const today = new Date().toISOString().split("T")[0];
                         handleOpenFolder(today); 
                      }}
                      className="flex flex-col items-center justify-center gap-3 p-5 border border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-zinc-900/30 text-zinc-500 hover:text-zinc-300 transition-colors min-h-[160px]"
                   >
                      <Plus className="w-8 h-8" />
                      <span className="font-medium">Start New Day</span>
                   </div>
                </div>
              )}
           </div>
        )}

        {/* --- LIST VIEW --- */}
        {view === "LIST" && (
          <div className="space-y-6">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <Input 
                placeholder="Search questions..." 
                className="bg-zinc-900 border-white/10 pl-10 py-6 text-white placeholder:text-zinc-600 rounded-xl focus-visible:ring-zinc-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Data Grid / List */}
            {loading && listData.length === 0 ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-500" /></div>
            ) : (
              <div className="grid gap-3">
                {filteredList.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleEdit(item)}
                    className="group flex items-center gap-4 p-4 bg-zinc-900/50 border border-white/5 hover:border-white/10 rounded-xl cursor-pointer transition-all hover:bg-zinc-900"
                  >
                    {/* Date Badge */}
                    <div 
                      className="relative flex flex-col items-center justify-center h-12 w-14 bg-zinc-950 rounded-lg border border-white/5 text-zinc-400 shrink-0 hover:border-white/20 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const input = dateInputRefs.current[item.id!];
                        if (input) {
                          try {
                            input.showPicker();
                          } catch {
                            input.focus();
                            input.click();
                          }
                        }
                      }}
                      title="Click to change date"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider">{formatDate(item.date).month}</span>
                      <span className="text-lg font-bold text-white leading-none">{formatDate(item.date).day}</span>
                      
                      <input 
                        ref={(el) => { dateInputRefs.current[item.id!] = el; }}
                        type="date"
                        className="sr-only"
                        defaultValue={item.date}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                           const newDate = e.target.value;
                           if (newDate && item.id) {
                              handleQuickDateUpdate(item.id, newDate);
                           }
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate pr-4">{item.question}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Answer: {item.correct_id.toUpperCase()}</span>
                        <span>•</span>
                        <span>ID: {item.id}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="icon" variant="ghost" 
                        className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                        <Button 
                        size="icon" variant="ghost" 
                        className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-950/30"
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id!); }}
                      >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                  </div>
                ))}

                {filteredList.length === 0 && !loading && (
                  <div className="text-center py-20 text-zinc-500">No questions found.</div>
                )}
              </div>
            )}
          </div>
        )}


        {/* --- EDIT VIEW --- */}
        {view === "EDIT" && (
          <div className="max-w-2xl">

            <Button 
              variant="ghost" 
              className="mb-6 text-zinc-400 hover:text-white pl-0 hover:bg-transparent"
              onClick={() => setView("LIST")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
              </Button>

            <Card className="bg-zinc-900 border-white/10 p-6 space-y-6">
              
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {formData.id ? "Edit Question" : "New Question"}
                </h2>
                <div className="flex items-center gap-2 bg-black px-3 py-1.5 rounded-lg border border-white/10 relative group cursor-pointer">
                  <Calendar className="w-4 h-4 text-zinc-400 pointer-events-none" />
                  <span className="text-sm text-white font-mono pointer-events-none">
                    {formData.date || "Select Date"}
                  </span>
                  <input 
                    type="date"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                  </div>

              {/* Question Text */}
                    <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Question Text</label>
                      <Textarea 
                  className="bg-black border-white/10 min-h-[100px] text-base resize-none focus-visible:ring-zinc-700"
                        placeholder="Enter the clinical scenario..."
                  value={formData.question}
                  onChange={(e) => setFormData({...formData, question: e.target.value})}
                      />
                    </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Options</label>
                {formData.options_json.map((opt, idx) => (
                  <div key={opt.id} className="flex items-center gap-3">
                          <button 
                      onClick={() => setFormData({...formData, correct_id: opt.id})}
                      className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-md border transition-all ${
                        formData.correct_id === opt.id 
                          ? "bg-green-500 border-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]" 
                          : "bg-black border-white/10 text-zinc-500 hover:border-zinc-700"
                      }`}
                    >
                      {formData.correct_id === opt.id ? <CheckCircle2 className="w-5 h-5" /> : <span className="font-bold">{opt.id.toUpperCase()}</span>}
                          </button>
                          <Input 
                      className="bg-black border-white/10 focus-visible:ring-zinc-700"
                            placeholder={`Option ${opt.id.toUpperCase()}`}
                            value={opt.text}
                      onChange={(e) => updateOption(idx, e.target.value)}
                          />
                        </div>
                      ))}
                  </div>

                </Card>

            {/* Save Bar */}
            <div className="flex items-center justify-between mt-6">
              <div>
                {formData.id && (
                  <Button 
                    variant="ghost" 
                    onClick={() => handleDelete(formData.id!)} 
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Question
                  </Button>
                )}
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setView("LIST")} className="text-zinc-400 hover:text-white">
                    Cancel
                  </Button>
                <Button 
                    onClick={handleSave} 
                    disabled={loading}
                    className="bg-white text-black hover:bg-zinc-200 rounded-full px-8"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
