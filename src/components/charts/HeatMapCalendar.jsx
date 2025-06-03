import React, { useState } from 'react';
import { formatDate } from '../../utils/dataProcessing';

/**
 * GitHub-style heat map calendar to visualize workout frequency
 */
const HeatMapCalendar = ({ workoutFrequency }) => {
  const [hoveredDay, setHoveredDay] = useState(null);
  
  // If no data, show placeholder
  if (!workoutFrequency || workoutFrequency.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
        No workout data available
      </div>
    );
  }
  
  // Get current date to calculate month positions
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Generate month labels (last 6 months)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const month = new Date(currentYear, currentMonth - i, 1);
    months.push({
      name: month.toLocaleDateString('en-US', { month: 'short' }),
      year: month.getFullYear(),
      position: 5 - i
    });
  }
  
  // Generate the last 26 weeks (half a year) of dates
  const generateCalendarData = () => {
    const weeks = [];
    const dayMilliseconds = 24 * 60 * 60 * 1000;
    
    // Start 26 weeks ago
    const startDate = new Date();
    startDate.setDate(today.getDate() - (26 * 7));
    
    // Create lookup map for fast access to workout data
    const workoutMap = {};
    workoutFrequency.forEach(day => {
      workoutMap[day.date] = day;
    });
    
    // Generate weeks
    for (let weekIndex = 0; weekIndex < 26; weekIndex++) {
      const week = [];
      
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = new Date(startDate.getTime() + ((weekIndex * 7 + dayIndex) * dayMilliseconds));
        const dateStr = formatDate(date, 'YYYY-MM-DD');
        
        // Check if this date has workout data
        const workoutData = workoutMap[dateStr] || { count: 0, level: 0, volume: 0, workouts: [] };
        
        week.push({
          date: dateStr,
          count: workoutData.count,
          level: workoutData.level,
          display: date.getDate(),
          month: date.getMonth(),
          workouts: workoutData.workouts,
          volume: workoutData.volume
        });
      }
      
      weeks.push(week);
    }
    
    return weeks;
  };
  
  const calendarData = generateCalendarData();
  
  // Day of week labels
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="overflow-x-auto pb-2">
      <div className="min-w-[840px]">
        {/* Month labels */}
        <div className="flex ml-9 mb-1">
          {months.map((month, i) => (
            <div 
              key={i}
              className="text-xs text-gray-500 dark:text-gray-400"
              style={{ 
                width: `${(month.position === 5 ? 1 : 4.33) * 16}%`,
                marginLeft: i === 0 ? '0' : '-8px' 
              }}
            >
              {month.name}
              {month.year !== currentYear && ` ${month.year}`}
            </div>
          ))}
        </div>
        
        <div className="flex">
          {/* Day of week labels */}
          <div className="flex flex-col justify-around mr-2 text-xs text-gray-500 dark:text-gray-400">
            {dayLabels.filter((_, i) => i % 2 === 0).map((day, i) => (
              <div key={i} className="h-4">{day}</div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="flex-grow">
            <div className="flex">
              {calendarData.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col">
                  {week.map((day, dayIndex) => (
                    <div 
                      key={`${weekIndex}-${dayIndex}`}
                      className={`
                        m-1 w-4 h-4 rounded-sm relative 
                        heat-${day.level} 
                        cursor-pointer
                        hover:scale-110 transition-transform duration-100
                      `}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {/* Tooltip */}
                      {hoveredDay && hoveredDay.date === day.date && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
                          <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg min-w-max">
                            <div className="font-medium">
                              {new Date(day.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            <div>
                              {day.count > 0 
                                ? `${day.count} workout${day.count > 1 ? 's' : ''}`
                                : 'No workouts'
                              }
                            </div>
                            {day.volume > 0 && (
                              <div>Volume: {day.volume.toLocaleString()} lbs</div>
                            )}
                          </div>
                          <div className="absolute left-1/2 transform -translate-x-1/2 top-full">
                            <div className="border-solid border-t-gray-800 border-t-8 border-x-transparent border-x-8 border-b-0"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex justify-end items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="mr-2">Less</span>
          {[0, 1, 2, 3, 4].map(level => (
            <div 
              key={level}
              className={`w-3 h-3 mx-0.5 rounded-sm heat-${level}`}
            ></div>
          ))}
          <span className="ml-2">More</span>
        </div>
      </div>
    </div>
  );
};

export default HeatMapCalendar;