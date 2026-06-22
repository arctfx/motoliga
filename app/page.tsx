"use client";

import React, { useMemo, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

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
   AUTH — uploads per Google account
   Replace the email key with your real Gmail address.
====================================================== */

type Upload = {
  id: string;
  name: string;
  track: string;
  live: boolean;
  youtubeId: string;
  ownedByUser: boolean;
};

const UPLOADS_BY_EMAIL: Record<string, Upload[]> = {
  "su.fs.racing@gmail.com": [
    {
      id: "usr-upload-01",
      name: "Plovdiv Hillclimb — Round 3",
      track: "Plovdiv Mountain Stage",
      live: false,
      youtubeId: "jfKfPfyJRdk",
      ownedByUser: true,
    },
  ],
};

/* ======================================================
   BRAND — LOGO & SHARED CHROME
====================================================== */

function MotoligaMark({ className = "" }: { className?: string }) {
  return (
    <img
      src="/motoliga2.svg"
      alt="Motoliga"
      width={300}
      height={100}
      className={className}
      aria-hidden="true"
    />
  );
}

function MotoligaLogo({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const heights = size === "lg" ? "h-10" : size === "sm" ? "h-5" : "h-7";
  return <MotoligaMark className={`${heights} w-auto ${className}`} />;
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
      style={{ background: "linear-gradient(90deg, var(--ml-red) 0 48px, var(--ml-border) 48px)" }}
    />
  );
}

/* ======================================================
   AUTH BUTTON — sign in or avatar, shown in every header
====================================================== */

function AuthButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = React.useState(false);

  // Still loading — show nothing to avoid flash
  if (status === "loading") return <div className="w-20 h-7" />;

  // Not signed in — show a simple Sign in button
  if (!session?.user) {
    return (
      <button
        onClick={() => signIn("google")}
        className="flex items-center gap-2 font-mono text-xs font-bold tracking-[0.1em] uppercase px-3 py-1.5 border transition-colors hover:border-ml-red hover:text-ml-text"
        style={{ borderColor: "var(--ml-border)", color: "var(--ml-text-mute)" }}
      >
        <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
        </svg>
        Sign in
      </button>
    );
  }

  // Signed in — show avatar + dropdown
  const initials = session.user.name
    ?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 font-mono text-xs tracking-[0.08em] uppercase text-ml-text-mute hover:text-ml-text transition-colors"
        aria-label="Account menu"
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name ?? ""}
            className="w-7 h-7 rounded-full border"
            style={{ borderColor: "var(--ml-border)" }}
          />
        ) : (
          <span
            className="w-7 h-7 flex items-center justify-center text-[11px] font-bold border"
            style={{ borderColor: "var(--ml-border)", background: "var(--ml-surface)", color: "var(--ml-red)" }}
          >
            {initials}
          </span>
        )}
        <span className="hidden sm:inline">{session.user.name?.split(" ")[0]}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-10 z-40 w-52 border py-1 font-mono text-xs"
            style={{ background: "var(--ml-surface)", borderColor: "var(--ml-border)" }}
          >
            <div
              className="px-3 py-2 text-ml-text-ghost border-b truncate"
              style={{ borderColor: "var(--ml-border)" }}
            >
              {session.user.email}
            </div>
            <button
              onClick={() => { signOut(); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-ml-text-dim hover:text-ml-red transition-colors tracking-[0.06em] uppercase"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ======================================================
   APP HEADER & FOOTER
====================================================== */

function AppHeader({ onLogoClick, right }: { onLogoClick?: () => void; right?: React.ReactNode }) {
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-8 py-4 border-b backdrop-blur"
      style={{ borderColor: "var(--ml-border)", background: "rgba(12,13,16,0.85)" }}
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
   APP ROOT — no login gate, guests welcome
====================================================== */

export default function MotorsportAppRoot() {
  const { data: session } = useSession();
  const [route, setRoute] = useState("streams");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // If signed in, show that user's uploads above the public streams
  const userEmail = session?.user?.email ?? "";
  const userUploads: Upload[] = UPLOADS_BY_EMAIL[userEmail] ?? [];
  const baseEvents = getEvents();
  const allEvents = [...userUploads, ...baseEvents];
  const liveEvents = baseEvents.filter((e) => e.live);
  const finishedEvents = baseEvents.filter((e) => !e.live);

  if (route === "event" && selectedEventId) {
    const event = allEvents.find((e) => e.id === selectedEventId);
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setRoute("fantasy")}
              className="font-mono text-xs sm:text-sm font-bold tracking-[0.1em] uppercase px-4 py-2 border transition-colors hover:bg-ml-red hover:text-[#0c0d10]"
              style={{ borderColor: "var(--ml-red)", color: "var(--ml-red)" }}
            >
              Fantasy League
            </button>
            <AuthButton />
          </div>
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

        {/* Only visible when signed in with an account that has uploads */}
        {userUploads.length > 0 && (
          <Section title="Your uploads" count={userUploads.length} owned>
            {userUploads.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                onClick={() => { setSelectedEventId(e.id); setRoute("event"); }}
              />
            ))}
          </Section>
        )}

        <Section title="Live now" live count={liveEvents.length}>
          {liveEvents.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              onClick={() => { setSelectedEventId(e.id); setRoute("event"); }}
            />
          ))}
        </Section>

        <Section title="Finished streams" count={finishedEvents.length}>
          {finishedEvents.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              onClick={() => { setSelectedEventId(e.id); setRoute("event"); }}
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
  React.useEffect(() => { initRaceEngine(); }, []);

  const tick = useRaceTick(1000);
  const [team] = useGlobalTeam();
  const score = useMemo(() => calculateFantasyPoints(team), [team]);
  const ranked = React.useMemo(() => getRankedDrivers(), [tick]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ml-bg)" }}>
      <AppHeader
        onLogoClick={onBack}
        right={
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="font-mono text-xs tracking-[0.14em] uppercase text-ml-text-faint hover:text-ml-text transition-colors hidden sm:block"
            >
              ← Streams
            </button>
            <AuthButton />
          </div>
        }
      />

      <main className="flex-1 px-5 sm:px-8 py-6 sm:py-8 max-w-6xl w-full mx-auto">
        <button
          onClick={onBack}
          className="font-mono text-xs tracking-[0.14em] uppercase text-ml-text-faint hover:text-ml-text mb-5 transition-colors sm:hidden"
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
            {event.driveId
              ? <DriveStream driveId={event.driveId} />
              : <BufferedLiveStream youtubeId={event.youtubeId} />
            }
          </div>
        </div>

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
    if (exists) { setTeam(team.filter((t) => t.id !== driver.id)); return; }
    if (team.length >= 3) return;
    if (spent + driver.value > budget) return;
    setTeam([...team, driver]);
  }

  const score = calculateFantasyPoints(team);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ml-bg)" }}>
      <AppHeader
        onLogoClick={onBack}
        right={
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="font-mono text-xs tracking-[0.14em] uppercase text-ml-text-faint hover:text-ml-text transition-colors hidden sm:block"
            >
              ← Streams
            </button>
            <AuthButton />
          </div>
        }
      />

      <main className="flex-1 px-5 sm:px-8 py-6 sm:py-8 max-w-6xl w-full mx-auto">
        <button
          onClick={onBack}
          className="font-mono text-xs tracking-[0.14em] uppercase text-ml-text-faint hover:text-ml-text mb-5 transition-colors sm:hidden"
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
  getDrivers().forEach((d) => { DRIVER_STATE[d.id] = { score: Math.random() * 100 }; });
  setInterval(() => {
    getDrivers().forEach((d) => { DRIVER_STATE[d.id].score += (Math.random() - 0.5) * 10; });
  }, 5000);
}

