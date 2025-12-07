import React from 'react';
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from '@heroicons/react/24/solid';

const StatsCard = ({ title, stats, unit, color = 'green' }) => {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color] || colorClasses.green}`}>
      <h4 className="font-medium text-sm mb-3">{title}</h4>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="flex items-center justify-center mb-1">
            <ArrowDownIcon className="w-4 h-4 mr-1" />
            <span className="text-xs">Min</span>
          </div>
          <p className="text-lg font-bold">
            {stats.min !== null ? `${stats.min}${unit}` : '-'}
          </p>
        </div>
        <div>
          <div className="flex items-center justify-center mb-1">
            <MinusIcon className="w-4 h-4 mr-1" />
            <span className="text-xs">Avg</span>
          </div>
          <p className="text-lg font-bold">
            {stats.avg !== null ? `${stats.avg}${unit}` : '-'}
          </p>
        </div>
        <div>
          <div className="flex items-center justify-center mb-1">
            <ArrowUpIcon className="w-4 h-4 mr-1" />
            <span className="text-xs">Max</span>
          </div>
          <p className="text-lg font-bold">
            {stats.max !== null ? `${stats.max}${unit}` : '-'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;