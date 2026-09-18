/**
 * Component: NormalizationStepVisualizer
 * Serves: act6-d3-ch02-first-normal-form ("First Normal Form") — 1NF mode
 *         act6-d3-ch03-second-normal-form ("Second Normal Form") — 2NF mode
 *         act6-d3-ch04-third-normal-form ("Third Normal Form") — 3NF mode
 *         act6-d3-ch05-bcnf ("BCNF") — BCNF mode
 *
 * What it demonstrates:
 *   1NF: a table with a repeating/multi-valued column split so every value gets its
 *   own row (atomic values only).
 *   2NF: a table with a composite key and a partial dependency (an attribute
 *   depending on only part of the key) decomposed into two tables removing it.
 *   3NF: a transitive dependency (A→B→C) decomposed so C no longer depends on A
 *   only indirectly through B.
 *   BCNF: a table satisfying 3NF but violating BCNF (a determinant that isn't a
 *   superkey) decomposed further, with an explicit callout on the classic case where
 *   BCNF decomposition loses a dependency that 3NF would have preserved.
 *
 * Design decisions:
 *   - Built as one component with four modes (per spec) sharing the same reveal-based
 *     "here's the violation, click Decompose to fix it" interaction shell, but each
 *     mode has its own complete WHAT-IS-THIS/KEY-TERMS/HOW-TO-USE/Common-Mistake,
 *     since each normal form is a genuinely different rule even though the fix
 *     ("split into two tables") looks superficially similar every time.
 *   - Each mode uses a small, standard textbook example chosen specifically because
 *     hand-verifying the violation and the fix takes seconds, not minutes — this is a
 *     "watch the rule apply" tool, not a general-purpose schema design tool.
 *   - The BCNF mode's dependency-preservation loss is shown explicitly (the FD
 *     (Student, Course) → Instructor can no longer be checked by looking at one table
 *     alone after decomposition) rather than glossed over, per the build spec's
 *     explicit callout requirement — decomposition fixing one problem while
 *     introducing a different, real tradeoff is the whole point of including it.
 *   - ASSUMPTION: Tailwind + lucide-react available in host repo.
 */
