"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { List, BarChart3, ArrowLeft, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

// --- CONFIG ---
const ADMIN_USER = "sarthaknav";
const ADMIN_PASS = "Delightful@98";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: "Manage Quizzes",
    href: "/admin",
    icon: <List className="w-5 h-5" />,
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: <BarChart3 className="w-5 h-5" />,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Login Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Check session storage on mount
    const auth = sessionStorage.getItem("admin_auth");
    if (auth === "true") {
      setIsAuthorized(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      sessionStorage.setItem("admin_auth", "true");
      setIsAuthorized(true);
      setError("");
    } else {
      setError("Invalid credentials");
    }
  };

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  // --- LOGIN SCREEN ---
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-zinc-900/20 blur-[100px] rounded-full" />
        </div>

        <Card className="w-full max-w-md bg-zinc-950 border-white/10 relative z-10">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-white/5">
              <Lock className="w-6 h-6 text-zinc-400" />
            </div>
            <CardTitle className="text-2xl text-white">Admin Access</CardTitle>
            <CardDescription className="text-zinc-500">
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Username</label>
                <Input 
                  type="text" 
                  placeholder="Username" 
                  className="bg-black border-white/10 text-white"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-black border-white/10 text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <p className="text-xs text-red-400 text-center">{error}</p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200">
                Unlock Panel
              </Button>
              <Link href="/" className="text-xs text-zinc-500 hover:text-white transition-colors">
                Return to website
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // --- AUTHENTICATED LAYOUT ---
  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar - Hidden on mobile, visible on md+ */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-16 flex-col bg-zinc-950 border-r border-white/10 z-50">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-white/10">
          <Image src="/icon.png" alt="Logo" width={28} height={28} className="rounded-md" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center py-4 gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.icon}
              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 border border-white/10 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                {item.label}
              </span>
              {/* Active indicator */}
              {isActive(item.href) && (
                <span className="absolute left-0 w-0.5 h-6 bg-white rounded-r-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom Navigation - Back to Site */}
        <div className="flex flex-col items-center py-4 border-t border-white/10">
          <Link
            href="/"
            className="group relative flex items-center justify-center w-11 h-11 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            {/* Tooltip */}
            <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 border border-white/10 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
              Back to Site
            </span>
          </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-zinc-950 border-b border-white/10 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Image src="/icon.png" alt="Logo" width={24} height={24} className="rounded" />
          <span className="font-semibold text-white">Admin</span>
        </div>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                isActive(item.href)
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              {item.icon}
            </Link>
          ))}
          <Link
            href="/"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-zinc-500 hover:text-white transition-colors ml-2 border-l border-white/10 pl-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:ml-16 bg-black min-h-screen w-full flex flex-col">
        {/* Mobile top padding */}
        <div className="md:hidden h-14" />
        <div className="flex-1 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
