interface LessonRequirements {
  fillerWords?: { max: number };
  grammarScore?: { min: number };
  wordChoiceScore?: { min: number };
  conciseness?: { maxWords?: number; maxSentences?: number };
  concisenessScore?: { min: number };
  charismaScore?: { min: number };
  relevanceScore?: { min: number };
}

export type LessonMode = 
  | "Open Question"
  | "Describe & Convince"
  | "Improv Rant"
  | "Opinion Clash"
  | "Pretend Scenario";

export interface Lesson {
  level: number;
  mode: LessonMode;
  prompt: string;
  timeLimit: number;
  requirements: LessonRequirements;
}

interface Unit {
  unit: number;
  title: string;
  lessons: Lesson[];
}

export interface LessonsData {
  units: Unit[];
}

// Function to calculate minimum relevance score based on level
const calculateMinRelevance = (level: number, unit: number): number => {
  // Calculate total level number (e.g., unit 5 level 1 = level 21)
  const totalLevel = ((unit - 1) * 5) + level;
  // Linear progression from 60% at level 1 to 95% at level 25
  return Math.round(60 + ((totalLevel - 1) * (95 - 60) / 24));
};

// Helper function to add relevance requirements to lessons
const addRelevanceRequirements = (lessons: any[], unit: number) => {
  return lessons.map((lesson) => ({
    ...lesson,
    requirements: {
      ...lesson.requirements,
      relevanceScore: { min: calculateMinRelevance(lesson.level, unit) }
    }
  }));
};

// Helper function to add charisma requirements to lessons
const addCharismaRequirements = (lessons: any[], unit: number) => {
  if (unit !== 5) {
    return lessons; // Return lessons unchanged for non-unit 5 lessons
  }
  return lessons.map((lesson) => ({
    ...lesson,
    requirements: {
      ...lesson.requirements,
      charismaScore: { min: unit === 5 ? 7 : 0 } // Only add charisma requirements for unit 5
    }
  }));
};

