import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardMetric } from '../../types';

interface MetricCardProps {
  metric: DashboardMetric;
}

export default function MetricCard({ metric }: MetricCardProps) {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300"
      whileHover={{ y: -2, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <motion.div 
          className={`p-2 rounded-lg ${
            metric.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
            metric.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' :
            metric.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20' :
            'bg-gray-100 dark:bg-gray-700'
          }`}
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          <div className={`w-6 h-6 ${
            metric.color === 'green' ? 'text-green-600 dark:text-green-400' :
            metric.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
            metric.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
            'text-gray-600 dark:text-gray-400'
          }`}>
            {/* Icon would be rendered here based on metric.icon */}
          </div>
        </motion.div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 10 }}
        >
          {getTrendIcon()}
        </motion.div>
      </div>
      
      <div className="space-y-2">
        <motion.h3 
          className="text-2xl font-bold text-gray-900 dark:text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {metric.value}
        </motion.h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">{metric.title}</p>
        <motion.div 
          className="flex items-center space-x-1"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {metric.change > 0 ? '+' : ''}{metric.change}%
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">from last month</span>
        </motion.div>
      </div>
    </motion.div>
  );
}