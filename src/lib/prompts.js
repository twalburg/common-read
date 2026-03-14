// src/lib/prompts.js — Rotating reflection questions & contemplative practice prompts

// 31 rotating reflection questions — cycled by chapter number (chapter % length)
export const REFLECTION_QUESTIONS = [
  "What word or phrase stood out to you most in this chapter?",
  "Where did you see God's character revealed in this reading?",
  "What is one thing this chapter teaches you about who God is?",
  "Was there a verse that challenged you or made you uncomfortable? Why?",
  "If you had to summarize this chapter in one sentence, what would it be?",
  "What does this passage reveal about the human condition?",
  "How does this chapter connect to your life right now?",
  "What question does this chapter raise for you?",
  "Where do you see grace in this passage?",
  "What invitation from God do you sense in this reading?",
  "What would it look like to live out this chapter today?",
  "Was there a moment in the text where you felt God speaking directly to you?",
  "What surprised you in this chapter?",
  "How does this passage change the way you see God?",
  "What is one thing you want to remember from today's reading?",
  "Where do you see brokenness and redemption in this chapter?",
  "What does this chapter teach about how we should relate to one another?",
  "If you could sit with the author of this text, what would you ask them?",
  "What emotion did this chapter stir in you?",
  "How does this passage point to the bigger story of Scripture?",
  "What is one way this chapter challenges the way you normally think?",
  "Where do you see hope in this reading?",
  "What does this passage tell you about what God values?",
  "Was there a command, promise, or warning that stood out?",
  "How might this chapter shape the way you pray today?",
  "What theme or thread do you notice carrying over from previous chapters?",
  "Where do you see yourself in this passage?",
  "What does faithfulness look like in the context of this chapter?",
  "What would change in your daily life if you took this passage seriously?",
  "How does this chapter deepen your understanding of the book so far?",
  "What is one thing you're grateful for after reading this chapter?",
];

// 21 contemplative centering prompts — shown before the reading
// Designed to slow the reader down and prepare their heart
export const CENTERING_PROMPTS = [
  {
    title: "Breathe & Be Still",
    instruction: "Take three slow, deep breaths. With each exhale, release one distraction. When you're ready, begin reading.",
    duration: "1 minute",
  },
  {
    title: "Silent Centering",
    instruction: "Sit in silence for two minutes. Don't try to think about anything — just be present. Then open today's chapter.",
    duration: "2 minutes",
  },
  {
    title: "A Prayer of Openness",
    instruction: "Pray simply: \"Lord, open my eyes to see what you want to show me today.\" Sit with that for a moment before reading.",
    duration: "1 minute",
  },
  {
    title: "Palms Down, Palms Up",
    instruction: "Place your hands palms-down and mentally release anything you're carrying — stress, to-dos, worries. Then turn your palms up and ask God to fill you with whatever He has for you today.",
    duration: "2 minutes",
  },
  {
    title: "Read Slowly",
    instruction: "Today, read the chapter more slowly than usual. When a word or phrase catches your attention, pause and sit with it before continuing.",
    duration: "Throughout",
  },
  {
    title: "Invite the Spirit",
    instruction: "Before you begin, simply say: \"Holy Spirit, be my teacher today.\" Then read with the expectation that God wants to meet you here.",
    duration: "30 seconds",
  },
  {
    title: "Name Your State",
    instruction: "Before reading, name how you're feeling right now — anxious, grateful, tired, hopeful. Acknowledge it honestly before God, then begin.",
    duration: "1 minute",
  },
  {
    title: "Silence Before the Word",
    instruction: "The ancient practice of Lectio Divina begins with silence. Spend one minute in quiet, letting the noise of the day settle, then open the text.",
    duration: "1 minute",
  },
  {
    title: "Remember You're Loved",
    instruction: "Before you read a single word, remember this: God is not disappointed in you. He delights in you. Read from that place today.",
    duration: "30 seconds",
  },
  {
    title: "Let Go of Performance",
    instruction: "You don't need to have a profound insight today. You don't need to \"get something out of it.\" Just show up and read. That's enough.",
    duration: "30 seconds",
  },
  {
    title: "Read It Twice",
    instruction: "Consider reading today's chapter twice — once quickly to get the story, then again slowly to listen for what God might be saying.",
    duration: "Throughout",
  },
  {
    title: "Imaginative Reading",
    instruction: "As you read today, try to place yourself in the scene. What do you see? Hear? Feel? Let the text come alive in your imagination.",
    duration: "Throughout",
  },
  {
    title: "A Moment of Gratitude",
    instruction: "Before you begin, name three things you're grateful for today. Gratitude opens the heart. Then turn to the chapter.",
    duration: "1 minute",
  },
  {
    title: "Ask a Question",
    instruction: "Come to today's reading with a question you're carrying — about God, about life, about yourself. Hold it loosely as you read.",
    duration: "30 seconds",
  },
  {
    title: "The Jesus Prayer",
    instruction: "Slowly repeat: \"Lord Jesus Christ, Son of God, have mercy on me.\" Let each word land. When you feel centered, begin your reading.",
    duration: "1–2 minutes",
  },
  {
    title: "Unplug First",
    instruction: "Put your phone on Do Not Disturb. Close other tabs. For the next few minutes, this is the only thing. Give the text your full attention.",
    duration: "30 seconds",
  },
  {
    title: "Read for One Person",
    instruction: "As you read today, hold someone in your heart — a friend, a family member, someone who's struggling. Read as if you're looking for a word meant for them.",
    duration: "Throughout",
  },
  {
    title: "Body Awareness",
    instruction: "Notice where you're holding tension — shoulders, jaw, hands. Consciously relax. A settled body helps create a settled mind for reading.",
    duration: "1 minute",
  },
  {
    title: "Come as You Are",
    instruction: "You don't need to clean yourself up before meeting God in His Word. Bring your whole self — the messy, tired, distracted parts too. He wants all of you here.",
    duration: "30 seconds",
  },
  {
    title: "Psalm 46:10",
    instruction: "\"Be still, and know that I am God.\" Repeat this phrase, removing a word each time: \"Be still and know that I am.\" \"Be still and know.\" \"Be still.\" \"Be.\"",
    duration: "2 minutes",
  },
  {
    title: "Listen, Don't Just Read",
    instruction: "Today, approach the text not as something to study, but as someone speaking to you. God's Word is living — listen for His voice in it.",
    duration: "Throughout",
  },
];

// Get the reflection question for a given chapter number
export function getReflectionQuestion(chapter) {
  return REFLECTION_QUESTIONS[(chapter - 1) % REFLECTION_QUESTIONS.length];
}

// Get the centering prompt for a given chapter number
export function getCenteringPrompt(chapter) {
  return CENTERING_PROMPTS[(chapter - 1) % CENTERING_PROMPTS.length];
}
