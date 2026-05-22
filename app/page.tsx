"use client";

import React, { useEffect, useMemo, useState } from "react";

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

export default function MotorsportAppRoot() {
  const [route, setRoute] = useState("streams");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const events = getEvents();

  const liveEvents = events.filter((e) => e.live);
  const finishedEvents = events.filter((e) => !e.live);

  // -------------------------
  // EVENT DETAIL
  // -------------------------
  if (route === "event" && selectedEventId) {
    const event = events.find((e) => e.id === selectedEventId);
    if (!event) return null;

    return (
      <EventPage event={event} onBack={() => setRoute("streams")} />
    );
  }

  // -------------------------
  // FANTASY PAGE
  // -------------------------
  if (route === "fantasy") {
    return <FantasyPage onBack={() => setRoute("streams")} />;
  }

  // -------------------------
  // STREAMS PAGE
  // -------------------------
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

      <section className="mb-10">
        <h2 className="text-xl font-bold text-red-500 mb-4">🔴 Live Now</h2>
        <div className="grid gap-4">
          {liveEvents.map((e) => (
            <div
              key={e.id}
              onClick={() => {
                setSelectedEventId(e.id);
                setRoute("event");
              }}
              className="p-4 border border-red-600 bg-zinc-900 rounded-xl cursor-pointer"
            >
              <div className="font-bold">{e.name}</div>
              <div className="text-sm text-zinc-400">{e.track}</div>
              <span className="text-xs text-red-400">LIVE</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Finished Streams</h2>
        <div className="grid gap-4">
          {finishedEvents.map((e) => (
            <div
              key={e.id}
              onClick={() => {
                setSelectedEventId(e.id);
                setRoute("event");
              }}
              className="p-4 border border-zinc-700 bg-zinc-900 rounded-xl cursor-pointer"
            >
              <div className="font-bold">{e.name}</div>
              <div className="text-sm text-zinc-400">{e.track}</div>
              <span className="text-xs text-zinc-500">FINISHED</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ======================================================
// EVENT PAGE
// ======================================================
function EventPage({ event, onBack }: any) {
  const drivers = getDrivers();
  const [team] = useGlobalTeam();
  const score = React.useMemo(() => calculateFantasyPoints(team), [team]);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <button onClick={onBack} className="text-zinc-400 mb-4">
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">{event.name}</h1>

      <div className="aspect-video mb-6">
        <BufferedLiveStream youtubeId={event.youtubeId} />
      </div>

      <h2 className="font-bold mb-3">Drivers</h2>

      <h2 className="font-bold mb-3">
        Drivers
      </h2>

      <div className="mb-4 p-3 bg-zinc-900 rounded-xl">
        <div className="text-sm text-zinc-400">
          Your Live Fantasy Points
        </div>

        <div className="text-xl font-bold text-green-400">
          {score}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {drivers.map((d) => {
          const isSelected = team.find((t) => t.id === d.id);
          const pos = getDriverPosition(d.id);

          return (
            <div
              key={d.id}
              className={`p-3 rounded-xl border transition ${isSelected
                  ? "bg-green-700 border-green-400 shadow-lg"
                  : "bg-zinc-900 border-zinc-800"
                }`}
            >
              <div className="font-bold flex justify-between">
                {d.name}

                {isSelected && (
                  <span className="text-xs text-black bg-green-300 px-2 rounded">
                    YOUR DRIVER
                  </span>
                )}
              </div>

              <div className="text-sm text-zinc-400">{d.team}</div>

              <div className="text-xs text-zinc-500">
                Position: {pos} | ${d.value}M
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ======================================================
// FANTASY ENGINE (LIVE + PERSISTENT + SCORING)
// ======================================================
const DRIVER_STATE: Record<number, number> = {};

function getDriverPosition(driverId: number) {
  if (!DRIVER_STATE[driverId]) {
    DRIVER_STATE[driverId] = Math.floor(Math.random() * 10) + 1;
  }

  const drift = Math.random() < 0.4 ? (Math.random() < 0.5 ? -1 : 1) : 0;

  DRIVER_STATE[driverId] = Math.max(
    1,
    Math.min(10, DRIVER_STATE[driverId] + drift)
  );

  return DRIVER_STATE[driverId];
}

function calculateFantasyPoints(team: any[]) {
  const pointsTable: Record<number, number> = {
    1: 25,
    2: 18,
    3: 15,
    4: 12,
    5: 10,
    6: 8,
    7: 6,
    8: 4,
    9: 2,
    10: 1,
  };

  return team.reduce((t, d) => {
    const pos = getDriverPosition(d.id);
    return t + (pointsTable[pos] || 0);
  }, 0);
}

// ======================================================
// FANTASY PAGE
// ======================================================
function FantasyPage({ onBack }: any) {
  const drivers = getDrivers();

  const [team, setTeam] = useGlobalTeam();

  const [tick, setTick] = useState(0);

  useEffect(() => {
    localStorage.setItem("fantasy_team", JSON.stringify(team));
  }, [team]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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
      <button onClick={onBack} className="text-zinc-400 mb-4">
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-2">🏎 Fantasy League</h1>

      <div className="mb-6 text-sm text-zinc-400">
        Budget: ${budget}M | Spent: ${spent}M |{" "}
        <span className="text-green-400 font-bold">
          Live Points: {score}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {drivers.map((d) => {
          const selected = team.find((t) => t.id === d.id);

          return (
            <div
              key={d.id}
              onClick={() => toggleDriver(d)}
              className={`p-4 rounded-xl border cursor-pointer ${selected
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

      <div className="p-4 bg-zinc-900 rounded-xl">
        <h2 className="font-bold mb-2">Your Team</h2>

        {team.length === 0 && (
          <p className="text-zinc-500">No drivers selected</p>
        )}

        {team.map((d) => (
          <div key={d.id} className="text-sm">
            {d.name}
          </div>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// STREAM PLAYER (FIXED LIVE DVR SYSTEM)
// ======================================================
function BufferedLiveStream({ youtubeId }: { youtubeId: string }) {
  const STREAM_START_TIME = React.useMemo(() => Date.now() - 120 * 60 * 1000, []);

  const [playerKey, setPlayerKey] = useState(0);
  const [mode, setMode] = useState<"live" | "dvr">("live");
  const [scrubTime, setScrubTime] = useState(0);

  const now = Date.now();
  const liveSeconds = Math.max(0, Math.floor((now - STREAM_START_TIME) / 1000));

  const minAllowed = 0;
  const maxAllowed = liveSeconds;

  const currentTime = mode === "live" ? liveSeconds : scrubTime;

  function seekTo(time: number) {
    const clamped = Math.min(Math.max(time, minAllowed), maxAllowed);

    setMode("dvr");
    setScrubTime(clamped);
    setPlayerKey((k) => k + 1);
  }

  function goLive() {
    setMode("live");
    setScrubTime(liveSeconds);
    setPlayerKey((k) => k + 1);
  }

  function format(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const progress =
    maxAllowed > 0 ? ((currentTime - minAllowed) / (maxAllowed - minAllowed)) * 100 : 0;

  return (
    <div className="w-full">

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            LIVE
          </span>

          <button
            onClick={goLive}
            className="px-3 py-1 bg-zinc-800 rounded text-xs"
          >
            Go LIVE
          </button>
        </div>

        <div className="text-xs text-zinc-400">
          DVR: {format(currentTime)} / {format(liveSeconds)}
        </div>
      </div>

      <div className="aspect-video rounded-xl overflow-hidden border border-zinc-700 mb-3">
        <iframe
          key={playerKey}
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${youtubeId}?start=${currentTime}&autoplay=1&mute=1&controls=0&rel=0`}
          allowFullScreen
        />
      </div>

      <div className="relative h-3 bg-zinc-800 rounded-full mb-2 overflow-hidden">
        <div className="absolute top-0 left-0 h-full bg-zinc-600 w-full" />
        <div
          className="absolute top-0 h-full bg-red-500"
          style={{ width: `${progress}%` }}
        />

        <input
          type="range"
          min={minAllowed}
          max={maxAllowed}
          value={currentTime}
          onChange={(e) => seekTo(Number(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex justify-between text-xs text-zinc-500">
        <span>START</span>
        <span>LIVE</span>
      </div>
    </div>
  );
}

// ======================================================
// DATA
// ======================================================
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

