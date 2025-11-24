"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { List, BarChart3, ArrowLeft } from "lucide-react";

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

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar - Hidden on mobile, visible on md+ */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-16 flex-col bg-zinc-950 border-r border-white/10 z-50">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-white/10">
          <div className="h-7 w-7 bg-white rounded-md" />
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
          <div className="h-6 w-6 bg-white rounded" />
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

