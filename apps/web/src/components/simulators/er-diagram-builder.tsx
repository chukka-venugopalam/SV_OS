/**
 * Component: ErDiagramBuilder
 * Serves: act6-d1-ch01-er-model ("ER Model")
 *
 * What it demonstrates:
 *   Building a live ER (Entity-Relationship) diagram from a short scenario
 *   description by adding entities with attributes and connecting them with
 *   relationships of different cardinalities (1:1, 1:N, M:N) — with entity boxes
 *   genuinely draggable around the canvas, not fixed in place.
 *
 * Design decisions:
 *   - Uses one concrete worked scenario ("a customer places orders; each order can
 *     contain many products") rather than a free-form blank canvas, because a
 *     beginner's first ER diagram is much easier to build by following a guided
 *     "add the next piece" sequence than by staring at an empty canvas and an entity
 *     palette with no starting point.
 *   - Dragging is implemented with real pointer events (pointerdown/move/up) on
 *     absolutely-positioned entity boxes, with an SVG overlay recomputing connector
 *     lines live from each box's current position — this is a genuine drag
 *     interaction, not a static pre-arranged diagram.
 *   - Cardinality is shown as a text label at each end of the connecting line
 *     ("1" / "N" / "M") rather than crow's-foot notation, since crow's-foot symbols
 *     are their own thing to learn and would compete with the ER-model concept this
 *     chapter is actually teaching.
 *   - This scenario (Customer –1:N– Order –M:N– Product) is deliberately the same
 *     one used by ErToTableMapper (ch19), so a student who builds this diagram sees
 *     it mechanically turn into real tables in the next chapter.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';

interface EntityDef {
  id: string;
  name: string;
  attributes: string[];
  pk: string;
}
interface RelationshipDef {
  id: string;
  from: string;
  to: string;
  cardinality: '1:1' | '1:N' | 'M:N';
  label: string;
}

const ALL_ENTITIES: EntityDef[] = [
  {
    id: 'customer',
    name: 'Customer',
    attributes: ['customer_id', 'name', 'email'],
    pk: 'customer_id',
  },
  { id: 'order', name: 'Order', attributes: ['order_id', 'order_date'], pk: 'order_id' },
  { id: 'product', name: 'Product', attributes: ['product_id', 'name', 'price'], pk: 'product_id' },
];
const ALL_RELATIONSHIPS: RelationshipDef[] = [
  { id: 'cust-order', from: 'customer', to: 'order', cardinality: '1:N', label: 'places' },
  { id: 'order-product', from: 'order', to: 'product', cardinality: 'M:N', label: 'contains' },
];

const DEFAULT_POS: Record<string, { x: number; y: number }> = {
  customer: { x: 30, y: 40 },
  order: { x: 280, y: 40 },
  product: { x: 530, y: 40 },
};

export default function ErDiagramBuilder() {
  const [entityCount, setEntityCount] = useState(0);
  const [relCount, setRelCount] = useState(0);
  const [positions, setPositions] = useState(DEFAULT_POS);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleEntities = ALL_ENTITIES.slice(0, entityCount);
  const visibleRelationships = ALL_RELATIONSHIPS.slice(0, relCount).filter(
    (r) =>
      visibleEntities.some((e) => e.id === r.from) && visibleEntities.some((e) => e.id === r.to),
  );

  const addEntity = () => setEntityCount((c) => Math.min(ALL_ENTITIES.length, c + 1));
  const addRelationship = () => setRelCount((c) => Math.min(ALL_RELATIONSHIPS.length, c + 1));
  const reset = () => {
    setEntityCount(0);
    setRelCount(0);
    setPositions(DEFAULT_POS);
  };

  const onPointerDown = (id: string) => (e: React.PointerEvent) => {
    const box = (e.target as HTMLElement).closest('[data-entity-box]') as HTMLElement;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!box || !containerRect) return;
    dragRef.current = {
      id,
      offsetX: e.clientX - (containerRect.left + positions[id].x),
      offsetY: e.clientY - (containerRect.top + positions[id].y),
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const { id, offsetX, offsetY } = dragRef.current;
    const x = Math.max(0, Math.min(620, e.clientX - containerRect.left - offsetX));
    const y = Math.max(0, Math.min(220, e.clientY - containerRect.top - offsetY));
    setPositions((p) => ({ ...p, [id]: { x, y } }));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const boxWidth = 180;
  const boxHeightFor = (e: EntityDef) => 40 + e.attributes.length * 18;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">What is this?</h3>
        <p className="text-sm leading-relaxed text-stone-700">
          Before building a database, it helps to first sketch what real-world "things" it needs to
          track and how they relate — this is an <strong>ER model</strong> (Entity-Relationship
          model). An <strong>entity</strong> is a type of thing (like "Customer" or "Order"), each
          with <strong>attributes</strong> describing it. A <strong>relationship</strong> connects
          two entities and has a <strong>cardinality</strong> — how many of one entity can relate to
          how many of the other, like 1:1, 1:N ("one to many"), or M:N ("many to many").
        </p>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="inline font-medium text-stone-900">Entity: </dt>
              <dd className="inline text-stone-600">
                a type of real-world thing being tracked, e.g. Customer, Order, Product.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Attribute: </dt>
              <dd className="inline text-stone-600">
                a piece of information describing an entity, e.g. a Customer's name or email.
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-stone-900">Cardinality: </dt>
              <dd className="inline text-stone-600">
                how many instances of one entity can be linked to how many instances of another
                (1:1, 1:N, or M:N).
              </dd>
            </div>
          </dl>
        </div>
        <CommonMistake>
          assuming a relationship's cardinality is just about which entity is "bigger" or more
          important. It's purely about counting:{' '}
          <span className="font-mono">Customer –1:N– Order</span> means one customer can have many
          orders, but each order belongs to exactly one customer — neither entity is more important,
          the numbers just describe how the real-world things actually connect.
        </CommonMistake>
      </div>

      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          <li>
            Scenario: "A customer places orders. Each order can contain many products, and a product
            can appear on many orders."
          </li>
          <li>Click "Add next entity" three times to bring in Customer, Order, and Product.</li>
          <li>Click "Add next relationship" twice to connect them with the right cardinalities.</li>
          <li>
            Drag any entity box around the canvas — the connecting lines follow automatically.
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={addEntity}
          disabled={entityCount >= ALL_ENTITIES.length}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Add next entity
        </button>
        <button
          onClick={addRelationship}
          disabled={entityCount < ALL_ENTITIES.length || relCount >= ALL_RELATIONSHIPS.length}
          className="rounded-md bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 disabled:opacity-40"
        >
          Add next relationship
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Reset
        </button>
      </div>

      <div
        ref={containerRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative w-full select-none overflow-hidden rounded-lg border border-stone-200 bg-stone-50"
        style={{ height: 300 }}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {visibleRelationships.map((r) => {
            const from = positions[r.from];
            const to = positions[r.to];
            const fromH = boxHeightFor(ALL_ENTITIES.find((e) => e.id === r.from)!);
            const toH = boxHeightFor(ALL_ENTITIES.find((e) => e.id === r.to)!);
            const x1 = from.x + boxWidth;
            const y1 = from.y + fromH / 2;
            const x2 = to.x;
            const y2 = to.y + toH / 2;
            const [c1, c2] = r.cardinality.split(':');
            return (
              <g key={r.id}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#a8a29e" strokeWidth={2} />
                <rect
                  x={(x1 + x2) / 2 - 28}
                  y={(y1 + y2) / 2 - 10}
                  width={56}
                  height={20}
                  fill="white"
                  stroke="#a8a29e"
                  rx={4}
                />
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#57534e"
                >
                  {r.label}
                </text>
                <text x={x1 + 10} y={y1 - 6} fontSize="11" fontWeight="bold" fill="#7c3aed">
                  {c1}
                </text>
                <text x={x2 - 12} y={y2 - 6} fontSize="11" fontWeight="bold" fill="#7c3aed">
                  {c2}
                </text>
              </g>
            );
          })}
        </svg>
        {visibleEntities.map((e) => (
          <div
            key={e.id}
            data-entity-box
            onPointerDown={onPointerDown(e.id)}
            style={{ left: positions[e.id].x, top: positions[e.id].y, width: boxWidth }}
            className="absolute cursor-grab rounded-md border-2 border-violet-300 bg-white shadow-sm active:cursor-grabbing"
          >
            <div className="rounded-t bg-violet-500 px-2 py-1 text-xs font-semibold text-white">
              {e.name}
            </div>
            <ul className="space-y-0.5 px-2 py-1 text-xs">
              {e.attributes.map((a) => (
                <li
                  key={a}
                  className={a === e.pk ? 'font-medium text-stone-900 underline' : 'text-stone-600'}
                >
                  {a}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {visibleEntities.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-stone-400">
            Click "Add next entity" to begin.
          </p>
        )}
      </div>
    </div>
  );
}

function CommonMistake({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <p>
        <span className="font-semibold">Common mistake: </span>
        {children}
      </p>
    </div>
  );
}