import { AlertTriangle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

type Mode = '1nf' | '2nf' | '3nf' | 'bcnf';

export default function NormalizationStepVisualizer() {
  const [mode, setMode] = useState<Mode>('1nf');
  const [decomposed, setDecomposed] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    setDecomposed(false);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-4">
        {(['1nf', '2nf', '3nf', 'bcnf'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium uppercase ${mode === m ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === '1nf' && <NF1 decomposed={decomposed} setDecomposed={setDecomposed} />}
      {mode === '2nf' && <NF2 decomposed={decomposed} setDecomposed={setDecomposed} />}
      {mode === '3nf' && <NF3 decomposed={decomposed} setDecomposed={setDecomposed} />}
      {mode === 'bcnf' && <NFBcnf decomposed={decomposed} setDecomposed={setDecomposed} />}
    </div>
  );
}

// ---------------- 1NF ----------------
function NF1({
  decomposed,
  setDecomposed,
}: {
  decomposed: boolean;
  setDecomposed: (b: boolean) => void;
}) {
  const before = [
    { id: 1, name: 'Ada', courses: 'Math, Physics' },
    { id: 2, name: 'Alan', courses: 'CS' },
  ];
  const after = [
    { id: 1, name: 'Ada', course: 'Math' },
    { id: 1, name: 'Ada', course: 'Physics' },
    { id: 2, name: 'Alan', course: 'CS' },
  ];
  return (
    <div className="space-y-4">
      <Intro
        title="What is this?"
        body={
          <>
            A table is in <strong>First Normal Form (1NF)</strong> if every column holds a single,
            atomic value — no column is allowed to pack in a list of several values at once. The
            "courses" column below violates this by cramming multiple course names into one field.
          </>
        }
        terms={[
          [
            'Atomic value',
            'a single, indivisible value in one column — not a list or a combination of several things.',
          ],
          [
            'Repeating group',
            'a column (or set of columns) that stores multiple values for one row, violating 1NF.',
          ],
        ]}
        mistake="assuming 1NF is about removing duplicate rows or redundant data. It isn't — 1NF only cares about each individual column holding one atomic value; the actual redundancy problems (like a name repeated across rows) get fixed by later normal forms, not this one."
        howTo={[
          'Look at the "courses" column — Ada\'s row lists two courses in one field.',
          'Click "Split into 1NF" to see it become one row per course instead.',
        ]}
      />
      <TableView title="Before (violates 1NF)" rows={before} highlightCols={['courses']} />
      {decomposed && <TableView title="After (1NF)" rows={after} highlightCols={['course']} good />}
      <DecomposeControls
        decomposed={decomposed}
        setDecomposed={setDecomposed}
        label="Split into 1NF"
      />
    </div>
  );
}

// ---------------- 2NF ----------------
function NF2({
  decomposed,
  setDecomposed,
}: {
  decomposed: boolean;
  setDecomposed: (b: boolean) => void;
}) {
  const before = [
    { student_id: 1, course_id: 'CS101', student_name: 'Ada', grade: 'A' },
    { student_id: 1, course_id: 'CS102', student_name: 'Ada', grade: 'B' },
    { student_id: 2, course_id: 'CS101', student_name: 'Alan', grade: 'A' },
  ];
  const studentTable = [
    { student_id: 1, student_name: 'Ada' },
    { student_id: 2, student_name: 'Alan' },
  ];
  const enrollmentTable = [
    { student_id: 1, course_id: 'CS101', grade: 'A' },
    { student_id: 1, course_id: 'CS102', grade: 'B' },
    { student_id: 2, course_id: 'CS101', grade: 'A' },
  ];
  return (
    <div className="space-y-4">
      <Intro
        title="What is this?"
        body={
          <>
            <strong>Second Normal Form (2NF)</strong> applies to tables with a{' '}
            <strong>composite key</strong> (a primary key made of more than one column). It requires
            that every non-key column depend on the <em>entire</em> key, not just part of it. Below,
            the key is (student_id, course_id), but student_name only depends on student_id — that's
            a <strong>partial dependency</strong>, and it's why Ada's name is stuck being repeated
            on every row she appears in.
          </>
        }
        terms={[
          ['Composite key', 'a primary key made of two or more columns together.'],
          [
            'Partial dependency',
            'a non-key column that depends on only part of the composite key, not all of it.',
          ],
        ]}
        mistake={`assuming any repeated value across rows is automatically a 2NF violation. 2NF specifically means a non-key column depending on only PART of a composite key — a table with a single-column key can never have a partial dependency at all, since there's no "part of the key" to depend on.`}
        howTo={[
          'Notice student_name repeats for every course Ada takes — it only depends on student_id, not the full (student_id, course_id) key.',
          'Click "Decompose to 2NF" to split student info into its own table.',
        ]}
      />
      <TableView title="Before (violates 2NF)" rows={before} highlightCols={['student_name']} />
      {decomposed && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TableView title="Student (2NF)" rows={studentTable} good />
          <TableView title="Enrollment (2NF)" rows={enrollmentTable} good />
        </div>
      )}
      <DecomposeControls
        decomposed={decomposed}
        setDecomposed={setDecomposed}
        label="Decompose to 2NF"
      />
    </div>
  );
}

// ---------------- 3NF ----------------
function NF3({
  decomposed,
  setDecomposed,
}: {
  decomposed: boolean;
  setDecomposed: (b: boolean) => void;
}) {
  const before = [
    { emp_id: 1, name: 'Ada', dept_id: 'D1', dept_name: 'Engineering' },
    { emp_id: 2, name: 'Alan', dept_id: 'D2', dept_name: 'Research' },
    { emp_id: 3, name: 'Grace', dept_id: 'D1', dept_name: 'Engineering' },
  ];
  const employeeTable = [
    { emp_id: 1, name: 'Ada', dept_id: 'D1' },
    { emp_id: 2, name: 'Alan', dept_id: 'D2' },
    { emp_id: 3, name: 'Grace', dept_id: 'D1' },
  ];
  const deptTable = [
    { dept_id: 'D1', dept_name: 'Engineering' },
    { dept_id: 'D2', dept_name: 'Research' },
  ];
  return (
    <div className="space-y-4">
      <Intro
        title="What is this?"
        body={
          <>
            <strong>Third Normal Form (3NF)</strong> removes{' '}
            <strong>transitive dependencies</strong>: a chain where A determines B, and B determines
            C, so C ends up indirectly dependent on A. Below, emp_id → dept_id, and dept_id →
            dept_name — so dept_name only depends on emp_id <em>through</em> dept_id, not directly.
            That's why "Engineering" gets repeated for every employee in that department.
          </>
        }
        terms={[
          ['Transitive dependency', 'A → B → C, where C depends on A only indirectly, via B.'],
          [
            'Non-key attribute',
            "a column that isn't part of the primary key — the kind 3NF cares about.",
          ],
        ]}
        mistake="confusing this with 2NF's partial dependency. 2NF is about a key with multiple columns where something depends on only PART of it; 3NF is about a chain of dependencies through a NON-key column, and applies even with a single-column key like emp_id here."
        howTo={[
          "Notice dept_name repeats for every employee sharing a department — it's really a fact about the department, not the employee.",
          'Click "Decompose to 3NF" to split department info into its own table.',
        ]}
      />
      <TableView title="Before (violates 3NF)" rows={before} highlightCols={['dept_name']} />
      {decomposed && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TableView title="Employee (3NF)" rows={employeeTable} good />
          <TableView title="Department (3NF)" rows={deptTable} good />
        </div>
      )}
      <DecomposeControls
        decomposed={decomposed}
        setDecomposed={setDecomposed}
        label="Decompose to 3NF"
      />
    </div>
  );
}

// ---------------- BCNF ----------------
function NFBcnf({
  decomposed,
  setDecomposed,
}: {
  decomposed: boolean;
  setDecomposed: (b: boolean) => void;
}) {
  const before = [
    { student: 'Ada', course: 'CS101', instructor: 'Dr. Turing' },
    { student: 'Ada', course: 'CS102', instructor: 'Dr. Hopper' },
    { student: 'Alan', course: 'CS101', instructor: 'Dr. Turing' },
  ];
  const studentInstructor = [
    { student: 'Ada', instructor: 'Dr. Turing' },
    { student: 'Ada', instructor: 'Dr. Hopper' },
    { student: 'Alan', instructor: 'Dr. Turing' },
  ];
  const instructorCourse = [
    { instructor: 'Dr. Turing', course: 'CS101' },
    { instructor: 'Dr. Hopper', course: 'CS102' },
  ];
  return (
    <div className="space-y-4">
      <Intro
        title="What is this?"
        body={
          <>
            This table is already in 3NF — (student, course) is the candidate key, and "course" is
            part of that key, so it's not subject to 3NF's rule about non-key columns. But it still
            violates <strong>BCNF</strong> (Boyce-Codd Normal Form), a stricter rule: <em>every</em>{' '}
            determinant must be a superkey. Here, instructor → course (each instructor only teaches
            one course), but "instructor" alone isn't a superkey — it's a determinant that shouldn't
            be allowed to determine anything under BCNF.
          </>
        }
        terms={[
          [
            'Determinant',
            'the left-hand side of a functional dependency — the thing that determines something else.',
          ],
          [
            'Superkey',
            'any set of attributes that uniquely identifies a row (a candidate key, or a candidate key plus extra columns).',
          ],
          [
            'BCNF',
            'a stricter version of 3NF requiring every determinant to be a superkey, with no exceptions for key attributes.',
          ],
        ]}
        mistake="assuming 3NF and BCNF always agree if a table looks 'clean.' They can genuinely differ, exactly like here — BCNF closes a loophole 3NF leaves open for determinants that happen to be part of the key. Watch the callout below: decomposing to fix THIS violation actually loses the ability to directly enforce the original (student, course) → instructor rule."
        howTo={[
          "Notice instructor → course holds (each instructor teaches one course) even though instructor isn't a key.",
          'Click "Decompose to BCNF" to fix the violation — then read the callout about what\'s lost.',
        ]}
      />
      <TableView
        title="Before (3NF, but violates BCNF)"
        rows={before}
        highlightCols={['instructor', 'course']}
      />
      {decomposed && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TableView title="Student_Instructor (BCNF)" rows={studentInstructor} good />
            <TableView title="Instructor_Course (BCNF)" rows={instructorCourse} good />
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="mb-1 font-semibold">Dependency preservation lost</p>
            <p>
              The original rule "(student, course) → instructor" — meaning a given student+course
              pair has exactly one instructor — can no longer be checked by looking at either table
              alone. You'd have to join Student_Instructor back to Instructor_Course and check
              consistency across both, which the database can't enforce with a simple key constraint
              on a single table. This is the well-known, genuinely rare case where a correct BCNF
              decomposition trades away dependency preservation that a 3NF version would have kept.
            </p>
          </div>
        </>
      )}
      <DecomposeControls
        decomposed={decomposed}
        setDecomposed={setDecomposed}
        label="Decompose to BCNF"
      />
    </div>
  );
}

