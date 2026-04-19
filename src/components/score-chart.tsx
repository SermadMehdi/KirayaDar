"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { formatMonth } from "@/lib/format"

interface ScoreChartProps {
  data: Array<{ generatedAt: string | Date; score: number }>
}

export function ScoreChart({ data }: ScoreChartProps) {
  const chartData = data.map((d) => ({
    date: formatMonth(d.generatedAt),
    score: d.score,
  }))

  if (chartData.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-muted-foreground bg-muted rounded-xl border border-border">
        Score history will appear here as you build more history
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[300, 850]}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          formatter={(value) => [value, "Kirayadar Score"]}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
          }}
          labelStyle={{ color: "#475569", fontWeight: 600 }}
        />
        <ReferenceLine y={670} stroke="#e2e8f0" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#059669"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#059669", strokeWidth: 0 }}
          activeDot={{ r: 6, fill: "#059669", strokeWidth: 2, stroke: "#fff" }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
