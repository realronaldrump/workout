import { FORMULAS } from '../config';

/**
 * Data Processing Utilities
 * This file contains functions for processing workout data.
 */

/**
 * Parse CSV text from Strong app export
 * @param {string} csvText - The CSV data as a string
 * @param {string} fileName - Name of the file being processed (for reference)
 * @returns {Object} Processed workout data
 */
export const parseStrongCsv = (csvText, fileName) => {
  const workouts = [];
  const lines = csvText.split('\n');
  
  // Skip header row
  if (lines.length <= 1) return workouts;
  
  let currentWorkout = null;
  let currentExercise = null;
  let workoutMap = {};
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV values, handling quoted fields correctly
    const values = parseCSVLine(line);
    
    if (values.length < 10) continue; // Skip malformed lines
    
    const [
      dateStr, workoutName, duration, exerciseName, setOrder, 
      weight, reps, distance, seconds, notes, workoutNotes, rpe
    ] = values;
    
    if (!dateStr || !workoutName) continue; // Skip if missing critical data
    
    // Create a unique ID for the workout using date and name
    const workoutId = `${dateStr}_${workoutName}`;
    
    // Check if we need to create a new workout
    if (!workoutMap[workoutId]) {
      currentWorkout = {
        id: workoutId,
        originalCsvDate: dateStr,
        workoutTimestamp: new Date(dateStr.replace(' ', 'T')),
        workoutName,
        durationString: duration,
        durationSeconds: parseDurationToSeconds(duration),
        exercises: [],
        exerciseMap: {},
        fileName,
        workoutNotes: workoutNotes || '',
        rpe: rpe || null
      };
      workoutMap[workoutId] = currentWorkout;
      workouts.push(currentWorkout);
    } else {
      currentWorkout = workoutMap[workoutId];
    }
    
    // Calculate set data
    const weightNum = parseFloat(weight) || 0;
    const repsNum = parseFloat(reps) || 0;
    const distanceNum = parseFloat(distance) || 0;
    const secondsNum = parseFloat(seconds) || 0;
    const volumeWeight = weightNum * repsNum;
    
    // Use the Epley formula by default
    const e1rm = calculateOneRepMax(weightNum, repsNum, FORMULAS.DEFAULT_ONE_REP_MAX_FORMULA);
    
    // Create or update exercise
    const exerciseId = `${workoutId}_${exerciseName}`;
    if (!currentWorkout.exerciseMap[exerciseId]) {
      currentExercise = {
        exerciseName,
        muscleGroup: getMuscleGroup(exerciseName),
        sets: [],
        maxWeightForExercise: weightNum > 0 ? weightNum : 0,
        maxRepsForExercise: repsNum > 0 ? repsNum : 0,
        maxE1RMForExercise: e1rm > 0 ? e1rm : 0,
        totalVolumeForExercise: volumeWeight
      };
      currentWorkout.exerciseMap[exerciseId] = currentExercise;
      currentWorkout.exercises.push(currentExercise);
    } else {
      currentExercise = currentWorkout.exerciseMap[exerciseId];
      
      // Update exercise stats
      if (weightNum > currentExercise.maxWeightForExercise) {
        currentExercise.maxWeightForExercise = weightNum;
      }
      
      if (repsNum > currentExercise.maxRepsForExercise) {
        currentExercise.maxRepsForExercise = repsNum;
      }
      
      if (e1rm > currentExercise.maxE1RMForExercise) {
        currentExercise.maxE1RMForExercise = e1rm;
      }
      
      currentExercise.totalVolumeForExercise += volumeWeight;
    }
    
    // Add the set
    currentExercise.sets.push({
      setOrder: parseInt(setOrder) || 0,
      weight: weightNum,
      reps: repsNum,
      distance: distanceNum,
      seconds: secondsNum,
      notes: notes || '',
      e1RM: e1rm,
      volume: volumeWeight
    });
  }
  
  // Sort the sets in each exercise by set order
  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      exercise.sets.sort((a, b) => a.setOrder - b.setOrder);
    });
  });
  
  return workouts;
};

/**
 * Parse a CSV line handling quoted strings correctly
 * @param {string} line - A single line from CSV
 * @returns {Array} Array of values
 */
export const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current); // Add the last field
  return result;
};

