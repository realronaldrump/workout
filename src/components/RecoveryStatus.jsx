import React from 'react';
import { Battery, BatteryFull, BatteryMedium, BatteryLow, BatteryWarning } from 'lucide-react';
import { formatDate } from '../utils/dataProcessing';
import { MUSCLE_GROUPS } from '../config';

/**
 * Component to display muscle recovery status
 */
const RecoveryStatus = ({ muscleRecovery }) => {
  // If no data, show placeholder
  if (!muscleRecovery || Object.keys(muscleRecovery).length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
        No recovery data available
      </div>
    );
  }
  
  // Sort muscles by recovery percentage (lowest first)
  const sortedMuscles = Object.entries(muscleRecovery)
    .map(([muscle, data]) => ({
      name: muscle,
      ...data
    }))
    .sort((a, b) => a.recoveryPercentage - b.recoveryPercentage);
  
  return (
    <div className="space-y-3">
      {sortedMuscles.map(muscle => (
        <MuscleRecoveryItem key={muscle.name} muscle={muscle} />
      ))}
    </div>
  );
};

/**
 * Individual muscle recovery item
 */
const MuscleRecoveryItem = ({ muscle }) => {
  const { name, recoveryPercentage, readiness, lastTrainedDate, exercises } = muscle;
  
  // Determine recovery color and icon based on percentage
  const getRecoveryDetails = () => {
    if (recoveryPercentage >= 95) {
      return {
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        textColor: 'text-green-800 dark:text-green-300',
        icon: <BatteryFull className="w-4 h-4" />,
        status: 'Fully Recovered'
      };
    } else if (recoveryPercentage >= 70) {
      return {
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        textColor: 'text-blue-800 dark:text-blue-300',
        icon: <BatteryMedium className="w-4 h-4" />,
        status: 'Moderately Recovered'
      };
    } else if (recoveryPercentage >= 40) {
      return {
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        textColor: 'text-yellow-800 dark:text-yellow-300',
        icon: <BatteryLow className="w-4 h-4" />,
        status: 'Partially Recovered'
      };
    } else {
      return {
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        textColor: 'text-red-800 dark:text-red-300',
        icon: <BatteryWarning className="w-4 h-4" />,
        status: 'Needs Rest'
      };
    }
  };
  
  const recovery = getRecoveryDetails();
  const muscleColor = MUSCLE_GROUPS[name]?.color || '#94a3b8';
  
  return (
    <div className={`rounded-lg p-3 ${recovery.bgColor}`}>
      <div className="flex justify-between">
        <div className="flex items-center">
          <div 
            className="w-3 h-3 rounded-full mr-2" 
            style={{ backgroundColor: muscleColor }}
          ></div>
          <h3 className="text-sm font-medium">{name}</h3>
        </div>
        <div className={`text-xs font-medium flex items-center ${recovery.color}`}>
          {recovery.icon}
          <span className="ml-1">{recovery.status}</span>
        </div>
      </div>
      
      <div className="mt-2">
        <div className="relative pt-1">
          <div className="overflow-hidden h-1.5 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
            <div 
              className="transition-all duration-500 ease-out"
              style={{ 
                width: `${recoveryPercentage}%`,
                backgroundColor: muscleColor 
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
            <span>{Math.round(recoveryPercentage)}% recovered</span>
            {lastTrainedDate && (
              <span>Last trained: {formatDate(lastTrainedDate, 'MM/DD')}</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Display recent exercises for this muscle group */}
      {exercises && exercises.length > 0 && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          <span>Recent exercises: </span>
          <span className="italic">
            {exercises.slice(0, 2).join(', ')}
            {exercises.length > 2 && ` + ${exercises.length - 2} more`}
          </span>
        </div>
      )}
    </div>
  );
};

export default RecoveryStatus; 