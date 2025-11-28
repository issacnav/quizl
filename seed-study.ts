import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytdmxhpxceywuaudguti.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0ZG14aHB4Y2V5d3VhdWRndXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjA2MDAsImV4cCI6MjA3OTM5NjYwMH0.DF323J_0OhS6pad5jgXgtdHVJ1BcvaJre894-r5AMQU';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Path to the questions file
const FILE_PATH = "c:\\Users\\naval\\Downloads\\scrap\\formatted_study_questions.txt";

async function seed() {
  console.log("Reading questions from:", FILE_PATH);
  
  let content = "";
  try {
    content = fs.readFileSync(FILE_PATH, 'utf8');
  } catch (err) {
    console.error("Error reading file:", err);
    console.log("Please ensure the file exists at the specified path.");
    return;
  }

  // Split by separator
  const blocks = content.split('---').map(b => b.trim()).filter(b => b);
  
  const questions = [];
  
  for (const block of blocks) {
    // Extract Question (look for Q: ... until Options:)
    const questionMatch = block.match(/Q:\s*([\s\S]*?)(?=Options:)/);
    if (!questionMatch) continue;
    
    const questionText = questionMatch[1].trim().replace(/\r\n/g, ' ').replace(/\n/g, ' ');
    
    // Extract Options
    const optionA = block.match(/A\)\s*(.+)/);
    const optionB = block.match(/B\)\s*(.+)/);
    const optionC = block.match(/C\)\s*(.+)/);
    
    if (optionA && optionB && optionC) {
      const options = [
        { id: "a", text: optionA[1].trim() },
        { id: "b", text: optionB[1].trim() },
        { id: "c", text: optionC[1].trim() }
      ];
      
      // Random answer
      const correctId = ['a', 'b', 'c'][Math.floor(Math.random() * 3)];
      
      questions.push({
        question: questionText,
        options,
        correct_id: correctId
      });
    }
  }
  
  console.log(`Parsed ${questions.length} questions.`);
  
  // Group into sets of 10
  const batches = [];
  for (let i = 0; i < questions.length; i += 10) {
    batches.push(questions.slice(i, i + 10));
  }
  
  console.log(`Created ${batches.length} batches (sets of 10).`);
  
  // Insert logic
  // Start date: 29/11/2025
  const startDate = new Date("2025-11-29T12:00:00Z"); // Use noon to avoid timezone issues flipping the date
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    // Calculate date for this batch
    const batchDate = new Date(startDate);
    batchDate.setDate(startDate.getDate() + i);
    const dateString = batchDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    console.log(`Uploading batch ${i+1}/${batches.length} for date ${dateString} (${batch.length} questions)...`);
    
    // Insert questions one by one (or we could use upsert if ID was known, but here we insert new)
    // Note: If 'date' has a UNIQUE constraint, this will fail after the first insert for a day.
    
    for (const q of batch) {
        const { error } = await supabase.from('daily_quiz').insert({
            question: q.question,
            options_json: q.options, // Ensure column name matches your schema (options_json or options)
            correct_id: q.correct_id,
            date: dateString
        });
        
        if (error) {
            console.error(`Error inserting question: ${error.message}`);
            if (error.message.includes("unique constraint") || error.message.includes("daily_quiz_date_key")) {
                console.error("\n!!! CRITICAL ERROR !!!");
                console.error("The database has a UNIQUE constraint on the 'date' column.");
                console.error("This prevents adding multiple questions for the same day.");
                console.error("TO FIX: You must remove the UNIQUE constraint from the 'daily_quiz' table.");
                console.error("SQL to fix: ALTER TABLE daily_quiz DROP CONSTRAINT daily_quiz_date_key;\n");
                return; // Stop execution
            }
        }
    }
  }
  
  console.log("Seeding complete!");
}

seed();

