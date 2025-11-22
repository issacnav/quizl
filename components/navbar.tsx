"use client";

import Link from "next/link";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";



export default function Navbar() {

  return (

    <motion.header 

      initial={{ y: -100, opacity: 0 }}

      animate={{ y: 0, opacity: 1 }}

      className="fixed top-0 w-full z-50 border-b border-white/10 bg-background/50 backdrop-blur-xl"

    >

      <div className="container mx-auto flex h-16 items-center justify-between px-4">

        <div className="flex items-center gap-2">

          <div className="h-6 w-6 rounded bg-primary" />

          <span className="font-bold tracking-tight">PhysioFlow</span>

        </div>

        <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">

          <Link href="#" className="hover:text-primary transition-colors">Recovery</Link>

          <Link href="#" className="hover:text-primary transition-colors">Exercises</Link>

          <Link href="#quiz" className="hover:text-primary transition-colors">Daily Quiz</Link>

        </nav>

        <div className="flex items-center gap-4">

          <Link href="/admin">

            <Button variant="ghost" size="sm" className="text-muted-foreground">Admin</Button>

          </Link>

          <Button size="sm" className="rounded-full px-6">Get Started</Button>

        </div>

      </div>

    </motion.header>

  );

}

