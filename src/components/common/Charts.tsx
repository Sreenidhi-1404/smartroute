import React, { useState } from 'react';

// Progress Bar
export const ProgressBar: React.FC<{
  value: number; // percentage 0-100
  label?: string;
  sublabel?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ value, label, sublabel, showPercentage = true, size = 'md' }) => {
  const clamped = Math.min(100, Math.max(0, value));
  
  // Color logic
  let color = 'bg-emerald-500';
  if (clamped >= 95) color = 'bg-rose-500';
  else if (clamped >= 80) color = 'bg-amber-500';
  else if (clamped < 40) color = 'bg-sky-500';

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="font-medium text-slate-700">{label}</span>
          <div className="flex items-center gap-1.5">
            {sublabel && <span className="text-slate-500">{sublabel}</span>}
            {showPercentage && (
              <span className="font-semibold text-slate-900">{clamped}%</span>
            )}
          </div>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${color} ${heights[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

// SVG Donut Chart
interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export const DonutChart: React.FC<{
  data: DonutSlice[];
  totalLabel?: string;
  totalValue?: string | number;
  size?: number;
}> = ({ data, totalLabel = 'Total', totalValue, size = 180 }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {total > 0 &&
            data.map((slice, i) => {
              const percent = slice.value / total;
              const dashoffset = circumference * (1 - percent);
              const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
              const rotation = accumulatedPercent * 360;
              accumulatedPercent += percent;

              return (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={hoveredIndex === i ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={0}
                  transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-xs uppercase font-medium text-slate-500">
            {hoveredIndex !== null ? data[hoveredIndex].label : totalLabel}
          </span>
          <span className="text-xl font-bold text-slate-900">
            {hoveredIndex !== null ? data[hoveredIndex].value : totalValue !== undefined ? totalValue : total}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-4 text-xs">
        {data.map((slice, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${
              hoveredIndex !== null && hoveredIndex !== i ? 'opacity-40' : 'opacity-100'
            }`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="text-slate-600 font-medium">{slice.label}:</span>
            <span className="text-slate-900 font-semibold">{slice.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// SVG Vertical Bar Chart
interface BarDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
  tooltip?: string;
}

export const BarChart: React.FC<{
  data: BarDataPoint[];
  height?: number;
  valueSuffix?: string;
  color?: string;
}> = ({ data, height = 200, valueSuffix = '', color = '#2563eb' }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="w-full">
      <div className="relative flex items-end justify-between gap-3 pt-6" style={{ height }}>
        {data.map((item, index) => {
          const heightPercent = (item.value / maxValue) * 100;
          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {hovered === index && (
                <div className="absolute -top-8 z-20 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded shadow whitespace-nowrap animate-in fade-in zoom-in-95">
                  {item.tooltip || `${item.label}: ${item.value}${valueSuffix}`}
                </div>
              )}

              {/* Bar */}
              <div className="w-full max-w-[42px] bg-slate-100 rounded-t-md overflow-hidden flex flex-col justify-end h-full">
                <div
                  className="w-full rounded-t-md transition-all duration-300"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: item.color || color,
                    opacity: hovered === index ? 1 : 0.85,
                  }}
                />
              </div>

              {/* X label */}
              <span className="text-[11px] font-medium text-slate-500 mt-2 truncate w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// SVG Line Chart for Attendance trends
interface LinePoint {
  label: string;
  value: number; // e.g. attendance percentage
}

export const LineChart: React.FC<{
  data: LinePoint[];
  height?: number;
  lineColor?: string;
  fillColor?: string;
  valueSuffix?: string;
}> = ({
  data,
  height = 180,
  lineColor = '#2563eb',
  fillColor = 'rgba(37, 99, 235, 0.08)',
  valueSuffix = '%',
}) => {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) return null;

  const width = 500;
  const paddingX = 30;
  const paddingY = 20;

  const values = data.map(d => d.value);
  const minVal = Math.max(0, Math.min(...values) - 10);
  const maxVal = Math.min(100, Math.max(...values) + 5);
  const range = maxVal - minVal || 1;

  const getX = (index: number) => paddingX + (index * (width - 2 * paddingX)) / (data.length - 1);
  const getY = (val: number) => height - paddingY - ((val - minVal) / range) * (height - 2 * paddingY);

  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  const areaPoints = `${points} ${getX(data.length - 1)},${height - paddingY} ${getX(0)},${height - paddingY}`;

  return (
    <div className="w-full">
      <div className="relative w-full" style={{ height }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={getY(maxVal)}
            x2={width - paddingX}
            y2={getY(maxVal)}
            stroke="#f1f5f9"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={getY(minVal)}
            x2={width - paddingX}
            y2={getY(minVal)}
            stroke="#f1f5f9"
            strokeDasharray="4 4"
          />

          {/* Shaded Area */}
          <polygon points={areaPoints} fill={fillColor} />

          {/* Polyline */}
          <polyline
            fill="none"
            stroke={lineColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Points */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.value);
            const isHovered = hovered === i;
            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill="#ffffff"
                  stroke={lineColor}
                  strokeWidth="2.5"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover detail box */}
        {hovered !== null && (
          <div
            className="absolute z-10 px-2.5 py-1 bg-slate-900 text-white rounded text-xs pointer-events-none transform -translate-x-1/2 -translate-y-8"
            style={{
              left: `${(getX(hovered) / width) * 100}%`,
              top: `${(getY(data[hovered].value) / height) * 100}%`,
            }}
          >
            <div className="font-semibold">
              {data[hovered].value}
              {valueSuffix}
            </div>
            <div className="text-[10px] text-slate-300">{data[hovered].label}</div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 px-4">
        {data.map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>
    </div>
  );
};
