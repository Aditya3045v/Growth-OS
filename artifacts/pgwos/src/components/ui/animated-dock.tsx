import * as React from "react";
import { useRef } from "react";
import {
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { Link, useLocation } from "wouter";

const cn = (...args: unknown[]) => twMerge(clsx(args));

export interface DockItemData {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export interface AnimatedDockProps {
  className?: string;
  items: DockItemData[];
}

export const AnimatedDock = ({ className, items }: AnimatedDockProps) => {
  const mouseX = useMotionValue(Infinity);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn(
        "relative flex items-end rounded-2xl overflow-hidden",
        className
      )}
    >
      {/* Scrollable track — handles touch on mobile */}
      <div
        ref={scrollRef}
        className="flex items-end gap-3 px-4 pb-3 pt-2 overflow-x-auto hide-scrollbar"
        style={{
          WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
          scrollSnapType: "x proximity",
          /* let browser handle horizontal swipe natively */
          touchAction: "pan-x",
          cursor: "grab",
        }}
      >
        {/* Desktop hover detection layer — invisible, pointer events only on desktop */}
        <motion.div
          onMouseMove={(e) => mouseX.set(e.pageX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          className="absolute inset-0 pointer-events-none md:pointer-events-auto"
        />

        {items.map((item) => (
          <DockItem key={item.href} mouseX={mouseX} item={item} />
        ))}
      </div>
    </div>
  );
};

interface DockItemProps {
  mouseX: MotionValue<number>;
  item: DockItemData;
}

const DockItem = ({ mouseX, item }: DockItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const isActive = location === item.href;

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-160, 0, 160], [44, 68, 44]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 170, damping: 14 });

  const iconScale = useTransform(width, [44, 68], [1, 1.45]);
  const iconSpring = useSpring(iconScale, { mass: 0.1, stiffness: 170, damping: 14 });

  return (
    <Link href={item.href}>
      <motion.div
        ref={ref}
        style={{ width }}
        title={item.label}
        className={cn(
          "aspect-square flex-shrink-0 flex items-center justify-center rounded-full cursor-pointer select-none",
          "transition-shadow duration-200",
          "scroll-snap-align-center",
          isActive
            ? "bg-gradient-to-br from-[#94aaff] to-[#809bff] shadow-[0_4px_24px_rgba(148,170,255,0.35)]"
            : "bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(148,170,255,0.12)] active:bg-[rgba(148,170,255,0.18)]"
        )}
      >
        <motion.div
          style={{ scale: iconSpring }}
          className={cn(
            "flex items-center justify-center w-full h-full",
            isActive ? "text-[#000]" : "text-[#adaaaa]"
          )}
        >
          {item.icon}
        </motion.div>
      </motion.div>
    </Link>
  );
};
