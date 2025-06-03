import { getMuscleGroup, formatDate } from './dataProcessing';
import { CONSTANTS } from '../config';

/**
 * Analytics and Workout Intelligence Utilities
 * Functions for advanced workout data analysis.
 */

/**
 * Generate muscle fatigue data based on workout history
 * @param {Array} workouts - All workout data
 * @returns {Object} Muscle fatigue scores by muscle group
 */
export const calculateMuscleFatigue = (workouts) => {
  if (!workouts || workouts.length === 0) return {};
  
  const today = new Date();
  const fatigueData = {};
  
  // Initialize all muscle groups with 0 fatigue
  Object.keys(CONSTANTS.RECOVERY_PERIODS).forEach(muscle => {
    fatigueData[muscle] = {
      fatigueScore: 0,
      lastTrainedDate: null,
      recoveryHours: CONSTANTS.RECOVERY_PERIODS[muscle],
      recoveryPercentage: 100,
      exercises: []
    };
  });
  
  // Find the most recent 10 workouts for accurate recent fatigue
  const recentWorkouts = [...workouts]
    .sort((a, b) => {
      const dateA = a.workoutTimestamp || new Date(a.originalCsvDate.replace(' ', 'T'));
      const dateB = b.workoutTimestamp || new Date(b.originalCsvDate.replace(' ', 'T'));
      return dateB - dateA; // Sort descending (newest first)
    })
    .slice(0, 10);
  
  // Calculate fatigue for each muscle group based on recent workouts
  recentWorkouts.forEach(workout => {
    const workoutDate = workout.workoutTimestamp || new Date(workout.originalCsvDate.replace(' ', 'T'));
    const hoursSinceWorkout = Math.max(0, (today - workoutDate) / (1000 * 60 * 60));
    
    workout.exercises.forEach(exercise => {
      const muscleGroup = exercise.muscleGroup;
      
      // Skip if not a tracked muscle group
      if (!fatigueData[muscleGroup]) return;
      
      // Calculate volume and intensity for this exercise
      const totalVolume = exercise.totalVolumeForExercise;
      const avgIntensity = exercise.sets.reduce((sum, set) => sum + (set.e1RM / (CONSTANTS.DEFAULT_RPE || 7)), 0) / exercise.sets.length;
      
      // Calculate fatigue impact based on volume, intensity, and recovery time
      const recoveryTimeHours = CONSTANTS.RECOVERY_PERIODS[muscleGroup];
      const recoveryPercentage = Math.min(100, (hoursSinceWorkout / recoveryTimeHours) * 100);
      const fatigueImpact = totalVolume * (1 - (recoveryPercentage / 100)) * (avgIntensity / 100);
      
      // Update fatigue data
      fatigueData[muscleGroup].fatigueScore += fatigueImpact;
      
      // Update last trained date if this workout is more recent
      if (!fatigueData[muscleGroup].lastTrainedDate || workoutDate > fatigueData[muscleGroup].lastTrainedDate) {
        fatigueData[muscleGroup].lastTrainedDate = workoutDate;
        fatigueData[muscleGroup].hoursSinceLastTraining = hoursSinceWorkout;
        fatigueData[muscleGroup].recoveryPercentage = recoveryPercentage;
      }
      
      // Track exercises used for this muscle group
      if (!fatigueData[muscleGroup].exercises.includes(exercise.exerciseName)) {
        fatigueData[muscleGroup].exercises.push(exercise.exerciseName);
      }
    });
  });
  
  // Normalize fatigue scores to 0-100 range
  const maxFatigue = Math.max(...Object.values(fatigueData).map(data => data.fatigueScore), 1);
  
  Object.keys(fatigueData).forEach(muscle => {
    fatigueData[muscle].fatigueScore = Math.min(100, Math.round((fatigueData[muscle].fatigueScore / maxFatigue) * 100));
    
    // Set training readiness (inverse of fatigue)
    fatigueData[muscle].readiness = Math.max(0, 100 - fatigueData[muscle].fatigueScore);
  });
  
  return fatigueData;
};

/**
 * Calculate workout frequency data for heat map visualization
 * @param {Array} workouts - All workout data
 * @param {number} days - Number of days to look back
 * @returns {Array} Daily workout data for heat map
 */
