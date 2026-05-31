"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { SEED_DEMO_TIPS, type DemoTip } from "@/lib/story-demo";
import { StoryDashboardScene } from "@/components/story/story-dashboard-scene";
import { StoryIntakeScene } from "@/components/story/story-intake-scene";

const SCENES = [
  { id: "s-open", title: "Open" },
  { id: "s-problem", title: "The problem" },
  { id: "s-shift", title: "The shift" },
  { id: "s-krava", title: "What Krava is" },
  { id: "s-passkey", title: "Private PasskeyID" },
  { id: "s-memory", title: "Secure Memory" },
  { id: "s-llm", title: "PrivateLLM" },
  { id: "s-router", title: "Inference Router" },
  { id: "s-app", title: "Our app" },
  { id: "s-intake", title: "Submit a tip" },
  { id: "s-dash", title: "Journalist's desk" },
  { id: "s-linq", title: "Linq · iMessage" },
  { id: "s-why", title: "Why it wins" },
] as const;

const DASHBOARD_SCENE_INDEX = SCENES.findIndex((scene) => scene.id === "s-dash");

const CONSTELLATION_STARS = [
  { name: "Krava depth", sub: "four primitives, used" },
  { name: "Privacy-first", sub: "exposure by design: none" },
  { name: "Experience", sub: "calm, legible, alive" },
  { name: "Creativity", sub: "redaction as light" },
  { name: "Execution", sub: "shipped & live" },
  { name: "Linq", sub: "two-way iMessage" },
];

type Particle = {
  id: number;
  oy: number;
  dx: number;
  delay: string;
  duration: string;
};

function buildParticles(): Particle[] {
  return Array.from({ length: 22 }, (_, id) => {
    const oy = Math.random() * 120 - 60;
    return {
      id,
      oy,
      dx: 520 + Math.random() * 60,
      delay: (Math.random() * 4.2).toFixed(2),
      duration: (3.6 + Math.random() * 1.6).toFixed(2),
    };
  });
}

function GuaranteeUse({ children }: { children: React.ReactNode }) {
  return (
    <div className="uses anim d3">
      <span className="sg" aria-hidden="true" />
      <span className="txt">
        <b>SourceShield uses this</b>
        <span>{children}</span>
      </span>
    </div>
  );
}

