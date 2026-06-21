"use client";

import React, { useEffect, useMemo, useState } from "react";

const TICK_LISTENERS: Function[] = [];

function useRaceTick(interval = 1000) {
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    TICK_LISTENERS.push(setTick);

    return () => {
      const i = TICK_LISTENERS.indexOf(setTick);
      if (i > -1) TICK_LISTENERS.splice(i, 1);
    };
  }, []);

  React.useEffect(() => {
    const id = setInterval(() => {
      TICK_LISTENERS.forEach((fn) => fn((t: number) => t + 1));
    }, interval);

    return () => clearInterval(id);
  }, [interval]);

  return tick;
}



/* ======================================================
   GLOBAL TEAM STATE
====================================================== */

let GLOBAL_TEAM: any[] = [];
let TEAM_LISTENERS: Function[] = [];

function setGlobalTeam(team: any[]) {
  GLOBAL_TEAM = team;
  TEAM_LISTENERS.forEach((fn) => fn(team));
}

function useGlobalTeam() {
  const [team, setTeam] = React.useState(GLOBAL_TEAM);

  React.useEffect(() => {
    TEAM_LISTENERS.push(setTeam);
    return () => {
      TEAM_LISTENERS = TEAM_LISTENERS.filter((f) => f !== setTeam);
    };
  }, []);

  return [team, setGlobalTeam] as const;
}

/* ======================================================
   BRAND — LOGO & SHARED CHROME
   Reconstructed from the MOTOLIGA pitch deck: a 2x2 offset
   red pixel mark + tracked-out wordmark.
====================================================== */

function MotoligaMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="0" y="0" width="12" height="12" fill="#ff0039" />
      <rect x="16" y="0" width="12" height="12" fill="#ff0039" />
      <rect x="4" y="12" width="12" height="12" fill="#ff0039" />
      <rect x="20" y="12" width="12" height="12" fill="#ff0039" opacity="0.55" />
    </svg>
  );
}

function MotoligaLogo({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims =
    size === "lg"
      ? { mark: "w-9 h-9", text: "text-2xl", gap: "gap-3" }
      : size === "sm"
      ? { mark: "w-4 h-4", text: "text-sm", gap: "gap-2" }
      : { mark: "w-6 h-6", text: "text-lg", gap: "gap-2.5" };

  return (
    <div className={`flex items-center ${dims.gap} ${className}`}>
      <MotoligaMark className={`${dims.mark} shrink-0`} />
      <span
        className={`font-mono font-bold tracking-[0.12em] uppercase ${dims.text}`}
        style={{ color: "var(--ml-text)" }}
      >
        Motoliga
      </span>
    </div>
  );
}

function Eyebrow({ index }: { index: string }) {
  return (
    <div className="flex items-center justify-between font-mono text-[11px] sm:text-xs tracking-[0.2em] uppercase">
      <span className="text-ml-red">{index}</span>
      <span className="text-ml-text-ghost">Motoliga</span>
    </div>
  );
}

function SectionRule() {
  return (
    <div
      className="h-px my-4"
      style={{
        background:
          "linear-gradient(90deg, var(--ml-red) 0 48px, var(--ml-border) 48px)",
      }}
    />
  );
}

function AppHeader({
  onLogoClick,
  right,
}: {
  onLogoClick?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-8 py-4 border-b backdrop-blur"
      style={{
        borderColor: "var(--ml-border)",
        background: "rgba(12,13,16,0.85)",
      }}
    >
      <button
        onClick={onLogoClick}
        className="cursor-pointer disabled:cursor-default"
        disabled={!onLogoClick}
        aria-label="Motoliga home"
      >
        <MotoligaLogo size="md" />
      </button>
      {right}
    </header>
  );
}

function AppFooter() {
  return (
    <footer
      className="px-5 sm:px-8 py-6 border-t flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between"
      style={{ borderColor: "var(--ml-border)" }}
    >
      <MotoligaLogo size="sm" />
      <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-ml-text-ghost">
        Grassroots motorsport, live
      </span>
    </footer>
  );
}

/* ======================================================
   APP ROOT
====================================================== */

export default function MotorsportAppRoot() {
  const [route, setRoute] = useState("streams");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const events = getEvents();
  const liveEvents = events.filter((e) => e.live);
  const finishedEvents = events.filter((e) => !e.live);

  if (route === "event" && selectedEventId) {
    const event = events.find((e) => e.id === selectedEventId);
    if (!event) return null;

    return <EventPage event={event} onBack={() => setRoute("streams")} />;
  }

  if (route === "fantasy") {
    return <FantasyPage onBack={() => setRoute("streams")} />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ml-bg)" }}>
      <AppHeader
        right={
          <button
            onClick={() => setRoute("fantasy")}
            className="font-mono text-xs sm:text-sm font-bold tracking-[0.1em] uppercase px-4 py-2 border transition-colors hover:bg-ml-red hover:text-[#0c0d10]"
            style={{ borderColor: "var(--ml-red)", color: "var(--ml-red)" }}
          >
            Fantasy League
          </button>
        }
      />

      <main className="flex-1 px-5 sm:px-8 py-8 sm:py-10 max-w-6xl w-full mx-auto">
        <Eyebrow index="01 / Streams" />
        <SectionRule />

        <h1 className="font-extrabold tracking-tight leading-[0.95] mb-2 text-[clamp(2rem,5vw,3.25rem)]">
          Watch the league,{" "}
          <span style={{ color: "var(--ml-red)" }}>live</span>.
        </h1>
        <p className="text-ml-text-mute text-sm sm:text-base max-w-xl mb-10">
          Stream, standings, and fantasy points in one place — updating every lap.
        </p>

        <Section title="Live now" live count={liveEvents.length}>
          {liveEvents.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              onClick={() => {
                setSelectedEventId(e.id);
                setRoute("event");
              }}
            />
          ))}
        </Section>

        <Section title="Finished streams" count={finishedEvents.length}>
          {finishedEvents.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              onClick={() => {
                setSelectedEventId(e.id);
                setRoute("event");
              }}
            />
          ))}
        </Section>
      </main>

      <AppFooter />
    </div>
  );
}

