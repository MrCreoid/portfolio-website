"use client";

import { useEffect, type RefObject } from "react";
import { EYEBROW_LINES, TYPE_WORDS } from "@/lib/data";
import { SPRING, prefersReducedMotion, rand, wait } from "@/lib/fx";

/** The hero sub-line types itself, forever. */
export function useTypewriter(ref: RefObject<HTMLSpanElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = TYPE_WORDS[0];
      return;
    }

    let alive = true;
    (async () => {
      let i = 0;
      while (alive) {
        const word = TYPE_WORDS[i % TYPE_WORDS.length];
        for (let c = 1; c <= word.length && alive; c++) {
          el.textContent = word.slice(0, c);
          await wait(65);
        }
        await wait(1700);
        for (let c = word.length; c >= 0 && alive; c--) {
          el.textContent = word.slice(0, c);
          await wait(32);
        }
        await wait(350);
        i++;
      }
    })();

    return () => {
      alive = false;
    };
  }, [ref]);
}

/** The status line above the name swaps itself out every few seconds. */
export function useEyebrowRotator(ref: RefObject<HTMLSpanElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let i = 0;

    const id = setInterval(() => {
      el.animate(
        [
          { transform: "translateY(0)", opacity: 1 },
          { transform: "translateY(-115%)", opacity: 0 },
        ],
        { duration: 320, easing: "ease-in", fill: "forwards" },
      ).onfinish = () => {
        i = (i + 1) % EYEBROW_LINES.length;
        el.textContent = EYEBROW_LINES[i];
        el.animate(
          [
            { transform: "translateY(115%)", opacity: 0 },
            { transform: "translateY(0)", opacity: 1 },
          ],
          { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
        );
      };
    }, 3600);

    return () => clearInterval(id);
  }, [ref]);
}

/**
 * Grab a letter of the name and fling it — it springs back.
 * The letters themselves are rendered by <SplitText>; this only wires physics.
 */
