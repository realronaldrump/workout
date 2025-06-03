import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Award, Clock, Dumbbell } from 'lucide-react';
import { formatDate, formatDuration } from '../utils/dataProcessing';
import { MUSCLE_GROUPS } from '../config';

/**
 * Component for displaying a list of workouts
 */
const WorkoutList = ({ workouts, onSelect, personalRecords, compact = false, searchTerm = '' }) => {
  // No workouts to display
  if (!workouts || workouts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No workouts to display</p>
      </div>
    );
  }

  // Filter workouts if search term is provided
  const filteredWorkouts = searchTerm 
    ? workouts.filter(workout => 
        workout.workoutName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workout.exercises.some(ex => ex.exerciseName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : workouts;
  
  if (filteredWorkouts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No workouts match your search</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredWorkouts.map(workout => (
        <WorkoutItem 
          key={workout.id || workout.originalCsvDate + workout.workoutName} 
          workout={workout} 
          onSelect={onSelect} 
          personalRecords={personalRecords}
          compact={compact}
        />
      ))}
    </div>
  );
};

/**
 * Individual workout item component
 */
const WorkoutItem = ({ workout, onSelect, personalRecords, compact }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Find any personal records set in this workout
  const workoutPRs = React.useMemo(() => {
    const prsInWorkout = [];
    
    if (!personalRecords) return prsInWorkout;
    
    const workoutDate = formatDate(
      workout.workoutTimestamp || workout.originalCsvDate, 
      'YYYY-MM-DD'
    );
    
    workout.exercises.forEach(ex => {
      // Check for PR by e1RM
      const e1RMRecord = personalRecords[ex.exerciseName]?.maxE1RM;
      if (e1RMRecord && e1RMRecord.date) {
        const prDate = formatDate(new Date(e1RMRecord.date), 'YYYY-MM-DD');
        
        if (prDate === workoutDate && !prsInWorkout.find(p => p.exerciseName === ex.exerciseName && p.type === 'e1RM')) {
          prsInWorkout.push({ 
            exerciseName: ex.exerciseName, 
            type: 'e1RM', 
            value: `${e1RMRecord.value.toFixed(1)} lbs` 
          });
        }
      }
      
      // Check for weight PRs
      const weightRecord = personalRecords[ex.exerciseName]?.maxWeight;
      if (weightRecord && weightRecord.date) {
        const prDate = formatDate(new Date(weightRecord.date), 'YYYY-MM-DD');
        
        if (prDate === workoutDate && !prsInWorkout.find(p => p.exerciseName === ex.exerciseName && p.type === 'weight')) {
          prsInWorkout.push({ 
            exerciseName: ex.exerciseName, 
            type: 'weight', 
            value: `${weightRecord.value} lbs` 
          });
        }
      }
    });
    
    return prsInWorkout;
  }, [workout, personalRecords]);

  // Calculate total workout volume
  const totalVolume = workout.exercises.reduce(
    (sum, ex) => sum + ex.totalVolumeForExercise, 
    0
  );
  
  // Get unique muscle groups worked
  const muscleGroups = [...new Set(workout.exercises.map(ex => ex.muscleGroup))];
  
  return (
    <div className={`
      bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700
      hover:shadow-md transition-shadow duration-200
      ${compact ? 'p-3' : 'p-4'}
    `}>
      <div className="flex justify-between items-start">
        {/* Main workout info section (clickable to view details) */}
        <div 
          className="flex-grow cursor-pointer" 
          onClick={() => onSelect(workout)}
        >
          <div className="flex items-center">
            <h3 className={`font-semibold text-gray-800 dark:text-white ${compact ? 'text-base' : 'text-lg'}`}>
              {workout.workoutName}
            </h3>
            
            {/* Volume badge */}
            <div className="ml-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Dumbbell className="w-3 h-3 mr-1" />
              <span>{Math.round(totalVolume).toLocaleString()} lbs</span>
            </div>
          </div>
          
          {/* Date and duration */}
          <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span>{formatDate(workout.workoutTimestamp || workout.originalCsvDate, 'Month DD, YYYY')}</span>
            <span className="mx-2">•</span>
            <Clock className="w-3 h-3 mr-1" />
            <span>{formatDuration(workout.durationSeconds)}</span>
          </div>
          
          {/* PRs achieved in this workout */}
          {workoutPRs.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {workoutPRs.slice(0, compact ? 1 : 3).map(pr => (
                <span 
                  key={`${pr.exerciseName}-${pr.type}`} 
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                >
                  <Award className="w-3 h-3 mr-1" />
                  {pr.exerciseName} {pr.value}
                </span>
              ))}
              {workoutPRs.length > (compact ? 1 : 3) && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                  +{workoutPRs.length - (compact ? 1 : 3)} more
                </span>
              )}
            </div>
          )}
          
          {/* Muscle groups worked - only show in expanded or non-compact view */}
          {(!compact || isExpanded) && muscleGroups.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {muscleGroups.map(muscle => (
                <span 
                  key={muscle}
                  className="inline-block px-2 py-1 rounded-full text-xs"
                  style={{ 
                    backgroundColor: `${MUSCLE_GROUPS[muscle]?.color}20` || '#94a3b820',
                    color: MUSCLE_GROUPS[muscle]?.color || '#94a3b8'
                  }}
                >
                  {muscle}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Expand/collapse button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label={isExpanded ? 'Collapse workout details' : 'Expand workout details'}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {/* Expanded exercises list */}
      {isExpanded && (
        <div className="mt-4 pl-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Exercises ({workout.exercises.length})
          </h4>
          <ul className="space-y-2 text-sm">
            {workout.exercises.map((exercise, index) => (
              <li 
                key={index} 
                className="py-1 px-2 bg-gray-50 dark:bg-gray-700/50 rounded flex justify-between items-center"
              >
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {exercise.exerciseName}
                  </span>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    {exercise.sets.length} sets
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Max: {exercise.maxWeightForExercise} lbs
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WorkoutList; 