// ---------------- shared bits ----------------
function Intro({
  title,
  body,
  terms,
  mistake,
  howTo,
}: {
  title: string;
  body: ReactNode;
  terms: [string, string][];
  mistake: string;
  howTo: string[];
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
      <p className="text-sm leading-relaxed text-stone-700">{body}</p>
      <div className="rounded-lg border border-stone-200 p-4">
        <p className="mb-2 text-sm font-semibold text-stone-900">Key terms</p>
        <dl className="space-y-1.5 text-sm">
          {terms.map(([t, d]) => (
            <div key={t}>
              <dt className="inline font-medium text-stone-900">{t}: </dt>
              <dd className="inline text-stone-600">{d}</dd>
            </div>
          ))}
        </dl>
      </div>
      <CommonMistake>{mistake}</CommonMistake>
      <div className="space-y-1 rounded-lg bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">How to use this</p>
        <ol className="list-inside list-decimal space-y-0.5">
          {howTo.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function TableView({
  title,
  rows,
  highlightCols = [],
  good = false,
}: {
  title: string;
  rows: Record<string, unknown>[];
  highlightCols?: string[];
  good?: boolean;
}) {
  if (rows.length === 0) return null;
  const cols = Object.keys(rows[0]);
  return (
    <div
      className={`overflow-hidden rounded-md border ${good ? 'border-emerald-300' : 'border-stone-200'}`}
    >
      <div
        className={`px-3 py-1.5 text-xs font-semibold ${good ? 'bg-emerald-600 text-white' : 'bg-stone-900 text-white'}`}
      >
        {title}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-stone-400">
            {cols.map((c) => (
              <th key={c} className="px-3 py-1 text-left font-normal">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-stone-100">
              {cols.map((c) => (
                <td
                  key={c}
                  className={`px-3 py-1 font-mono ${highlightCols.includes(c) && !good ? 'bg-amber-50 text-amber-800' : 'text-stone-700'}`}
                >
                  {String(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DecomposeControls({
  decomposed,
  setDecomposed,
  label,
}: {
  decomposed: boolean;
  setDecomposed: (b: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => setDecomposed(true)}
        disabled={decomposed}
        className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        {label}
      </button>
      <button
        onClick={() => setDecomposed(false)}
        className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
      >
        Reset
      </button>
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
