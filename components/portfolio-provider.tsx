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
import { NAV, SITE_TITLE, VIEWS, View } from "@/lib/data";
import { inkBurst } from "@/hooks/use-ambient";
import { prefersReducedMotion, scramble, setParticleTheme, wait } from "@/lib/fx";
import { scrollTop } from "@/lib/scroll";

type PreviewTarget = { url: string; title: string } | null;
type LightboxTarget = { src: string; caption: string } | null;

type PortfolioValue = {
  view: View;
  goTo: (name: View, cx?: number, cy?: number) => void;
  openDeepLink: () => void;
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

/** The hash is the view. Home is the bare URL — it has no hash of its own. */
const viewFromHash = (): View => {
  const h = location.hash.slice(1);
  return VIEWS.find((v) => v === h) ?? "home";
};

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

  /* the slats drop, the view swaps underneath them, the slats lift. The
     click's centre is kept for the label, which leans toward where you were. */
  const goTo = useCallback(
    /* `push` is false only for the back button, which has already moved the
       address bar — pushing there would bury the entry it just came back to */
    async (name: View, cx?: number, cy?: number, push = true) => {
      if (animating.current) return;
      if (name === view) {
        scrollTop(false);
        return;
      }
      animating.current = true;
      setMenuOpen(false);
      // the address bar moves with the click, not a slat-length later
      if (push) {
        history.pushState(null, "", name === "home" ? location.pathname + location.search : `#${name}`);
      }

      const el = transitionRef.current;
      if (prefersReducedMotion() || !el) {
        setView(name);
        scrollTop();
        animating.current = false;
        return;
      }

      el.style.setProperty("--cx", (cx ?? innerWidth / 2) + "px");
      el.style.setProperty("--cy", (cy ?? innerHeight / 2) + "px");
      // the ink goes first: a splat thrown from the click the slats are about
      // to wipe over
      inkBurst(cx ?? innerWidth / 2, cy ?? innerHeight / 2, 12, 1.5, 90);
      // the destination resolves out of noise rather than simply being there,
      // and its folio number underneath says where it sits in the set
      const logo = el.querySelector<HTMLElement>(".t-logo");
      if (logo) {
        const label = NAV.find((n) => n.id === name)?.label ?? name;
        logo.dataset.text = label;
        logo.textContent = label;
        delete logo.dataset.busy;
        scramble(logo, 380);
      }
      const folio = el.querySelector<HTMLElement>(".t-folio");
      if (folio) {
        const n = VIEWS.indexOf(name) + 1;
        folio.textContent = `${String(n).padStart(2, "0")} / ${String(VIEWS.length).padStart(2, "0")}`;
      }
      el.classList.add("is-covering");
      await wait(760);

      setView(name);
      scrollTop();

      el.classList.add("is-leaving");
      await wait(780);

      el.classList.remove("is-covering", "is-leaving");
      animating.current = false;
    },
    [view],
  );

  /* A deep link opens its view when the intro hands the page over — the
     preloader's slats are still down at that point, so the swap needs no
     transition of its own, and the URL already says where we are. */
  const openDeepLink = useCallback(() => {
    const v = viewFromHash();
    if (v !== "home") {
      setView(v);
      scrollTop(false);
    }
  }, []);

  /* back and forward walk the same slat transition, without pushing again */
  useEffect(() => {
    const onPop = () => void goTo(viewFromHash(), undefined, undefined, false);
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, [goTo]);

  /* the tab says where you are */
  useEffect(() => {
    const label = NAV.find((n) => n.id === view)?.label;
    document.title = view === "home" ? SITE_TITLE : `${label} — Pratyush Garg`;
  }, [view]);

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
      openDeepLink,
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
    [view, goTo, openDeepLink, toast, cozy, crt, preview, lightbox, gameOpen, menuOpen, toastMsg, toastShown],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