export const lessonsData: LessonsData = {
  "units": [
    {
      "unit": 1,
      "title": "Filler Words",
      "lessons": addRelevanceRequirements(addCharismaRequirements([
        {
          "level": 1,
          "mode": "Improv Rant",
          "prompt": "Rant about a daily task that seems simple but always ends up annoying — like untangling headphones, finding parking, or peeling a sticker off cleanly.",
          "timeLimit": 40,
          "requirements": {
            "fillerWords": { "max": 1 }
          }
        },
        {
          "level": 2,
          "mode": "Pretend Scenario",
          "prompt": "You accidentally texted the wrong person something personal. Imagine you're calling them to explain what happened. How do you smooth it over?",
          "timeLimit": 35,
          "requirements": {
            "fillerWords": { "max": 1 }
          }
        },
        {
          "level": 3,
          "mode": "Opinion Clash",
          "prompt": "Is it better to be brutally honest or politely vague when giving negative feedback? Pick a side and defend it.",
          "timeLimit": 40,
          "requirements": {
            "fillerWords": { "max": 1 }
          }
        },
        {
          "level": 4,
          "mode": "Describe & Convince",
          "prompt": "Convince a friend to delete social media for 30 days. Be specific about what they'd gain — emotionally, mentally, and socially.",
          "timeLimit": 45,
          "requirements": {
            "fillerWords": { "max": 1 }
          }
        },
        {
          "level": 5,
          "mode": "Open Question",
          "prompt": "What's one thing people misunderstand about you — and how would you explain it to them?",
          "timeLimit": 45,
          "requirements": {
            "fillerWords": { "max": 1 }
          }
        }
      ], 1), 1)
    },
    {
      "unit": 2,
      "title": "Grammar",
      "lessons": addRelevanceRequirements(addCharismaRequirements([
        {
          "level": 1,
          "mode": "Open Question",
          "prompt": "What's a personal habit you've picked up that actually improved your life? Explain how it helps.",
          "timeLimit": 40,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 85 }
          }
        },
        {
          "level": 2,
          "mode": "Opinion Clash",
          "prompt": "Which teaches you more — success or failure? Pick one, and make your case.",
          "timeLimit": 45,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 88 }
          }
        },
        {
          "level": 3,
          "mode": "Describe & Convince",
          "prompt": "Convince someone to move to your city without mentioning its name. Focus on what daily life feels like and why it's worth it.",
          "timeLimit": 50,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 90 }
          }
        },
        {
          "level": 4,
          "mode": "Improv Rant",
          "prompt": "Rant about a phrase or trend that people overuse. Try to stay sharp, clear, and grammatically polished even as you vent.",
          "timeLimit": 45,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 92 }
          }
        },
        {
          "level": 5,
          "mode": "Pretend Scenario",
          "prompt": "You're the best man or maid of honor giving a speech at a wedding. Keep it heartfelt, clear, and well-structured — like someone might quote you later.",
          "timeLimit": 60,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 94 }
          }
        }
      ], 2), 2)
    },
    {
      "unit": 3,
      "title": "Word Choice",
      "lessons": addRelevanceRequirements(addCharismaRequirements([
        {
          "level": 1,
          "mode": "Describe & Convince",
          "prompt": "Describe your favorite drink — but make it sound luxurious, cinematic, and unforgettable. Try to appeal to all five senses.",
          "timeLimit": 45,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 85 },
            "wordChoiceScore": { "min": 70 }
          }
        },
        {
          "level": 2,
          "mode": "Opinion Clash",
          "prompt": "Is it better to be interesting or reliable? Pick one and defend it using precise, punchy language.",
          "timeLimit": 45,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 88 },
            "wordChoiceScore": { "min": 75 }
          }
        },
        {
          "level": 3,
          "mode": "Open Question",
          "prompt": "What's a memory that sticks with you because of how it *felt*, not what happened? Use strong language to describe the mood, energy, or atmosphere.",
          "timeLimit": 50,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 90 },
            "wordChoiceScore": { "min": 78 }
          }
        },
        {
          "level": 4,
          "mode": "Improv Rant",
          "prompt": "Rant about an object in your room like it's sacred — a candle, a pen, a sock — but make it sound powerful, legendary, or poetic.",
          "timeLimit": 45,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 92 },
            "wordChoiceScore": { "min": 80 }
          }
        },
        {
          "level": 5,
          "mode": "Pretend Scenario",
          "prompt": "You've just landed on a distant planet and are recording a voice message describing what you see. Your vocabulary is the only way Earth will understand what's out there.",
          "timeLimit": 60,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 94 },
            "wordChoiceScore": { "min": 85 }
          }
        }
      ], 3), 3)
    },
    {
      "unit": 4,
      "title": "Conciseness",
      "lessons": addRelevanceRequirements(addCharismaRequirements([
        {
          "level": 1,
          "mode": "Opinion Clash",
          "prompt": "Is it better to multitask or focus on one thing at a time? Make your case in under 4 sentences.",
          "timeLimit": 40,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 85 },
            "wordChoiceScore": { "min": 70 },
            "concisenessScore": { "min": 60 }
          }
        },
        {
          "level": 2,
          "mode": "Improv Rant",
          "prompt": "Rant about why people should stop overusing emojis — but keep it under 60 words.",
          "timeLimit": 45,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 88 },
            "wordChoiceScore": { "min": 75 },
            "concisenessScore": { "min": 70 }
          }
        },
        {
          "level": 3,
          "mode": "Pretend Scenario",
          "prompt": "You're on an elevator with someone you admire. You have 15 seconds to tell them who you are and why they should remember you.",
          "timeLimit": 30,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 90 },
            "wordChoiceScore": { "min": 78 },
            "concisenessScore": { "min": 75 }
          }
        },
        {
          "level": 4,
          "mode": "Describe & Convince",
          "prompt": "Convince someone to try meditation — but do it in exactly 3 sentences.",
          "timeLimit": 40,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 92 },
            "wordChoiceScore": { "min": 80 },
            "concisenessScore": { "min": 85 }
          }
        },
        {
          "level": 5,
          "mode": "Open Question",
          "prompt": "What's a lesson you learned the hard way? Tell the story in 4 sentences or less, but make it hit hard.",
          "timeLimit": 45,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 94 },
            "wordChoiceScore": { "min": 85 },
            "concisenessScore": { "min": 90 }
          }
        }
      ], 4), 4)
    },
    {
      "unit": 5,
      "title": "Relevance",
      "lessons": addRelevanceRequirements(addCharismaRequirements([
        {
          "level": 1,
          "mode": "Pretend Scenario",
          "prompt": "You just walked into a room full of strangers at a party. Introduce yourself like a main character from a movie — confident, memorable, and a little mysterious.",
          "timeLimit": 45,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 85 },
            "wordChoiceScore": { "min": 85 },
            "concisenessScore": { "min": 60 },
            "charismaScore": { "min": 6 }
          }
        },
        {
          "level": 2,
          "mode": "Opinion Clash",
          "prompt": "Which is more powerful — silence or a great one-liner? Pick a side and make it entertaining.",
          "timeLimit": 45,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 88 },
            "wordChoiceScore": { "min": 88 },
            "concisenessScore": { "min": 70 },
            "charismaScore": { "min": 7 }
          }
        },
        {
          "level": 3,
          "mode": "Describe & Convince",
          "prompt": "Convince someone to wear a leather jacket every day — like it's a personality, not just a piece of clothing. Make it iconic.",
          "timeLimit": 50,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 90 },
            "wordChoiceScore": { "min": 90 },
            "concisenessScore": { "min": 75 },
            "charismaScore": { "min": 8 }
          }
        },
        {
          "level": 4,
          "mode": "Improv Rant",
          "prompt": "Rant about why your generation is misunderstood — like you're on stage and everyone needs to feel it.",
          "timeLimit": 50,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 92 },
            "wordChoiceScore": { "min": 92 },
            "concisenessScore": { "min": 80 },
            "charismaScore": { "min": 9 }
          }
        },
        {
          "level": 5,
          "mode": "Open Question",
          "prompt": "What makes someone unforgettable when they speak — even if you don't agree with them?",
          "timeLimit": 45,
          "requirements": {
            "fillerWords": { "max": 1 },
            "grammarScore": { "min": 94 },
            "wordChoiceScore": { "min": 95 },
            "concisenessScore": { "min": 90 },
            "charismaScore": { "min": 10 }
          }
        }
      ], 5), 5)
    }
  ]
};

// Helper function to find a lesson by unit and level
export const findLesson = (unitId: number, levelId: number): Lesson | undefined => {
  const unit = lessonsData.units.find(u => u.unit === unitId);
  if (!unit) return undefined;
  
  // Convert absolute level to unit-relative level (1-5)
  const levelInUnit = ((levelId - 1) % 5) + 1;
  return unit.lessons.find(l => l.level === levelInUnit);
}; 