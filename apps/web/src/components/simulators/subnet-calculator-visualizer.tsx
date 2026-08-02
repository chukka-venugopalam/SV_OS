'use client';

import { Card, CardContent } from '@sv-os/ui';

export function SubnetCalculatorVisualizer() {
  return (
    <Card className="border-neutral-200 bg-neutral-900 text-white dark:border-neutral-800">
      <CardContent className="space-y-6 p-6">
        <div>
          <h3 className="text-primary-400 text-lg font-bold">
            CIDR Subnet Mask & IPv4 Calculator Visualizer
          </h3>
          <p className="text-xs text-neutral-400">
            Computer Networks — IPv4 Subnetting & Network/Broadcast Address Range
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-xs text-emerald-400">
          IP: 192.168.1.0/24 | Netmask: 255.255.255.0 | Usable Hosts: 254 (192.168.1.1 -
          192.168.1.254)
        </div>
      </CardContent>
    </Card>
  );
}
