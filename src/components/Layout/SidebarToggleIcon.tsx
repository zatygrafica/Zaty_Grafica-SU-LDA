import React from 'react';
import { motion } from 'framer-motion';

interface SidebarToggleIconProps {
  isCollapsed: boolean;
  className?: string;
}

const SidebarToggleIcon: React.FC<SidebarToggleIconProps> = ({ isCollapsed, className }) => {
  return (
    <div className={`w-5 h-5 relative ${className}`}>
      {/* Outer frame */}
      <div className="w-full h-full rounded border-2 border-current" />

      {/* Animated divider */}
      <motion.div
        className="absolute top-0.5 bottom-0.5 h-auto w-0.5 bg-current"
        initial={false}
        animate={{
          left: isCollapsed ? '25%' : '40%',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      />
    </div>
  );
};

export default SidebarToggleIcon;