export const calculateWorkoutFrequency = (workouts, days = 365) => {
  if (!workouts || workouts.length === 0) return [];
  
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);
  
  // Create a map of dates and workout counts
  const dateMap = {};
  
  // Initialize all dates with 0 workouts
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d, 'YYYY-MM-DD');
    dateMap[dateStr] = { 
      date: dateStr, 
      count: 0, 
      volume: 0,
      workouts: []
    };
  }
  
  // Count workouts and volume by date
  workouts.forEach(workout => {
    const workoutDate = workout.workoutTimestamp || new Date(workout.originalCsvDate.replace(' ', 'T'));
    const dateStr = formatDate(workoutDate, 'YYYY-MM-DD');
    
    // Only include dates within our range
    if (dateMap[dateStr]) {
      dateMap[dateStr].count += 1;
      
      // Calculate total volume for the workout
      let totalVolume = 0;
      workout.exercises.forEach(exercise => {
        totalVolume += exercise.totalVolumeForExercise;
      });
      
      dateMap[dateStr].volume += totalVolume;
      dateMap[dateStr].workouts.push({
        name: workout.workoutName,
        id: workout.id,
        volume: totalVolume,
        durationSeconds: workout.durationSeconds
      });
    }
  });
  
  // Convert the map to an array of objects
  return Object.values(dateMap).map(item => ({
    date: item.date,
    count: item.count,
    volume: Math.round(item.volume),
    // Calculate heat level based on workout count (0-4)
    level: Math.min(4, item.count),
    workouts: item.workouts
  }));
};

/**
 * Generate workout suggestions based on fatigue, PRs, and workout history
 * @param {Array} workouts - All workout data
 * @param {Object} personalRecords - Personal records data
 * @returns {Object} Workout suggestions
 */