/* ======================================================
   EVENT PAGE
====================================================== */

function EventPage({ event, onBack }: any) {
  React.useEffect(() => {
    initRaceEngine();
  }, []);

  const tick = useRaceTick(1000);
  const drivers = getDrivers();
  const [team] = useGlobalTeam();

  const score = useMemo(() => calculateFantasyPoints(team), [team]);

  const ranked = React.useMemo(() => getRankedDrivers(), [tick]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ml-bg)" }}>
      <AppHeader onLogoClick={onBack} />

      <main className="flex-1 px-5 sm:px-8 py-6 sm:py-8 max-w-6xl w-full mx-auto">
        <button
          onClick={onBack}
          className="font-mono text-xs tracking-[0.14em] uppercase text-ml-text-faint hover:text-ml-text mb-5 transition-colors"
        >
          ← Back to streams
        </button>

        <div className="flex items-start justify-between gap-4 mb-1">
          <h1 className="font-extrabold tracking-tight leading-tight text-[clamp(1.5rem,3.5vw,2.25rem)]">
            {event.name}
          </h1>
          {event.live && (
            <span
              className="relative overflow-hidden shrink-0 flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-[0.14em] uppercase text-ml-red px-2.5 py-1 border"
              style={{ borderColor: "var(--ml-red)" }}
            >
              <span className="ml-stripes" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-ml-red ml-pulse" />
              <span className="relative">Live</span>
            </span>
          )}
        </div>
        <p className="font-mono text-xs tracking-[0.1em] uppercase text-ml-text-ghost mb-6">
          {event.track}
        </p>

        <div className="relative overflow-hidden mb-6 border" style={{ borderColor: "var(--ml-border)" }}>
          {event.live && <div className="ml-stripes" />}
          <div className="relative aspect-video">
            <BufferedLiveStream youtubeId={event.youtubeId} />
          </div>
        </div>

        {/* TEAM SCORE */}
        <div
          className="mb-6 p-4 border flex items-center justify-between"
          style={{ borderColor: "var(--ml-border)", background: "var(--ml-surface)" }}
        >
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-ml-text-faint">
            Your fantasy points
          </div>
          <div className="text-2xl font-extrabold" style={{ color: "var(--ml-red)" }}>
            {score}
          </div>
        </div>

        {/* DRIVERS GRID */}
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-ml-text-faint mb-3">
          Live standings
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ranked.map((d) => {
            const isSelected = team.find((t) => t.id === d.id);

            return (
              <div
                key={d.id}
                className="p-4 border transition-all duration-500"
                style={{
                  borderColor: isSelected ? "var(--ml-red)" : "var(--ml-border)",
                  background: isSelected
                    ? "linear-gradient(180deg, rgba(255,0,57,0.14), rgba(255,0,57,0.03))"
                    : "var(--ml-surface)",
                }}
              >
                <div className="flex justify-between items-start font-bold">
                  <span>{d.name}</span>
                  <span
                    className="font-mono text-[11px] px-1.5 py-0.5 shrink-0"
                    style={{ background: "rgba(0,0,0,0.35)", color: "var(--ml-text-dim)" }}
                  >
                    P{d.position}
                  </span>
                </div>

                <div className="text-sm text-ml-text-mute mt-1">{d.team}</div>
                <div className="font-mono text-xs text-ml-text-ghost mt-1">${d.value}M</div>
              </div>
            );
          })}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

