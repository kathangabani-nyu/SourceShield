"use client";

import { useState } from "react";
import {
  createDemoTip,
  DEFAULT_DEMO_TIP_TEXT,
  delay,
  type DemoTip,
} from "@/lib/story-demo";

const PROC_STEPS = [
  "Encrypting to Krava memory",
  "Sanitizing with PrivateLLM",
  "Sealing — key stays with source",
];

type CardPhase = "idle" | "processing" | "success";

type StoryIntakeSceneProps = {
  tipCount: number;
  onSubmit: (tip: DemoTip) => void;
  onScrollToDashboard: () => void;
};

export function StoryIntakeScene({
  tipCount,
  onSubmit,
  onScrollToDashboard,
}: StoryIntakeSceneProps) {
  const [tipText, setTipText] = useState(DEFAULT_DEMO_TIP_TEXT);
  const [contact, setContact] = useState("");
  const [phase, setPhase] = useState<CardPhase>("idle");
  const [stepsDone, setStepsDone] = useState(0);

  async function handleSubmit(event?: React.FormEvent | React.MouseEvent) {
    event?.preventDefault();
    const trimmed = tipText.trim();
    if (trimmed.length < 12) return;

    setPhase("processing");
    setStepsDone(0);

    await delay(1400);
    setStepsDone(1);
    await delay(1300);
    setStepsDone(2);
    await delay(1100);
    setStepsDone(3);
    await delay(700);

    const tip = createDemoTip(trimmed, contact.trim() || "web session", tipCount + 1);
    onSubmit(tip);

    setPhase("success");
    window.setTimeout(onScrollToDashboard, 2600);
  }

  return (
    <section className="scene" id="s-intake" aria-label="Live · Intake">
      <div className="scene-inner" style={{ maxWidth: 700 }}>
        <div className="kicker lines anim">Try it — live</div>
        <h2 className="display anim d1" style={{ marginTop: 20 }}>
          Send a tip <em>in confidence.</em>
        </h2>
        <p className="lede anim d2" style={{ maxWidth: "48ch" }}>
          This is the real intake. Type a tip — or hit send on the one below — and watch it travel
          through the Krava pipeline.
        </p>
        <div className="intake-wrap anim d3" style={{ marginTop: 44 }}>
          <div
            className={`intake-card${phase === "processing" ? " processing" : ""}${phase === "success" ? " success" : ""}`}
          >
            <div className="intake-head">
              <span className="source-id">
                <span className="dot" aria-hidden="true" />
                Anonymous web session
              </span>
              <span className="mono-label">Encrypted in transit</span>
            </div>

            <form className="intake-body" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="tip-text">What do you need to report?</label>
                <textarea
                  id="tip-text"
                  rows={5}
                  value={tipText}
                  onChange={(event) => setTipText(event.target.value)}
                  placeholder="Type your tip here…"
                />
              </div>
              <div className="field">
                <label htmlFor="tip-contact">How should we reach you for follow-up?</label>
                <input
                  id="tip-contact"
                  type="text"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder="iMessage handle · or leave blank for this web session"
                />
              </div>
            </form>

            <div className="intake-footer">
              <button
                type="button"
                className="btn btn-primary submit-btn"
                style={{ width: "100%", textAlign: "center", display: "block" }}
                onClick={handleSubmit}
              >
                Send in confidence →
              </button>
            </div>

            <div className="intake-processing" aria-hidden={phase !== "processing"}>
              <div className="proc-icon">
                <div className="proc-ring" />
                <div className="proc-dot" />
              </div>
              <div className="proc-steps">
                {PROC_STEPS.map((label, index) => (
                  <div
                    key={label}
                    className={`proc-step${index < stepsDone ? " done" : ""}`}
                  >
                    <span className="check" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="intake-success" aria-hidden={phase !== "success"}>
              <div className="success-glyph" aria-hidden="true" />
              <div className="success-title">Your tip has been sealed.</div>
              <div className="success-sub">Encrypted · Sanitized · Delivered</div>
              <p className="success-detail">
                Raw words live only in Krava&apos;s encrypted memory. The journalist&apos;s desk now
                holds only the safe summary.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
