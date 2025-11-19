import React from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';

// Định nghĩa Props cho StatCard
type StatCardProps = {
  label: string;
  value: number | null;
  href?: string;
  icon: React.ReactNode;
};

// Component StatCard
const StatCard: React.FC<StatCardProps> = ({ label, value, href, icon }) => {
  const displayValue = value === null ? '' : value > 999 ? `${Math.round(value / 1000)}k` : value;
  const growthPercentage = value ? `+${Math.min(9, Math.round(value % 10))}%` : '';

  return (
    <motion.div
      className="bg-white dark:bg-slate-800 shadow-lg rounded-2xl p-5 flex items-center gap-5 border border-slate-100 dark:border-slate-700 cursor-pointer"
      whileHover={{ scale: 1.02, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-2xl shadow-md">
        {icon}
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="text-sm text-[var(--color-gray-600)] dark:text-slate-300 font-medium">
            {label}
          </div>
          <div className="text-xs text-[var(--color-gray-500)] dark:text-slate-400">
            {displayValue}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-4">
          <div className="text-4xl font-extrabold text-[var(--color-gray-800)] dark:text-white">
            {value === null ? <span className="text-slate-400">—</span> : value}
          </div>
          <div className="text-sm text-green-500 font-semibold">
            {growthPercentage}
          </div>
        </div>

        {href && (
          <div className="mt-4">
            <Link
              to={href}
              className="text-sm text-brand-500 dark:text-indigo-400 hover:underline font-medium"
            >
              Quản lý {label.toLowerCase()}
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;