/* ======================================================
   FANTASY PAGE
====================================================== */

function FantasyPage({ onBack }: any) {
  const tick = useRaceTick(1000);
  const drivers = getDrivers();
  const [team, setTeam] = useGlobalTeam();

  const budget = 30;
  const spent = team.reduce((s, d) => s + d.value, 0);

  function toggleDriver(driver: any) {
    const exists = team.find((t) => t.id === driver.id);

    if (exists) {
      setTeam(team.filter((t) => t.id !== driver.id));
      return;
    }

    if (team.length >= 3) return;
    if (spent + driver.value > budget) return;

    setTeam([...team, driver]);
  }

  const score = calculateFantasyPoints(team);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ml-bg)" }}>
      <AppHeader onLogoClick={onBack} />

      <main className="flex-1 px-5 sm:px-8 py-6 sm:py-8 max-w-6xl w-full mx-auto">
        <button
          onClick={onBack}
          className="font-mono text-xs tracking-[0.14em] uppercase text-ml-text-faint hover:text-ml-text mb-5 transition-colors"
        >
          ← Back to streams
        </button>

        <Eyebrow index="02 / Fantasy" />
        <SectionRule />

        <h1 className="font-extrabold tracking-tight leading-tight mb-6 text-[clamp(1.75rem,4vw,2.5rem)]">
          Build your team.
        </h1>

        <div
          className="flex flex-wrap gap-x-6 gap-y-2 mb-8 p-4 border font-mono text-xs sm:text-sm"
          style={{ borderColor: "var(--ml-border)", background: "var(--ml-surface)" }}
        >
          <span className="text-ml-text-mute">
            Budget <span className="text-ml-text font-bold">${budget}M</span>
          </span>
          <span className="text-ml-text-mute">
            Spent <span className="text-ml-text font-bold">${spent}M</span>
          </span>
          <span style={{ color: "var(--ml-red)" }} className="font-bold">
            Points: {score}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((d) => {
            const selected = team.find((t) => t.id === d.id);

            return (
              <div
                key={d.id}
                onClick={() => toggleDriver(d)}
                className="p-4 border cursor-pointer transition-colors"
                style={{
                  borderColor: selected ? "var(--ml-red)" : "var(--ml-border)",
                  background: selected
                    ? "linear-gradient(180deg, rgba(255,0,57,0.14), rgba(255,0,57,0.03))"
                    : "var(--ml-surface)",
                }}
              >
                <div className="font-bold">{d.name}</div>
                <div className="text-sm text-ml-text-mute mt-1">{d.team}</div>
                <div className="font-mono text-xs text-ml-text-ghost mt-1">${d.value}M</div>
              </div>
            );
          })}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

/* ======================================================
   RACE ENGINE
====================================================== */

const DRIVER_STATE: Record<number, { score: number }> = {};
let RACE_STARTED = false;

function initRaceEngine() {
  if (RACE_STARTED) return;
  RACE_STARTED = true;

  getDrivers().forEach((d) => {
    DRIVER_STATE[d.id] = { score: Math.random() * 100 };
  });

  setInterval(() => {
    getDrivers().forEach((d) => {
      DRIVER_STATE[d.id].score += (Math.random() - 0.5) * 10;
    });
  }, 5000);
}

