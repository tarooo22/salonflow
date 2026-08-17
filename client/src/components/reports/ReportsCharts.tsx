import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatGelTetri } from "@/lib/presentation";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

type RevenuePoint = { date: string; revenueTetri: number };
type CommissionSpecialist = { staffProfileId: string; publicDisplayName: string; amountTetri: number; paidTetri: number; entryCount: number };

const revenueConfig = {
  revenueTetri: { label: "შემოსავალი", color: "var(--sf-fuchsia)" },
} satisfies ChartConfig;

const commissionConfig = {
  amountTetri: { label: "დარიცხული", color: "var(--sf-violet)" },
  paidTetri: { label: "გადახდილი", color: "var(--sf-jade)" },
} satisfies ChartConfig;

const compactGel = (value: number) => new Intl.NumberFormat("ka-GE", {
  style: "currency",
  currency: "GEL",
  notation: "compact",
  maximumFractionDigits: 1,
}).format(value / 100);

const formatChartDate = (value: string) => new Intl.DateTimeFormat("ka-GE", {
  day: "2-digit",
  month: "short",
}).format(new Date(`${value}T12:00:00Z`));

export function RevenueTrendChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">შემოსავლის დინამიკა</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">თარიღების მიხედვით აქტიური ჯავშნებიდან მიღებული თანხა.</p>
        </div>
        <span className="rounded-full bg-[color-mix(in_srgb,var(--sf-fuchsia)_13%,transparent)] px-2.5 py-1 text-xs font-semibold text-[var(--sf-accent-strong)]">რეალური მონაცემი</span>
      </div>
      <div className="sr-only" aria-live="polite">შემოსავლის გრაფიკი შეიცავს {data.length} დღის მონაცემს.</div>
      <ChartContainer id="report-revenue-trend" config={revenueConfig} className="h-[270px] w-full aspect-auto" role="img" aria-label="შემოსავლის დინამიკის გრაფიკი">
        <AreaChart data={data} margin={{ top: 12, right: 10, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="var(--color-revenueTetri)" stopOpacity={0.45} />
              <stop offset="95%" stopColor="var(--color-revenueTetri)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={formatChartDate} />
          <YAxis width={58} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={compactGel} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" labelFormatter={label => formatChartDate(String(label))} formatter={(value) => <span className="font-mono font-semibold">{formatGelTetri(Number(value))}</span>} />} />
          <Area type="monotone" dataKey="revenueTetri" stroke="var(--color-revenueTetri)" strokeWidth={2.5} fill="url(#revenue-fill)" />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

export function CommissionDistributionChart({ data }: { data: CommissionSpecialist[] }) {
  const chartData = data.slice(0, 6).map(row => ({ ...row, label: row.publicDisplayName.length > 17 ? `${row.publicDisplayName.slice(0, 16)}…` : row.publicDisplayName }));
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">საკომისიო სპეციალისტების მიხედვით</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">დარიცხული და გადახდილი თანხის შედარება არჩეულ პერიოდში.</p>
      </div>
      <div className="sr-only" aria-live="polite">საკომისიოების გრაფიკი შეიცავს {chartData.length} სპეციალისტის მონაცემს.</div>
      <ChartContainer id="report-commission-distribution" config={commissionConfig} className="h-[300px] w-full aspect-auto" role="img" aria-label="სპეციალისტების საკომისიოების შედარებითი გრაფიკი">
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 14, left: 10, bottom: 0 }} barGap={5}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={compactGel} />
          <YAxis dataKey="label" type="category" width={102} tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip cursor={{ fill: "color-mix(in srgb, var(--sf-surface-hover) 70%, transparent)" }} content={<ChartTooltipContent labelKey="label" formatter={(value) => <span className="font-mono font-semibold">{formatGelTetri(Number(value))}</span>} />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="amountTetri" fill="var(--color-amountTetri)" radius={[0, 5, 5, 0]} />
          <Bar dataKey="paidTetri" fill="var(--color-paidTetri)" radius={[0, 5, 5, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