export const generateWorkoutSuggestions = (workouts, personalRecords) => {
  if (!workouts || workouts.length === 0 || !personalRecords) {
    return { error: "Insufficient data to generate suggestions" };
  }
  
  // Calculate muscle fatigue data
  const fatigueData = calculateMuscleFatigue(workouts);
  
  // Find common workout templates
  const templateMap = {};
  workouts.forEach(workout => {
    const exercises = workout.exercises.map(ex => ex.exerciseName).sort();
    const templateKey = exercises.join('|');
    
    if (!templateMap[templateKey]) {
      templateMap[templateKey] = {
        count: 1,
        exercises,
        workoutNames: [workout.workoutName],
        lastPerformed: workout.workoutTimestamp || new Date(workout.originalCsvDate.replace(' ', 'T')),
        muscleGroups: new Set(workout.exercises.map(ex => ex.muscleGroup))
      };
    } else {
      templateMap[templateKey].count += 1;
      
      if (!templateMap[templateKey].workoutNames.includes(workout.workoutName)) {
        templateMap[templateKey].workoutNames.push(workout.workoutName);
      }
      
      const workoutDate = workout.workoutTimestamp || new Date(workout.originalCsvDate.replace(' ', 'T'));
      if (workoutDate > templateMap[templateKey].lastPerformed) {
        templateMap[templateKey].lastPerformed = workoutDate;
      }
      
      workout.exercises.forEach(ex => {
        templateMap[templateKey].muscleGroups.add(ex.muscleGroup);
      });
    }
  });
  
  // Convert the set of muscle groups to an array
  Object.values(templateMap).forEach(template => {
    template.muscleGroups = Array.from(template.muscleGroups);
  });
  
  // Get frequent templates (used at least twice)
  const frequentTemplates = Object.values(templateMap)
    .filter(template => template.count >= 2)
    .sort((a, b) => b.count - a.count);
  
  // Find muscle groups ready for training (recovery >= 90%)
  const readyMuscleGroups = Object.entries(fatigueData)
    .filter(([_, data]) => data.recoveryPercentage >= 90)
    .map(([muscle, _]) => muscle)
    .sort();
  
  // Find exercises with potential for new PRs
  const prOpportunities = [];
  
  Object.entries(personalRecords).forEach(([exercise, records]) => {
    const maxE1RM = records.maxE1RM;
    if (!maxE1RM || !maxE1RM.date) return;
    
    const daysSincePR = Math.round((new Date() - new Date(maxE1RM.date)) / (1000 * 60 * 60 * 24));
    
    // Check if it's been at least 7 days since the last PR
    if (daysSincePR >= 7) {
      const muscleGroup = getMuscleGroup(exercise);
      
      // Only suggest if the muscle group is recovered enough
      if (fatigueData[muscleGroup] && fatigueData[muscleGroup].recoveryPercentage >= 85) {
        prOpportunities.push({
          exercise,
          muscleGroup,
          currentPR: maxE1RM.value,
          daysSincePR,
          reps: maxE1RM.reps,
          weight: maxE1RM.weightAtE1RM,
          suggestedWeight: Math.round(maxE1RM.weightAtE1RM * 1.025), // Suggest 2.5% increase
          suggestedReps: maxE1RM.reps
        });
      }
    }
  });
  
  // Sort PR opportunities by days since PR (descending)
  prOpportunities.sort((a, b) => b.daysSincePR - a.daysSincePR);
  
  // Calculate workout streak
  const streakData = calculateWorkoutStreak(workouts);
  
  // Generate customized workout suggestions
  const suggestions = {
    nextWorkoutDate: getNextWorkoutDate(workouts),
    muscleFatigue: fatigueData,
    workoutTemplates: frequentTemplates.slice(0, 5),
    readyMuscleGroups,
    prOpportunities: prOpportunities.slice(0, 5),
    streak: streakData,
    
    // Suggested workouts
    suggestedWorkouts: []
  };
  
  // Generate full workout suggestions based on templates and recovery
  if (frequentTemplates.length > 0) {
    // Find templates that mostly use recovered muscle groups
    const suitableTemplates = frequentTemplates
      .filter(template => {
        const readyCount = template.muscleGroups.filter(muscle => 
          fatigueData[muscle] && fatigueData[muscle].recoveryPercentage >= 80
        ).length;
        
        return readyCount >= template.muscleGroups.length * 0.7; // At least 70% of muscles are ready
      })
      .slice(0, 3);
    
    // Generate workout suggestions from suitable templates
    suitableTemplates.forEach(template => {
      const exerciseSuggestions = [];
      
      template.exercises.forEach(exercise => {
        const muscleGroup = getMuscleGroup(exercise);
        const exerciseRecord = personalRecords[exercise];
        
        if (!exerciseRecord) return;
        
        // Get the best weights and reps
        const maxWeight = exerciseRecord.maxWeight?.value || 0;
        const typicalReps = exerciseRecord.maxE1RM?.reps || 10;
        
        // For recovered muscles, suggest slightly higher weight
        // For fatigued muscles, suggest maintenance volume
        const recoveryPercent = fatigueData[muscleGroup]?.recoveryPercentage || 100;
        const suggestedWeight = recoveryPercent >= 90 
          ? Math.round(maxWeight * 1.025) // 2.5% increase if fully recovered
          : recoveryPercent >= 70 
            ? maxWeight // Maintain if partially recovered
            : Math.round(maxWeight * 0.9); // Decrease if fatigued
        
        exerciseSuggestions.push({
          exercise,
          muscleGroup,
          sets: 3,
          suggestedWeight,
          suggestedReps: typicalReps,
          notes: recoveryPercent >= 90 
            ? "Push for a new PR" 
            : recoveryPercent >= 70 
              ? "Maintain current level" 
              : "Light recovery workout"
        });
      });
      
      suggestions.suggestedWorkouts.push({
        name: template.workoutNames[0],
        exercises: exerciseSuggestions,
        muscleGroups: template.muscleGroups,
        estimatedDuration: `${Math.round(exerciseSuggestions.length * 3 * 1.5 + 5)}m`, // Rough estimate: (exercises * sets * 1.5min + 5min rest)
        focus: template.muscleGroups.length === 1 
          ? `${template.muscleGroups[0]} Focus` 
          : "Full Body"
      });
    });
  }
  
  // If no suitable templates, create a custom workout based on ready muscle groups
  if (suggestions.suggestedWorkouts.length === 0 && readyMuscleGroups.length > 0) {
    const customExercises = [];
    
    // For each ready muscle group, find the best exercise
    readyMuscleGroups.forEach(muscleGroup => {
      // Find exercises for this muscle group
      const muscleExercises = Object.keys(personalRecords)
        .filter(exercise => getMuscleGroup(exercise) === muscleGroup);
      
      if (muscleExercises.length === 0) return;
      
      // Sort by e1RM (highest first)
      muscleExercises.sort((a, b) => {
        const aE1RM = personalRecords[a]?.maxE1RM?.value || 0;
        const bE1RM = personalRecords[b]?.maxE1RM?.value || 0;
        return bE1RM - aE1RM;
      });
      
      // Take the top 1-2 exercises
      const topExercises = muscleExercises.slice(0, Math.min(2, muscleExercises.length));
      
      topExercises.forEach(exercise => {
        const record = personalRecords[exercise];
        if (!record) return;
        
        customExercises.push({
          exercise,
          muscleGroup,
          sets: 3,
          suggestedWeight: record.maxWeight?.value || 0,
          suggestedReps: record.maxE1RM?.reps || 10,
          notes: "Focus on form and progression"
        });
      });
    });
    
    if (customExercises.length > 0) {
      suggestions.suggestedWorkouts.push({
        name: "Custom Recovery Workout",
        exercises: customExercises,
        muscleGroups: readyMuscleGroups,
        estimatedDuration: `${Math.round(customExercises.length * 3 * 1.5 + 5)}m`,
        focus: readyMuscleGroups.length === 1 
          ? `${readyMuscleGroups[0]} Recovery` 
          : "Multi-Muscle Recovery"
      });
    }
  }
  
  return suggestions;
};

