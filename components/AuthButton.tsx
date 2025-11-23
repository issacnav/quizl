"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";

export default function AuthButton() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    // Change to 'google' when you have keys, using 'discord' or 'github' is often easier for dev
    await supabase.auth.signInWithOAuth({
      provider: 'google', 
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // Reload to reset state
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        {/* XP Badge */}
        <div className="hidden md:flex items-center px-3 py-1 bg-zinc-800 rounded-full border border-white/5 text-xs text-zinc-300 font-mono">
          LVL 1
        </div>
        
        <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
          {user.user_metadata.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="User" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center"><User className="w-4 h-4" /></div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-zinc-500 hover:text-white">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleLogin}
      size="sm" 
      className="bg-white text-black hover:bg-zinc-200 font-medium text-xs"
    >
      <LogIn className="w-3 h-3 mr-2" />
      Sign In
    </Button>
  );
}