export function useGrabbableLetters() {
  useEffect(() => {
    const letters = Array.from(document.querySelectorAll<HTMLElement>(".h-letter"));
    const cleanups: (() => void)[] = [];

    letters.forEach((el) => {
      // per-letter state so simultaneous grabs never share or fight over data
      const st = {
        ox: 0,
        oy: 0,
        sx: 0,
        sy: 0,
        dx: 0,
        dy: 0,
        vx: 0,
        vy: 0,
        lastX: 0,
        lastY: 0,
        lastT: 0,
        flingTimer: undefined as ReturnType<typeof setTimeout> | undefined,
      };

      const down = (e: PointerEvent) => {
        e.preventDefault();
        clearTimeout(st.flingTimer); // a re-grab cancels any pending spring-home
        el.setPointerCapture(e.pointerId);
        el.classList.add("is-grabbed");
        // resume from wherever the letter currently is (it may be mid-spring)
        const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
        st.ox = m.e;
        st.oy = m.f;
        st.dx = st.ox;
        st.dy = st.oy;
        st.sx = e.clientX;
        st.sy = e.clientY;
        st.vx = st.vy = 0;
        st.lastX = e.clientX;
        st.lastY = e.clientY;
        st.lastT = performance.now();
        el.style.transition = "none";
        el.style.transform = `translate(${st.ox}px, ${st.oy}px) rotate(${st.ox * 0.08}deg)`;
      };

      const move = (e: PointerEvent) => {
        if (!el.classList.contains("is-grabbed")) return;
        st.dx = st.ox + (e.clientX - st.sx);
        st.dy = st.oy + (e.clientY - st.sy);
        const t = performance.now();
        const dt = Math.min(Math.max(t - st.lastT, 1), 60);
        st.vx = (e.clientX - st.lastX) / dt;
        st.vy = (e.clientY - st.lastY) / dt;
        st.lastX = e.clientX;
        st.lastY = e.clientY;
        st.lastT = t;
        el.style.transform = `translate(${st.dx}px, ${st.dy}px) rotate(${st.dx * 0.08}deg)`;
      };

      const release = () => {
        if (!el.classList.contains("is-grabbed")) return;
        el.classList.remove("is-grabbed");
        // stale velocity from a pause shouldn't launch the letter
        if (performance.now() - st.lastT > 80) st.vx = st.vy = 0;
        const fx = st.dx + Math.max(Math.min(st.vx * 60, 220), -220);
        const fy = st.dy + Math.max(Math.min(st.vy * 60, 220), -220);
        el.style.transition = "transform 0.09s ease-out";
        el.style.transform = `translate(${fx}px, ${fy}px) rotate(${fx * 0.1}deg)`;
        st.flingTimer = setTimeout(() => {
          el.style.transition = `transform 0.9s ${SPRING}`;
          el.style.transform = "translate(0,0) rotate(0deg)";
        }, 90);
      };

      el.addEventListener("pointerdown", down);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", release);
      el.addEventListener("pointercancel", release);
      el.addEventListener("lostpointercapture", release);

      cleanups.push(() => {
        clearTimeout(st.flingTimer);
        el.removeEventListener("pointerdown", down);
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", release);
        el.removeEventListener("pointercancel", release);
        el.removeEventListener("lostpointercapture", release);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);
}

/** A real string: bend it with the cursor, let go, it oscillates and decays. */
export function useGuitarString(
  boxRef: RefObject<HTMLDivElement | null>,
  pathRef: RefObject<SVGPathElement | null>,
) {
  useEffect(() => {
    const box = boxRef.current;
    const path = pathRef.current;
    if (!box || !path) return;

    const REST = 45;
    let cy = REST; // current control-point y
    let target = REST; // where the cursor is pulling it
    let holding = false; // cursor is bending the string
    let osc: { a: number; t: number } | null = null; // oscillation after release
    let raf = 0;

    const setPath = (y: number) =>
      path.setAttribute("d", `M 0 ${REST} Q 500 ${y} 1000 ${REST}`);

    const pluck = (amplitude: number) => {
      osc = { a: Math.max(Math.min(amplitude, 70), -70), t: 0 };
      if (Math.abs(osc.a) > 6) {
        const r = box.getBoundingClientRect();
        const note = document.createElement("span");
        note.className = "music-note";
        note.textContent = ["♪", "♫", "♩"][(Math.random() * 3) | 0];
        note.style.left = r.left + r.width / 2 + rand(-80, 80) + "px";
        note.style.top = r.top + 20 + "px";
        document.body.appendChild(note);
        note.animate(
          [
            { transform: "translateY(0) rotate(0deg)", opacity: 1 },
            { transform: `translateY(-60px) rotate(${rand(-25, 25)}deg)`, opacity: 0 },
          ],
          { duration: 1100, easing: "ease-out" },
        ).onfinish = () => note.remove();
      }
    };

    const toLocalY = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      return ((e.clientY - r.top) / r.height) * 90;
    };

    const onMove = (e: PointerEvent) => {
      const y = toLocalY(e);
      if (Math.abs(y - REST) < 32) {
        holding = true;
        osc = null;
        target = y;
      } else if (holding) {
        holding = false;
        pluck(cy - REST);
      }
    };

    const onLeave = () => {
      if (holding) {
        holding = false;
        pluck(cy - REST);
      }
    };

    const vibrate = () => {
      if (holding) {
        cy += (target - cy) * 0.4;
      } else if (osc) {
        osc.t += 16;
        const decayed = osc.a * Math.exp(-osc.t / 350) * Math.cos(osc.t / 28);
        cy = REST + decayed;
        if (Math.abs(decayed) < 0.3) {
          osc = null;
          cy = REST;
        }
      } else {
        cy += (REST - cy) * 0.2;
      }
      setPath(cy);
      raf = requestAnimationFrame(vibrate);
    };
    raf = requestAnimationFrame(vibrate);

    box.addEventListener("pointermove", onMove);
    box.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      box.removeEventListener("pointermove", onMove);
      box.removeEventListener("pointerleave", onLeave);
    };
  }, [boxRef, pathRef]);
}
