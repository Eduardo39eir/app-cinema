import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, useReducedMotion, MotionConfig } from "motion/react";
import { animate } from "motion/mini";
import { useStore } from "./store";

export const cineEase = [0.22, 1, 0.36, 1] as const;
export function useQuietMotion() {
  const system = useReducedMotion();
  const preference = useStore((s) => s.preferences.reducedMotion);
  return !!system || preference;
}
export function CineMotion({ children }: { children: ReactNode }) {
  const quiet = useQuietMotion();
  return (
    <MotionConfig
      reducedMotion={quiet ? "always" : "never"}
      transition={{ duration: 0.42, ease: cineEase }}
    >
      {children}
    </MotionConfig>
  );
}

// Original Cine implementations inspired by the reveal patterns documented in
// React Bits, Magic UI and Animata. References are recorded in MOTION.md.
export function BlurWords({ text }: { text: string }) {
  const quiet = useQuietMotion();
  return (
    <span className="blur-words">
      <span className="sr-only">{text}</span>
      {text.split(" ").map((word, i) => (
        <motion.span
          aria-hidden="true"
          key={`${word}-${i}`}
          initial={quiet ? false : { opacity: 0, filter: "blur(4px)", y: 9 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{
            duration: quiet ? 0 : 0.48,
            delay: quiet ? 0 : i * 0.045,
            ease: cineEase,
          }}
          style={{ display: "inline-block" }}
        >
          {word}
          {i < text.split(" ").length - 1 ? "\u00a0" : ""}
        </motion.span>
      ))}
    </span>
  );
}

export function AnimatedNumber({ value }: { value: number }) {
  const quiet = useQuietMotion();
  const previous = useRef(0);
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (quiet) {
      setDisplay(value);
      previous.current = value;
      return;
    }
    const from = previous.current;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 550);
      setDisplay(Math.round(from + (value - from) * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    previous.current = value;
    return () => cancelAnimationFrame(frame);
  }, [value, quiet]);
  return (
    <span className="animated-number">
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">{quiet ? value : display}</span>
    </span>
  );
}

const revealSelector = [
  ".section-heading",
  ".poster-card",
  ".movie-row",
  ".list-card",
  ".empty-state",
  ".post-card",
  ".chat-row",
  ".message",
  ".comment",
  ".post-text",
  ".cinema-card",
  ".session-times",
  ".summary-card",
  ".digital-ticket",
  ".ticket-preview",
  ".ticket-success",
  ".cinema-editorial",
  ".profile-review",
  ".profile-stats",
  ".profile-info > h1",
  ".profile-info > .eyebrow",
  ".profile-info > p",
  ".list-hero",
  ".settings > section",
  ".setting-row",
  ".notice",
  ".check-row",
  ".form-stack > label",
  ".genre-tile",
  ".onboard-posters > button",
  ".friend-films > a",
  ".assistant-banner",
  ".community-people > a",
  ".cast-rail > a",
  ".gallery-preview",
  ".detail-title-row",
  ".detail-section",
  ".detail-ctas",
  ".booking-context",
  ".seat-row",
  ".booking-total",
].join(",");

/** Reveals existing semantic elements without extra wrappers or hidden content.
 * Only newly mounted elements are observed. All effects are finite and removed
 * on unmount, preference changes and completion. Native scroll remains untouched. */
export function ContentMotion() {
  const quiet = useQuietMotion();
  useLayoutEffect(() => {
    if (quiet) return;
    const root = document.querySelector(".app-shell");
    if (!root) return;
    const known = new WeakSet<Element>();
    const pending = new Set<Element>();
    const active = new Map<Element, ReturnType<typeof animate>>();
    const run = (el: HTMLElement, delay = 0) => {
      const effect = animate(
        el,
        { opacity: [0, 1], transform: ["translateY(18px)", "none"] },
        { duration: 0.48, delay, ease: cineEase },
      );
      el.dataset.cineReveal = "running";
      active.set(el, effect);
      effect.then(() => {
        if (active.get(el) !== effect) return;
        effect.cancel();
        active.delete(el);
        el.dataset.cineReveal = "done";
      });
    };
    const observer = new IntersectionObserver(
      (entries) => {
        let stagger = 0;
        for (const entry of entries)
          if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            pending.delete(entry.target);
            run(entry.target as HTMLElement, Math.min(stagger++ * 0.045, 0.18));
          }
      },
      { threshold: 0.06 },
    );
    const scan = (node: Element) => {
      const elements = [
        ...(node.matches(revealSelector) ? [node] : []),
        ...node.querySelectorAll(revealSelector),
      ];
      for (const el of elements) {
        if (known.has(el) || el.parentElement?.closest(revealSelector))
          continue;
        known.add(el);
        pending.add(el);
        observer.observe(el);
      }
    };
    scan(root);
    const updates = new MutationObserver((records) => {
      for (const node of pending)
        if (!node.isConnected) {
          observer.unobserve(node);
          pending.delete(node);
        }
      for (const record of records)
        for (const node of record.addedNodes)
          if (node instanceof Element) scan(node);
      for (const [node, effect] of active)
        if (!node.isConnected) {
          effect.cancel();
          active.delete(node);
        }
    });
    updates.observe(root, { childList: true, subtree: true });
    const tap = (event: Event) => {
      const target = (event.target as Element).closest<HTMLButtonElement>(
        "button",
      );
      if (!target || target.disabled || target.closest(".bottom-nav")) return;
      const glyph = target.querySelector<SVGElement>("svg");
      if (glyph) {
        active.get(glyph)?.cancel();
        const effect = animate(
          glyph,
          { transform: ["scale(1)", "scale(1.2)", "scale(1)"] },
          { duration: 0.3, ease: cineEase },
        );
        active.set(glyph, effect);
        effect.then(() => {
          if (active.get(glyph) === effect) {
            effect.cancel();
            active.delete(glyph);
          }
        });
      }
    };
    root.addEventListener("click", tap);
    return () => {
      observer.disconnect();
      pending.clear();
      updates.disconnect();
      root.removeEventListener("click", tap);
      for (const [el, effect] of active) {
        effect.cancel();
        if (el instanceof HTMLElement) el.dataset.cineReveal = "done";
      }
      active.clear();
    };
  }, [quiet]);
  return null;
}
