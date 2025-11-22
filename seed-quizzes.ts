import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

// ---------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytdmxhpxceywuaudguti.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0ZG14aHB4Y2V5d3VhdWRndXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjA2MDAsImV4cCI6MjA3OTM5NjYwMH0.DF323J_0OhS6pad5jgXgtdHVJ1BcvaJre894-r5AMQU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------------------------------------------------------
// THE CARDIO PHYSIO DATA
// ---------------------------------------------------------
const cardioQuestions = [
  {
    question: "A patient 3 days post-CABG reports sternal clicking during supine-to-sit transfers. What is the most appropriate immediate action?",
    options: [
      { id: "a", text: "Encourage use of log-rolling technique" },
      { id: "b", text: "Apply sternal counter-pressure with a pillow" },
      { id: "c", text: "Discontinue therapy and notify the surgeon" }, 
      { id: "d", text: "Progress to resistance exercises" }
    ],
    correct_id: "c"
  },
  {
    question: "Which of the following physiological responses is an absolute contraindication to continuing exercise during Phase I Cardiac Rehab?",
    options: [
      { id: "a", text: "Heart rate increase of 20 bpm above resting" },
      { id: "b", text: "Systolic BP drop >10 mmHg with increasing workload" }, 
      { id: "c", text: "Respiratory rate of 24 breaths/min" },
      { id: "d", text: "SpO2 dropping from 99% to 95%" }
    ],
    correct_id: "b"
  },
  {
    question: "A patient with NYHA Class III Heart Failure is performing ambulation training. Which Borg RPE scale (6-20) range is the recommended intensity target?",
    options: [
      { id: "a", text: "6 - 9 (Very Very Light)" },
      { id: "b", text: "11 - 13 (Light to Somewhat Hard)" }, 
      { id: "c", text: "15 - 17 (Hard to Very Hard)" },
      { id: "d", text: "18 - 20 (Very Very Hard)" }
    ],
    correct_id: "b"
  },
  {
    question: "You are treating a patient with Peripheral Arterial Disease (PAD). They experience claudication pain after 2 minutes of walking. What is the guideline for exercise progression?",
    options: [
      { id: "a", text: "Stop immediately and do not resume walking that day" },
      { id: "b", text: "Walk until pain is excruciating (10/10)" },
      { id: "c", text: "Walk to near-maximal pain (3-4/5), rest, then repeat" }, 
      { id: "d", text: "Avoid walking; switch to ergometer" }
    ],
    correct_id: "c"
  },
  {
    question: "In an ECG strip, what does a wide, bizarre QRS complex without a preceding P-wave typically indicate?",
    options: [
      { id: "a", text: "Atrial Fibrillation" },
      { id: "b", text: "First Degree AV Block" },
      { id: "c", text: "Premature Ventricular Contraction (PVC)" }, 
      { id: "d", text: "ST Segment Elevation" }
    ],
    correct_id: "c"
  }
];

// ---------------------------------------------------------
// UPLOAD LOGIC
// ---------------------------------------------------------
async function seedDatabase() {
  console.log("🚀 Starting upload to Supabase...");

  const today = new Date();

  for (let i = 0; i < cardioQuestions.length; i++) {
    const quiz = cardioQuestions[i];
    
    // Calculate date: Today + i days
    const scheduledDate = new Date(today);
    scheduledDate.setDate(today.getDate() + i);
    const dateString = scheduledDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    // Mapping to your specific database columns:
    // options_json, date, correct_id, question
    const { error } = await supabase
      .from('daily_quiz') 
      .insert({
        question: quiz.question,
        options_json: quiz.options, 
        correct_id: quiz.correct_id,
        date: dateString,
      });

    if (error) {
      console.error(`❌ Error uploading question ${i + 1}:`, error.message);
      console.error(`   Full error:`, error);
      if (error.message.includes('invalid input syntax for type integer')) {
        console.error(`   ⚠️  It looks like your 'correct_id' column is INTEGER, but should be TEXT.`);
        console.error(`   Run the SQL in fix-schema.sql to fix this.`);
      }
    } else {
      console.log(`✅ Uploaded Question ${i + 1} for date: ${scheduledDate.toDateString()}`);
    }
  }

  console.log("🎉 Seeding complete!");
}

seedDatabase();