/**
 * Calculate workout streak data
 * @param {Array} workouts - All workout data
 * @returns {Object} Streak information
 */
export const calculateWorkoutStreak = (workouts) => {
  if (!workouts || workouts.length === 0) return { 
    current: 0, 
    longest: 0, 
    lastWorkoutDate: null, 
    streakDates: [] 
  };
  
  // Sort workouts by date (newest first)
  const sortedWorkouts = [...workouts].sort((a, b) => {
    const dateA = a.workoutTimestamp || new Date(a.originalCsvDate.replace(' ', 'T'));
    const dateB = b.workoutTimestamp || new Date(b.originalCsvDate.replace(' ', 'T'));
    return dateB - dateA;
  });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastWorkoutDate = sortedWorkouts[0].workoutTimestamp || 
    new Date(sortedWorkouts[0].originalCsvDate.replace(' ', 'T'));
  lastWorkoutDate.setHours(0, 0, 0, 0);
  
  // Create a set of all workout dates (as YYYY-MM-DD strings)
  const workoutDates = new Set();
  sortedWorkouts.forEach(workout => {
    const date = workout.workoutTimestamp || new Date(workout.originalCsvDate.replace(' ', 'T'));
    workoutDates.add(formatDate(date, 'YYYY-MM-DD'));
  });
  
  // Calculate current streak
  let currentStreak = 0;
  const streakDates = [];
  
  // If last workout was today, start streak at 1
  if (formatDate(lastWorkoutDate, 'YYYY-MM-DD') === formatDate(today, 'YYYY-MM-DD')) {
    currentStreak = 1;
    streakDates.push(formatDate(today, 'YYYY-MM-DD'));
  } 
  // If last workout was yesterday, start streak at 1
  else if ((today - lastWorkoutDate) / (1000 * 60 * 60 * 24) <= 1) {
    currentStreak = 1;
    streakDates.push(formatDate(lastWorkoutDate, 'YYYY-MM-DD'));
  } 
  // If more than a day has passed, streak is broken
  else {
    currentStreak = 0;
  }
  
  // Work backwards from yesterday to find the current streak
  let checkDate = new Date(today);
  checkDate.setDate(checkDate.getDate() - 1);
  
  while (currentStreak > 0) {
    const dateString = formatDate(checkDate, 'YYYY-MM-DD');
    
    if (workoutDates.has(dateString)) {
      currentStreak++;
      streakDates.push(dateString);
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  // Calculate longest streak
  let longest = currentStreak;
  let currentRun = 0;
  let prevDate = null;
  
  // Get all workout dates in ascending order
  const allDates = [...workoutDates]
    .map(dateStr => new Date(dateStr))
    .sort((a, b) => a - b);
  
  allDates.forEach(date => {
    if (!prevDate) {
      currentRun = 1;
    } else {
      const dayDiff = Math.round((date - prevDate) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        currentRun++;
      } else {
        currentRun = 1;
      }
    }
    
    if (currentRun > longest) {
      longest = currentRun;
    }
    
    prevDate = date;
  });
  
  return {
    current: currentStreak,
    longest,
    lastWorkoutDate: formatDate(lastWorkoutDate, 'YYYY-MM-DD'),
    streakDates
  };
};

/**
 * Predict the next workout date based on workout history
 * @param {Array} workouts - All workout data
 * @returns {string} Predicted next workout date (YYYY-MM-DD)
 */
export const getNextWorkoutDate = (workouts) => {
  if (!workouts || workouts.length === 0) {
    // If no workout history, suggest tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow, 'YYYY-MM-DD');
  }
  
  // Sort workouts by date (newest first)
  const sortedWorkouts = [...workouts].sort((a, b) => {
    const dateA = a.workoutTimestamp || new Date(a.originalCsvDate.replace(' ', 'T'));
    const dateB = b.workoutTimestamp || new Date(b.originalCsvDate.replace(' ', 'T'));
    return dateB - dateA;
  });
  
  // Get the last few workout dates
  const recentDates = sortedWorkouts
    .slice(0, Math.min(10, sortedWorkouts.length))
    .map(workout => workout.workoutTimestamp || new Date(workout.originalCsvDate.replace(' ', 'T')));
  
  if (recentDates.length < 2) {
    // Not enough data, suggest tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow, 'YYYY-MM-DD');
  }
  
  // Calculate average time between workouts (in days)
  let totalDays = 0;
  for (let i = 0; i < recentDates.length - 1; i++) {
    const dayDiff = (recentDates[i] - recentDates[i + 1]) / (1000 * 60 * 60 * 24);
    totalDays += dayDiff;
  }
  
  const avgDays = Math.max(1, Math.round(totalDays / (recentDates.length - 1)));
  
  // Calculate next date based on the most recent workout
  const nextDate = new Date(recentDates[0]);
  nextDate.setDate(nextDate.getDate() + avgDays);
  
  // If the predicted date is in the past, suggest tomorrow
  const today = new Date();
  if (nextDate < today) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow, 'YYYY-MM-DD');
  }
  
  return formatDate(nextDate, 'YYYY-MM-DD');
};

