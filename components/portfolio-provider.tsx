"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { View } from "@/lib/data";
import { prefersReducedMotion, setParticleTheme, wait } from "@/lib/fx";

type PreviewTarget = { url: string; title: string } | null;
type LightboxTarget = { src: string; caption: string } | null;

type PortfolioValue = {
  view: View;
  goTo: (name: View, cx?: number, cy?: number) => void;
  toast: (msg: string, ms?: number) => void;
  cozy: boolean;
  setCozy: (v: boolean | ((p: boolean) => boolean)) => void;
  crt: boolean;
  setCrt: (v: boolean | ((p: boolean) => boolean)) => void;
  preview: PreviewTarget;
  openPreview: (t: PreviewTarget) => void;
  lightbox: LightboxTarget;
  openLightbox: (t: LightboxTarget) => void;
  gameOpen: boolean;
  setGameOpen: (v: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  toastMsg: string;
  toastShown: boolean;
  transitionRef: RefObject<HTMLDivElement | null>;
};

const Ctx = createContext<PortfolioValue | null>(null);

export function usePortfolio() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePortfolio must be used inside <PortfolioProvider>");
  return v;
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [cozy, setCozy] = useState(false);
  const [crt, setCrt] = useState(false);
  const [preview, setPreview] = useState<PreviewTarget>(null);
  const [lightbox, setLightbox] = useState<LightboxTarget>(null);
  const [gameOpen, setGameOpen] = useState(false);

  const [toastMsg, setToastMsg] = useState("");
  const [toastShown, setToastShown] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const transitionRef = useRef<HTMLDivElement | null>(null);
  const animating = useRef(false);

  const toast = useCallback((msg: string, ms = 2400) => {
    setToastMsg(msg);
    setToastShown(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastShown(false), ms);
  }, []);

  /* the circular wipe grows out of wherever the click came from */
  const goTo = useCallback(
    async (name: View, cx?: number, cy?: number) => {
      if (animating.current) return;
      if (name === view) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      animating.current = true;
      setMenuOpen(false);

      const el = transitionRef.current;
      if (prefersReducedMotion() || !el) {
        setView(name);
        window.scrollTo(0, 0);
        animating.current = false;
        return;
      }

      el.style.setProperty("--cx", (cx ?? innerWidth / 2) + "px");
      el.style.setProperty("--cy", (cy ?? innerHeight / 2) + "px");
      el.classList.add("is-covering");
      await wait(640);

      setView(name);
      window.scrollTo(0, 0);

      el.classList.add("is-leaving");
      await wait(660);

      el.classList.remove("is-covering", "is-leaving");
      animating.current = false;
    },
    [view],
  );

  /* body classes the stylesheet keys off */
  useEffect(() => {
    document.body.classList.toggle("is-cozy", cozy);
  }, [cozy]);

  useEffect(() => {
    document.body.classList.toggle("is-crt", crt);
  }, [crt]);

  useEffect(() => {
    setParticleTheme(crt, cozy);
  }, [crt, cozy]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const value = useMemo<PortfolioValue>(
    () => ({
      view,
      goTo,
      toast,
      cozy,
      setCozy,
      crt,
      setCrt,
      preview,
      openPreview: setPreview,
      lightbox,
      openLightbox: setLightbox,
      gameOpen,
      setGameOpen,
      menuOpen,
      setMenuOpen,
      toastMsg,
      toastShown,
      transitionRef,
    }),
    [view, goTo, toast, cozy, crt, preview, lightbox, gameOpen, menuOpen, toastMsg, toastShown],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
