import { cn } from "@/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

export const HoverEffect = ({
  items,
  className,
}: {
  items: {
    title: string;
    description: React.ReactNode;
    icon: LucideIcon;
    onClick?: () => void;
    percentageChange?: number;
  }[];
  className?: string;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
        className
      )}
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
            <div
                key={idx}
                className={cn(
                  "relative group block p-2 h-full w-full",
                  item.onClick && "cursor-pointer"
                )}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={item.onClick}
            >
                <AnimatePresence>
                {hoveredIndex === idx && (
                    <motion.span
                    className="absolute inset-0 h-full w-full bg-gradient-to-br from-cyan-200/50 to-sky-200/50 dark:from-cyan-500/20 dark:to-sky-500/20 block rounded-2xl"
                    layoutId="hoverBackground"
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: 1,
                        transition: { duration: 0.15 },
                    }}
                    exit={{
                        opacity: 0,
                        transition: { duration: 0.15, delay: 0.2 },
                    }}
                    />
                )}
                </AnimatePresence>
                <Card>
                    <div className="flex justify-between items-start">
                        <CardTitle>{item.title}</CardTitle>
                        <div className="p-2 rounded-full bg-gray-100 dark:bg-neutral-800 group-hover:bg-white/90 dark:group-hover:bg-neutral-700">
                            <Icon className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                        </div>
                    </div>
                    <CardDescription>{item.description}</CardDescription>
                    {item.percentageChange != null && (
                        <div className={cn(
                            "mt-3 flex items-center text-xs",
                            item.percentageChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        )}>
                            {item.percentageChange >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                            <span>
                                {item.percentageChange >= 0 ? '+' : ''}
                                {item.percentageChange.toFixed(0)}% vs último mês
                            </span>
                        </div>
                    )}
                </Card>
            </div>
        )
        })}
    </div>
  );
};

export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl h-full w-full p-4 overflow-hidden bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg border border-gray-200 dark:border-white/20 relative z-20",
        className
      )}
    >
      <div className="relative z-50">
        <div className="p-0">{children}</div>
      </div>
    </div>
  );
};

export const CardTitle = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <h4 className={cn("text-gray-700 dark:text-gray-300 font-medium", className)}>
      {children}
    </h4>
  );
};

export const CardDescription = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "mt-2",
        className
      )}
    >
      {children}
    </div>
  );
};
