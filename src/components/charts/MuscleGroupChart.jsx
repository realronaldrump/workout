import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MUSCLE_GROUPS } from '../../config';

/**
 * Pie chart component to visualize muscle group distribution
 */
const MuscleGroupChart = ({ distribution }) => {
  // No data handling
  if (!distribution || distribution.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
        No muscle group data available
      </div>
    );
  }
  
  // Format data for chart
  const chartData = distribution.map(item => ({
    name: item.name,
    value: item.percentage,
    count: item.count,
    color: MUSCLE_GROUPS[item.name]?.color || '#94a3b8'
  }));
  
  // Custom tooltip to show muscle group details
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-md p-2 border border-gray-200 dark:border-gray-700 text-xs">
          <p className="font-medium">{data.name}</p>
          <p>Exercises: {data.count}</p>
          <p>{data.value}% of training</p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={1}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MuscleGroupChart; 