function getRankedDrivers() {
  return getDrivers()
    .map((d) => ({
      ...d,
      score: DRIVER_STATE[d.id]?.score ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
    .map((d, i) => ({
      ...d,
      position: i + 1,
    }));
}

/* ======================================================
   FANTASY SCORING
====================================================== */

function calculateFantasyPoints(team: any[]) {
  const points: Record<number, number> = {
    1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
    6: 8, 7: 6, 8: 4, 9: 2, 10: 1,
  };

  const ranked = getRankedDrivers();

  return team.reduce((total, driver) => {
    const found = ranked.find((d) => d.id === driver.id);
    const pos = found?.position ?? 999;
    return total + (points[pos] || 0);
  }, 0);
}

/* ======================================================
   STREAM PLAYER
   - Uses the YouTube IFrame Player API (not a raw <iframe src>)
     so we can call player.seekTo() to scrub through the buffer.
     Changing an <iframe src> forces a full reload (the original
     bug); seekTo() jumps instantly without reloading anything.
   - The player is created once on mount and never recreated, so
     it's immune to the parent's once-per-second race-tick
     re-renders.
   - "Live edge" = how many seconds of buffered video exist right
     now. It grows by 1 every second on its own internal timer,
     independent of the driver table's tick.
====================================================== */

const STREAM_BUFFER_SECONDS = 120 * 60; // 2 hours of pre-roll buffer

let ytApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if ((window as any).YT && (window as any).YT.Player) {
    return Promise.resolve();
  }
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const prevCallback = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      prevCallback?.();
      resolve();
    };
    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  });

  return ytApiPromise;
}

const BufferedLiveStream = React.memo(function BufferedLiveStream({
  youtubeId,
}: {
  youtubeId: string;
}) {
  const mountedAt = React.useRef(Date.now());
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const playerRef = React.useRef<any>(null);

  const [playerReady, setPlayerReady] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [liveEdge, setLiveEdge] = useState(STREAM_BUFFER_SECONDS);
  const [position, setPosition] = useState(STREAM_BUFFER_SECONDS);
  const [isDragging, setIsDragging] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Create the player once on mount.
  React.useEffect(() => {
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || playerRef.current) return;

      playerRef.current = new (window as any).YT.Player(containerRef.current, {
        videoId: youtubeId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          start: STREAM_BUFFER_SECONDS,
        },
        events: {
          onReady: (e: any) => {
            setVideoDuration(e.target.getDuration?.() || null);
            setPlayerReady(true);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId]);

  // Independent 1s timer: advances the live edge and polls playback
  // position. Does not touch the iframe, so nothing reloads.
  React.useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - mountedAt.current) / 1000);
      const edge = videoDuration
        ? Math.min(STREAM_BUFFER_SECONDS + elapsed, videoDuration)
        : STREAM_BUFFER_SECONDS + elapsed;
      setLiveEdge(edge);

      if (playerRef.current?.getCurrentTime && !isDragging) {
        const current = playerRef.current.getCurrentTime();
        setPosition(current);
        setIsLive(edge - current < 3);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [isDragging, videoDuration]);

  function commitSeek(value: number) {
    playerRef.current?.seekTo?.(value, true);
    setIsDragging(false);
    setIsLive(liveEdge - value < 3);
  }

  function jumpToLive() {
    playerRef.current?.seekTo?.(liveEdge, true);
    playerRef.current?.playVideo?.();
    setPosition(liveEdge);
    setIsLive(true);
  }

  function toggleMute() {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute?.();
      if ((playerRef.current.getVolume?.() ?? 0) === 0) {
        playerRef.current.setVolume?.(100);
      }
      setIsMuted(false);
    } else {
      playerRef.current.mute?.();
      setIsMuted(true);
    }
  }

  function formatBehindLive(value: number) {
    const behind = Math.max(0, liveEdge - value);
    if (behind < 2) return "LIVE";
    const h = Math.floor(behind / 3600);
    const m = Math.floor((behind % 3600) / 60);
    const s = Math.floor(behind % 60);
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    return `-${h > 0 ? `${h}:` : ""}${mm}:${ss}`;
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ background: "#000" }}>
      <div className="relative flex-1 min-h-0">
        <div ref={containerRef} className="w-full h-full" />
        {!playerReady && (
          <div className="absolute inset-0 flex items-center justify-center font-mono text-xs tracking-[0.1em] uppercase text-ml-text-ghost">
            <div className="ml-stripes" />
            <span className="relative">Loading stream…</span>
          </div>
        )}
      </div>

      <div
        className="flex items-center gap-3 px-3 py-2"
        style={{ background: "var(--ml-surface)" }}
      >
        {isLive ? (
          <span className="relative overflow-hidden flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-[0.1em] uppercase shrink-0 w-16 px-1" style={{ color: "var(--ml-red)" }}>
            <span className="ml-stripes" />
            <span className="relative w-2 h-2 rounded-full ml-pulse" style={{ background: "var(--ml-red)" }} />
            <span className="relative">Live</span>
          </span>
        ) : (
          <button
            onClick={jumpToLive}
            className="font-mono text-[11px] font-bold tracking-[0.1em] uppercase text-ml-text-mute hover:text-ml-text shrink-0 px-2 py-1 border w-16"
            style={{ borderColor: "var(--ml-border)" }}
          >
            ⏵ Live
          </button>
        )}

        <input
          type="range"
          min={0}
          max={liveEdge}
          step={1}
          value={position}
          disabled={!playerReady}
          onChange={(e) => setPosition(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          onMouseUp={(e) => commitSeek(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => commitSeek(Number((e.target as HTMLInputElement).value))}
          className="flex-1"
        />

        <span className="font-mono text-[11px] text-ml-text-faint w-16 text-right shrink-0">
          {formatBehindLive(position)}
        </span>

        <button
          onClick={toggleMute}
          disabled={!playerReady}
          className="shrink-0 px-2 py-1 border text-ml-text-mute hover:text-ml-text text-sm"
          style={{ borderColor: "var(--ml-border)" }}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>
    </div>
  );
});

