import React from 'react';
import { motion } from 'framer-motion';
import {
  Menu,
  Waves,
  ChevronRight,
  Wifi,
  Thermometer,
  Droplets,
  Anchor,
  Map,
  Satellite,
  Compass,
  Database,
  Layers3,
  Radio,
  Activity,
  Gauge,
  BookOpen,
  ArrowRight,
  Play,
} from 'lucide-react';
import { useOceanStore } from '../../stores/oceanStore';
import Ocean3DGlobe from './Ocean3DGlobe';

interface LandingPageProps {
  onLaunch: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  officerName: string;
}

const stats = [
  { value: '7', label: 'Depth layers', detail: '0m → 1000m', icon: Layers3 },
  { value: '1/12°', label: 'Model resolution', detail: 'ROMS grid', icon: Gauge },
  { value: '4D', label: 'Ocean variables', detail: 'Time + depth', icon: Activity },
  { value: 'LIVE', label: 'Argo validation', detail: 'In-situ feeds', icon: Radio },
];

const capabilities = [
  {
    icon: Layers3,
    title: 'Explore the water column',
    text: 'Move from the surface to 1000m depth and reveal temperature, salinity, chlorophyll and current structures.',
  },
  {
    icon: Radio,
    title: 'Validate with real observations',
    text: 'Compare numerical forecasts with autonomous Argo profiles and inspect the difference at individual locations.',
  },
  {
    icon: Activity,
    title: 'See change through time',
    text: 'Play the temporal model sequence and follow how ocean conditions evolve across the Arabian Sea.',
  },
];

const workflow = [
  ['01', 'Choose a variable', 'Temperature, salinity, chlorophyll or currents.'],
  ['02', 'Select a depth', 'Slice the digital ocean from 0m to 1000m.'],
  ['03', 'Inspect the data', 'Click observations to open detailed CTD profiles.'],
  ['04', 'Validate the model', 'Compare forecast and in-situ measurements.'],
];

