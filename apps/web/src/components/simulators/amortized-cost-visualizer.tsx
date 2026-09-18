/*
  CHAPTER: D1 — Complexity Core
    Amortized Analysis (d1-05-amortized-analysis)

  WHAT THIS DEMONSTRATES
    A dynamic array growing via repeated appends, showing the O(n) resize spikes
    against the O(1) amortized average cost per append over the whole sequence.

  DESIGN DECISIONS
    - Doubling strategy (capacity doubles on overflow) is used since it's the
      standard textbook example and gives clean, visually obvious spikes.
    - The per-append cost bar chart is the core visual (spikes at resizes, otherwise
      flat) since that contrast IS the entire intuition behind amortized analysis —
      individual operations vary wildly, but the AVERAGE stays low.
*/

import React, { useState } from 'react';

const COLORS = {
  ink: '#1B2430',
  inkSoft: '#5B6472',
  parchment: '#FAF7F0',
  panel: '#F1ECE1',
  teal: '#2A9D8F',
  tealSoft: '#DCEEEC',
  amber: '#E9A23B',
  amberSoft: '#FBEBD2',
  red: '#D4634A',
  redSoft: '#F8E1DB',
  line: '#DDD5C3',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3
        style={{
          fontFamily: 'ui-serif, Georgia, serif',
          fontSize: 15,
          fontWeight: 600,
          color: COLORS.ink,
          margin: '0 0 10px 0',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
function KeyTerm({ term, def }: { term: string; def: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13.5, lineHeight: 1.5 }}>
      <span style={{ fontWeight: 600, color: COLORS.ink, minWidth: 150, flexShrink: 0 }}>
        {term}
      </span>
      <span style={{ color: COLORS.inkSoft }}>{def}</span>
    </div>
  );
}
function Step({ children }: { children: React.ReactNode }) {
  return (
    <li
      style={{
        marginBottom: 6,
        fontSize: 13.5,
        lineHeight: 1.55,
        color: COLORS.inkSoft,
        paddingLeft: 2,
      }}
    >
      {children}
    </li>
  );
}
function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 14,
        padding: '8px 12px',
        background: COLORS.amberSoft,
        borderRadius: 6,
        fontSize: 12.5,
        color: COLORS.ink,
      }}
    >
      {children}
    </div>
  );
}

interface AppendRecord {
  index: number;
  cost: number;
  resized: boolean;
  newCapacity: number;
}

function simulateAppends(count: number): { records: AppendRecord[]; finalCapacity: number } {
  let capacity = 1;
  let size = 0;
  const records: AppendRecord[] = [];
  for (let i = 0; i < count; i++) {
    if (size === capacity) {
      // resize: cost is proportional to copying all existing elements, then +1 for the actual append
      const cost = capacity + 1;
      capacity *= 2;
      records.push({ index: i, cost, resized: true, newCapacity: capacity });
    } else {
      records.push({ index: i, cost: 1, resized: false, newCapacity: capacity });
    }
    size++;
  }
  return { records, finalCapacity: capacity };
}

