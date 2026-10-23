"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CHARACTERS, getCharacter } from "@/lib/characters";
import { useCharacterId } from "@/lib/prefs";
import { Avatar } from "./Avatar";
import { REST_L, REST_R } from "@/lib/signs";
import { BookOpen, ChevronDown, Dumbbell, GraduationCap, Video } from "lucide-react";
import { LogoMark, Wordmark } from "./Logo";

const LINKS = [
  { href: "/call", label: "Live call", icon: Video },
  { href: "/practice", label: "Practice", icon: GraduationCap },
  { href: "/learn", label: "Phrasebook", icon: BookOpen },
  { href: "/train", label: "Train", icon: Dumbbell },
];

const STILL = { R: REST_R, L: REST_L };

export function Nav() {
  const path = usePathname();
  const [id, setId] = useCharacterId();
  const [open, setOpen] = useState(false);
  const c = getCharacter(id);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => !menuRef.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <nav className="sb-card mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-4" aria-label="Main">
        <Link href="/" className="flex items-center gap-2 rounded-full pr-2">
          <LogoMark />
          <Wordmark />
        </Link>
        <ul className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = path.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-bold transition ${active ? "bg-ink text-[#170c33]" : "text-muted hover:bg-surface-2 hover:text-ink"}`}
                >
                  <l.icon className="h-[18px] w-[18px]" aria-hidden />
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div ref={menuRef} className="relative ml-auto md:ml-2">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-haspopup="listbox"
            className="flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pl-1 pr-3 font-bold hover:bg-white/10"
          >
            <span className="h-10 w-10 overflow-hidden rounded-full" style={{ background: `${c.aura}33` }}>
              <Avatar character={c} pose={STILL} className="h-[160%] w-[160%] -translate-x-[19%] -translate-y-[3%]" />
            </span>
            <span className="hidden sm:inline">{c.name}</span>
            <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {open && (
            <ul role="listbox" aria-label="Choose your signing buddy" className="sb-card sb-rise absolute right-0 mt-2 w-72 p-2">
              {CHARACTERS.map((ch) => (
                <li key={ch.id}>
                  <button
                    role="option"
                    aria-selected={ch.id === c.id}
                    onClick={() => {
                      setId(ch.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-white/10 ${ch.id === c.id ? "bg-white/10" : ""}`}
                  >
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl" style={{ background: `${ch.aura}40` }}>
                      <Avatar character={ch} pose={STILL} className="h-[160%] w-[160%] -translate-x-[19%] -translate-y-[3%]" />
                    </span>
                    <span>
                      <span className="block font-bold">{ch.name}</span>
                      <span className="block text-xs text-muted">{ch.tagline}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>
      <ul className="mx-auto mt-2 flex max-w-7xl gap-1 overflow-x-auto md:hidden">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className={`inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-bold ${path.startsWith(l.href) ? "bg-ink text-[#170c33]" : "bg-surface text-ink"}`}
            >
              <l.icon className="h-4 w-4" aria-hidden />
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </header>
  );
}
