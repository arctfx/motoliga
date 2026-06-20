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
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🏁 Motorsport Streams</h1>

        <button
          onClick={() => setRoute("fantasy")}
          className="px-4 py-2 bg-purple-600 rounded-lg"
        >
          Fantasy League
        </button>
      </div>

      <Section title="🔴 Live Now" color="text-red-500">
        {liveEvents.map((e) => (
          <EventCard key={e.id} event={e} onClick={() => {
            setSelectedEventId(e.id);
            setRoute("event");
          }} />
        ))}
      </Section>

      <Section title="Finished Streams">
        {finishedEvents.map((e) => (
          <EventCard key={e.id} event={e} onClick={() => {
            setSelectedEventId(e.id);
            setRoute("event");
          }} />
        ))}
      </Section>
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
    <div className="min-h-screen bg-black text-white p-6">
      <button onClick={onBack} className="text-zinc-400 mb-4">← Back</button>

      <h1 className="text-2xl font-bold mb-4">{event.name}</h1>

      <div className="mb-6">
        <div className="aspect-video">
          <BufferedLiveStream youtubeId={event.youtubeId} />
        </div>
      </div>

      {/* TEAM SCORE */}
      <div className="mb-4 p-3 bg-zinc-900 rounded-xl">
        <div className="text-sm text-zinc-400">Your Fantasy Points</div>
        <div className="text-xl font-bold text-green-400">{score}</div>
      </div>

      {/* DRIVERS GRID */}
      <div className="grid md:grid-cols-3 gap-3">
        {ranked.map((d) => {
          const isSelected = team.find((t) => t.id === d.id);

          return (
            <div
              key={d.id}
              className={`p-3 rounded-xl border transition-all duration-500 ${
                isSelected
                  ? "bg-green-700 border-green-400"
                  : "bg-zinc-900 border-zinc-800"
              }`}
            >
              <div className="flex justify-between font-bold">
                {d.name}
                <span className="text-xs bg-black/40 px-2 rounded">
                  P{d.position}
                </span>
              </div>

              <div className="text-sm text-zinc-400">{d.team}</div>
              <div className="text-xs text-zinc-500">${d.value}M</div>
            </div>
          );
        })}
      </div>
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
    <div className="min-h-screen bg-black text-white p-8">
      <button onClick={onBack} className="text-zinc-400 mb-4">← Back</button>

      <h1 className="text-3xl font-bold mb-4">🏎 Fantasy League</h1>

      <div className="mb-6 text-sm text-zinc-400">
        Budget: ${budget}M | Spent: ${spent}M |{" "}
        <span className="text-green-400 font-bold">Points: {score}</span>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {drivers.map((d) => {
          const selected = team.find((t) => t.id === d.id);

          return (
            <div
              key={d.id}
              onClick={() => toggleDriver(d)}
              className={`p-4 rounded-xl border cursor-pointer ${
                selected
                  ? "bg-green-700 border-green-400"
                  : "bg-zinc-900 border-zinc-700"
              }`}
            >
              <div className="font-bold">{d.name}</div>
              <div className="text-sm text-zinc-400">{d.team}</div>
              <div className="text-xs text-zinc-500">${d.value}M</div>
            </div>
          );
        })}
      </div>
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
    <div className="w-full h-full flex flex-col bg-black">
      <div className="relative flex-1 min-h-0">
        <div ref={containerRef} className="w-full h-full" />
        {!playerReady && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
            Loading stream…
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 bg-zinc-900 px-3 py-2">
        {isLive ? (
          <span className="flex items-center gap-1 text-red-500 text-xs font-bold shrink-0 w-16">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
        ) : (
          <button
            onClick={jumpToLive}
            className="text-xs font-bold text-zinc-300 hover:text-white shrink-0 px-2 py-1 rounded bg-zinc-800 w-16"
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
          className="flex-1 accent-red-500"
        />

        <span className="text-xs text-zinc-400 w-16 text-right shrink-0">
          {formatBehindLive(position)}
        </span>
      </div>
    </div>
  );
});

/* ======================================================
   SMALL UI HELPERS
====================================================== */

function Section({ title, color, children }: any) {
  return (
    <section className="mb-10">
      <h2 className={`text-xl font-bold mb-4 ${color || ""}`}>{title}</h2>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function EventCard({ event, onClick }: any) {
  return (
    <div onClick={onClick} className="p-4 bg-zinc-900 rounded-xl cursor-pointer">
      <div className="font-bold">{event.name}</div>
      <div className="text-sm text-zinc-400">{event.track}</div>
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
