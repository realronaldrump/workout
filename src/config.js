/**
 * Application Configuration
 */

// Muscle group definitions with color associations
export const MUSCLE_GROUPS = {
  Chest: { color: '#f87171', icon: 'Chest' },
  Back: { color: '#60a5fa', icon: 'Back' },
  Shoulders: { color: '#a78bfa', icon: 'Shoulders' },
  Biceps: { color: '#34d399', icon: 'Biceps' },
  Triceps: { color: '#fbbf24', icon: 'Triceps' },
  Quads: { color: '#f472b6', icon: 'Quads' },
  Hamstrings: { color: '#4ade80', icon: 'Hamstrings' },
  Calves: { color: '#c084fc', icon: 'Calves' },
  Glutes: { color: '#fb923c', icon: 'Glutes' },
  Core: { color: '#94a3b8', icon: 'Core' },
  Adductors: { color: '#fb7185', icon: 'Adductors' },
  Abductors: { color: '#c084fc', icon: 'Abductors' },
  Cardio: { color: '#67e8f9', icon: 'Cardio' },
  Other: { color: '#94a3b8', icon: 'Other' }
};

// Exercise type categorization
export const EXERCISE_TYPES = {
  STRENGTH: 'strength',
  CARDIO: 'cardio',
  FLEXIBILITY: 'flexibility',
  BALANCE: 'balance'
};

// Features configuration
export const FEATURES = {
  darkMode: true,
  muscleMapVisualization: true,
  aiWorkoutSuggestions: true,
  heatMapCalendar: true,
  progressionCharts: true,
  personalRecords: true,
  workoutPlanner: true,
  exerciseLibrary: true,
  progressPhotos: false, // Disabled as no storage mechanism in place
  bodyStat: true,
  oneRepMaxCalculator: true,
  volumeTracker: true,
  restTimer: true,
  workoutStreaks: true,
  muscleFatigueTracker: true,
  exportData: true,
};

// App version info
export const APP_VERSION = {
  number: '2.0.0',
  name: 'Power Gains',
  releaseDate: '2023-08-01'
};

// Constants for calculations
export const CONSTANTS = {
  // Weight of body for bodyweight exercises (lbs)
  DEFAULT_BODYWEIGHT: 160,
  
  // Recovery periods by muscle group (in hours)
  RECOVERY_PERIODS: {
    Chest: 48,
    Back: 48,
    Shoulders: 48,
    Biceps: 48,
    Triceps: 48,
    Quads: 72,
    Hamstrings: 72,
    Calves: 24,
    Glutes: 48,
    Core: 24
  },
  
  // Default RPE if not specified
  DEFAULT_RPE: 7,
  
  // Threshold percentages for progress indicators
  PROGRESS_THRESHOLDS: {
    significant: 5,  // 5% improvement is significant
    major: 10,       // 10% improvement is major
    decline: -3      // 3% decline is concerning
  }
};

// UI theme settings
export const THEME = {
  light: {
    primary: '#3b82f6',
    secondary: '#10b981',
    background: '#f3f4f6',
    card: '#ffffff',
    text: '#1f2937',
    border: '#e5e7eb'
  },
  dark: {
    primary: '#60a5fa',
    secondary: '#34d399',
    background: '#111827',
    card: '#1f2937',
    text: '#f9fafb',
    border: '#374151'
  }
};

// Duration of animations in milliseconds
export const ANIMATION_DURATION = {
  short: 200,
  medium: 300,
  long: 500
};

// Formula constants
export const FORMULAS = {
  // Coefficients for different 1RM formulas
  ONE_REP_MAX: {
    BRZYCKI: {
      name: 'Brzycki',
      formula: (weight, reps) => weight * (36 / (37 - reps))
    },
    EPLEY: {
      name: 'Epley',
      formula: (weight, reps) => weight * (1 + 0.0333 * reps)
    },
    LOMBARDI: {
      name: 'Lombardi',
      formula: (weight, reps) => weight * Math.pow(reps, 0.1)
    },
    MAYHEW: {
      name: 'Mayhew et al.',
      formula: (weight, reps) => weight * 100 / (52.2 + 41.9 * Math.exp(-0.055 * reps))
    },
    OCONNER: {
      name: "O'Conner et al.",
      formula: (weight, reps) => weight * (1 + 0.025 * reps)
    },
    WATHAN: {
      name: 'Wathan',
      formula: (weight, reps) => weight * 100 / (48.8 + 53.8 * Math.exp(-0.075 * reps))
    }
  },
  
  // Default formula to use
  DEFAULT_ONE_REP_MAX_FORMULA: 'EPLEY'
};

export default {
  MUSCLE_GROUPS,
  EXERCISE_TYPES,
  FEATURES,
  APP_VERSION,
  CONSTANTS,
  THEME,
  ANIMATION_DURATION,
  FORMULAS
}; 