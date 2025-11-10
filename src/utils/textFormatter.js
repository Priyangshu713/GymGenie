// Utility functions for formatting AI response text

export const formatAIText = (text) => {
  if (!text) return text;
  
  // Convert markdown-style formatting to HTML
  let formatted = text
    // Convert **bold** to <strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert *italic* to <em>
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Convert bullet points (- item) to proper list items with better spacing
    .replace(/^- (.+)$/gm, '<div class="bullet-item">• $1</div>')
    // Convert numbered lists (1. item) to proper format
    .replace(/^\d+\. (.+)$/gm, '<div class="bullet-item">• $1</div>')
    // Handle workout schedule formatting
    .replace(/\*\*([^*]+):\*\* /g, '<strong>$1:</strong> ')
    // Handle day formatting (Day 1, Day 2, etc.)
    .replace(/\*\*Day (\d+)[^*]*\*\*/g, '<strong>Day $1</strong>')
    // Add proper paragraph breaks
    .replace(/\n\s*\n/g, '<div class="paragraph-break"></div>')
    // Add line breaks for single newlines
    .replace(/\n/g, '<br/>')
    // Clean up multiple line breaks
    .replace(/(<br\/>){3,}/g, '<div class="paragraph-break"></div>');

  return formatted;
};

export const formatWorkoutPlan = (text) => {
  if (!text) return text;
  
  // Special formatting for workout plans
  let formatted = text
    // Format complex day headers like "**Day 1 (Monday/Tuesday): Push Day**"
    .replace(/\*\*Day (\d+) \(([^)]+)\): ([^*]+)\*\*/g, 
      '<div class="workout-day-header">Day $1</div><div class="workout-day-subtitle">$2 • $3</div>')
    
    // Format simpler day headers like "**Monday: Push Day**"
    .replace(/\*\*([A-Za-z]+day): ([^*]+)\*\*/g, 
      '<div class="workout-day-header">$1</div><div class="workout-day-subtitle">$2</div>')
    
    // Format workout types in quotes
    .replace(/\*\*"([^"]+)"\*\*/g, '<div class="workout-type">$1</div>')
    
    // Format exercise lines that start with bullet points
    .replace(/• ([^:]+): ([^\n]+)/g, 
      '<div class="exercise-item"><span class="exercise-name">$1:</span> <span class="exercise-details">$2</span></div>')
    
    // Format exercise lines that start with muscle groups
    .replace(/• ([A-Za-z\s]+): ([^\n]+)/g, 
      '<div class="exercise-item"><span class="muscle-group">$1:</span> <span class="exercise-details">$2</span></div>')
    
    // Format remaining bullet points
    .replace(/• ([^\n]+)/g, '<div class="exercise-item">• $1</div>')
    
    // Format sets and reps with better highlighting
    .replace(/\((\d+ sets? of \d+[-\d]* reps?)\)/gi, '<span class="sets-reps">($1)</span>')
    
    // Format weights
    .replace(/(\d+(?:\.\d+)?\s*kg)/gi, '<span class="weight">$1</span>')
    
    // Clean up and add proper spacing
    .replace(/\n\s*\n/g, '<div class="section-break"></div>')
    .replace(/\n/g, '<br/>');

  return formatted;
};

export const parseWorkoutSchedule = (text) => {
  if (!text) return [];
  
  const days = [];
  const dayPattern = /\*\*([A-Za-z]+day)\s*\(([^)]+)\)\*\*:\s*([^*]+?)(?=\*\*[A-Za-z]+day|\*\*Note:|$)/gs;
  
  let match;
  while ((match = dayPattern.exec(text)) !== null) {
    const [, day, type, details] = match;
    days.push({
      day: day.trim(),
      type: type.trim(),
      details: details.trim().replace(/\n/g, ' ')
    });
  }
  
  return days;
};