export function SourceShieldStory() {
  const rootRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLElement>(null);
  const sceneRefs = useRef<(HTMLElement | null)[]>([]);
  const constelRef = useRef<HTMLDivElement>(null);
  const cipherRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  const [current, setCurrent] = useState(0);
  const [phaseTense, setPhaseTense] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hintHidden, setHintHidden] = useState(false);
  const [demoTips, setDemoTips] = useState<DemoTip[]>(SEED_DEMO_TIPS);

  const scrollToScene = useCallback((index: number) => {
    const deck = deckRef.current;
    const scene = sceneRefs.current[index];
    if (!deck || !scene) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    deck.style.scrollSnapType = "none";
    deck.scrollTo({ top: scene.offsetTop, behavior: reduce ? "auto" : "smooth" });
    window.setTimeout(() => {
      if (deck) deck.style.scrollSnapType = "";
    }, reduce ? 60 : 760);
  }, []);

  useEffect(() => {
    setParticles(buildParticles());
  }, []);

  useEffect(() => {
    const deck = deckRef.current;
    const scenes = sceneRefs.current.filter(Boolean) as HTMLElement[];
    if (!deck || scenes.length === 0) return;

    scenes[0]?.classList.add("active");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = scenes.indexOf(entry.target as HTMLElement);
          if (idx < 0) return;

          if (entry.intersectionRatio >= 0.45) {
            entry.target.classList.add("active");
            setCurrent(idx);
            setPhaseTense(entry.target.id === "s-problem");
          } else if (entry.intersectionRatio < 0.12) {
            entry.target.classList.remove("active");
          }
        });
      },
      { root: deck, threshold: [0, 0.12, 0.45, 0.7] },
    );

    scenes.forEach((scene) => observer.observe(scene));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const deck = deckRef.current;
    const hint = hintRef.current;
    if (!deck || !hint) return;

    const onScroll = () => {
      setHintHidden(true);
    };
    deck.addEventListener("scroll", onScroll, { once: true });
    return () => deck.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", " "].includes(ev.key)) {
        ev.preventDefault();
        scrollToScene(Math.min(SCENES.length - 1, current + 1));
      } else if (["ArrowUp", "PageUp"].includes(ev.key)) {
        ev.preventDefault();
        scrollToScene(Math.max(0, current - 1));
      } else if (ev.key === "Home") {
        ev.preventDefault();
        scrollToScene(0);
      } else if (ev.key === "End") {
        ev.preventDefault();
        scrollToScene(SCENES.length - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, scrollToScene]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cipher = cipherRef.current;
    if (!cipher) return;

    const target = "a3f9 7c21 e8b4\n6d05 f11a 9e7c\n2b88 c4d3 0a6f";
    const hex = "0123456789abcdef";

    if (reduce) {
      cipher.textContent = target;
      return;
    }

    let timer: number | undefined;
    let cancelled = false;

    function scramble() {
      const memoryScene = document.getElementById("s-memory");
      if (cancelled || !cipher) return;

      if (memoryScene?.classList.contains("active")) {
        cipher.textContent = target
          .split("")
          .map((ch) => {
            if (ch === " " || ch === "\n") return ch;
            return Math.random() < 0.78 ? hex[(Math.random() * 16) | 0] : ch;
          })
          .join("");
      }

      timer = window.setTimeout(scramble, 90);
    }

    scramble();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const flow = document.querySelector(".source-shield-story .flow");
    if (!flow) return;

    const steps = [...flow.querySelectorAll(".fstep")];
    let timer: number | undefined;

    function runFlow() {
      const appScene = document.getElementById("s-app");
      if (!appScene || !appScene.classList.contains("active") || reduce) {
        if (reduce) steps.forEach((step) => step.classList.add("lit"));
        timer = window.setTimeout(runFlow, 700);
        return;
      }

      let i = 0;
      steps.forEach((step) => step.classList.remove("lit"));

      const tick = () => {
        if (!appScene.classList.contains("active")) {
          timer = window.setTimeout(runFlow, 700);
          return;
        }
        if (i < steps.length) {
          steps[i].classList.add("lit");
          i += 1;
          timer = window.setTimeout(tick, 900);
        } else {
          timer = window.setTimeout(() => {
            steps.forEach((step) => step.classList.remove("lit"));
            timer = window.setTimeout(tick, 600);
          }, 2600);
        }
      };

      tick();
    }

    runFlow();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const constel = constelRef.current;
    if (!constel) return;

    const stars = [...constel.querySelectorAll<HTMLElement>(".star")];
    const svg = constel.querySelector("svg");
    if (!svg) return;

    const cx = 50;
    const cy = 50;
    const rx = 40;
    const ry = 38;

    const svgEl = svg;

    function layout() {
      if (!svgEl) return;
      svgEl.innerHTML = "";
      stars.forEach((star, i) => {
        const ang = (-90 + i * (360 / stars.length)) * (Math.PI / 180);
        const x = cx + rx * Math.cos(ang);
        const y = cy + ry * Math.sin(ang);
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        const pt = star.querySelector<HTMLElement>(".pt");
        if (pt) pt.style.animationDelay = `${(i * 0.4).toFixed(2)}s`;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String(cx));
        line.setAttribute("y1", String(cy));
        line.setAttribute("x2", String(x));
        line.setAttribute("y2", String(y));
        svgEl.appendChild(line);
      });
      svgEl.setAttribute("viewBox", "0 0 100 100");
      svgEl.setAttribute("preserveAspectRatio", "none");
    }

    layout();
    window.addEventListener("resize", layout);
    return () => window.removeEventListener("resize", layout);
  }, []);

  const setSceneRef = (index: number) => (el: HTMLElement | null) => {
    sceneRefs.current[index] = el;
  };

  return (
    <div
      ref={rootRef}
      className={`source-shield-story${phaseTense ? " phase-tense" : ""}`}
    >
      <div className="ambient" aria-hidden="true">
        <div className="aurora a1" />
        <div className="aurora a2" />
        <div className="aurora a3" />
      </div>
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <Link href="/" className="deck-mark">
        <span className="glyph" aria-hidden="true" />
        <span>SourceShield</span>
      </Link>

      <nav className="rail" aria-label="Scene navigation">
        {SCENES.map((scene, index) => (
          <button
            key={scene.id}
            type="button"
            className={current === index ? "on" : ""}
            aria-label={scene.title}
            onClick={() => scrollToScene(index)}
          >
            <span className="tip">{scene.title}</span>
          </button>
        ))}
      </nav>

      <div className="counter" aria-live="polite">
        <b>{String(current + 1).padStart(2, "0")}</b> / {String(SCENES.length).padStart(2, "0")}
      </div>

      <main className="deck" ref={deckRef}>
        <section
          className="scene"
          id="s-open"
          ref={setSceneRef(0)}
          aria-label="Opening"
        >
          <div className="scene-inner">
            <div className="openmark anim" aria-hidden="true" />
            <div className="kicker lines anim d1">Krava × Linq · Privacy-First AI</div>
            <h1 className="display anim d2" style={{ marginTop: 26 }}>
              Truth, <em>sanitized before the desk.</em>
            </h1>
            <p className="lede anim d3">
              SourceShield — a privacy story in thirteen quiet scenes. Scroll, and let it unfold.
            </p>
          </div>
          <div
            ref={hintRef}
            className="scroll-hint anim d4"
            style={{ opacity: hintHidden ? 0 : undefined }}
          >
            Scroll<span className="dash" aria-hidden="true" />
          </div>
        </section>

        <section
          className="scene"
          id="s-problem"
          ref={setSceneRef(1)}
          aria-label="The problem"
        >
          <div className="scene-inner">
            <div className="kicker lines anim">The cost of convenience</div>
            <h2 className="display anim d1" style={{ marginTop: 22 }}>
              Most AI apps became
              <br />
              <em>surveillance products</em> on the side.
            </h2>
            <p className="lede anim d2">
              Every prompt, every name, every secret — quietly collected, logged, and learned from.
              Watched by default.
            </p>
            <div className="leak anim d3">
              <div className="src">
                name · location
                <br />
                messages · contacts
                <br />
                voice · habits
              </div>
              <div className="eye" aria-hidden="true">
                <div className="lid" />
                <div className="iris" />
                <div className="pupil" />
              </div>
              {particles.map((p) => (
                <span
                  key={p.id}
                  className="particle focal"
                  style={
                    {
                      "--oy": `${p.oy}px`,
                      "--dx": `${p.dx}px`,
                      top: `calc(50% + ${p.oy}px)`,
                      animationDelay: `${p.delay}s`,
                      animationDuration: `${p.duration}s`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          </div>
        </section>

        <section className="scene" id="s-shift" ref={setSceneRef(2)} aria-label="The shift">
          <div className="scene-inner">
            <div className="kicker lines anim">A different foundation</div>
            <h2 className="display anim d1" style={{ marginTop: 22 }}>
              Privacy isn&apos;t a promise.
              <br />
              It&apos;s the <em>architecture.</em>
            </h2>
            <p className="lede anim d2">
              Not a setting you toggle. Not a policy you&apos;re asked to trust. Something built into
              the ground floor — so exposure simply can&apos;t happen.
            </p>
            <div className="archi anim d3" aria-hidden="true">
              <div className="bloom focal" />
              <svg className="grid-svg" viewBox="0 0 620 300" preserveAspectRatio="none">
                <line x1="60" y1="80" x2="560" y2="80" />
                <line x1="60" y1="150" x2="560" y2="150" />
                <line x1="60" y1="220" x2="560" y2="220" />
                <line x1="160" y1="40" x2="160" y2="260" />
                <line x1="310" y1="40" x2="310" y2="260" />
                <line x1="460" y1="40" x2="460" y2="260" />
              </svg>
              <div className="node focal" style={{ left: "25.8%", top: "26.6%" }} />
              <div
                className="node focal"
                style={{ left: "50%", top: "50%", animationDelay: "0.6s" }}
              />
              <div
                className="node focal"
                style={{ left: "74.2%", top: "73.3%", animationDelay: "1.2s" }}
              />
              <div
                className="node focal"
                style={{ left: "74.2%", top: "26.6%", animationDelay: "1.8s" }}
              />
              <div
                className="node focal"
                style={{ left: "25.8%", top: "73.3%", animationDelay: "2.4s" }}
              />
            </div>
          </div>
        </section>

        <section className="scene" id="s-krava" ref={setSceneRef(3)} aria-label="What Krava is">
          <div className="scene-inner split">
            <div className="copy">
              <div className="kicker anim">The privacy layer</div>
              <h2 className="display anim d1" style={{ marginTop: 20 }}>
                The layer your AI agent <em>was missing.</em>
              </h2>
              <p className="lede anim d2">
                Not a wrapper bolted on top. Not a contract you file away. Infrastructure that sits
                beneath your agent and makes exposure impossible by design.
              </p>
            </div>
            <div className="visual anim d2">
              <div className="planes" aria-hidden="true">
                <div className="plane p-top focal">Your AI agent</div>
                <div className="plane p-krava focal">Krava — privacy layer</div>
                <div className="plane p-infra focal">Infrastructure</div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="scene"
          id="s-passkey"
          ref={setSceneRef(4)}
          aria-label="Guarantee · PasskeyID"
        >
          <div className="scene-inner split">
            <div className="visual anim d2">
              <div className="viz passkey" aria-hidden="true">
                <div className="ring focal" />
                <div className="faceid focal">
                  <svg viewBox="0 0 100 100">
                    <path className="stroke" d="M24 38 V30 a8 8 0 0 1 8 -8 H40" />
                    <path className="stroke" d="M76 38 V30 a8 8 0 0 0 -8 -8 H60" />
                    <path className="stroke" d="M24 62 V70 a8 8 0 0 0 8 8 H40" />
                    <path className="stroke" d="M76 62 V70 a8 8 0 0 1 -8 8 H60" />
                    <path className="stroke" d="M40 44 V50" />
                    <path className="stroke" d="M60 44 V50" />
                    <path className="stroke" d="M50 46 V56" />
                    <path className="stroke" d="M42 64 Q50 70 58 64" />
                  </svg>
                </div>
                <div className="id-token t1 focal">Maria Delgado</div>
                <div className="id-token t2 focal">+1 415 555 0179</div>
                <div className="id-token t3 focal">device · iPhone 15</div>
                <div className="id-token t4 focal">@m.delgado</div>
              </div>
            </div>
            <div className="copy">
              <div className="guar-index anim">
                Guarantee 01 <span className="of">/ 04</span>
              </div>
              <h2 className="display anim d1">Private PasskeyID</h2>
              <p className="lede anim d2">
                Identity that masks itself. Authentication that proves you&apos;re real without ever
                revealing who you are — architecturally incapable of exposing it.
              </p>
              <GuaranteeUse>
                Every source gets a pseudonymous Krava identity. Journalists never see who&apos;s
                behind a tip.
              </GuaranteeUse>
            </div>
          </div>
        </section>

        <section
          className="scene"
          id="s-memory"
          ref={setSceneRef(5)}
          aria-label="Guarantee · Secure Memory"
        >
          <div className="scene-inner split">
            <div className="visual anim d2">
              <div className="viz" style={{ aspectRatio: "1/0.7" }} aria-hidden="true">
                <div className="mem" style={{ position: "absolute", inset: 0 }}>
                  <div className="col">
                    <div className="keyicon focal">
                      <svg viewBox="0 0 100 100">
                        <circle className="k" cx="34" cy="40" r="16" />
                        <path className="k" d="M46 46 L78 78" />
                        <path className="k" d="M68 68 L76 60" />
                        <path className="k" d="M60 76 L68 68" />
                      </svg>
                    </div>
                    <div className="label">
                      User holds
                      <br />
                      the key
                    </div>
                  </div>
                  <div className="flow" />
                  <div className="col">
                    <div className="seal">
                      <div className="lockdot" />
                      <div className="cipher" ref={cipherRef}>
                        a3f9 7c21 e8b4
                      </div>
                    </div>
                    <div className="label">AES-256-GCM</div>
                  </div>
                  <div className="flow" />
                  <div className="col">
                    <div className="db">
                      <div className="disc d-a" />
                      <div className="disc d-b" />
                      <div className="disc d-c" />
                      <div className="wall" />
                      <div className="wall r" />
                    </div>
                    <div className="label">
                      Database sees
                      <br />
                      only ciphertext
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="copy">
              <div className="guar-index anim">
                Guarantee 02 <span className="of">/ 04</span>
              </div>
              <h2 className="display anim d1">Secure Memory</h2>
              <p className="lede anim d2">
                Data is sealed with AES-256-GCM and the key stays in the user&apos;s hands — long
                before anything reaches a database. Stored memory is just light without a key.
              </p>
              <GuaranteeUse>
                Raw transcripts live only in Krava encrypted memory. Our own database holds
                sanitized summaries — never the original words.
              </GuaranteeUse>
            </div>
          </div>
        </section>

        <section className="scene" id="s-llm" ref={setSceneRef(6)} aria-label="Guarantee · PrivateLLM">
          <div className="scene-inner split">
            <div className="visual anim d2">
              <div className="tee" aria-hidden="true">
                <div className="watcher">
                  <div className="e" />
                  <div className="blocked">operator · blind</div>
                </div>
                <div className="enclave">
                  <div className="frost" />
                  <div className="scan focal" />
                  <div className="core focal" />
                  <div className="tlabel">TEE</div>
                </div>
                <div className="pkt focal" />
              </div>
            </div>
            <div className="copy">
              <div className="guar-index anim">
                Guarantee 03 <span className="of">/ 04</span>
              </div>
              <h2 className="display anim d1">PrivateLLM</h2>
              <p className="lede anim d2">
                Your request enters a sealed enclave — a trusted execution environment where even the
                operator can&apos;t see inside. Inference happens in the dark.{" "}
                <span style={{ color: "var(--ink)" }}>SOC 2 Type II.</span>
              </p>
              <GuaranteeUse>
                Every tip is sanitized — and every journalist&apos;s follow-up rewritten safe —
                inside Krava&apos;s private inference.
              </GuaranteeUse>
            </div>
          </div>
        </section>

        <section
          className="scene"
          id="s-router"
          ref={setSceneRef(7)}
          aria-label="Guarantee · Inference Router"
        >
          <div className="scene-inner split">
            <div className="visual anim d2">
              <div className="router" aria-hidden="true">
                <svg viewBox="0 0 460 280" preserveAspectRatio="none">
                  <path className="path" d="M55 140 C 180 110, 260 70, 382 50" />
                  <path className="path" d="M55 140 C 200 140, 300 140, 405 140" />
                  <path className="path" d="M55 140 C 180 170, 260 210, 382 230" />
                  <path className="live focal" d="M55 140 C 200 140, 300 140, 405 140" />
                </svg>
                <div className="src-node">request</div>
                <div className="enc" style={{ left: "83%", top: "18%" }}>
                  enclave
                </div>
                <div className="enc chosen focal" style={{ left: "88%", top: "50%" }}>
                  most
                  <br />
                  private
                </div>
                <div className="enc" style={{ left: "83%", top: "82%" }}>
                  enclave
                </div>
              </div>
            </div>
            <div className="copy">
              <div className="guar-index anim">
                Guarantee 04 <span className="of">/ 04</span>
              </div>
              <h2 className="display anim d1">Private Inference Router</h2>
              <p className="lede anim d2">
                Every request is routed to the most private enclave available — automatically,
                invisibly. The path of least exposure, chosen for you.
              </p>
              <GuaranteeUse>
                Sanitization and follow-up inference are routed through Krava&apos;s private enclave
                path — no plaintext ever leaves it.
              </GuaranteeUse>
            </div>
          </div>
        </section>

        <section className="scene" id="s-app" ref={setSceneRef(8)} aria-label="Our app · SourceShield">
          <div className="scene-inner">
            <div className="kicker lines anim">Our app, end to end</div>
            <h2 className="display anim d1" style={{ marginTop: 20 }}>
              SourceShield, in <em>one calm flow.</em>
            </h2>
            <p className="lede anim d2" style={{ maxWidth: "52ch" }}>
              A pseudonymous tip travels from a frightened source to a journalist&apos;s desk — and
              every step rests on a Krava guarantee.
            </p>
            <div className="flow anim d3" style={{ marginTop: 60 }}>
              <div className="rail-line">
                <span className="pulse-dot focal" />
              </div>
              <div className="fstep">
                <div className="icon">
                  <div className="gl" />
                </div>
                <h4>Source sends</h4>
                <p>A tip arrives over iMessage or the web.</p>
                <span className="gtag">PasskeyID</span>
              </div>
              <div className="fstep">
                <div className="icon">
                  <div className="gl" />
                </div>
                <h4>Sealed in memory</h4>
                <p>Raw words encrypted into Krava memory.</p>
                <span className="gtag">Secure Memory</span>
              </div>
              <div className="fstep">
                <div className="icon">
                  <div className="gl" />
                </div>
                <h4>Sanitized</h4>
                <p>Names, dates &amp; places become safe tokens.</p>
                <span className="gtag">PrivateLLM</span>
              </div>
              <div className="fstep">
                <div className="icon">
                  <div className="gl" />
                </div>
                <h4>Routed &amp; returned</h4>
                <p>Only the sanitized summary reaches the desk.</p>
                <span className="gtag">Inference Router</span>
              </div>
            </div>
          </div>
        </section>

        <StoryIntakeScene
          sceneRef={setSceneRef(9)}
          tipCount={demoTips.length}
          onSubmit={(tip) => setDemoTips((tips) => [tip, ...tips])}
          onScrollToDashboard={() => scrollToScene(DASHBOARD_SCENE_INDEX)}
        />

        <StoryDashboardScene
          sceneRef={setSceneRef(10)}
          tips={demoTips}
          active={current === DASHBOARD_SCENE_INDEX}
        />

        <section className="scene" id="s-linq" ref={setSceneRef(11)} aria-label="Linq integration">
          <div className="scene-inner split">
            <div className="visual anim d2">
              <div className="thread glass">
                <div className="thead">
                  <span className="lk" aria-hidden="true" /> End-to-end · pseudonymous
                </div>
                <div className="bub in anim d2">
                  <span className="who">Source</span>I have documents about the Eastgate contract.
                </div>
                <div className="bub out anim d3">
                  <span className="who">SourceShield</span>Received and sealed. What date were they
                  signed?
                </div>
                <div className="bub in anim d4">
                  <span className="who">Source</span>March 3rd. I can send more.
                </div>
                <div className="bub out anim d5">
                  <span className="who">SourceShield</span>Thank you. Please keep it text-only —
                  attachments are declined for your safety.
                </div>
              </div>
            </div>
            <div className="copy">
              <div className="kicker anim">Controlling the AI by text</div>
              <h2 className="display anim d1" style={{ marginTop: 20 }}>
                A newsroom in a <em>message thread.</em>
              </h2>
              <p className="lede anim d2">
                Sources reply in iMessage. SourceShield answers — pseudonymous, sanitized, and private
                from the first word to the last.
              </p>
            </div>
          </div>
        </section>

        <section className="scene" id="s-why" ref={setSceneRef(12)} aria-label="Why it wins">
          <div className="scene-inner">
            <div className="kicker lines anim">Why this wins</div>
            <h2 className="display anim d1" style={{ marginTop: 20 }}>
              Privacy you can <em>scroll through.</em>
            </h2>
            <div className="constel anim d2" ref={constelRef} aria-hidden="true">
              <svg />
              <div className="core">
                <span className="sg" />
              </div>
              {CONSTELLATION_STARS.map((star) => (
                <div key={star.name} className="star">
                  <span className="pt" />
                  <span className="nm">{star.name}</span>
                  <span className="sub">{star.sub}</span>
                </div>
              ))}
            </div>
            <p className="lede anim d3" style={{ marginTop: 48 }}>
              One story. Every layer earning trust.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
