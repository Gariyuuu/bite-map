"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Utensils } from "lucide-react";

const STORAGE_KEY = "bitemap-intro-shown";

/**
 * One-time animated splash shown the first time a browser session lands on
 * the app. Purely decorative — mounted as an overlay so it never delays the
 * dashboard's own data fetch underneath. Skipped entirely for
 * prefers-reduced-motion and on repeat visits within the same session.
 */
export function IntroSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alreadyShown = window.sessionStorage.getItem(STORAGE_KEY);
    if (reducedMotion || alreadyShown) return;

    window.sessionStorage.setItem(STORAGE_KEY, "1");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          onClick={() => setVisible(false)}
          className="fixed inset-0 z-[200] flex cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden bg-[#0a0a0a]"
        >
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 1.4 }}
            style={{
              background: "radial-gradient(circle at 50% 40%, rgba(56,189,248,0.25), transparent 60%)",
            }}
          />

          <motion.div
            initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
            className="relative flex size-16 items-center justify-center rounded-2xl bg-sky-400/15 ring-1 ring-sky-400/40"
          >
            <Utensils className="size-7 text-sky-400" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="relative font-serif text-2xl font-semibold tracking-tight text-white"
          >
            Bite Map
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.5 }}
            className="relative text-sm text-white/60"
          >
            Your food exploration operating system
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
