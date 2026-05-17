interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}

export function Sparkline({
  values,
  width = 60,
  height = 18,
  stroke = "#cb181d",
}: SparklineProps) {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const range = hi - lo || 1;
  const pad = 1;
  const innerW = width - 2 * pad;
  const innerH = height - 2 * pad;
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * innerW;
    const y = pad + innerH - ((v - lo) / range) * innerH;
    return [x, y] as const;
  });
  const polyline = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [, endY] = points[points.length - 1];
  const [, startY] = points[0];
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-label={`Trend across ${values.length} points`}
      className="inline-block align-middle"
    >
      <polyline
        points={polyline}
        fill="none"
        stroke={stroke}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={pad} cy={startY} r={1.5} fill="#9ca3af" />
      <circle cx={width - pad} cy={endY} r={1.75} fill={stroke} />
    </svg>
  );
}
