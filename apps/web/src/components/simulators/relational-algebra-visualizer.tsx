'use client';

import { Button, Card, CardContent } from '@sv-os/ui';
import { Database, Filter } from 'lucide-react';
import { useState } from 'react';

export function RelationalAlgebraVisualizer() {
  const [op, setOp] = useState<string>('PROJECT');
  const [query, setQuery] = useState<string>('π_{name, dept} (Employees ⋈_{dept_id} Departments)');

  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-primary-400 text-lg font-bold">
              Relational Algebra Query Evaluator
            </h3>
            <p className="text-xs text-neutral-400">
              Databases — Selection, Projection, Natural Join & Set Operations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={op === 'PROJECT' ? 'default' : 'outline'}
              onClick={() => {
                setOp('PROJECT');
                setQuery('π_{name, dept} (Employees)');
              }}
              className="text-xs"
            >
              Projection (π)
            </Button>
            <Button
              size="sm"
              variant={op === 'JOIN' ? 'default' : 'outline'}
              onClick={() => {
                setOp('JOIN');
                setQuery('Employees ⋈_{dept_id} Departments');
              }}
              className="text-xs"
            >
              Join (⋈)
            </Button>
          </div>
        </div>

        {/* Query Display */}
        <div className="text-primary-300 rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-center font-mono text-sm">
          {query}
        </div>

        {/* Result Table Preview */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-neutral-400">Relational Result Set:</div>
          <table className="w-full border-collapse overflow-hidden rounded-lg border border-neutral-800 text-left font-mono text-xs">
            <thead className="bg-neutral-800 text-neutral-300">
              <tr>
                <th className="border-b border-neutral-700 p-2.5">emp_id</th>
                <th className="border-b border-neutral-700 p-2.5">name</th>
                <th className="border-b border-neutral-700 p-2.5">dept_name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-400">
              <tr>
                <td className="p-2.5">101</td>
                <td className="p-2.5">Alice Smith</td>
                <td className="p-2.5">Engineering</td>
              </tr>
              <tr>
                <td className="p-2.5">102</td>
                <td className="p-2.5">Bob Jones</td>
                <td className="p-2.5">Infrastructure</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
