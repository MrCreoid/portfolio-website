"use client";

import { useCallback, useEffect, useState } from "react";
import { VIEWS } from "@/lib/data";
import { PortfolioProvider, usePortfolio } from "@/components/portfolio-provider";
import { Ambient, Cursor } from "@/components/fx/ambient";
import { Preloader } from "@/components/fx/preloader";
import { Header, MobileMenu } from "@/components/layout/header";
import { BottomSecret, Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Projects } from "@/components/sections/projects";
import { Achievements } from "@/components/sections/achievements";
import { Contact } from "@/components/sections/contact";
import {
  CrtOverlay,
  Lightbox,
  McToast,
  PreviewWindow,
  Toast,
  Transition,
} from "@/components/overlays/overlays";
import { TypingGame } from "@/components/overlays/typing-game";
import {
  useBentoSpotlight,
  useMagneticTilt,
  useNavIndicator,
  useViewEnter,
} from "@/hooks/use-view-effects";
import {
  useDvdScreensaver,
  useFilmPosterWobble,
  useTabPout,
} from "@/hooks/use-ambient";
import {
  useConsoleGreeting,
  useCozyMode,
  useKonami,
  useTypedSecrets,
} from "@/hooks/use-eggs";

const SECTIONS = {
  home: Hero,
  about: About,
  projects: Projects,
  achievements: Achievements,
  contact: Contact,
} as const;

function Site() {
  const { view, menuOpen } = usePortfolio();
  const [ready, setReady] = useState(false);
  const [achievement, setAchievement] = useState(false);

  const onPreloaderDone = useCallback(() => setReady(true), []);
  const showAchievement = useCallback(() => {
    setAchievement(true);
    setTimeout(() => setAchievement(false), 4200);
  }, []);

  // single owner of the scroll lock — both the mobile menu and the intro need it
  useEffect(() => {
    document.body.classList.toggle("is-locked", menuOpen || !ready);
  }, [menuOpen, ready]);

  useViewEnter(view, ready);
  useNavIndicator(view, ready);
  useMagneticTilt();
  useBentoSpotlight();
  useDvdScreensaver();
  useTabPout();
  useFilmPosterWobble();
  useTypedSecrets();
  useCozyMode();
  useKonami(showAchievement);
  useConsoleGreeting();

  return (
    <>
      <Ambient />
      <Cursor />
      <Preloader onDone={onPreloaderDone} />
      <Transition />

      <Header />
      <MobileMenu />

      <main>
        {VIEWS.map((name) => {
          const Section = SECTIONS[name];
          return (
            <section
              key={name}
              className={`view${view === name ? " is-active" : ""}`}
              id={`view-${name}`}
            >
              <Section />
            </section>
          );
        })}
      </main>

      <Footer />
      <BottomSecret />

      <Toast />
      <PreviewWindow />
      <Lightbox />
      <McToast shown={achievement} />
      <CrtOverlay />
      <TypingGame />
    </>
  );
}

export function Portfolio() {
  return (
    <PortfolioProvider>
      <Site />
    </PortfolioProvider>
  );
}
