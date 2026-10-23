"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";



export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const activeTransitionRef = React.useRef<ViewTransition | null>(null);

  // Avoid hydration mismatch by waiting until mounted
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="w-9 h-9 opacity-50">
        <Monitor className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const cycleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';

    // Determine current and target visual modes ('light' or 'dark')
    const systemIsDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    const currentEffective =
      resolvedTheme ||
      (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

    const targetEffective =
      nextTheme === 'system' ? (systemIsDark ? 'dark' : 'light') : nextTheme;

    // Check for user reduced motion preference and browser View Transitions API support
    const isReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Fast-path: if browser doesn't support View Transitions, user prefers reduced motion,
    // or the visual mode does not change (e.g. system matches current), switch instantly.
    if (!('startViewTransition' in document) || !document.startViewTransition || isReducedMotion || currentEffective === targetEffective) {
      setTheme(nextTheme);
      return;
    }

    // Skip any in-flight transition so fast repeated clicks never hang
    if (activeTransitionRef.current?.skipTransition) {
      try {
        activeTransitionRef.current.skipTransition();
      } catch {
        // Safe to ignore if already finished
      }
    }

    // Calculate origin coordinates from the center of the theme toggle button
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Radius needed to reach the furthest corner of the viewport
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const isGoingToDark = targetEffective === 'dark';
    const transitionClass = isGoingToDark
      ? 'theme-transition-to-dark'
      : 'theme-transition-to-light';

    document.documentElement.classList.add(transitionClass);

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme);
      });
    });

    activeTransitionRef.current = transition;

    transition.ready.then(() => {
      // Telegram-style reveal:
      // When switching to Dark: new dark layer emerges from button to cover screen
      // When switching to Light: old dark layer collapses into button, revealing light underneath
      const clipPath = isGoingToDark
        ? [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ]
        : [
            `circle(${endRadius}px at ${x}px ${y}px)`,
            `circle(0px at ${x}px ${y}px)`,
          ];

      const animation = document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: isGoingToDark ? 650 : 500,
          easing: 'cubic-bezier(0.23, 1, 0.32, 1)', // Telegram EASE_OUT_QUINT
          pseudoElement: isGoingToDark
            ? '::view-transition-new(root)'
            : '::view-transition-old(root)',
          fill: 'forwards',
        }
      );

      animation.onfinish = () => {
        document.documentElement.classList.remove(transitionClass);
      };
    });

    const cleanup = () => {
      document.documentElement.classList.remove(transitionClass);
      if (activeTransitionRef.current === transition) {
        activeTransitionRef.current = null;
      }
    };

    transition.finished.then(cleanup, cleanup);
  };

  const getIcon = () => {
    if (theme === 'light') return <Sun className="h-[1.2rem] w-[1.2rem]" />;
    if (theme === 'dark') return <Moon className="h-[1.2rem] w-[1.2rem]" />;
    return <Monitor className="h-[1.2rem] w-[1.2rem]" />;
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      className="theme-toggle-btn w-9 h-9 cursor-pointer transition-colors duration-200"
      title={`Current theme: ${theme} (Click to toggle)`}
      aria-label={`Toggle theme (Current: ${theme})`}
    >
      {getIcon()}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
