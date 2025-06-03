import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Firebase imports are removed

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { UploadCloud, BarChart2, List, CalendarDays, Zap, AlertTriangle, CheckCircle, Info, ArrowRight, ChevronDown, ChevronUp, FileText, Settings, Dumbbell, TrendingUp, Brain, Target, Activity, Repeat, HelpCircle, Clock, TrendingDown, Award } from 'lucide-react';

// --- Muscle Group Mapping (Basic) ---
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
  'Overhead Press': 'Shoulders', // (Barbell/Dumbbell)
  'Arnold Press': 'Shoulders',
  // Legs
  'Seated Leg Curl (Machine)': 'Hamstrings',
  'Lying Leg Curl (Machine)': 'Hamstrings',
  'Leg Extension (Machine)': 'Quads',
  'Seated Leg Press (Machine)': 'Quads',
  'Squat': 'Quads', // (Barbell)
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
  'Tricep Pushdown': 'Triceps', // (Cable)
  'Overhead Tricep Extension': 'Triceps',
  // Cardio / Other
  'Running (Treadmill)': 'Cardio',
  'Cycling': 'Cardio',
  'Elliptical': 'Cardio',
  'Plank': 'Core',
  'Crunches': 'Core',
  'Leg Raise': 'Core',
};

const getMuscleGroup = (exerciseName) => {
    for (const key in exerciseToMuscleGroupMap) {
        if (exerciseName.toLowerCase().includes(key.toLowerCase())) {
            return exerciseToMuscleGroupMap[key];
        }
    }
    if (exerciseName.toLowerCase().includes('curl')) return 'Biceps';
    if (exerciseName.toLowerCase().includes('tricep')) return 'Triceps';
    if (exerciseName.toLowerCase().includes('chest') || (exerciseName.toLowerCase().includes('press') && !exerciseName.toLowerCase().includes('leg') && !exerciseName.toLowerCase().includes('shoulder'))) return 'Chest';
    if (exerciseName.toLowerCase().includes('shoulder') || exerciseName.toLowerCase().includes('deltoid') || exerciseName.toLowerCase().includes('lateral raise')) return 'Shoulders';
    if (exerciseName.toLowerCase().includes('row') || exerciseName.toLowerCase().includes('pulldown') || exerciseName.toLowerCase().includes('lat ')) return 'Back';
    if (exerciseName.toLowerCase().includes('squat') || exerciseName.toLowerCase().includes('lunge') || exerciseName.toLowerCase().includes('leg press') || exerciseName.toLowerCase().includes('quad')) return 'Quads';
    if (exerciseName.toLowerCase().includes('hamstring') || exerciseName.toLowerCase().includes('deadlift')) return 'Hamstrings';
    if (exerciseName.toLowerCase().includes('calf') || exerciseName.toLowerCase().includes('calves')) return 'Calves';
    if (exerciseName.toLowerCase().includes('glute')) return 'Glutes';
    return 'Other';
};

