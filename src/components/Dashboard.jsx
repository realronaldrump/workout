import React from 'react';
import { 
  BarChart2, Award, Calendar, Dumbbell, TrendingUp, 
  Clock, Activity, Zap, Fire, Heart 
} from 'lucide-react';
import { formatDuration } from '../utils/dataProcessing';
import { MUSCLE_GROUPS } from '../config';
import OverviewCard from './cards/OverviewCard';
import WorkoutList from './WorkoutList';
import ProgressChart from './charts/ProgressChart';
import HeatMapCalendar from './charts/HeatMapCalendar';
import MuscleGroupChart from './charts/MuscleGroupChart';
import RecoveryStatus from './RecoveryStatus';
import WorkoutSuggestions from './WorkoutSuggestions';

/**
 * Dashboard component that displays an overview of workout data and metrics
 */
const Dashboard = ({
  workouts,
  personalRecords,
  overallStats,
  setSelectedWorkout,
  setCurrentView,
  muscleRecovery,
  workoutFrequency,
  workoutStreak,
  workoutSuggestions,
  handleGenerateSuggestions,
  isGeneratingSuggestions
}) => {
  // Filter for recent workouts (last 5)
  const recentWorkouts = [...workouts]
    .sort((a, b) => {
      const dateA = a.workoutTimestamp || new Date(a.originalCsvDate.replace(' ', 'T'));
      const dateB = b.workoutTimestamp || new Date(b.originalCsvDate.replace(' ', 'T'));
      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-8">
      {/* Main Stats Overview */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewCard
          title="Total Workouts"
          value={overallStats.totalWorkouts}
          icon={<Calendar className="w-8 h-8 text-blue-500" />}
          trend={workouts.length > 3 ? '+3 this month' : undefined}
          onClick={() => setCurrentView('workouts')}
        />
        <OverviewCard
          title="Current Streak"
          value={`${workoutStreak.current} ${workoutStreak.current === 1 ? 'day' : 'days'}`}
          icon={<Fire className="w-8 h-8 text-orange-500" />}
          badge={workoutStreak.longest > workoutStreak.current ? `Best: ${workoutStreak.longest}` : 'Personal Best'}
        />
        <OverviewCard
          title="Total Volume"
          value={`${(overallStats.totalVolume / 1000).toFixed(1)}k lbs`}
          icon={<Dumbbell className="w-8 h-8 text-purple-500" />}
          trend={overallStats.totalWorkouts > 0 ? `${overallStats.avgVolumePerWorkout.toLocaleString()} lbs / workout` : undefined}
        />
        <OverviewCard
          title="Total Duration"
          value={formatDuration(overallStats.totalDuration)}
          icon={<Clock className="w-8 h-8 text-green-500" />}
          trend={overallStats.totalWorkouts > 0 ? `${formatDuration(overallStats.avgWorkoutDuration)} avg` : undefined}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recovery and Workout Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Progress Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Progress</h2>
              <button 
                onClick={() => setCurrentView('analytics')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All
              </button>
            </div>
            <div className="h-64">
              <ProgressChart workouts={workouts} />
            </div>
          </div>

          {/* Heat Map Calendar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Workout Activity</h2>
            </div>
            <HeatMapCalendar workoutFrequency={workoutFrequency} />
          </div>

          {/* Recent Workouts */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Workouts</h2>
              <button 
                onClick={() => setCurrentView('workouts')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All
              </button>
            </div>
            <WorkoutList 
              workouts={recentWorkouts} 
              onSelect={setSelectedWorkout} 
              personalRecords={personalRecords}
              compact={true}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Recovery Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Recovery Status</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                Live
              </span>
            </div>
            <RecoveryStatus muscleRecovery={muscleRecovery} />
          </div>

          {/* Muscle Group Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Muscle Group Focus</h2>
            <MuscleGroupChart distribution={overallStats.muscleGroupDistribution} />
            
            <div className="mt-4 space-y-2">
              {overallStats.muscleGroupDistribution.slice(0, 4).map(group => (
                <div key={group.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: MUSCLE_GROUPS[group.name]?.color || '#94a3b8' }}
                    ></span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{group.name}</span>
                  </div>
                  <span className="text-sm font-medium">{group.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Workout Suggestions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Workout Suggestions</h2>
              <button 
                onClick={handleGenerateSuggestions}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                disabled={isGeneratingSuggestions}
              >
                {isGeneratingSuggestions ? 'Generating...' : 'Refresh'}
              </button>
            </div>
            <WorkoutSuggestions 
              suggestions={workoutSuggestions} 
              isLoading={isGeneratingSuggestions}
            />
          </div>

          {/* Personal Records Highlight */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Personal Records</h2>
              <button 
                onClick={() => setCurrentView('analytics')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {Object.entries(personalRecords).slice(0, 3).map(([exercise, records]) => (
                <div key={exercise} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                  <div className="flex items-center">
                    <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">{exercise}</h3>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    <p>Max Weight: <span className="font-semibold">{records.maxWeight?.value || 0} lbs</span></p>
                    <p>e1RM: <span className="font-semibold">{records.maxE1RM?.value.toFixed(1) || 0} lbs</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 