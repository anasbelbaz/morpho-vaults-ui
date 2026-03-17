"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "motion/react";

export function FlipValue({
  value,
  defaultValue,
}: {
  value: string;
  defaultValue: string;
}) {
  const hasAnimated = useRef(false);
  const isDefault = value === defaultValue;

  if (!isDefault) hasAnimated.current = true;

  if (!hasAnimated.current) return <span className="font-medium">{value}</span>;

  return (
    <span
      className="relative inline-block overflow-hidden font-medium"
      style={{ minWidth: "3ch" }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={isDefault ? "default" : "active"}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ type: "spring", duration: 0.35, bounce: 0 }}
          className="block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
