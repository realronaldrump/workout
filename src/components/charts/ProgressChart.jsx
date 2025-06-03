import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Area 
} from 'recharts';
import { formatDate } from '../../utils/dataProcessing';

/**
 * Chart component for visualizing workout progress over time
 */
const ProgressChart = ({ workouts, exerciseName = null }) => {
  const [chartData, setChartData] = useState([]);
  const [metric, setMetric] = useState('volume');
  
  // Generate chart data when workouts or selected exercise changes
  useEffect(() => {
    if (!workouts || workouts.length === 0) {
      setChartData([]);
      return;
    }
    
    // Sort workouts by date (oldest first)
    const sortedWorkouts = [...workouts].sort((a, b) => {
      const dateA = a.workoutTimestamp || new Date(a.originalCsvDate.replace(' ', 'T'));
      const dateB = b.workoutTimestamp || new Date(b.originalCsvDate.replace(' ', 'T'));
      return dateA - dateB;
    });
    
    // Take the most recent 15 workouts max (or all if less than 15)
    const recentWorkouts = sortedWorkouts.slice(-15);
    
    if (exerciseName) {
      // Generate data for a specific exercise
      const exerciseData = recentWorkouts
        .filter(workout => workout.exercises.some(ex => ex.exerciseName === exerciseName))
        .map(workout => {
          const exercise = workout.exercises.find(ex => ex.exerciseName === exerciseName);
          if (!exercise) return null;
          
          // Get max weight and e1RM from exercise
          const maxWeight = exercise.maxWeightForExercise || 0;
          const maxE1RM = exercise.maxE1RMForExercise || 0;
          
          // Calculate averages
          const setCount = exercise.sets.length;
          let totalWeight = 0;
          let totalReps = 0;
          
          exercise.sets.forEach(set => {
            totalWeight += set.weight;
            totalReps += set.reps;
          });
          
          const avgWeight = setCount > 0 ? totalWeight / setCount : 0;
          const avgReps = setCount > 0 ? totalReps / setCount : 0;
          
          return {
            date: formatDate(workout.workoutTimestamp || workout.originalCsvDate, 'MM/DD'),
            maxWeight,
            avgWeight: Math.round(avgWeight * 10) / 10,
            maxE1RM: Math.round(maxE1RM * 10) / 10,
            volume: exercise.totalVolumeForExercise,
            sets: setCount,
            avgReps: Math.round(avgReps * 10) / 10,
          };
        })
        .filter(Boolean);
      
      setChartData(exerciseData);
    } else {
      // Generate overall workout data
      const workoutData = recentWorkouts.map(workout => {
        // Calculate totals for this workout
        let totalVolume = 0;
        let totalSets = 0;
        let maxE1RMForWorkout = 0;
        
        workout.exercises.forEach(exercise => {
          totalVolume += exercise.totalVolumeForExercise || 0;
          totalSets += exercise.sets.length;
          
          // Track the highest e1RM in the workout
          if (exercise.maxE1RMForExercise > maxE1RMForWorkout) {
            maxE1RMForWorkout = exercise.maxE1RMForExercise;
          }
        });
        
        return {
          date: formatDate(workout.workoutTimestamp || workout.originalCsvDate, 'MM/DD'),
          volume: Math.round(totalVolume),
          exercises: workout.exercises.length,
          sets: totalSets,
          duration: workout.durationSeconds || 0,
          maxE1RM: Math.round(maxE1RMForWorkout * 10) / 10
        };
      });
      
      setChartData(workoutData);
    }
  }, [workouts, exerciseName]);

  // Handle empty data
  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>No data available to display</p>
      </div>
    );
  }

  // Chart configurations based on selected metric
  const chartConfig = {
    volume: {
      label: 'Volume (lbs)',
      color: '#60a5fa',
      dataKey: 'volume',
    },
    sets: {
      label: 'Sets',
      color: '#f472b6',
      dataKey: 'sets'
    },
    maxE1RM: {
      label: 'Max e1RM (lbs)',
      color: '#34d399',
      dataKey: 'maxE1RM'
    },
    exercises: {
      label: 'Exercises',
      color: '#a78bfa',
      dataKey: 'exercises'
    },
    duration: {
      label: 'Duration (min)',
      color: '#f59e0b',
      dataKey: 'duration',
      // Convert seconds to minutes for display
      valueFormatter: (value) => Math.round(value / 60)
    },
    maxWeight: {
      label: 'Max Weight (lbs)',
      color: '#ef4444',
      dataKey: 'maxWeight'
    }
  };

  // Get the currently selected metric config
  const currentMetric = chartConfig[metric];
  
  // Format for tooltip
  const formatTooltipValue = (value, name) => {
    if (name === 'duration') {
      return `${Math.round(value / 60)} min`;
    }
    return value;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Metric selector */}
      <div className="flex mb-2 overflow-x-auto pb-2 scrollbar-hide">
        {Object.keys(chartConfig).map(key => {
          // Only show metrics that exist in the data
          if (!chartData.some(item => item[key] !== undefined)) return null;
          
          return (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`px-3 py-1 text-xs rounded-full mr-2 whitespace-nowrap ${
                metric === key
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 font-medium'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {chartConfig[key].label}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              domain={['auto', 'auto']}
              tickFormatter={(value) => {
                // Format large numbers for better display
                if (currentMetric.valueFormatter) {
                  return currentMetric.valueFormatter(value);
                }
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(1)}k`;
                }
                return value;
              }}
            />
            <Tooltip 
              formatter={formatTooltipValue}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey={currentMetric.dataKey} 
              fill={`${currentMetric.color}20`}
              stroke={currentMetric.color} 
              strokeWidth={2}
              dot={{ r: 4, fill: currentMetric.color }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProgressChart; 