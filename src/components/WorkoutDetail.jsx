import React, { useMemo } from 'react';
import { 
  X, Award, Calendar, Clock, FileText, 
  ArrowUpRight, ArrowDownRight, Minus,
  BarChart2, Dumbbell, Tag
} from 'lucide-react';
import { formatDate, formatDuration } from '../utils/dataProcessing';
import { MUSCLE_GROUPS } from '../config';

/**
 * Modal to display detailed workout information
 */
const WorkoutDetail = ({ workout, onClose, personalRecords }) => {
  if (!workout) return null;
  
  // Find PRs for this workout
  const workoutPRs = useMemo(() => {
    const prsInWorkout = [];
    
    if (!personalRecords) return prsInWorkout;
    
    const workoutDate = formatDate(
      workout.workoutTimestamp || workout.originalCsvDate, 
      'YYYY-MM-DD'
    );
    
    workout.exercises.forEach(ex => {
      // Check for E1RM PR
      const e1RMRecord = personalRecords[ex.exerciseName]?.maxE1RM;
      if (e1RMRecord && e1RMRecord.date) {
        const prDate = formatDate(new Date(e1RMRecord.date), 'YYYY-MM-DD');
        
        if (prDate === workoutDate) {
          prsInWorkout.push({ 
            exerciseName: ex.exerciseName, 
            type: 'Max E1RM', 
            value: `${e1RMRecord.value.toFixed(1)} lbs (${e1RMRecord.weightAtE1RM} × ${e1RMRecord.reps})` 
          });
        }
      }
      
      // Check for weight PR
      const weightRecord = personalRecords[ex.exerciseName]?.maxWeight;
      if (weightRecord && weightRecord.date) {
        const prDate = formatDate(new Date(weightRecord.date), 'YYYY-MM-DD');
        
        if (prDate === workoutDate) {
          prsInWorkout.push({ 
            exerciseName: ex.exerciseName, 
            type: 'Max Weight', 
            value: `${weightRecord.value} lbs (${weightRecord.reps} reps)` 
          });
        }
      }
      
      // Check for volume PR
      const volumeRecord = personalRecords[ex.exerciseName]?.maxVolume;
      if (volumeRecord && volumeRecord.date) {
        const prDate = formatDate(new Date(volumeRecord.date), 'YYYY-MM-DD');
        
        if (prDate === workoutDate) {
          prsInWorkout.push({ 
            exerciseName: ex.exerciseName, 
            type: 'Max Volume', 
            value: `${volumeRecord.value.toFixed(0)} lbs (${volumeRecord.sets} sets)` 
          });
        }
      }
      
      // Check for rep PRs
      const repRecord = personalRecords[ex.exerciseName]?.maxReps;
      if (repRecord && repRecord.date) {
        const prDate = formatDate(new Date(repRecord.date), 'YYYY-MM-DD');
        
        if (prDate === workoutDate) {
          prsInWorkout.push({ 
            exerciseName: ex.exerciseName, 
            type: 'Max Reps', 
            value: `${repRecord.value} reps (${repRecord.weight} lbs)` 
          });
        }
      }
    });
    
    return prsInWorkout;
  }, [workout, personalRecords]);
  
  // Calculate total workout volume
  const totalWorkoutVolume = useMemo(() => {
    return workout.exercises.reduce((sum, ex) => sum + ex.totalVolumeForExercise, 0);
  }, [workout]);
  
  // Get unique muscle groups
  const muscleGroups = useMemo(() => {
    return [...new Set(workout.exercises.map(ex => ex.muscleGroup))];
  }, [workout]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {workout.workoutName}
            </h2>
            <div className="flex items-center mt-1 text-gray-600 dark:text-gray-300">
              <Calendar className="w-4 h-4 mr-1" />
              <span className="mr-3">
                {formatDate(workout.workoutTimestamp || workout.originalCsvDate, 'Month DD, YYYY')}
              </span>
              <Clock className="w-4 h-4 mr-1" />
              <span>{formatDuration(workout.durationSeconds)}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Modal content - scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase">
                Total Volume
              </h3>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {Math.round(totalWorkoutVolume).toLocaleString()} lbs
              </p>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h3 className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase">
                Exercises
              </h3>
              <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                {workout.exercises.length}
              </p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h3 className="text-xs font-medium text-green-700 dark:text-green-300 uppercase">
                Total Sets
              </h3>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                {workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)}
              </p>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <h3 className="text-xs font-medium text-orange-700 dark:text-orange-300 uppercase">
                Muscle Groups
              </h3>
              <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                {muscleGroups.length}
              </p>
            </div>
          </div>
          
          {/* Workout notes if available */}
          {workout.workoutNotes && (
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Workout Notes
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-line">
                {workout.workoutNotes}
              </p>
            </div>
          )}
          
          {/* PRs achieved in this workout */}
          {workoutPRs.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-3">
                <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Personal Records Set
                </h3>
              </div>
              <div className="space-y-2">
                {workoutPRs.map((pr, index) => (
                  <div 
                    key={index}
                    className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 rounded p-2"
                  >
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      {pr.exerciseName}
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        {pr.type}
                      </span>
                    </div>
                    <div className="text-yellow-600 dark:text-yellow-400">
                      {pr.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Muscle group tags */}
          {muscleGroups.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <Tag className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Muscle Groups
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {muscleGroups.map(muscle => (
                  <span 
                    key={muscle}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: `${MUSCLE_GROUPS[muscle]?.color}15` || '#94a3b815',
                      color: MUSCLE_GROUPS[muscle]?.color || '#94a3b8'
                    }}
                  >
                    {muscle}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Exercises List */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
              <Dumbbell className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-300" />
              Exercises
            </h3>
            
            {workout.exercises.map((exercise, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white">
                        {exercise.exerciseName}
                      </h4>
                      <div className="flex items-center mt-1">
                        <span 
                          className="inline-block w-3 h-3 rounded-full mr-2"
                          style={{ 
                            backgroundColor: MUSCLE_GROUPS[exercise.muscleGroup]?.color || '#94a3b8'
                          }}
                        ></span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {exercise.muscleGroup}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {exercise.sets.length} sets
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round(exercise.totalVolumeForExercise).toLocaleString()} lbs total
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Sets table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Set
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Weight
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Reps
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          e1RM
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Volume
                        </th>
                        {exercise.sets.some(s => s.distance > 0 || s.seconds > 0) && (
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Dist/Time
                          </th>
                        )}
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                      {exercise.sets.map((set, setIndex) => {
                        // Find if this set has a PR
                        const isPR = workoutPRs.some(pr => 
                          pr.exerciseName === exercise.exerciseName && 
                          ((pr.type === 'Max E1RM' && set.e1RM === exercise.maxE1RMForExercise) ||
                           (pr.type === 'Max Weight' && set.weight === exercise.maxWeightForExercise) ||
                           (pr.type === 'Max Reps' && set.reps === exercise.maxRepsForExercise))
                        );
                        
                        return (
                          <tr 
                            key={setIndex}
                            className={`${isPR ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                              {set.setOrder}
                              {isPR && (
                                <Award className="w-4 h-4 text-yellow-500 inline ml-1" />
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                              {set.weight > 0 ? `${set.weight} lbs` : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                              {set.reps > 0 ? set.reps : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                              {set.e1RM > 0 ? `${set.e1RM.toFixed(1)} lbs` : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                              {set.volume > 0 ? `${Math.round(set.volume)} lbs` : '-'}
                            </td>
                            {exercise.sets.some(s => s.distance > 0 || s.seconds > 0) && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                {set.distance > 0 ? `${set.distance} km` : ''}
                                {set.distance > 0 && set.seconds > 0 ? ' / ' : ''}
                                {set.seconds > 0 ? formatDuration(set.seconds) : ''}
                                {set.distance === 0 && set.seconds === 0 ? '-' : ''}
                              </td>
                            )}
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                              {set.notes || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Exercise stats footer */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 text-xs flex flex-wrap gap-x-4 gap-y-1">
                  <div className="flex items-center">
                    <BarChart2 className="w-3 h-3 text-gray-500 dark:text-gray-400 mr-1" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Max Weight: {exercise.maxWeightForExercise} lbs
                    </span>
                  </div>
                  <div className="flex items-center">
                    <ArrowUpRight className="w-3 h-3 text-gray-500 dark:text-gray-400 mr-1" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Max e1RM: {exercise.maxE1RMForExercise.toFixed(1)} lbs
                    </span>
                  </div>
                  <div className="flex items-center">
                    <ArrowDownRight className="w-3 h-3 text-gray-500 dark:text-gray-400 mr-1" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Max Reps: {exercise.maxRepsForExercise}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Modal footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="w-full bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-medium py-2.5 px-4 rounded-lg transition duration-150 ease-in-out"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutDetail; 