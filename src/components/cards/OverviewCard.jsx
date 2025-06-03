import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Card component for displaying overview statistics
 */
const OverviewCard = ({ title, value, icon, trend, badge, onClick }) => {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md transition-all duration-200 
      ${onClick ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          {icon}
        </div>
        {badge && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            {badge}
          </span>
        )}
      </div>
      
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
      
      {trend && (
        <div className="mt-2 flex items-center text-xs">
          {trend.startsWith('+') ? (
            <>
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">{trend}</span>
            </>
          ) : trend.startsWith('-') ? (
            <>
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-red-500 font-medium">{trend}</span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{trend}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default OverviewCard; 