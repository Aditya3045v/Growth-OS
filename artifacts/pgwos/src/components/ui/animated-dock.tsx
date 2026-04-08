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
  // Single shared motion value — fed by BOTH mouse and touch
  const pointerX = useMotionValue(Infinity);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Desktop mouse ─────────────────────────────────────────────────
  const handleMouseMove = (e: React.MouseEvent) => pointerX.set(e.pageX);
  const handleMouseLeave = () => pointerX.set(Infinity);

  // ── Mobile touch ─────────────────────────────────────────────────
  // We use the raw touch pageX so the coordinate space matches getBoundingClientRect
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) pointerX.set(touch.pageX);
  };
  const handleTouchEnd = () => pointerX.set(Infinity);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex items-end gap-3 px-4 pb-3 pt-2 overflow-x-auto hide-scrollbar",
        className
      )}
      style={{
        // Native momentum scroll for horizontal swipe on mobile
        WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
        scrollSnapType: "x proximity",
        // Allow horizontal pan for both scroll and touch-tracking
        touchAction: "pan-x",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {items.map((item) => (
        <DockItem key={item.href} pointerX={pointerX} item={item} />
      ))}
    </div>
  );
};

interface DockItemProps {
  pointerX: MotionValue<number>;
  item: DockItemData;
}

const DockItem = ({ pointerX, item }: DockItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const isActive = location === item.href;

  // Distance from pointer to item center — works identically for mouse & touch
  const distance = useTransform(pointerX, (val) => {
    if (val === Infinity) return Infinity;
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    // pageX vs clientX: account for scroll offset
    const scrollX = window.scrollX ?? 0;
    return val - (bounds.x + scrollX) - bounds.width / 2;
  });

  // Map proximity → size: 44px at rest, 72px at pointer center
  const widthSync = useTransform(distance, (d) => {
    if (d === Infinity) return 44;
    // Gaussian-ish falloff: full effect within ±120px, fades to 0 at ±200px
    const abs = Math.abs(d);
    if (abs > 200) return 44;
    const t = 1 - abs / 200;
    return 44 + 28 * t * t;
  });

  const width = useSpring(widthSync, {
    mass: 0.07,
    stiffness: 200,
    damping: 16,
  });

  const iconScale = useTransform(width, [44, 72], [1, 1.5]);
  const iconSpring = useSpring(iconScale, {
    mass: 0.07,
    stiffness: 200,
    damping: 16,
  });

  // Vertical "lift" — items rise slightly as they grow (iOS behaviour)
  const y = useTransform(width, [44, 72], [0, -10]);
  const ySpring = useSpring(y, { mass: 0.07, stiffness: 200, damping: 16 });

  return (
    <Link href={item.href}>
      <motion.div
        ref={ref}
        style={{ width, y: ySpring }}
        title={item.label}
        className={cn(
          "aspect-square flex-shrink-0 flex items-center justify-center rounded-full",
          "cursor-pointer select-none origin-bottom",
          "transition-shadow duration-150",
          "[scroll-snap-align:center]",
          isActive
            ? "bg-gradient-to-br from-[#94aaff] to-[#809bff] shadow-[0_4px_24px_rgba(148,170,255,0.4)]"
            : "bg-[rgba(255,255,255,0.07)] active:bg-[rgba(148,170,255,0.2)]"
        )}
      >
        <motion.div
          style={{ scale: iconSpring }}
          className={cn(
            "flex items-center justify-center w-full h-full pointer-events-none",
            isActive ? "text-[#000]" : "text-[#adaaaa]"
          )}
        >
          {item.icon}
        </motion.div>
      </motion.div>
    </Link>
  );
};