/**
 * Calculate one-rep max using various formulas
 * @param {number} weight - Weight lifted
 * @param {number} reps - Number of repetitions
 * @param {string} formula - Formula name to use (from FORMULAS)
 * @returns {number} Calculated 1RM
 */
export const calculateOneRepMax = (weight, reps, formulaName = 'EPLEY') => {
  if (!weight || !reps || weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  
  const formula = FORMULAS.ONE_REP_MAX[formulaName];
  if (!formula) return weight * (1 + 0.0333 * reps); // Default to Epley
  
  return formula.formula(weight, reps);
};

/**
 * Calculate total volume (weight x reps) for a set
 * @param {number} weight - Weight lifted
 * @param {number} reps - Number of repetitions
 * @returns {number} Total volume
 */
export const calculateVolume = (weight, reps) => {
  return (weight || 0) * (reps || 0);
};

/**
 * Parse duration string to seconds
 * @param {string} durationStr - Duration string (e.g., "1h 30m 15s")
 * @returns {number} Total seconds
 */
export const parseDurationToSeconds = (durationStr) => {
  if (!durationStr || typeof durationStr !== 'string') return 0;
  
  let totalSeconds = 0;
  const hoursMatch = durationStr.match(/(\d+)\s*h/);
  const minutesMatch = durationStr.match(/(\d+)\s*m/);
  const secondsMatch = durationStr.match(/(\d+)\s*s/);
  
  if (hoursMatch) totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
  if (minutesMatch) totalSeconds += parseInt(minutesMatch[1], 10) * 60;
  if (secondsMatch) totalSeconds += parseInt(secondsMatch[1], 10);
  
  return totalSeconds;
};

/**
 * Format seconds into a readable duration string
 * @param {number} totalSeconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (totalSeconds) => {
  if (isNaN(totalSeconds) || totalSeconds === 0) return "N/A";
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  let str = "";
  if (hours > 0) str += `${hours}h `;
  if (minutes > 0) str += `${minutes}m `;
  if (seconds > 0 && hours === 0 && minutes === 0) str += `${seconds}s`;
  
  return str.trim() || "0s";
};

/**
 * Format date to various formats
 * @param {Date|string} dateStringOrDate - Date object or string
 * @param {string} format - Output format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateStringOrDate, format = 'YYYY-MM-DD') => {
  let date;
  
  if (dateStringOrDate instanceof Date) {
    date = dateStringOrDate;
  } else if (typeof dateStringOrDate === 'string') {
    date = new Date(dateStringOrDate.includes('T') ? dateStringOrDate : dateStringOrDate.replace(' ', 'T'));
  } else {
    return 'Invalid Date';
  }
  
  if (isNaN(date.getTime())) {
    // Fallback for "YYYY-MM-DD HH:MM:SS" if initial parsing failed or was ambiguous
    const parts = String(dateStringOrDate).split(/[\s:-]/);
    if (parts.length >= 3) {
      date = new Date(parts[0], parseInt(parts[1],10) - 1, parts[2], parts[3] || 0, parts[4] || 0, parts[5] || 0);
    }
    if (isNaN(date.getTime())) {
      return 'Invalid Date'; 
    }
  }
  
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM': return `${year}-${month}`;
    case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
    case 'MM/DD': return `${month}/${day}`;
    case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
    case 'MM/DD HH:mm': return `${month}/${day} ${hours}:${minutes}`;
    case 'Month DD, YYYY': 
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    case 'Month DD, YYYY HH:mm': 
      return `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ${hours}:${minutes}`;
    default: return date.toISOString();
  }
};

/**
 * Get muscle group for an exercise
 * @param {string} exerciseName - Name of the exercise
 * @returns {string} Muscle group name
 */
export const getMuscleGroup = (exerciseName) => {
  const exerciseToMuscleGroupMap = {
    // Chest
    'Chest Press (Machine)': 'Chest',
    'Chest Fly': 'Chest',
    'Incline Dumbbell Press': 'Chest',
    'Push-up': 'Chest',
    'Bench Press (Barbell)': 'Chest',
    // Back
    'Lat Pulldown (Machine)': 'Back',
    'Seated Row (Machine)': 'Back',
    'MTS Row': 'Back',
    'Pull-up': 'Back',
    'Bent Over Row': 'Back',
    'T-Bar Row': 'Back',
    // Shoulders
    'Shoulder Press (Machine)': 'Shoulders',
    'Lateral Raise (Machine)': 'Shoulders',
    'Reverse Fly (Machine)': 'Shoulders',
    'Overhead Press': 'Shoulders',
    'Arnold Press': 'Shoulders',
    // Legs
    'Seated Leg Curl (Machine)': 'Hamstrings',
    'Lying Leg Curl (Machine)': 'Hamstrings',
    'Leg Extension (Machine)': 'Quads',
    'Seated Leg Press (Machine)': 'Quads',
    'Squat': 'Quads',
    'Hack Squat': 'Quads',
    'Deadlift': 'Hamstrings', 
    'Romanian Deadlift': 'Hamstrings',
    'Calf Extension Machine': 'Calves',
    'Seated Calf Raise': 'Calves',
    'Hip Adductor (Machine)': 'Adductors',
    'Hip Abductor (Machine)': 'Abductors',
    'Glute Kickback (Machine)': 'Glutes',
    'Hip Thrust': 'Glutes',
    // Arms
    'Bicep Curl (Machine)': 'Biceps',
    'Preacher Curl (Machine)': 'Biceps',
    'Triceps Press Machine': 'Triceps',
    'Triceps Extension (Machine)': 'Triceps',
    'Dumbbell Bicep Curl': 'Biceps',
    'Hammer Curl': 'Biceps',
    'Tricep Pushdown': 'Triceps',
    'Overhead Tricep Extension': 'Triceps',
    // Cardio / Other
    'Running (Treadmill)': 'Cardio',
    'Cycling': 'Cardio',
    'Elliptical': 'Cardio',
    'Plank': 'Core',
    'Crunches': 'Core',
    'Leg Raise': 'Core',
  };

  // Exact match
  if (exerciseToMuscleGroupMap[exerciseName]) {
    return exerciseToMuscleGroupMap[exerciseName];
  }
  
  // Partial match
  for (const key in exerciseToMuscleGroupMap) {
    if (exerciseName.toLowerCase().includes(key.toLowerCase())) {
      return exerciseToMuscleGroupMap[key];
    }
  }
  
  // Keyword-based fallbacks
  const exerciseLower = exerciseName.toLowerCase();
  
  if (exerciseLower.includes('curl')) return 'Biceps';
  if (exerciseLower.includes('tricep')) return 'Triceps';
  
  if (exerciseLower.includes('chest') || 
      (exerciseLower.includes('press') && 
       !exerciseLower.includes('leg') && 
       !exerciseLower.includes('shoulder'))) return 'Chest';
  
  if (exerciseLower.includes('shoulder') || 
      exerciseLower.includes('deltoid') || 
      exerciseLower.includes('lateral raise')) return 'Shoulders';
  
  if (exerciseLower.includes('row') || 
      exerciseLower.includes('pulldown') || 
      exerciseLower.includes('lat ')) return 'Back';
  
  if (exerciseLower.includes('squat') || 
      exerciseLower.includes('lunge') || 
      exerciseLower.includes('leg press') || 
      exerciseLower.includes('quad')) return 'Quads';
  
  if (exerciseLower.includes('hamstring') || 
      exerciseLower.includes('deadlift')) return 'Hamstrings';
  
  if (exerciseLower.includes('calf') || 
      exerciseLower.includes('calves')) return 'Calves';
  
  if (exerciseLower.includes('glute')) return 'Glutes';
  if (exerciseLower.includes('abs') || 
      exerciseLower.includes('crunch') || 
      exerciseLower.includes('plank')) return 'Core';
  
  return 'Other';
};

/**
 * Calculate personal records from workout data
 * @param {Array} allWorkouts - List of all workouts
 * @returns {Object} Personal records by exercise
 */
export const calculateAllPRs = (allWorkouts) => {
  const prs = {}; 
  
  allWorkouts.forEach(workout => {
    const workoutDate = workout.workoutTimestamp || new Date(workout.originalCsvDate.replace(' ', 'T'));
    
    workout.exercises.forEach(exercise => {
      if (!prs[exercise.exerciseName]) {
        prs[exercise.exerciseName] = { 
          maxE1RM: { value: 0, date: null, reps: 0, weightAtE1RM: 0 },
          maxWeight: { value: 0, date: null, reps: 0 },
          maxReps: { value: 0, date: null, weight: 0 },
          maxVolume: { value: 0, date: null, sets: 0 }
        };
      }
      
      // Track exercise total volume for this workout
      let exerciseTotalVolume = 0;
      let exerciseSets = 0;
      
      exercise.sets.forEach(set => {
        if (set.weight > 0 && set.reps > 0) {
          exerciseTotalVolume += set.volume;
          exerciseSets++;
          
          // Check for max E1RM
          if (set.e1RM > prs[exercise.exerciseName].maxE1RM.value) {
            prs[exercise.exerciseName].maxE1RM = { 
              value: set.e1RM, 
              date: workoutDate,
              reps: set.reps,
              weightAtE1RM: set.weight
            };
          }
          
          // Check for max weight
          if (set.weight > prs[exercise.exerciseName].maxWeight.value) {
            prs[exercise.exerciseName].maxWeight = {
              value: set.weight,
              date: workoutDate,
              reps: set.reps
            };
          }
          
          // Check for max reps
          if (set.reps > prs[exercise.exerciseName].maxReps.value) {
            prs[exercise.exerciseName].maxReps = {
              value: set.reps,
              date: workoutDate,
              weight: set.weight
            };
          }
          
          // Track RM records for specific rep ranges
          const repKey = `${set.reps}RM_weight_lbs`;
          if (!prs[exercise.exerciseName][repKey] || set.weight > prs[exercise.exerciseName][repKey].value) {
            prs[exercise.exerciseName][repKey] = { 
              value: set.weight, 
              date: workoutDate 
            };
          }
        }
      });
      
      // Check for max total volume in a workout
      if (exerciseTotalVolume > prs[exercise.exerciseName].maxVolume.value) {
        prs[exercise.exerciseName].maxVolume = {
          value: exerciseTotalVolume,
          date: workoutDate,
          sets: exerciseSets
        };
      }
    });
  });
  
  return prs;
};

/**
 * Calculate volume and progress trends for a specific exercise
 * @param {Array} workouts - List of all workouts
 * @param {string} exerciseName - Name of the exercise to analyze
 * @returns {Object} Trend data for the exercise
 */
export const calculateExerciseTrends = (workouts, exerciseName) => {
  if (!workouts || !exerciseName) return null;
  
  const exerciseWorkouts = workouts
    .filter(w => w.exercises.some(e => e.exerciseName === exerciseName))
    .sort((a, b) => {
      const dateA = a.workoutTimestamp || new Date(a.originalCsvDate.replace(' ', 'T'));
      const dateB = b.workoutTimestamp || new Date(b.originalCsvDate.replace(' ', 'T'));
      return dateA - dateB;
    });
  
  if (exerciseWorkouts.length === 0) return null;
  
  const trends = {
    dates: [],
    maxWeight: [],
    avgWeight: [],
    totalVolume: [],
    maxE1RM: [],
    setCount: [],
    repCount: [],
    progressPercentage: {
      weight: null,
      volume: null,
      e1rm: null
    }
  };
  
  exerciseWorkouts.forEach(workout => {
    const date = formatDate(workout.workoutTimestamp || workout.originalCsvDate, 'MM/DD/YYYY');
    const exercise = workout.exercises.find(e => e.exerciseName === exerciseName);
    
    if (exercise) {
      let totalWeight = 0;
      let totalReps = 0;
      let maxWeight = 0;
      let maxE1RM = 0;
      
      exercise.sets.forEach(set => {
        if (set.weight > 0 && set.reps > 0) {
          totalWeight += set.weight;
          totalReps += set.reps;
          if (set.weight > maxWeight) maxWeight = set.weight;
          if (set.e1RM > maxE1RM) maxE1RM = set.e1RM;
        }
      });
      
      const avgWeight = exercise.sets.length > 0 ? totalWeight / exercise.sets.length : 0;
      
      trends.dates.push(date);
      trends.maxWeight.push(maxWeight);
      trends.avgWeight.push(avgWeight);
      trends.totalVolume.push(exercise.totalVolumeForExercise);
      trends.maxE1RM.push(maxE1RM);
      trends.setCount.push(exercise.sets.length);
      trends.repCount.push(totalReps);
    }
  });
  
  // Calculate progress percentages
  if (trends.maxWeight.length >= 2) {
    const firstWeight = trends.maxWeight[0];
    const lastWeight = trends.maxWeight[trends.maxWeight.length - 1];
    trends.progressPercentage.weight = firstWeight > 0 
      ? ((lastWeight - firstWeight) / firstWeight) * 100 
      : 0;
      
    const firstVolume = trends.totalVolume[0];
    const lastVolume = trends.totalVolume[trends.totalVolume.length - 1];
    trends.progressPercentage.volume = firstVolume > 0 
      ? ((lastVolume - firstVolume) / firstVolume) * 100 
      : 0;
      
    const firstE1RM = trends.maxE1RM[0];
    const lastE1RM = trends.maxE1RM[trends.maxE1RM.length - 1];
    trends.progressPercentage.e1rm = firstE1RM > 0 
      ? ((lastE1RM - firstE1RM) / firstE1RM) * 100 
      : 0;
  }
  
  return trends;
};

/**
 * Project future gains based on current progress
 * @param {Array} workouts - All workouts
 * @param {Object} prs - Personal records
 * @returns {Array} Projected gains for coming weeks
 */
export const calculateGainsProjection = (workouts, prs) => {
  const projections = [];
  
  // Need at least a few workouts to make projections
  if (!workouts || workouts.length < 3 || !prs) return projections;
  
  // Get common exercises (performed at least 3 times)
  const exerciseCounts = {};
  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      exerciseCounts[exercise.exerciseName] = (exerciseCounts[exercise.exerciseName] || 0) + 1;
    });
  });
  
  const frequentExercises = Object.keys(exerciseCounts)
    .filter(exercise => exerciseCounts[exercise] >= 3);
  
  // For each frequent exercise, calculate progression rate
  frequentExercises.forEach(exerciseName => {
    const trends = calculateExerciseTrends(workouts, exerciseName);
    
    if (!trends || trends.maxE1RM.length < 3) return;
    
    // Get current PR
    const currentPR = prs[exerciseName]?.maxE1RM?.value || 0;
    if (currentPR <= 0) return;
    
    // Calculate average weekly improvement
    const firstE1RM = trends.maxE1RM[0];
    const lastE1RM = trends.maxE1RM[trends.maxE1RM.length - 1];
    const firstDate = new Date(workouts.find(w => 
      w.exercises.some(e => e.exerciseName === exerciseName)
    ).workoutTimestamp || workouts.find(w => 
      w.exercises.some(e => e.exerciseName === exerciseName)
    ).originalCsvDate.replace(' ', 'T'));
    
    const lastDate = new Date(workouts.filter(w => 
      w.exercises.some(e => e.exerciseName === exerciseName)
    ).pop().workoutTimestamp || workouts.filter(w => 
      w.exercises.some(e => e.exerciseName === exerciseName)
    ).pop().originalCsvDate.replace(' ', 'T'));
    
    const weeksBetween = Math.max(1, Math.round((lastDate - firstDate) / (7 * 24 * 60 * 60 * 1000)));
    const weeklyImprovement = (lastE1RM - firstE1RM) / weeksBetween;
    
    // Only project if there's positive improvement
    if (weeklyImprovement <= 0) return;
    
    // Project for next 12 weeks
    const muscleGroup = getMuscleGroup(exerciseName);
    
    // Project gains with diminishing returns (slower gains as you get stronger)
    let projectedE1RM = currentPR;
    const diminishingFactor = 0.95; // 5% slowdown in gains each week
    let currentImprovementRate = weeklyImprovement;
    
    for (let week = 1; week <= 12; week++) {
      projectedE1RM += currentImprovementRate;
      currentImprovementRate *= diminishingFactor;
      
      projections.push({
        exercise: exerciseName,
        muscleGroup,
        week,
        projectedE1RM: Math.round(projectedE1RM * 10) / 10,
        improvement: Math.round((projectedE1RM - currentPR) * 10) / 10,
        improvementPercentage: Math.round(((projectedE1RM - currentPR) / currentPR) * 1000) / 10
      });
    }
  });
  
  return projections.sort((a, b) => {
    if (a.week !== b.week) return a.week - b.week;
    return b.improvementPercentage - a.improvementPercentage;
  });
};

export default {
  parseStrongCsv,
  parseCSVLine,
  calculateOneRepMax,
  calculateVolume,
  parseDurationToSeconds,
  formatDuration,
  formatDate,
  getMuscleGroup,
  calculateAllPRs,
  calculateExerciseTrends,
  calculateGainsProjection
}; 