function getRankedDrivers() {
  return getDrivers()
    .map((d) => ({ ...d, score: DRIVER_STATE[d.id]?.score ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .map((d, i) => ({ ...d, position: i + 1 }));
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
    return total + (points[found?.position ?? 999] || 0);
  }, 0);
}

/* ======================================================
   STREAM PLAYER
====================================================== */

const STREAM_BUFFER_SECONDS = 120 * 60;

let ytApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if ((window as any).YT && (window as any).YT.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prevCallback = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => { prevCallback?.(); resolve(); };
    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  });
  return ytApiPromise;
}

function DriveStream({ driveId }: { driveId: string }) {
  return (
    <div className="w-full h-full" style={{ background: "#000" }}>
      <iframe
        src={`https://drive.google.com/file/d/${driveId}/preview`}
        className="w-full h-full"
        style={{ border: "none", display: "block" }}
        allow="autoplay"
        allowFullScreen
      />
    </div>
  );
}

const BufferedLiveStream = React.memo(function BufferedLiveStream({ youtubeId }: { youtubeId: string }) {
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

  React.useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || playerRef.current) return;
      playerRef.current = new (window as any).YT.Player(containerRef.current, {
        videoId: youtubeId,
        width: "100%",
        height: "100%",
        playerVars: { autoplay: 1, mute: 1, controls: 0, modestbranding: 1, rel: 0, start: STREAM_BUFFER_SECONDS },
        events: {
          onReady: (e: any) => { setVideoDuration(e.target.getDuration?.() || null); setPlayerReady(true); },
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
      if ((playerRef.current.getVolume?.() ?? 0) === 0) playerRef.current.setVolume?.(100);
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
    return `-${h > 0 ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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

      <div className="flex items-center gap-3 px-3 py-2" style={{ background: "var(--ml-surface)" }}>
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
          type="range" min={0} max={liveEdge} step={1} value={position}
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
  title, live, owned, count, children,
}: {
  title: string; live?: boolean; owned?: boolean; count?: number; children: React.ReactNode;
}) {
  if (React.Children.toArray(children).length === 0) return null;
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        {live && <span className="w-2 h-2 rounded-full ml-pulse shrink-0" style={{ background: "var(--ml-red)" }} />}
        {owned && <span className="w-2 h-2 shrink-0" style={{ background: "var(--ml-text-ghost)" }} />}
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
      style={{
        borderColor: event.ownedByUser ? "var(--ml-border-strong)" : "var(--ml-border)",
        background: "var(--ml-surface)",
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="font-bold leading-snug">{event.name}</div>
        <div className="flex items-center gap-1.5 shrink-0">
          {event.ownedByUser && (
            <span
              className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase px-1.5 py-0.5"
              style={{ color: "var(--ml-text-faint)", background: "var(--ml-surface-alt)", border: "1px solid var(--ml-border)" }}
            >
              Your upload
            </span>
          )}
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
    { id: 1, name: "Chemnitz TU", team: "TUC Racing eV", value: 0.12 },
    { id: 2, name: "Pforzeim TU", team: "Rennschmeide Pforzeim eV", value: 0.10 },
    { id: 3, name: "Stockholm KTH", team: "KTH Formula Student", value: 0.8 },
    { id: 4, name: "Lemgo TH OWL", team: "OWL Racing Team", value: 0.11 },
    { id: 5, name: "Ghent U", team: "UGent Racing", value: 0.9 },
    { id: 6, name: "Bath U", team: "Bath University Racing", value: 0.7 },
    { id: 7, name: "Lisboa IST", team: "Lisboa FST", value: 0.13 },
    { id: 8, name: "Poznan PUT", team: "PUT Motorsport Electric", value: 0.6 },
    { id: 9, name: "Sion HES", team: "Valais Wallis Racing Team", value: 0.10 },
    { id: 10, name: "Winterthur ZHAW", team: "Zurich UAS Racing", value: 0.8 },
  ];
}

function getEvents() {
  return [
    { id: "1", name: "Formula Student Germany Endurance", track: "Hockenheim, Germany", live: true, youtubeId: "NLnbL4mvoC0" },
    { id: "2", name: "FSG Historic Acceleration", track: "Hockenheim, Germany", live: false, youtubeId: "xGOJJVq7yXU" },
  ];
}
