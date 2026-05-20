import { Card } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, Legend } from "recharts";
import { type IRSnapshot } from "@/hooks/useUnitEconomics";

export function RevPerEmployeeCard({ data }: { data: IRSnapshot[] }) {
  const series = data.map((s) => ({
    date: s.snapshot_date.slice(5),
    RevPerFTE: Number(s.revenue_per_employee_usd ?? 0),
  }));
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-1">Revenue per Employee</h3>
      <p className="text-xs text-muted-foreground mb-3">Three-Person Unicorn benchmark: $1M / FTE</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
            <Legend />
            <ReferenceLine y={1_000_000} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label="$1M" />
            <Line type="monotone" dataKey="RevPerFTE" stroke="hsl(var(--primary))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
