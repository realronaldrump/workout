import React, { useState } from 'react';
import { 
  Calendar, Dumbbell, ChevronDown, ChevronUp, 
  Brain, TrendingUp, Award, Clock 
} from 'lucide-react';
import { formatDate } from '../utils/dataProcessing';
import { MUSCLE_GROUPS } from '../config';

/**
 * Component to display AI-generated workout suggestions
 */
const WorkoutSuggestions = ({ suggestions, isLoading }) => {
  const [expandedWorkout, setExpandedWorkout] = useState(null);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="py-6 flex flex-col items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mb-2"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Generating suggestions...</p>
      </div>
    );
  }
  
  // No suggestions yet
  if (!suggestions) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <Brain className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2" />
        <p className="text-sm text-center text-gray-500 dark:text-gray-400">
          AI workout suggestions will appear here
        </p>
      </div>
    );
  }
  
  // Error state
  if (suggestions.error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
        <p className="text-sm text-red-800 dark:text-red-300">{suggestions.error}</p>
      </div>
    );
  }
  
  // No suggested workouts
  if (!suggestions.suggestedWorkouts || suggestions.suggestedWorkouts.length === 0) {
    return (
      <div className="py-4">
        <div className="flex items-center mb-3">
          <Calendar className="w-4 h-4 text-blue-500 mr-2" />
          <span className="text-sm font-medium">
            Next workout: {formatDate(suggestions.nextWorkoutDate, 'Month DD, YYYY')}
          </span>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            No specific workout suggestions available yet. 
            Try importing more workout data for better recommendations.
          </p>
        </div>
        
        {/* Show ready muscle groups if available */}
        {suggestions.readyMuscleGroups && suggestions.readyMuscleGroups.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Ready to train:
            </h4>
            <div className="flex flex-wrap gap-1">
              {suggestions.readyMuscleGroups.map(muscle => (
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
          </div>
        )}
      </div>
    );
  }
  
  // Display suggested workouts
  return (
    <div className="space-y-4">
      {/* Next workout date */}
      <div className="flex items-center">
        <Calendar className="w-4 h-4 text-blue-500 mr-2" />
        <span className="text-sm font-medium">
          Next workout: {formatDate(suggestions.nextWorkoutDate, 'Month DD, YYYY')}
        </span>
      </div>
      
      {/* Workout suggestions */}
      {suggestions.suggestedWorkouts.map((workout, index) => (
        <div 
          key={index}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-300">
                {workout.name}
              </h3>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                <Clock className="w-3 h-3 mr-1" />
                <span>Est. {workout.estimatedDuration}</span>
                <span className="mx-1">•</span>
                <span>{workout.focus}</span>
              </div>
            </div>
            <button
              onClick={() => setExpandedWorkout(expandedWorkout === index ? null : index)}
              className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-full"
            >
              {expandedWorkout === index ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* Muscle groups */}
          <div className="flex flex-wrap gap-1 mt-2">
            {workout.muscleGroups.map(muscle => (
              <span 
                key={muscle}
                className="inline-block px-2 py-0.5 rounded-full text-xs"
                style={{ 
                  backgroundColor: `${MUSCLE_GROUPS[muscle]?.color}20` || '#94a3b820',
                  color: MUSCLE_GROUPS[muscle]?.color || '#94a3b8'
                }}
              >
                {muscle}
              </span>
            ))}
          </div>
          
          {/* Expanded exercise details */}
          {expandedWorkout === index && (
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
              <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Suggested Exercises:
              </h4>
              <ul className="space-y-2">
                {workout.exercises.map((exercise, exIndex) => (
                  <li 
                    key={exIndex}
                    className="text-sm bg-white dark:bg-gray-800/50 rounded p-2"
                  >
                    <div className="flex justify-between">
                      <div className="font-medium">{exercise.exercise}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {exercise.muscleGroup}
                      </div>
                    </div>
                    <div className="flex items-center mt-1 text-xs text-gray-600 dark:text-gray-400">
                      <Dumbbell className="w-3 h-3 mr-1" />
                      <span>
                        {exercise.sets} sets × {exercise.suggestedReps} reps @ {exercise.suggestedWeight} lbs
                      </span>
                    </div>
                    {exercise.notes && (
                      <div className="mt-1 text-xs italic text-gray-500 dark:text-gray-400">
                        {exercise.notes}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
      
      {/* PR opportunities */}
      {suggestions.prOpportunities && suggestions.prOpportunities.length > 0 && (
        <div className="mt-2">
          <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center">
            <Award className="w-3 h-3 text-yellow-500 mr-1" />
            PR Opportunities:
          </h4>
          <ul className="space-y-1">
            {suggestions.prOpportunities.slice(0, 2).map((pr, i) => (
              <li 
                key={i}
                className="text-xs flex justify-between bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded"
              >
                <span className="text-gray-800 dark:text-gray-200">
                  {pr.exercise} 
                  <span className="text-gray-500 dark:text-gray-400 ml-1">
                    ({pr.muscleGroup})
                  </span>
                </span>
                <span className="font-medium text-yellow-800 dark:text-yellow-300 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Try {pr.suggestedWeight} lbs × {pr.suggestedReps}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WorkoutSuggestions; 