import Link from "next/link";
import { ArrowRight, Captions, Check, GraduationCap, Hand, Mic, ShieldCheck, Video, Volume2 } from "lucide-react";
import { CrewPicker } from "@/components/Crew";
import { HeroDemo } from "@/components/HeroDemo";
import { HandGlyph } from "@/components/HandGlyph";
import { SkeletonArt } from "@/components/SkeletonArt";
import { SHAPES } from "@/lib/signs";

const ACCESS = [
  "Captions you can resize up to extra-large",
  "Every control reachable by keyboard, with a visible focus ring",
  "Touch targets of 44px and up",
  "Respects reduced-motion: the avatar snaps between poses instead of gliding",
  "Signing speed down to half pace for learners",
  "Camera and microphone stay in your browser",
];

const TILE_LETTERS = ["A", "B", "C", "D", "I", "L", "O", "V", "W", "Y"];
const TILE_COLORS = ["#ff5aa8", "#ffc23d", "#b4f04a", "#3ddcf5", "#9b7bff"];

function Arrow() {
  return (
    <div className="grid place-items-center text-faint" aria-hidden>
      <ArrowRight className="h-6 w-6 rotate-90 md:rotate-0" />
    </div>
  );
}

export default function Home() {
  return (
    <div className="pt-6 sm:pt-12">
      {/* HERO */}
      <section className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
        <div className="sb-rise">
          <h1 className="font-display text-[clamp(2.75rem,6.5vw,5.25rem)] font-bold leading-[0.98] tracking-[-0.025em]">
            Every hand has something to{" "}
            <span className="sb-underline text-pink">
              say.
              <svg viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden>
                <path d="M2 8 C 22 2, 40 12, 58 6 S 88 3, 98 7" fill="none" stroke="var(--sb-amber)" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted sm:text-xl">
            SignBridge turns signing into speech and speech into signing, live. Fingerspell to your camera and it&apos;s spoken aloud. Talk back and a friendly avatar signs it to you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/call" className="sb-btn sb-btn-primary">
              <Video aria-hidden /> Start a live call
            </Link>
            <Link href="/practice" className="sb-btn sb-btn-ghost">
              <GraduationCap aria-hidden /> Learn to fingerspell
            </Link>
          </div>
          <p className="mt-8 flex items-center gap-2 text-sm text-faint">
            <ShieldCheck className="h-4 w-4 text-lime" aria-hidden />
            Runs in your browser. Video never leaves your device.
          </p>
        </div>
        <div className="sb-rise" style={{ animationDelay: "120ms" }}>
          <HeroDemo />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mt-28" aria-labelledby="how">
        <h2 id="how" className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          A bridge that runs both ways
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-muted">Two people, two languages, one screen. Each direction is its own little pipeline.</p>

        <div className="mt-10 space-y-5">
          {/* sign -> speech */}
          <div className="sb-card grid items-stretch gap-3 p-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:p-5">
            <div className="sb-well flex items-center gap-4 p-4">
              <SkeletonArt className="h-24 w-20 shrink-0" />
              <div>
                <div className="flex items-center gap-1.5 text-sm font-black text-pink">
                  <Hand className="h-4 w-4" aria-hidden /> You sign
                </div>
                <p className="mt-1 text-sm text-muted">21 landmarks per hand, tracked on-device. The skeleton glows brighter as confidence rises.</p>
              </div>
            </div>
            <Arrow />
            <div className="sb-well flex flex-col justify-center p-4">
              <div className="text-sm font-black text-amber">Recognised</div>
              <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-sm font-bold">
                {["ME", "NAME", "A-V-A", "NICE", "MEET", "YOU"].map((g) => (
                  <span key={g} className="rounded-full bg-amber/15 px-2.5 py-0.5 text-amber">
                    {g}
                  </span>
                ))}
              </div>
            </div>
            <Arrow />
            <div className="sb-well flex flex-col justify-center p-4">
              <div className="flex items-center gap-1.5 text-sm font-black text-lime">
                <Volume2 className="h-4 w-4" aria-hidden /> Spoken aloud
              </div>
              <p className="mt-1 font-display text-2xl font-bold leading-tight">&ldquo;My name is Ava, nice to meet you.&rdquo;</p>
              <p className="mt-1 text-xs text-faint">Polished into natural English by AI</p>
            </div>
          </div>

          {/* speech -> sign */}
          <div className="sb-card grid items-stretch gap-3 p-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:p-5">
            <div className="sb-well flex flex-col justify-center p-4">
              <div className="flex items-center gap-1.5 text-sm font-black text-cyan">
                <Mic className="h-4 w-4" aria-hidden /> They speak
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="sb-bars flex h-5 items-end gap-[3px] text-cyan" aria-hidden>
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
                <span className="font-display text-xl font-bold">nice to meet you</span>
              </div>
            </div>
            <Arrow />
            <div className="sb-well flex flex-col justify-center p-4">
              <div className="flex items-center gap-1.5 text-sm font-black text-violet">
                <Captions className="h-4 w-4" aria-hidden /> Live captions + gloss
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-sm font-bold">
                {["NICE", "MEET", "YOU"].map((g) => (
                  <span key={g} className="rounded-full bg-violet/20 px-2.5 py-0.5 text-violet">
                    {g}
                  </span>
                ))}
              </div>
            </div>
            <Arrow />
            <div className="sb-well flex items-center gap-4 p-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-pink/15">
                <HandGlyph shape={SHAPES.D} className="h-16 w-16" />
              </div>
              <div>
                <div className="text-sm font-black text-pink">Your buddy signs it</div>
                <p className="mt-1 text-sm text-muted">Words become signs; anything else is fingerspelled letter by letter.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CREW */}
      <section className="mt-28" aria-labelledby="crew">
        <h2 id="crew" className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Pick your signing buddy
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-muted">Five characters, one shared sign library. Tap one to make them your partner across the app.</p>
        <div className="mt-10">
          <CrewPicker />
        </div>
      </section>

      {/* PRACTICE + ACCESS */}
      <section className="mt-28 grid items-start gap-5 lg:grid-cols-[1.25fr_1fr]">
        <div className="sb-card relative overflow-hidden p-6 sm:p-8">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Learning to sign? Practise with feedback.</h2>
          <p className="mt-3 max-w-md text-muted">Your buddy shows the handshape, you copy it on camera. Hold it steady, the ring fills, and the streak climbs.</p>
          <div className="mt-6 grid grid-cols-5 gap-2">
            {TILE_LETTERS.map((l, i) => {
              const col = TILE_COLORS[i % TILE_COLORS.length];
              return (
                <div key={l} className="relative grid aspect-square place-items-center rounded-2xl" style={{ background: `color-mix(in oklab, ${col} 16%, var(--sb-surface-2))`, boxShadow: `inset 0 0 0 1.5px color-mix(in oklab, ${col} 45%, transparent)` }}>
                  <HandGlyph shape={SHAPES[l]} className="h-[70%] w-[70%]" />
                  <span className="absolute left-1.5 top-0.5 font-display text-base font-bold sm:left-2 sm:top-1 sm:text-lg" style={{ color: col }}>
                    {l}
                  </span>
                </div>
              );
            })}
          </div>
          <Link href="/practice" className="sb-btn sb-btn-cool mt-7">
            Start practising <ArrowRight aria-hidden />
          </Link>
        </div>

        <div className="sb-card p-6 sm:p-8">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Accessible from the first pixel</h2>
          <ul className="mt-6 space-y-4">
            {ACCESS.map((a) => (
              <li key={a} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lime/15 text-lime">
                  <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                </span>
                <span className="text-ink/90">{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="relative mt-28 overflow-hidden rounded-[32px] p-8 text-center sm:p-14" style={{ background: "linear-gradient(120deg, #3a1470 0%, #5a1a6e 40%, #0f4a6b 100%)" }}>
        <div aria-hidden className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-pink/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-cyan/25 blur-3xl" />
        <div className="relative">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Try the 30-second demo</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink/85">
            Fingerspell your name to the camera and hear it spoken. Then say &ldquo;nice to meet you&rdquo; and watch your buddy sign it back.
          </p>
          <Link href="/call" className="sb-btn sb-btn-primary mt-8">
            Open the live call <ArrowRight aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