export default function AmortizedCostVisualizer() {
  const [numAppends, setNumAppends] = useState(16);
  const { records } = simulateAppends(numAppends);

  const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
  const avgCost = totalCost / numAppends;
  const maxCost = Math.max(...records.map((r) => r.cost));

  return (
    <div
      style={{
        background: COLORS.parchment,
        minHeight: '100%',
        padding: '28px 24px 40px',
        fontFamily: 'system-ui, sans-serif',
        color: COLORS.ink,
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 6, fontSize: 11.5, color: COLORS.inkSoft }}>
          Complexity Core · D1
        </div>
        <h2
          style={{
            fontFamily: 'ui-serif, Georgia, serif',
            fontSize: 24,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          Amortized Analysis
        </h2>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 24px 0' }}>
          Why a dynamic array's occasional expensive resize doesn't ruin its overall speed.
        </p>

        <Section title="What is this?">
          <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
            A dynamic array (like Python's list or Java's ArrayList) starts small and grows
            automatically as you add items. Most appends are cheap — just drop the new item in the
            next free slot. But occasionally, the array runs out of room and has to{' '}
            <strong>resize</strong>: allocate a bigger block of memory and copy every existing
            element over, which is expensive. <strong>Amortized analysis</strong> asks: if you
            SPREAD that occasional expensive cost out over all the cheap operations around it,
            what's the real average cost per append? The surprising answer: even with those spikes,
            the average stays constant — O(1) — because resizes get rarer and rarer as the array
            grows (doubling means each resize "pays for itself" using all the cheap appends since
            the last one).
          </p>
        </Section>

        <Section title="Key terms">
          <KeyTerm
            term="Resize"
            def="When a dynamic array runs out of space and must allocate a bigger block, copying every old element into it."
          />
          <KeyTerm
            term="Amortized cost"
            def="The average cost per operation, calculated over a long sequence — not the cost of any single operation."
          />
          <KeyTerm
            term="Doubling strategy"
            def="Whenever the array is full, its capacity doubles — a common, efficient growth rule."
          />
          <KeyTerm
            term="Worst-case vs amortized"
            def="Worst-case looks at the single most expensive operation; amortized looks at the average across many operations."
          />
        </Section>

        <Section title="How to use this">
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <Step>Drag the slider to change how many items get appended in a row.</Step>
            <Step>
              Look at the bar chart — tall red spikes are resize operations; short teal bars are
              cheap appends.
            </Step>
            <Step>
              Compare the "total cost" and "average cost per append" numbers as you increase the
              append count.
            </Step>
            <Step>
              Notice the average cost stays low and roughly flat, even though individual spikes get
              taller.
            </Step>
          </ol>
        </Section>

        <Section title="Watch a dynamic array grow, one append at a time">
          <div
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <label
              style={{ fontSize: 12, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}
            >
              Number of appends: {numAppends}
            </label>
            <input
              type="range"
              min={4}
              max={64}
              value={numAppends}
              onChange={(e) => setNumAppends(+e.target.value)}
              style={{ width: 260, marginBottom: 18 }}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 2,
                height: 120,
                marginBottom: 8,
                overflowX: 'auto',
                paddingBottom: 4,
              }}
            >
              {records.map((r, i) => (
                <div
                  key={i}
                  title={`Append #${i + 1}: cost ${r.cost}`}
                  style={{
                    width: Math.max(4, 260 / numAppends - 2),
                    height: `${(r.cost / maxCost) * 100}%`,
                    background: r.resized ? COLORS.red : COLORS.teal,
                    borderRadius: '2px 2px 0 0',
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 16,
                fontSize: 11.5,
                color: COLORS.inkSoft,
                marginBottom: 16,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: COLORS.teal,
                    borderRadius: 2,
                    display: 'inline-block',
                  }}
                />
                Normal append (cost 1)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: COLORS.red,
                    borderRadius: 2,
                    display: 'inline-block',
                  }}
                />
                Resize (cost = old size + 1)
              </span>
            </div>

            <div style={{ display: 'flex', gap: 24, marginBottom: 8, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13.5 }}>
                Total cost for {numAppends} appends: <strong>{totalCost}</strong>
              </div>
              <div
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 13.5,
                  color: COLORS.teal,
                  fontWeight: 700,
                }}
              >
                Average (amortized) cost per append: {avgCost.toFixed(2)}
              </div>
            </div>

            <p style={{ fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6, margin: '10px 0 0' }}>
              Try dragging the slider all the way up — notice the average cost per append stays
              close to 2, no matter how many appends you do. The resize spikes get individually more
              expensive (since they copy more elements each time), but they also happen
              exponentially less often, so the two effects cancel out.
            </p>

            <Callout>
              <strong>Common mistake:</strong> looking at the single worst append (the biggest
              resize) and concluding the whole structure is "slow." Amortized analysis specifically
              asks about the AVERAGE over a long sequence, not the worst single moment — and here,
              that average is O(1) even though some individual operations are O(n).
            </Callout>
          </div>
        </Section>
      </div>
    </div>
  );
}