// --- Helper Functions ---
const parseDurationToSeconds = (durationStr) => {
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

const formatDate = (dateStringOrDate, format = 'YYYY-MM-DD') => {
  let date;
  if (dateStringOrDate instanceof Date) {
    date = dateStringOrDate;
  } else if (typeof dateStringOrDate === 'string') {
    // Ensure the string is in a format Date constructor can reliably parse, especially ISO 8601
    date = new Date(dateStringOrDate.includes('T') ? dateStringOrDate : dateStringOrDate.replace(' ', 'T'));
  } else {
    // console.warn("Invalid date input to formatDate:", dateStringOrDate);
    return 'Invalid Date';
  }

  if (isNaN(date.getTime())) {
      // Fallback for "YYYY-MM-DD HH:MM:SS" if initial parsing failed or was ambiguous
      const parts = String(dateStringOrDate).split(/[\s:-]/);
      if (parts.length >= 3) { // Year, Month, Day are essential
          // Month is 0-indexed in JS Date constructor
          date = new Date(parts[0], parseInt(parts[1],10) - 1, parts[2], parts[3] || 0, parts[4] || 0, parts[5] || 0);
      }
      if (isNaN(date.getTime())) {
        // console.warn("Still invalid date after fallback:", dateStringOrDate);
        return 'Invalid Date'; 
      }
  }

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  if (format === 'YYYY-MM') return `${year}-${month}`;
  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  if (format === 'MM/DD') return `${month}/${day}`;
  if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
  if (format === 'MM/DD HH:mm') return `${month}/${day} ${hours}:${minutes}`;
  if (format === 'Month DD, YYYY') return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  if (format === 'Month DD, YYYY HH:mm') return `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ${hours}:${minutes}`;
  return date.toISOString();
};

const formatDuration = (totalSeconds) => {
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

const calculateE1RM = (weight, reps) => {
  if (reps === 0 || weight === 0) return 0;
  if (reps === 1) return weight;
  return weight / (1.0278 - 0.0278 * reps);
};

// --- Main App Component ---
const App = () => {
  // Removed Firebase-specific states like userId, isAuthReady
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Start true until localStorage is loaded
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [personalRecords, setPersonalRecords] = useState({});
  const [workoutSuggestions, setWorkoutSuggestions] = useState(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [selectedExerciseForAnalytics, setSelectedExerciseForAnalytics] = useState('');
  const [plannedNextWorkoutDate, setPlannedNextWorkoutDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [gainsProjection, setGainsProjection] = useState([]);

  // Load workouts from localStorage on initial mount
  useEffect(() => {
    setIsLoading(true);
    try {
      const storedWorkouts = localStorage.getItem('fitTrackWorkouts');
      if (storedWorkouts) {
        const parsed = JSON.parse(storedWorkouts).map(workout => ({
          ...workout,
          // Ensure workoutTimestamp is a Date object if stored as string
          // originalCsvDate is already a string from parsing and should remain so for ID purposes
          workoutTimestamp: workout.workoutTimestamp ? new Date(workout.workoutTimestamp) : null 
        }));
        setWorkouts(parsed);
        const prs = calculateAllPRs(parsed);
        setPersonalRecords(prs);
        if (parsed.length > 0 && Object.keys(prs).length > 0) {
          setGainsProjection(calculateGainsProjection(parsed, prs));
        }
      }
    } catch (e) {
      console.error("Error loading workouts from localStorage:", e);
      setError("Could not load saved workouts. Data might be corrupted or incompatible.");
    }
    setIsLoading(false);
  }, []);

  // Save workouts to localStorage whenever they change
  useEffect(() => {
    // Don't save during initial load if workouts haven't been set from storage yet
    if (isLoading && workouts.length === 0) return; 
    try {
      const workoutsToStore = workouts.map(workout => ({
        ...workout,
        // Convert Date objects back to ISO strings for storage
        workoutTimestamp: workout.workoutTimestamp instanceof Date 
          ? workout.workoutTimestamp.toISOString() 
          : workout.workoutTimestamp, // Already a string or null
      }));
      localStorage.setItem('fitTrackWorkouts', JSON.stringify(workoutsToStore));
    } catch (e) {
      console.error("Error saving workouts to localStorage:", e);
      setError("Could not save workout data. Browser storage might be full.");
    }
  }, [workouts, isLoading]); // Add isLoading to dependencies to avoid premature save


  const calculateAllPRs = (allWorkouts) => {
    const prs = {}; 
    allWorkouts.forEach(workout => {
      const workoutDate = workout.workoutTimestamp ? new Date(workout.workoutTimestamp) : new Date(workout.originalCsvDate.replace(' ', 'T'));
      workout.exercises.forEach(exercise => {
        if (!prs[exercise.exerciseName]) {
          prs[exercise.exerciseName] = { maxE1RM: { value: 0, date: null, reps: 0, weightAtE1RM: 0 } };
        }
        exercise.sets.forEach(set => {
          if (set.weight > 0 && set.reps > 0) {
            if (set.e1RM > prs[exercise.exerciseName].maxE1RM.value) {
              prs[exercise.exerciseName].maxE1RM = { 
                value: set.e1RM, 
                date: workoutDate,
                reps: set.reps,
                weightAtE1RM: set.weight
              };
            }
            const repKey = `${set.reps}RM_weight_lbs`;
            if (!prs[exercise.exerciseName][repKey] || set.weight > prs[exercise.exerciseName][repKey].value) {
              prs[exercise.exerciseName][repKey] = { value: set.weight, date: workoutDate };
            }
          }
        });
      });
    });
    return prs;
  };
  
  const calculateGainsProjection = (allWorkouts, currentPRs) => {
    const projections = [];
    if (allWorkouts.length < 3) return projections;

    const exerciseCounts = {};
    allWorkouts.forEach(w => {
        w.exercises.forEach(ex => {
            if (ex.muscleGroup !== 'Cardio' && ex.muscleGroup !== 'Other') {
                exerciseCounts[ex.exerciseName] = (exerciseCounts[ex.exerciseName] || 0) + 1;
            }
        });
    });
    const sortedCoreExercises = Object.entries(exerciseCounts)
        .sort(([,a],[,b]) => b-a)
        .slice(0, 5)
        .map(([name]) => name);

    sortedCoreExercises.forEach(exName => {
        const currentMaxE1RM = currentPRs[exName]?.maxE1RM?.value || 0;
        if (currentMaxE1RM === 0) return;
        const targetE1RM = currentMaxE1RM * 1.05;

        const eightWeeksAgo = new Date();
        eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
        
        const relevantWorkoutDates = new Set();
        allWorkouts.forEach(w => {
            if (w.exercises.some(e => e.exerciseName === exName)) {
                relevantWorkoutDates.add(formatDate(w.workoutTimestamp || w.originalCsvDate, 'YYYY-MM-DD'));
            }
        });
        const sortedUniqueWorkoutDates = Array.from(relevantWorkoutDates).sort((a,b) => new Date(b) - new Date(a));
        const last8UniqueWorkoutDates = sortedUniqueWorkoutDates.slice(0, 8).map(d => new Date(d));

        const e1RMTrendData = allWorkouts
            .filter(w => {
                const workoutDate = w.workoutTimestamp ? new Date(w.workoutTimestamp) : new Date(w.originalCsvDate.replace(' ', 'T'));
                return w.exercises.some(e => e.exerciseName === exName) && 
                       last8UniqueWorkoutDates.some(uniqueDate => formatDate(workoutDate, 'YYYY-MM-DD') === formatDate(uniqueDate, 'YYYY-MM-DD'));
            })
            .map(w => {
                const exData = w.exercises.find(e => e.exerciseName === exName);
                return { date: w.workoutTimestamp ? new Date(w.workoutTimestamp) : new Date(w.originalCsvDate.replace(' ', 'T')), e1RM: exData.maxE1RMForExercise };
            })
            .sort((a,b) => a.date - b.date);

        if (e1RMTrendData.length < 2) {
             projections.push({ exerciseName: exName, currentMaxE1RM: currentMaxE1RM.toFixed(1), targetE1RM: targetE1RM.toFixed(1), estimatedWorkouts: 'N/A (Insufficient trend data)', estimatedWeeks: 'N/A' }); return;
        }

        const firstPoint = e1RMTrendData[0];
        const lastPoint = e1RMTrendData[e1RMTrendData.length - 1];
        
        const e1RMChange = lastPoint.e1RM - firstPoint.e1RM;
        const timeDiffDays = (lastPoint.date.getTime() - firstPoint.date.getTime()) / (1000 * 60 * 60 * 24);
        const numWorkoutsForExerciseInPeriod = e1RMTrendData.length;

        if (timeDiffDays <= 0 || e1RMChange <= 0) {
             projections.push({ exerciseName: exName, currentMaxE1RM: currentMaxE1RM.toFixed(1), targetE1RM: targetE1RM.toFixed(1), estimatedWorkouts: 'N/A (No recent progress)', estimatedWeeks: 'N/A' }); return;
        }
        const dailyImprovementRate = e1RMChange / timeDiffDays;
        const workoutsPerDayForExercise = numWorkoutsForExerciseInPeriod / timeDiffDays;
        const e1RMToGain = targetE1RM - currentMaxE1RM;

        if (e1RMToGain <= 0) {
             projections.push({ exerciseName: exName, currentMaxE1RM: currentMaxE1RM.toFixed(1), targetE1RM: targetE1RM.toFixed(1), estimatedWorkouts: 'Achieved/Exceeded', estimatedWeeks: 'Achieved/Exceeded' }); return;
        }
        const daysToTarget = e1RMToGain / dailyImprovementRate;
        const workoutsToTarget = Math.ceil(daysToTarget * workoutsPerDayForExercise);
        const weeksToTarget = Math.ceil(daysToTarget / 7);
        projections.push({ exerciseName: exName, currentMaxE1RM: currentMaxE1RM.toFixed(1), targetE1RM: targetE1RM.toFixed(1), estimatedWorkouts: workoutsToTarget > 0 ? workoutsToTarget : 'N/A', estimatedWeeks: weeksToTarget > 0 ? weeksToTarget : 'N/A' });
    });
    return projections;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) { setError("No file selected."); return; }
    setIsLoading(true); setError(null); setSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvText = e.target.result;
      try {
        const newParsedWorkouts = parseStrongCsv(csvText, file.name);
        if (newParsedWorkouts.length === 0) throw new Error("No valid workout data found in CSV.");

        setWorkouts(prevWorkouts => {
            let newCount = 0;
            let skippedCount = 0;
            // Create a mutable copy for modification
            const updatedWorkoutsList = [...prevWorkouts];
            const existingOriginalCsvDates = new Set(prevWorkouts.map(w => w.originalCsvDate));

            newParsedWorkouts.forEach(parsedWorkout => {
                if (!existingOriginalCsvDates.has(parsedWorkout.originalCsvDate)) {
                    updatedWorkoutsList.push(parsedWorkout);
                    // Add to set to prevent duplicates if multiple identical entries are in the *same* uploaded file
                    existingOriginalCsvDates.add(parsedWorkout.originalCsvDate); 
                    newCount++;
                } else {
                    skippedCount++;
                }
            });
            
            // Sort all workouts (old + new) by date descending
            updatedWorkoutsList.sort((a, b) => 
                (new Date(b.workoutTimestamp || b.originalCsvDate.replace(' ', 'T'))) - 
                (new Date(a.workoutTimestamp || a.originalCsvDate.replace(' ', 'T')))
            );
            
            // Recalculate PRs and Gains Projection with the full updated list
            if (newCount > 0) {
                 const prs = calculateAllPRs(updatedWorkoutsList);
                 setPersonalRecords(prs);
                 if (updatedWorkoutsList.length > 0 && Object.keys(prs).length > 0) {
                    setGainsProjection(calculateGainsProjection(updatedWorkoutsList, prs));
                 }
            }
            setSuccessMessage(`${newCount} new workout(s) added. ${skippedCount} skipped (already existed). All weights assumed lbs.`);
            return updatedWorkoutsList; // Return the new state
        });

      } catch (err) {
        console.error("Error processing file:", err);
        setError(`Error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
    event.target.value = null; // Reset file input to allow re-uploading the same file
  };
  
  const parseStrongCsv = (csvText, fileName) => {
    const lines = csvText.split(/\r\n|\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const rawEntries = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      const values = [];
      let currentVal = '';
      let inQuotes = false;
      for (let char of lines[i]) {
          if (char === '"' && (lines[i][lines[i].indexOf(char)-1] !== '"' && lines[i][lines[i].indexOf(char)+1] !== '"')) { // Handle "" as literal quote
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) { 
            values.push(currentVal.replace(/""/g, '"').trim()); // Replace "" with "
            currentVal = ''; 
          } else { 
            currentVal += char; 
          }
      }
      values.push(currentVal.replace(/""/g, '"').trim()); // Add last value

      if (values.length !== headers.length) { console.warn(`Skipping malformed CSV line ${i+1}: Expected ${headers.length}, got ${values.length}. Line: ${lines[i]}`); continue; }
      
      const entry = {};
      headers.forEach((header, index) => { entry[header] = values[index] ? values[index].replace(/^"|"$/g, '') : ''; });
      if (entry['Set Order'] !== 'Rest Timer' && entry['Exercise Name']) rawEntries.push(entry);
    }
  
    const workoutsMap = new Map();
    rawEntries.forEach(entry => {
      const workoutKey = entry['Date']; // This is "YYYY-MM-DD HH:MM:SS"
      if (!workoutKey) { console.warn("Skipping entry with no Date:", entry); return; }
      
      if (!workoutsMap.has(workoutKey)) {
        let workoutDateObj;
        try {
            // Attempt to parse the date string. Strong app format is usually "YYYY-MM-DD HH:MM:SS"
            const dateTimeParts = workoutKey.split(' ');
            const dateParts = dateTimeParts[0].split('-');
            const timeParts = dateTimeParts[1].split(':');
            workoutDateObj = new Date(
                parseInt(dateParts[0], 10), 
                parseInt(dateParts[1], 10) - 1, // Month is 0-indexed
                parseInt(dateParts[2], 10),
                parseInt(timeParts[0], 10),
                parseInt(timeParts[1], 10),
                parseInt(timeParts[2], 10)
            );
            if (isNaN(workoutDateObj.getTime())) throw new Error("Invalid date from parsed parts");
        } catch (e) {
            console.error("Failed to parse date string:", workoutKey, e); return; 
        }

        workoutsMap.set(workoutKey, {
          id: workoutKey + '-' + Math.random().toString(36).substr(2, 9), 
          originalCsvDate: workoutKey, // Keep the original string for exact matching
          workoutDate: formatDate(workoutDateObj, 'YYYY-MM-DD'),
          workoutTimestamp: workoutDateObj.toISOString(), 
          workoutName: entry['Workout Name'],
          durationString: entry['Duration'],
          durationSeconds: parseDurationToSeconds(entry['Duration']),
          exercises: new Map(),
          workoutNotes: entry['Workout Notes'] || '',
          rpe: entry['RPE'] ? parseFloat(entry['RPE']) : null,
          fileName: fileName,
          uploadedAt: new Date().toISOString()
        });
      }
  
      const currentWorkout = workoutsMap.get(workoutKey);
      const exerciseName = entry['Exercise Name'];
      if (!currentWorkout.exercises.has(exerciseName)) {
        currentWorkout.exercises.set(exerciseName, {
          exerciseName: exerciseName, muscleGroup: getMuscleGroup(exerciseName), sets: [],
        });
      }
  
      const currentExercise = currentWorkout.exercises.get(exerciseName);
      const weightLbs = parseFloat(entry['Weight']) || 0;
      const reps = parseFloat(entry['Reps']) || 0;
      
      currentExercise.sets.push({
        setOrder: parseInt(entry['Set Order'], 10) || 0, weight: weightLbs, reps: reps,
        distance: parseFloat(entry['Distance']) || 0, seconds: parseFloat(entry['Seconds']) || 0,
        notes: entry['Notes'] || '', volume: (weightLbs * reps) || 0, e1RM: calculateE1RM(weightLbs, reps),
      });
    });
  
    return Array.from(workoutsMap.values()).map(workout => {
      const exercisesArray = Array.from(workout.exercises.values()).map(ex => {
        ex.sets.sort((a, b) => a.setOrder - b.setOrder);
        const totalVolumeForExercise = ex.sets.reduce((sum, set) => sum + (set.volume || 0), 0);
        const maxWeightForExercise = Math.max(0, ...ex.sets.map(s => s.weight));
        const maxRepsForExercise = Math.max(0, ...ex.sets.map(s => s.reps));
        const maxE1RMForExercise = Math.max(0, ...ex.sets.map(s => s.e1RM));
        return { ...ex, totalVolumeForExercise, maxWeightForExercise, maxRepsForExercise, maxE1RMForExercise };
      });
      return { ...workout, exercises: exercisesArray };
    });
  };

  const handleGenerateSuggestions = async () => {
    if (!workouts || workouts.length === 0) { setError("Not enough workout data for suggestions."); return; }
    setIsGeneratingSuggestions(true); setError(null); setWorkoutSuggestions(null);

    const recentWorkoutsSummary = workouts.slice(0, 3).map(w => ({
        name: w.workoutName, date: formatDate(w.workoutTimestamp || w.originalCsvDate, 'YYYY-MM-DD'),
        exercises: w.exercises.map(ex => ({ name: ex.exerciseName, sets: ex.sets.map(s => `${s.reps} reps @ ${s.weight.toFixed(1)} lbs`).join(', ') }))
    }));
    const prSummary = Object.entries(personalRecords).sort(([,a],[,b]) => b.maxE1RM.value - a.maxE1RM.value).slice(0, 5).map(([exName, prData]) => `${exName}: Max e1RM ${prData.maxE1RM.value.toFixed(1)} lbs`).join('; ');
    const muscleGroupsWorkedRecently = new Set();
    workouts.slice(0,5).forEach(w => w.exercises.forEach(ex => { if(ex.muscleGroup !== 'Cardio' && ex.muscleGroup !== 'Other') muscleGroupsWorkedRecently.add(ex.muscleGroup); }));
    const availableMachines = Array.from(new Set(workouts.flatMap(w => w.exercises.filter(ex => ex.exerciseName.toLowerCase().includes('(machine)')).map(ex => ex.exerciseName))));

    const prompt = `You are a knowledgeable fitness coach. User weights are in POUNDS (lbs).
User's planned next workout date: ${plannedNextWorkoutDate} (today is ${formatDate(new Date(), 'YYYY-MM-DD')}).
Recent Workouts (last 3, weights in lbs): ${JSON.stringify(recentWorkoutsSummary, null, 2)}
Key Personal Records (Top 5 by e1RM, in lbs): ${prSummary || 'No PRs.'}
Muscle groups worked in last 5 workouts: ${Array.from(muscleGroupsWorkedRecently).join(', ') || 'None'}
Available machines (user history, prioritize these): ${availableMachines.join(', ') || 'None specific, assume standard gym.'}
Suggest a balanced workout for ${plannedNextWorkoutDate}. Consider recovery & progressive overload.
Provide 3-5 exercises. For each: Exercise Name (common name), Target Sets (e.g., '3-4 sets'), Target Reps (e.g., '8-12 reps'), Target Weight (in lbs, e.g., 'try 150 lbs' or '+5 lbs from last time') OR RPE (e.g., 'RPE 7-8'), Rest Time (optional, e.g., '60-90 seconds').
Structure the response as JSON.
`;

    let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = {
        contents: chatHistory,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT", properties: {
                    workoutTitle: { type: "STRING" }, notes: { type: "STRING" },
                    suggestedExercises: { type: "ARRAY", items: {
                            type: "OBJECT", properties: {
                                exerciseName: { type: "STRING" }, targetSets: { type: "STRING" }, targetReps: { type: "STRING" },
                                targetWeightOrRPE: { type: "STRING" }, restTime: { type: "STRING" }
                            }, required: ["exerciseName", "targetSets", "targetReps", "targetWeightOrRPE"]
                        }}
                }, required: ["workoutTitle", "suggestedExercises"]
            }
        }
    };
    // IMPORTANT: For deployment, you MUST replace this empty apiKey with your own Google AI API key
    // or use environment variables as described in the README.md.
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 
    if (!apiKey) {
        setError("Gemini API key is not configured. Please set VITE_GEMINI_API_KEY for deployed version or update in code for local use.");
        setIsGeneratingSuggestions(false);
        return;
    }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) { const errBody = await response.text(); throw new Error(`API Error ${response.status}: ${errBody}`); }
        const result = await response.json();
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            setWorkoutSuggestions(JSON.parse(result.candidates[0].content.parts[0].text));
        } else { throw new Error("Unexpected API response structure."); }
    } catch (apiError) {
        console.error("Error generating workout suggestions:", apiError);
        setError(`Suggestions Error: ${apiError.message}.`);
    } finally {
        setIsGeneratingSuggestions(false);
    }
  };

  const filteredWorkouts = useMemo(() => {
    if (!searchTerm) return workouts;
    return workouts.filter(workout => 
      workout.workoutName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workout.exercises.some(ex => ex.exerciseName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [workouts, searchTerm]);

  const workoutsByMonth = useMemo(() => {
    const counts = {}; workouts.forEach(w => { const mY = formatDate(w.workoutTimestamp || w.originalCsvDate, 'YYYY-MM'); counts[mY] = (counts[mY] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, workouts: count })).sort((a,b) => new Date(a.name) - new Date(b.name));
  }, [workouts]);

  const totalVolumeByWorkout = useMemo(() => workouts.map(w => ({
        name: formatDate(w.workoutTimestamp || w.originalCsvDate, 'MM/DD'), date: new Date(w.workoutTimestamp || w.originalCsvDate.replace(' ', 'T')),
        volume: w.exercises.reduce((sum, ex) => sum + (ex.totalVolumeForExercise || 0), 0),
    })).sort((a,b) => a.date - b.date), [workouts]);
  
  const uniqueExercises = useMemo(() => { const names = new Set(); workouts.forEach(w => w.exercises.forEach(ex => names.add(ex.exerciseName))); return Array.from(names).sort(); }, [workouts]);

  const exerciseFrequency = useMemo(() => { const counts = {}; workouts.forEach(w => { const exs = new Set(); w.exercises.forEach(ex => exs.add(ex.exerciseName)); exs.forEach(exN => { counts[exN] = (counts[exN] || 0) + 1; }); }); return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count); }, [workouts]);

  const muscleGroupFrequency = useMemo(() => { const counts = {}; workouts.forEach(w => { const mgs = new Set(); w.exercises.forEach(ex => { if (ex.muscleGroup && ex.muscleGroup !== 'Cardio' && ex.muscleGroup !== 'Other') mgs.add(ex.muscleGroup); }); mgs.forEach(mgN => { counts[mgN] = (counts[mgN] || 0) + 1; }); }); return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count); }, [workouts]);

  const exerciseProgressData = useMemo(() => {
    if (!selectedExerciseForAnalytics) return null;
    return workouts.filter(w => w.exercises.some(ex => ex.exerciseName === selectedExerciseForAnalytics))
        .map(w => { const exD = w.exercises.find(ex => ex.exerciseName === selectedExerciseForAnalytics); return { date: formatDate(w.workoutTimestamp || w.originalCsvDate, 'YYYY-MM-DD'), maxWeight: exD.maxWeightForExercise, totalVolume: exD.totalVolumeForExercise, maxE1RM: exD.maxE1RMForExercise }; })
        .sort((a,b) => new Date(a.date) - new Date(b.date));
  }, [workouts, selectedExerciseForAnalytics]);

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-100">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Workouts" value={workouts.length} icon={<CalendarDays className="w-8 h-8 text-blue-500" />} />
        <StatCard title="Unique Exercises" value={uniqueExercises.length} icon={<Dumbbell className="w-8 h-8 text-green-500" />} />
        {workouts.length > 0 && <StatCard title="Last Workout" value={formatDate(workouts[0]?.workoutTimestamp || workouts[0]?.originalCsvDate, 'Month DD, YYYY')} icon={<Zap className="w-8 h-8 text-yellow-500" />} />}
        <StatCard title="Avg Duration" value={workouts.length > 0 ? formatDuration(workouts.reduce((s, w) => s + w.durationSeconds, 0) / workouts.length) : 'N/A'} icon={<Activity className="w-8 h-8 text-indigo-500" />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Personal Records (Max e1RM - lbs)"> {Object.keys(personalRecords).length > 0 ? (<ul className="space-y-2 max-h-60 overflow-y-auto pr-2">{Object.entries(personalRecords).sort(([,a],[,b]) => b.maxE1RM.value - a.maxE1RM.value).slice(0, 10).map(([exName, prData]) => (<li key={exName} className="text-sm text-gray-700 dark:text-gray-300"><span className="font-semibold">{exName}:</span> {prData.maxE1RM.value.toFixed(1)} lbs <span className="text-xs text-gray-500 dark:text-gray-400"> ({prData.maxE1RM.weightAtE1RM} lbs x {prData.maxE1RM.reps} reps on {formatDate(new Date(prData.maxE1RM.date), 'MM/DD/YYYY')})</span></li>))}</ul>) : <p className="text-sm text-gray-500 dark:text-gray-400">No PRs. Upload data.</p>} </ChartCard>
        <ChartCard title="Muscle Group Frequency"> {muscleGroupFrequency.length > 0 ? (<ResponsiveContainer width="100%" height={250}><PieChart><Pie data={muscleGroupFrequency} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{muscleGroupFrequency.map((entry, index) => <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#ef4444', '#f97316', '#8b5cf6', '#eab308', '#d946ef', '#06b6d4'][index % 8]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>) : <p className="text-sm text-gray-500 dark:text-gray-400">Not enough data.</p>} </ChartCard>
      </div>
      <ChartCard title="Time 'Til Gains (Estimations)" id="gains-tracker-section">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg mb-4"><div className="flex items-start"><Info className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-3 mt-1 flex-shrink-0" /><p className="text-xs text-blue-700 dark:text-blue-300">Estimates 5% e1RM (lbs) increase for core exercises based on last 8 active weeks trends. Not a guarantee. Use for motivation.</p></div></div>
        {gainsProjection.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{gainsProjection.map(p => (<div key={p.exerciseName} className="p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700/50"><h5 className="font-semibold text-gray-800 dark:text-gray-100">{p.exerciseName}</h5><p className="text-xs text-gray-600 dark:text-gray-400">Current Max e1RM: {p.currentMaxE1RM} lbs</p><p className="text-xs text-gray-600 dark:text-gray-400">Target +5% e1RM: <span className="font-bold text-green-600 dark:text-green-400">{p.targetE1RM} lbs</span></p>{p.estimatedWorkouts === 'Achieved/Exceeded' ? (<p className="text-xs text-green-600 dark:text-green-400 flex items-center"><Award className="w-4 h-4 mr-1"/> Target Met/Exceeded!</p>) : p.estimatedWorkouts.startsWith('N/A') ? (<p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center"><TrendingDown className="w-4 h-4 mr-1"/> {p.estimatedWorkouts}</p>) : (<><p className="text-xs text-gray-600 dark:text-gray-400">Est. Workouts: {p.estimatedWorkouts}</p><p className="text-xs text-gray-600 dark:text-gray-400">Est. Weeks: {p.estimatedWeeks}</p></>)}</div>))}</div>) : <p className="text-sm text-gray-500 dark:text-gray-400">Not enough data for gains projection.</p>}
      </ChartCard>
      <div>
        <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Recent Workouts</h3>
        <input type="text" placeholder="Search workouts..." className="w-full p-3 mb-4 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 dark:border-gray-600" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        {isLoading && workouts.length === 0 && <LoadingSpinner text="Loading workouts..." />}
        {filteredWorkouts.length === 0 && !isLoading && <p className="text-gray-600 dark:text-gray-400">No workouts found. Try uploading a CSV.</p>}
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">{filteredWorkouts.slice(0, 10).map(workout => <WorkoutItem key={workout.id} workout={workout} onSelect={setSelectedWorkout} personalRecords={personalRecords} />)}</div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-100">Workout Analytics</h2>
      <ChartCard title="Workouts Per Month"><ResponsiveContainer width="100%" height={300}><BarChart data={workoutsByMonth}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="workouts" fill="#3b82f6" name="Number of Workouts"/></BarChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Total Volume Per Workout (lbs)"><ResponsiveContainer width="100%" height={300}><LineChart data={totalVolumeByWorkout}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis label={{ value: 'lbs', angle: -90, position: 'insideLeft' }}/><Tooltip formatter={(value) => `${value.toFixed(1)} lbs`} /><Legend /><Line type="monotone" dataKey="volume" stroke="#10b981" activeDot={{ r: 8 }} name="Total Volume (lbs)"/></LineChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Exercise Frequency (Top 15)"><ResponsiveContainer width="100%" height={400}><BarChart data={exerciseFrequency.slice(0,15)} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" width={150} interval={0} style={{ fontSize: '12px' }}/><Tooltip /><Legend /><Bar dataKey="count" fill="#8b5cf6" name="Times Performed" /></BarChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Exercise Progress Deep Dive (lbs)">
        <div className="mb-4"><label htmlFor="exercise-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Exercise:</label><select id="exercise-select" value={selectedExerciseForAnalytics} onChange={(e) => setSelectedExerciseForAnalytics(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 dark:border-gray-600"><option value="">-- Select --</option>{uniqueExercises.map(exName => <option key={exName} value={exName}>{exName}</option>)}</select></div>
        {selectedExerciseForAnalytics && exerciseProgressData && exerciseProgressData.length > 0 ? (<div className="space-y-6"><h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Progress for: {selectedExerciseForAnalytics}</h4><ResponsiveContainer width="100%" height={250}><LineChart data={exerciseProgressData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis yAxisId="left" stroke="#ef4444" label={{ value: 'lbs', angle: -90, position: 'insideLeft' }} /><YAxis yAxisId="right" orientation="right" stroke="#f97316" label={{ value: 'lbs', angle: -90, position: 'insideRight' }}/><Tooltip formatter={(value) => `${value.toFixed(1)} lbs`} /><Legend /><Line yAxisId="left" type="monotone" dataKey="maxWeight" stroke="#ef4444" name="Max Weight (lbs)" /><Line yAxisId="right" type="monotone" dataKey="maxE1RM" stroke="#f97316" name="Max e1RM (lbs)" /></LineChart></ResponsiveContainer><ResponsiveContainer width="100%" height={250}><LineChart data={exerciseProgressData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis label={{ value: 'lbs', angle: -90, position: 'insideLeft' }}/><Tooltip formatter={(value) => `${value.toFixed(1)} lbs`} /><Legend /><Line type="monotone" dataKey="totalVolume" stroke="#06b6d4" name="Total Volume (lbs)" /></LineChart></ResponsiveContainer></div>) : selectedExerciseForAnalytics ? <p className="text-sm text-gray-500 dark:text-gray-400">No data for {selectedExerciseForAnalytics}.</p> : null}
      </ChartCard>
    </div>
  );

  const renderUpload = () => (
    <div className="space-y-6"><h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-100">Upload Workout Data</h2><div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg"><p className="text-gray-600 dark:text-gray-300 mb-4">Upload CSV from "Strong" app. Weights assumed in lbs. Duplicates skipped.</p><div className="flex items-center justify-center w-full"><label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors dark:border-gray-600"><div className="flex flex-col items-center justify-center pt-5 pb-6"><UploadCloud className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" /><p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag & drop</p><p className="text-xs text-gray-500 dark:text-gray-400">CSV files only</p></div><input id="csv-upload" type="file" className="hidden" accept=".csv" onChange={handleFileUpload} /></label></div>{isLoading && <div className="mt-4 flex items-center justify-center text-blue-600 dark:text-blue-400"><LoadingSpinner text="Processing..."/><span className="ml-2"></span></div>}</div></div>
   );

  const renderSuggestions = () => (
    <div className="space-y-6"><h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-100">AI Workout Suggestions</h2><div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg"><div className="mb-4"><label htmlFor="next-workout-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Planned Next Workout Date:</label><input type="date" id="next-workout-date" value={plannedNextWorkoutDate} onChange={(e) => setPlannedNextWorkoutDate(e.target.value)} className="w-full md:w-1/2 p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 dark:border-gray-600"/></div><button onClick={handleGenerateSuggestions} disabled={isGeneratingSuggestions || workouts.length < 3} className="w-full flex items-center justify-center px-6 py-3 mb-6 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all">{isGeneratingSuggestions ? <><LoadingSpinner text="Generating..." /> <span className="ml-2"></span></> : <><Brain className="w-5 h-5 mr-2" /> Generate New Workout Plan</> }</button>{workouts.length < 3 && <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4">Upload at least 3 workouts for suggestions.</p>}{workoutSuggestions ? (<div className="mt-4 space-y-4"><h3 className="text-xl font-semibold text-purple-700 dark:text-purple-300">{workoutSuggestions.workoutTitle || "Suggested Workout"}</h3>{workoutSuggestions.notes && <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-3 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-md">{workoutSuggestions.notes}</p>}<div className="space-y-3">{workoutSuggestions.suggestedExercises?.map((ex, index) => (<div key={index} className="p-3 border rounded-md bg-gray-50 dark:bg-gray-700/50 dark:border-gray-700"><p className="font-semibold text-gray-800 dark:text-gray-100">{ex.exerciseName}</p><p className="text-xs text-gray-500 dark:text-gray-400">Sets: {ex.targetSets} | Reps: {ex.targetReps} {ex.targetWeightOrRPE && ` | Target: ${ex.targetWeightOrRPE}`}{ex.restTime && ` | Rest: ${ex.restTime}`}</p></div>))}</div></div>) : !isGeneratingSuggestions && <div className="text-center py-8"><HelpCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" /><p className="text-gray-500 dark:text-gray-400">Click button for AI suggestions.</p><p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Not professional advice. Ensure API key is set for deployed version.</p></div>}</div></div>
  );
  
  const renderSettings = () => (
    <div className="space-y-6"><h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-100">Settings</h2><div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg"><p className="text-gray-700 dark:text-gray-300 mt-4">FitTrack analyzes Strong app CSVs (weights in lbs) & offers AI suggestions. No external DB used; data stored in your browser. For AI suggestions on deployed version, you'll need your own Google AI API key (set as VITE_GEMINI_API_KEY environment variable).</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-2">LocalStorage limit: ~5-10MB. For very large histories, data might eventually exceed this.</p></div></div>
  );

  if (isLoading && workouts.length === 0) return <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900"><LoadingSpinner text="Initializing FitTrack..." /></div>;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 dark:bg-gray-900 font-inter">
      <nav className="md:w-64 bg-white dark:bg-gray-800 p-4 md:p-6 shadow-lg md:sticky md:top-0 md:h-screen flex flex-col">
        <div className="flex items-center mb-8"><Dumbbell className="w-10 h-10 text-blue-600 dark:text-blue-400 mr-3" /><h1 className="text-2xl font-bold text-gray-800 dark:text-white">FitTrack</h1></div>
        <ul className="space-y-3 flex-grow">
          <NavItem icon={<BarChart2 />} text="Dashboard" view="dashboard" currentView={currentView} setCurrentView={setCurrentView} />
          <NavItem icon={<TrendingUp />} text="Analytics" view="analytics" currentView={currentView} setCurrentView={setCurrentView} />
          <NavItem icon={<Brain />} text="Suggestions" view="suggestions" currentView={currentView} setCurrentView={setCurrentView} />
          <NavItem icon={<Clock />} text="Gains Tracker" view="dashboard" currentView={currentView} setCurrentView={() => {setCurrentView('dashboard'); setTimeout(() => document.getElementById('gains-tracker-section')?.scrollIntoView({behavior: 'smooth'}),0);}} />
          <NavItem icon={<UploadCloud />} text="Upload Data" view="upload" currentView={currentView} setCurrentView={setCurrentView} />
          <NavItem icon={<Settings />} text="Settings" view="settings" currentView={currentView} setCurrentView={setCurrentView} />
        </ul>
      </nav>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />}
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'analytics' && renderAnalytics()}
        {currentView === 'suggestions' && renderSuggestions()}
        {currentView === 'upload' && renderUpload()}
        {currentView === 'settings' && renderSettings()}
        {selectedWorkout && <WorkoutDetailModal workout={selectedWorkout} onClose={() => setSelectedWorkout(null)} personalRecords={personalRecords} />}
      </main>
    </div>
  );
};

const NavItem = ({ icon, text, view, currentView, setCurrentView }) => (<li><button onClick={() => setCurrentView(view)} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ease-in-out group ${currentView === view ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white'}`}>{React.cloneElement(icon, { className: `w-6 h-6 transition-colors group-hover:text-${currentView === view ? 'white' : 'blue-500 dark:group-hover:text-blue-400'}` })}<span className="text-base font-medium">{text}</span></button></li>);
const StatCard = ({ title, value, icon }) => (<div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 transform hover:scale-105 transition-transform duration-200"><div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">{icon}</div><div><p className="text-sm text-gray-500 dark:text-gray-400">{title}</p><p className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{value}</p></div></div>);
const ChartCard = ({ title, children, id }) => (<div id={id} className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg"><h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">{title}</h3>{children}</div>);
const Alert = ({ type, message, onClose }) => { const S = { e: "bg-red-100 dark:bg-red-800 border-red-500 text-red-700 dark:text-red-200", s: "bg-green-100 dark:bg-green-800 border-green-500 text-green-700 dark:text-green-200", i: "bg-blue-100 dark:bg-blue-800 border-blue-500 text-blue-700 dark:text-blue-200" }; const Icon = type === 'error' ? AlertTriangle : type === 'success' ? CheckCircle : Info; return (<div className={`p-4 mb-4 rounded-lg flex items-start space-x-3 shadow-md border-l-4 ${S[type[0]]}`} role="alert"><Icon className={`w-6 h-6 shrink-0 ${type[0]==='e'?'text-red-500':type[0]==='s'?'text-green-500':'text-blue-500'}`} /><div className="grow"><p className="font-medium">{type[0].toUpperCase()+type.slice(1)}</p><p className="text-sm">{message}</p></div>{onClose && <button onClick={onClose} className={`ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg focus:ring-2 inline-flex h-8 w-8 ${type[0]==='e'?'hover:bg-red-200 dark:hover:bg-red-700 focus:ring-red-400':type[0]==='s'?'hover:bg-green-200 dark:hover:bg-green-700 focus:ring-green-400':'hover:bg-blue-200 dark:hover:bg-blue-700 focus:ring-blue-400'}`}><span className="sr-only">Dismiss</span><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg></button>}</div>);};
const LoadingSpinner = ({ text }) => (<div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300"><svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{text && <span className="text-sm">{text}</span>}</div>);
const WorkoutItem = ({ workout, onSelect, personalRecords }) => { const [isExpanded, setIsExpanded] = useState(false); const workoutPRs = useMemo(() => { const prsInWorkout = []; if (!personalRecords) return prsInWorkout; workout.exercises.forEach(ex => ex.sets.forEach(set => { if (set.e1RM > 0 && personalRecords[ex.exerciseName]?.maxE1RM?.value === set.e1RM && formatDate(new Date(personalRecords[ex.exerciseName].maxE1RM.date), 'YYYY-MM-DD') === formatDate(workout.workoutTimestamp || workout.originalCsvDate, 'YYYY-MM-DD')) { if (!prsInWorkout.find(p => p.exerciseName === ex.exerciseName && p.type === 'e1RM')) prsInWorkout.push({ exerciseName: ex.exerciseName, type: 'e1RM', value: `${set.e1RM.toFixed(1)} lbs (${set.weight}x${set.reps})` }); } const repKey = `${set.reps}RM_weight_lbs`; if (personalRecords[ex.exerciseName]?.[repKey]?.value === set.weight && formatDate(new Date(personalRecords[ex.exerciseName]?.[repKey]?.date), 'YYYY-MM-DD') === formatDate(workout.workoutTimestamp || workout.originalCsvDate, 'YYYY-MM-DD')) { if (!prsInWorkout.find(p => p.exerciseName === ex.exerciseName && p.type === `${set.reps}RM`)) prsInWorkout.push({ exerciseName: ex.exerciseName, type: `${set.reps}RM`, value: `${set.weight} lbs` }); } })); return prsInWorkout; }, [workout, personalRecords]); return (<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200"><div className="flex justify-between items-start"><div className="flex-grow cursor-pointer" onClick={() => onSelect(workout)}><h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400">{workout.workoutName}</h4><p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(workout.workoutTimestamp || workout.originalCsvDate, 'Month DD, YYYY')} - {formatDuration(workout.durationSeconds)}</p>{workoutPRs.length > 0 && <div className="mt-1">{workoutPRs.slice(0,2).map(pr => <span key={`${pr.exerciseName}-${pr.type}`} className="inline-block bg-yellow-100 dark:bg-yellow-700 text-yellow-700 dark:text-yellow-200 text-xs font-semibold mr-2 px-2 py-0.5 rounded">PR: {pr.exerciseName} ({pr.type}) {pr.value}</span>)}{workoutPRs.length > 2 && <span className="text-xs text-yellow-600 dark:text-yellow-400"> +{workoutPRs.length - 2} more PRs</span>}</div>}</div><button onClick={() => setIsExpanded(!isExpanded)} className="text-sm text-blue-500 hover:underline mt-1 flex items-center shrink-0 ml-2" aria-label={isExpanded ? 'Hide exercises' : 'Show exercises'}>{isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</button></div>{isExpanded && <div className="mt-3 pl-1"><ul className="space-y-1 text-gray-600 dark:text-gray-300">{workout.exercises.map((ex, index) => <li key={index} className="text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md"><span className="font-medium">{ex.exerciseName}</span> ({ex.muscleGroup}) - {ex.sets.length} sets. Max Wt: {ex.maxWeightForExercise} lbs, Max e1RM: {ex.maxE1RMForExercise.toFixed(1)} lbs</li>)}</ul></div>}</div>);};
const WorkoutDetailModal = ({ workout, onClose, personalRecords }) => { if (!workout) return null; return (<div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"><div className="flex justify-between items-center mb-4"><h3 className="text-2xl font-semibold text-blue-700 dark:text-blue-300">{workout.workoutName}</h3><button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div><div className="mb-4 text-sm text-gray-600 dark:text-gray-400 grid grid-cols-2 gap-x-4"><p><strong>Date:</strong> {formatDate(workout.workoutTimestamp || workout.originalCsvDate, 'Month DD, YYYY HH:mm')}</p><p><strong>Duration:</strong> {formatDuration(workout.durationSeconds)}</p>{workout.rpe && <p><strong>RPE:</strong> {workout.rpe}</p>}{workout.fileName && <p className="col-span-2"><strong>Source File:</strong> {workout.fileName}</p>}{workout.workoutNotes && <p className="mt-2 col-span-2"><strong>Notes:</strong> {workout.workoutNotes}</p>}</div><div className="space-y-4">{workout.exercises.map((exercise, exIndex) => (<div key={exIndex} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50 dark:border-gray-700"><h4 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-1">{exercise.exerciseName} <span className="text-xs text-gray-500 dark:text-gray-400">({exercise.muscleGroup})</span></h4>{personalRecords && personalRecords[exercise.exerciseName] && <div className="mb-2 text-xs">{Object.entries(personalRecords[exercise.exerciseName]).map(([prKey, prData]) => { let prT = ''; if (prKey === 'maxE1RM') prT = `Max e1RM: ${prData.value.toFixed(1)} lbs (${prData.weightAtE1RM} lbs x ${prData.reps} on ${formatDate(new Date(prData.date), 'MM/DD/YY')})`; else if (prKey.endsWith('RM_weight_lbs')) prT = `${prKey.replace('_weight_lbs', '')}: ${prData.value} lbs on ${formatDate(new Date(prData.date), 'MM/DD/YY')}`; return prT ? <span key={prKey} className="inline-block bg-yellow-100 dark:bg-yellow-700 text-yellow-700 dark:text-yellow-200 mr-2 mb-1 px-1.5 py-0.5 rounded">{prT}</span> : null; })}</div>}<table className="w-full text-sm text-left text-gray-500 dark:text-gray-400"><thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-700"><tr><th scope="col" className="px-2 py-2">Set</th><th scope="col" className="px-2 py-2">Weight (lbs)</th><th scope="col" className="px-2 py-2">Reps</th><th scope="col" className="px-2 py-2">Volume (lbs)</th><th scope="col" className="px-2 py-2">e1RM (lbs)</th>{exercise.sets.some(s => s.distance > 0 || s.seconds > 0) && <th scope="col" className="px-2 py-2">Dist/Time</th>}<th scope="col" className="px-2 py-2">Notes</th></tr></thead><tbody>{exercise.sets.map((set, setIndex) => (<tr key={setIndex} className="bg-white dark:bg-gray-800 border-b dark:border-gray-600 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700"><td className="px-2 py-2">{set.setOrder}</td><td className="px-2 py-2">{set.weight > 0 ? `${set.weight}` : '-'}</td><td className="px-2 py-2">{set.reps > 0 ? set.reps : '-'}</td><td className="px-2 py-2">{set.volume > 0 ? set.volume.toFixed(1) : '-'}</td><td className="px-2 py-2">{set.e1RM > 0 ? set.e1RM.toFixed(1) : '-'}</td>{exercise.sets.some(s => s.distance > 0 || s.seconds > 0) && <td className="px-2 py-2">{set.distance > 0 ? `${set.distance} km` : ''}{set.distance > 0 && set.seconds > 0 ? ' / ' : ''}{set.seconds > 0 ? formatDuration(set.seconds) : ''}{set.distance === 0 && set.seconds === 0 ? '-' : ''}</td>}<td className="px-2 py-2 text-xs">{set.notes || '-'}</td></tr>))}</tbody></table><div className="mt-2 text-xs text-gray-500 dark:text-gray-400"><p>Total Volume: {exercise.totalVolumeForExercise.toFixed(1)} lbs | Max Weight: {exercise.maxWeightForExercise} lbs | Max Reps: {exercise.maxRepsForExercise} | Max e1RM (this workout): {exercise.maxE1RMForExercise.toFixed(1)} lbs</p></div></div>))}</div><button onClick={onClose} className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out">Close</button></div></div>);};

export default App;