/* ======================================================
   SMALL UI HELPERS
====================================================== */

function Section({
  title,
  live,
  count,
  children,
}: {
  title: string;
  live?: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  const items = React.Children.toArray(children);
  if (items.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        {live && (
          <span className="w-2 h-2 rounded-full ml-pulse shrink-0" style={{ background: "var(--ml-red)" }} />
        )}
        <h2 className="font-mono text-xs sm:text-sm font-bold tracking-[0.16em] uppercase text-ml-text-dim">
          {title}
        </h2>
        {typeof count === "number" && (
          <span className="font-mono text-xs text-ml-text-ghost">({count})</span>
        )}
        <div className="flex-1 h-px" style={{ background: "var(--ml-border)" }} />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </section>
  );
}

function EventCard({ event, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="group p-5 border cursor-pointer transition-colors hover:border-ml-red"
      style={{ borderColor: "var(--ml-border)", background: "var(--ml-surface)" }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="font-bold leading-snug">{event.name}</div>
        {event.live && (
          <span
            className="relative overflow-hidden shrink-0 flex items-center gap-1 font-mono text-[10px] font-bold tracking-[0.1em] uppercase px-1.5 py-0.5"
            style={{ color: "var(--ml-red)", background: "rgba(255,0,57,0.1)" }}
          >
            <span className="ml-stripes" />
            <span className="relative w-1.5 h-1.5 rounded-full ml-pulse" style={{ background: "var(--ml-red)" }} />
            <span className="relative">Live</span>
          </span>
        )}
      </div>
      <div className="font-mono text-xs tracking-[0.06em] text-ml-text-ghost">
        {event.track}
      </div>
    </div>
  );
}

/* ======================================================
   DATA
====================================================== */

function getDrivers() {
  return [
    { id: 1, name: "Ivan Petrov", team: "Red Line", value: 12 },
    { id: 2, name: "Georgi Ivanov", team: "SpeedX", value: 10 },
    { id: 3, name: "Nikola Dimitrov", team: "Drift King", value: 8 },
    { id: 4, name: "Alex Ivanov", team: "Turbo Apex", value: 11 },
    { id: 5, name: "Martin Kolev", team: "Night Shift", value: 9 },
    { id: 6, name: "Dimitar Hristov", team: "Blackline", value: 7 },
    { id: 7, name: "Petar Stoyanov", team: "Velocity Union", value: 13 },
    { id: 8, name: "Stoyan Petrov", team: "Iron Drift", value: 6 },
    { id: 9, name: "Hristo Nikolov", team: "Skyline Garage", value: 10 },
    { id: 10, name: "Yordan Georgiev", team: "Red Zone", value: 8 },
  ];
}

function getEvents() {
  return [
    {
      id: "1",
      name: "Sofia Drift Championship",
      track: "Sofia Ring",
      live: true,
      youtubeId: "NLnbL4mvoC0",
    },
    {
      id: "2",
      name: "Black Sea Night Drift",
      track: "Varna Circuit",
      live: false,
      youtubeId: "ysz5S6PUM-U",
    },
  ];
}