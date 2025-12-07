import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

const SENSOR_COLORS = {
  TEMPERATURE: '#ef4444',
  HUMIDITY: '#3b82f6',
  SOIL_MOISTURE: '#8b5cf6',
  LIGHT: '#f59e0b',
  CO2: '#6b7280',
  PH: '#10b981',
  EC: '#ec4899',
  WATER_FLOW: '#06b6d4'
};

const SensorChart = ({ data, sensorType, sensorName, unit }) => {
  const color = SENSOR_COLORS[sensorType] || '#22c55e';

  const formatXAxis = (tickItem) => {
    return format(new Date(tickItem), 'HH:mm');
  };

  const formatTooltip = (value, name, props) => {
    return [`${value} ${unit}`, sensorName];
  };

  const formatTooltipLabel = (label) => {
    return format(new Date(label), 'MMM dd, HH:mm');
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available for this time range</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="time" 
          tickFormatter={formatXAxis}
          stroke="#6b7280"
          fontSize={12}
        />
        <YAxis 
          stroke="#6b7280"
          fontSize={12}
          tickFormatter={(value) => `${value}${unit}`}
        />
        <Tooltip 
          formatter={formatTooltip}
          labelFormatter={formatTooltipLabel}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          name={sensorName}
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SensorChart;