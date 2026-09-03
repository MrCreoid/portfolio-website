"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { VIEWS } from "@/lib/data";
import { PortfolioProvider, usePortfolio } from "@/components/portfolio-provider";
import { Ambient, Cursor } from "@/components/fx/ambient";
import { ImageTrail } from "@/components/fx/image-trail";
import { Preloader } from "@/components/fx/preloader";
import { Header, MobileMenu } from "@/components/layout/header";
import { Rail } from "@/components/layout/rail";
import { BottomSecret, Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Projects } from "@/components/sections/projects";
import { Achievements } from "@/components/sections/achievements";
import { Contact } from "@/components/sections/contact";
import {
  CrtOverlay,
  GridOverlay,
  Lightbox,
  McToast,
  PreviewWindow,
  Readout,
  Toast,
  Transition,
} from "@/components/overlays/overlays";
import { TypingGame } from "@/components/overlays/typing-game";
import {
  useBentoSpotlight,
  useMagneticTilt,
  useNavIndicator,
  useScramble,
  useTypePinch,
  useViewEnter,
} from "@/hooks/use-view-effects";
import { useNameToMarquee, useScrollChrome, useViewScrollFx } from "@/hooks/use-scroll-fx";
import { useHeroLetters } from "@/hooks/use-toys";
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
import { splitWords } from "@/lib/fx";
import { getLenis } from "@/lib/scroll";

const SECTIONS = {
  home: Hero,
  about: About,
  projects: Projects,
  achievements: Achievements,
  contact: Contact,
} as const;

function Site() {
  const { view, menuOpen, openDeepLink } = usePortfolio();
  const [ready, setReady] = useState(false);
  const [achievement, setAchievement] = useState(false);

  const onPreloaderDone = useCallback(() => {
    setReady(true);
    openDeepLink();
  }, [openDeepLink]);
  const showAchievement = useCallback(() => {
    setAchievement(true);
    setTimeout(() => setAchievement(false), 4200);
  }, []);

  // single owner of the scroll lock — both the mobile menu and the intro need it
  useEffect(() => {
    const locked = menuOpen || !ready;
    document.body.classList.toggle("is-locked", locked);
    const lenis = getLenis();
    if (lenis) (locked ? lenis.stop : lenis.start).call(lenis);
  }, [menuOpen, ready]);

  // the word cascades need their spans before the first reveal fires, and
  // this runs before useViewEnter because it is declared before it
  useLayoutEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-words]").forEach(splitWords);
  }, []);

  useViewEnter(view, ready);
  useNavIndicator(view, ready);
  useScrollChrome(ready);
  useViewScrollFx(view, ready);
  useNameToMarquee(view === "home" && ready);
  useHeroLetters(view === "home" && ready);
  useMagneticTilt();
  useBentoSpotlight();
  useTypePinch();
  useScramble();
  useDvdScreensaver();
  useTabPout();
  useFilmPosterWobble();
  useTypedSecrets();
  useCozyMode();
  useKonami(showAchievement);
  useConsoleGreeting();

  return (
    <>
      <Ambient view={view} />
      <Cursor />
      {/* outside <main>: the active view carries a per-frame skew, and a
          transformed ancestor would anchor the trail to it instead of the
          viewport */}
      <ImageTrail scope=".work-index" />
      <Preloader onDone={onPreloaderDone} />
      <Transition />

      <Header />
      <MobileMenu />
      <Rail view={view} ready={ready} />

      <main id="main">
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

      <Readout view={view} />
      <Toast />
      <PreviewWindow />
      <Lightbox />
      <McToast shown={achievement} />
      <CrtOverlay />
      <GridOverlay />
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