export default function LandingPage({
  onLaunch,
  onLogout,
  officerName,
}: LandingPageProps) {
  const setViewMode = useOceanStore((s) => s.setViewMode);

  const launch3D = () => {
    setViewMode('volume');
    onLaunch();
  };

  const launchMap = () => {
    setViewMode('map2d');
    onLaunch();
  };

  return (
    <div className="relative min-h-screen overflow-y-auto overflow-x-hidden bg-[#020716] text-slate-100 font-sans selection:bg-cyan-400/30">
      {/* Background Cybernetic Ocean Atmosphere & Top Ambient Light Beams */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Top-Right Glowing Light Flare Beam (Matching Reference Header Light) */}
        <div className="absolute -top-32 left-1/3 w-[900px] h-[450px] bg-gradient-to-b from-cyan-400/[0.18] via-blue-500/[0.08] to-transparent blur-[120px] -rotate-12 pointer-events-none" />
        <div className="absolute top-1/4 -left-20 h-[700px] w-[700px] rounded-full bg-cyan-500/[0.10] blur-[170px]" />
        <div className="absolute top-1/3 right-0 h-[850px] w-[850px] rounded-full bg-blue-600/[0.14] blur-[190px]" />
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(56,189,248,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.14) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          }}
        />
      </div>

      {/* ── TOP HEADER NAVBAR ── */}
      <header className="sticky top-0 z-50 border-b border-cyan-400/20 bg-[#020716]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-[68px] max-w-[1536px] items-center justify-between px-4 sm:px-8">
          {/* Left: Hamburger Menu + Inline Wave Logo + Ocean 3D */}
          <div className="flex items-center gap-5">
            <button className="p-2 text-slate-300 hover:text-cyan-400 transition cursor-pointer">
              <Menu className="h-5 w-5" />
            </button>

            <button onClick={launch3D} className="flex items-center gap-3 text-left group">
              <Waves className="h-6 w-6 text-cyan-400 stroke-[2.5]" />
              <span className="text-2xl font-black tracking-tight text-white">
                Ocean <span className="text-cyan-400">3D</span>
              </span>
            </button>
          </div>

          {/* Right Status Indicators: SYSTEM ONLINE | SATELLITE DATA | LIVE | Wifi Icon */}
          <div className="flex items-center gap-4 font-mono text-[12px] uppercase tracking-wider text-slate-300">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
              <span>SYSTEM ONLINE</span>
            </div>
            <span className="text-slate-600 font-normal">|</span>
            <div className="hidden sm:block text-slate-300">SATELLITE DATA</div>
            <span className="hidden sm:inline text-slate-600 font-normal">|</span>
            <div className="text-slate-300">LIVE</div>
            <Wifi className="h-4.5 w-4.5 text-cyan-400" />
            {officerName && (
              <>
                <span className="text-slate-600 font-normal">|</span>
                <button
                  onClick={onLogout}
                  className="text-xs text-slate-400 hover:text-cyan-300 transition cursor-pointer ml-1"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <main className="relative z-10">
        <section className="relative w-full min-h-[calc(100vh-68px)] flex items-center justify-between py-6 lg:py-8 px-4 sm:px-6 lg:px-10 max-w-[1600px] mx-auto">
          <div className="w-full grid grid-cols-1 lg:grid-cols-[28%_44%_28%] items-center gap-6 relative z-10">

            {/* ── LEFT SIDE INFO PANEL ── */}
            <motion.div
              initial={{ opacity: 0, x: -25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-4 w-full order-2 lg:order-1"
            >
              <div className="flex items-center gap-2 text-[11px] font-mono tracking-[0.2em] text-cyan-400 font-bold uppercase">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8] animate-pulse" />
                <span>OCEAN MODEL SPECS</span>
              </div>

              {/* Card 1: Water Column Depth */}
              <div className="rounded-2xl border border-cyan-500/25 bg-[#040f26]/85 p-4 backdrop-blur-xl shadow-[0_0_20px_rgba(0,229,255,0.12)]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-cyan-500/15 text-cyan-300">
                    <Layers3 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                      7 DEPTH LAYERS
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      0m → 1000m Water Column
                    </div>
                  </div>
                </div>
                <p className="mt-2.5 text-xs text-slate-300/80 leading-relaxed font-sans">
                  Slice temperature, salinity, currents & biology down to 1,000m depth across the Arabian Sea.
                </p>
              </div>

              {/* Card 2: Model Resolution */}
              <div className="rounded-2xl border border-cyan-500/25 bg-[#040f26]/85 p-4 backdrop-blur-xl shadow-[0_0_20px_rgba(0,229,255,0.12)]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-cyan-500/15 text-cyan-300">
                    <Gauge className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                      1/12° GRID RESOLUTION
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      ROMS Numerical Solver
                    </div>
                  </div>
                </div>
                <p className="mt-2.5 text-xs text-slate-300/80 leading-relaxed font-sans">
                  High-fidelity numerical hydrodynamic grid driven by INCOIS ocean forecast feeds.
                </p>
              </div>

              {/* Card 3: Argo Validation */}
              <div className="rounded-2xl border border-cyan-500/25 bg-[#040f26]/85 p-4 backdrop-blur-xl shadow-[0_0_20px_rgba(0,229,255,0.12)]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-cyan-500/15 text-cyan-300">
                    <Radio className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                      IN-SITU CTD SYNC
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      Argo Profiling Floats
                    </div>
                  </div>
                </div>
                <p className="mt-2.5 text-xs text-slate-300/80 leading-relaxed font-sans">
                  Direct validation between forecast layers and autonomous CTD ocean observations.
                </p>
              </div>
            </motion.div>

            {/* ── CENTER COLUMN: SMALLER GLOBE + LAUNCH BUTTON ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center justify-center w-full order-1 lg:order-2"
            >
              {/* Globe Container */}
              <div className="relative w-full max-w-[500px] h-[400px] sm:h-[460px] lg:h-[480px]">
                <Ocean3DGlobe />

                {/* Floating Top Badge */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full border border-cyan-400/35 bg-[#040f26]/90 px-4 py-1.5 font-mono text-[10px] text-cyan-300 font-bold backdrop-blur-xl shadow-[0_0_15px_rgba(0,229,255,0.2)] pointer-events-none flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>AI MODE: FEED SYNCHRONIZED</span>
                </div>
              </div>

              {/* MAIN PAGE ACTION BUTTONS */}
              <div className="mt-2 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-[480px]">
                <button
                  onClick={launch3D}
                  className="group flex-1 w-full flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#00e5ff] via-[#0284c7] to-[#0072ff] px-7 py-4 text-xs font-black tracking-widest text-white uppercase shadow-[0_0_35px_rgba(0,229,255,0.6)] hover:shadow-[0_0_55px_rgba(0,229,255,0.85)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="h-4 w-4 fill-current text-white" />
                  <span className="text-white font-black tracking-widest text-sm">ENTER DIGITAL TWIN</span>
                  <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-1 transition" />
                </button>

                <button
                  onClick={launchMap}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#061533] border border-cyan-500/35 px-5 py-4 text-xs font-extrabold tracking-wider text-slate-200 hover:border-cyan-400 hover:text-white transition cursor-pointer"
                >
                  <Compass className="h-4 w-4 text-cyan-400" />
                  <span>2D MAP</span>
                </button>
              </div>
            </motion.div>

            {/* ── RIGHT SIDE INFO PANEL ── */}
            <motion.div
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-4 w-full order-3 lg:order-3"
            >
              <div className="flex items-center gap-2 text-[11px] font-mono tracking-[0.2em] text-cyan-400 font-bold uppercase">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                <span>REAL-TIME TELEMETRY</span>
              </div>

              {/* Card 1: Sea Surface Temperature */}
              <div className="rounded-2xl border border-cyan-500/25 bg-[#040f26]/85 p-4 backdrop-blur-xl shadow-[0_0_20px_rgba(0,229,255,0.12)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-cyan-500/15 text-cyan-300">
                      <Thermometer className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                        SURFACE TEMP
                      </div>
                      <div className="text-2xl font-black text-white font-mono tracking-tight mt-0.5">
                        28.4°C
                      </div>
                    </div>
                  </div>
                  <div className="h-6 w-16 opacity-80">
                    <svg className="w-full h-full stroke-cyan-400 fill-none" viewBox="0 0 100 20">
                      <path d="M0,10 Q25,0 50,10 T100,10" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 2: Salinity Level */}
              <div className="rounded-2xl border border-cyan-500/25 bg-[#040f26]/85 p-4 backdrop-blur-xl shadow-[0_0_20px_rgba(0,229,255,0.12)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-cyan-500/15 text-cyan-300">
                      <Droplets className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                        SALINITY LEVEL
                      </div>
                      <div className="text-2xl font-black text-white font-mono tracking-tight mt-0.5">
                        35.2 <span className="text-xs font-bold text-slate-300">PSU</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-6 w-16 opacity-80">
                    <svg className="w-full h-full stroke-cyan-400 fill-none" viewBox="0 0 100 20">
                      <path d="M0,12 Q20,24 40,12 T80,12 T100,6" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 3: Satellite Data Status */}
              <div className="rounded-2xl border border-cyan-500/25 bg-[#040f26]/85 p-4 backdrop-blur-xl shadow-[0_0_20px_rgba(0,229,255,0.12)]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-cyan-500/15 text-cyan-300">
                    <Satellite className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      SATELLITE FEED LIVE
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      Arabian Sea Basin
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-cyan-400/15 pt-2">
                  <span>LAT: 5.0°N — 25.0°N</span>
                  <span className="text-emerald-400 font-bold">100% SYNCHRONIZED</span>
                </div>
              </div>
            </motion.div>

          </div>
        </section>


        {/* ── METRICS SECTION ── */}
        <section className="border-y border-cyan-400/10 bg-[#040b18]/75">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-cyan-400/10 sm:grid-cols-4 sm:divide-y-0">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-3 px-5 py-6 sm:px-7">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-cyan-400/10 bg-cyan-400/[0.04]">
                    <Icon className="h-4 w-4 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{stat.value}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {stat.label}
                    </div>
                    <div className="text-[9px] font-mono text-slate-600">{stat.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CAPABILITIES SECTION ── */}
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400">
                /01 — Platform
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                From raw ocean data to
                <span className="text-cyan-300"> useful insight.</span>
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-500">
              One interface for numerical models, observations and spatial exploration.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {capabilities.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: index * 0.08 }}
                  className="group rounded-2xl border border-slate-800 bg-slate-900/45 p-6 transition hover:-translate-y-1 hover:border-cyan-400/25 hover:bg-slate-900/70"
                >
                  <div className="mb-8 flex items-center justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.05]">
                      <Icon className="h-5 w-5 text-cyan-300" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-700">0{index + 1}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  <p className="mt-3 text-xs leading-6 text-slate-400">{item.text}</p>
                  <div className="mt-6 flex items-center gap-1 text-[10px] font-semibold text-cyan-400">
                    EXPLORE <ChevronRight className="h-3 w-3" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── WORKFLOW SECTION ── */}
        <section className="border-y border-cyan-400/10 bg-[#030a16]">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <div className="mb-10">
              <div className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400">
                /02 — Workflow
              </div>
              <h2 className="text-3xl font-bold text-white">Four steps. One ocean.</h2>
            </div>

            <div className="grid gap-px overflow-hidden rounded-2xl border border-slate-800 bg-slate-800 sm:grid-cols-2 lg:grid-cols-4">
              {workflow.map(([num, title, text]) => (
                <div key={num} className="bg-[#06101d] p-6">
                  <div className="font-mono text-2xl font-bold text-cyan-400/70">{num}</div>
                  <h3 className="mt-7 text-sm font-bold text-white">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA SECTION ── */}
        <section className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.08] via-blue-500/[0.06] to-transparent px-6 py-12 sm:px-12">
            <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
            <Database className="mx-auto h-7 w-7 text-cyan-300" />
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-white">
              Ready to enter the digital ocean?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
              Open the volumetric scene to explore the model, or switch to the GIS view for a
              geographic overview.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                onClick={launch3D}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 cursor-pointer"
              >
                Enter 3D Scene <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={launchMap}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/30 cursor-pointer"
              >
                <Compass className="h-4 w-4 text-cyan-300" /> Open GIS View
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900 bg-[#01040b]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>OCEAN3D • ARABIAN SEA DIGITAL TWIN • SIH-26067</span>
          <span>INCOIS • Ministry of Earth Sciences • Government of India</span>
        </div>
      </footer>
    </div>
  );
}
