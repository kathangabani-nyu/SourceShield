"use client";

import { useState } from "react";
import { rewriteQuestion, type DemoTip } from "@/lib/story-demo";

type StoryDashboardSceneProps = {
  tips: DemoTip[];
  active: boolean;
};

function TipCard({
  tip,
  index,
  open,
  onToggle,
}: {
  tip: DemoTip;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [rewrite, setRewrite] = useState<string | null>(null);

  function handleRewrite(event: React.MouseEvent) {
    event.stopPropagation();
    const trimmed = question.trim();
    if (!trimmed) return;
    setRewrite(rewriteQuestion(trimmed));
  }

  return (
    <div
      className={`tip-card anim in${tip.isNew ? " new-tip" : ""}${open ? " open" : ""}`}
      style={{ transitionDelay: `${index * 0.12}s` }}
    >
      <div className="card-top" onClick={onToggle} onKeyDown={(e) => e.key === "Enter" && onToggle()} role="button" tabIndex={0}>
        <span className="card-id">{tip.id}</span>
        <span className="card-channel">
          <span className="dot" aria-hidden="true" />
          {tip.channel}
        </span>
      </div>
      <div
        className="card-summary"
        dangerouslySetInnerHTML={{ __html: tip.summary }}
        onClick={onToggle}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
        role="button"
        tabIndex={0}
      />
      <div className="card-footer" onClick={onToggle} onKeyDown={(e) => e.key === "Enter" && onToggle()} role="button" tabIndex={0}>
        <span className={`status${tip.status === "new" ? " new-s" : ""}`}>
          {tip.status === "new" ? "New · unread" : "In review"}
        </span>
        <span className="expand-hint">Expand ↓</span>
      </div>
      <div className="card-detail">
        <div className="detail-inner">
          <div className="detail-cols">
            <div className="detail-col">
              <h4>As the source wrote it</h4>
              <div className="text" dangerouslySetInnerHTML={{ __html: tip.safe }} />
            </div>
            <div className="detail-col">
              <h4>As the journalist sees it</h4>
              <div className="text" dangerouslySetInnerHTML={{ __html: tip.summary }} />
            </div>
          </div>
          <div className="followup">
            <h4>Draft a follow-up question</h4>
            <div className="followup-row">
              <input
                type="text"
                className="fu-input"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="e.g. Can you share the document date?"
                onClick={(event) => event.stopPropagation()}
              />
              <button type="button" className="rewrite-btn" onClick={handleRewrite}>
                Preview safe rewrite →
              </button>
            </div>
            {rewrite ? (
              <div className="rewrite-result show">
                <div className="rlabel">Rewritten — safe to send</div>
                <div className="rtext">{rewrite}</div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StoryDashboardScene({ tips, active }: StoryDashboardSceneProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="scene" id="s-dash" aria-label="Live · Dashboard">
      <div className="dash-wrap">
        <div className="dash-header anim">
          <div>
            <div className="kicker" style={{ marginBottom: 14 }}>
              What the journalist sees
            </div>
            <h2>
              The desk. <em>Nothing else.</em>
            </h2>
          </div>
          <span className="badge">SourceShield · Journalist view</span>
        </div>
        <p className="lede anim d1" style={{ marginBottom: 40, maxWidth: "52ch" }}>
          Click any card to expand it. See the raw tip alongside the sanitized version — then draft
          a safe follow-up question.
        </p>
        <p className="tech-note anim d1" style={{ marginBottom: 32, maxWidth: "52ch" }}>
          Demo mirrors production: dashboard shows Postgres summaries only · raw panel illustrative ·
          real deploy strips phone/chat fields.
        </p>
        <div className="tip-grid" key={`${active ? "active" : "idle"}-${tips.length}`}>
          {tips.map((tip, index) => (
            <TipCard
              key={tip.id}
              tip={tip}
              index={index}
              open={openId === tip.id}
              onToggle={() => setOpenId((current) => (current === tip.id ? null : tip.id))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