/**
 * Calculate total workout metrics and statistics
 * @param {Array} workouts - All workout data
 * @returns {Object} Overall workout statistics
 */
export const calculateOverallStats = (workouts) => {
  if (!workouts || workouts.length === 0) {
    return {
      totalWorkouts: 0,
      totalExercises: 0,
      totalSets: 0,
      totalReps: 0,
      totalVolume: 0,
      totalDuration: 0,
      avgWorkoutDuration: 0,
      avgExercisesPerWorkout: 0,
      avgSetsPerExercise: 0,
      avgVolumePerWorkout: 0,
      muscleGroupDistribution: {},
      exerciseFrequency: {}
    };
  }
  
  let totalExercises = 0;
  let totalSets = 0;
  let totalReps = 0;
  let totalVolume = 0;
  let totalDuration = 0;
  
  const exerciseCounts = {};
  const muscleGroupCounts = {};
  
  // Calculate totals
  workouts.forEach(workout => {
    totalDuration += workout.durationSeconds || 0;
    totalExercises += workout.exercises.length;
    
    workout.exercises.forEach(exercise => {
      // Track exercise frequency
      exerciseCounts[exercise.exerciseName] = (exerciseCounts[exercise.exerciseName] || 0) + 1;
      
      // Track muscle group distribution
      muscleGroupCounts[exercise.muscleGroup] = (muscleGroupCounts[exercise.muscleGroup] || 0) + 1;
      
      totalSets += exercise.sets.length;
      
      exercise.sets.forEach(set => {
        totalReps += set.reps || 0;
        totalVolume += set.volume || 0;
      });
    });
  });
  
  // Calculate averages
  const avgWorkoutDuration = workouts.length > 0 ? totalDuration / workouts.length : 0;
  const avgExercisesPerWorkout = workouts.length > 0 ? totalExercises / workouts.length : 0;
  const avgSetsPerExercise = totalExercises > 0 ? totalSets / totalExercises : 0;
  const avgVolumePerWorkout = workouts.length > 0 ? totalVolume / workouts.length : 0;
  
  // Sort exercise frequency
  const exerciseFrequency = Object.entries(exerciseCounts)
    .sort((a, b) => b[1] - a[1])
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
  
  // Calculate muscle group distribution percentages
  const totalMuscleGroups = Object.values(muscleGroupCounts).reduce((sum, count) => sum + count, 0);
  
  const muscleGroupDistribution = Object.entries(muscleGroupCounts)
    .map(([group, count]) => ({
      name: group,
      count,
      percentage: totalMuscleGroups > 0 ? Math.round((count / totalMuscleGroups) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
  
  return {
    totalWorkouts: workouts.length,
    totalExercises,
    totalSets,
    totalReps,
    totalVolume: Math.round(totalVolume),
    totalDuration,
    avgWorkoutDuration,
    avgExercisesPerWorkout,
    avgSetsPerExercise,
    avgVolumePerWorkout: Math.round(avgVolumePerWorkout),
    muscleGroupDistribution,
    exerciseFrequency
  };
};

export default {
  calculateMuscleFatigue,
  calculateWorkoutFrequency,
  generateWorkoutSuggestions,
  calculateWorkoutStreak,
  getNextWorkoutDate,
  calculateOverallStats
}; 