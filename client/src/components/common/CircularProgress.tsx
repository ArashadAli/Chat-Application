interface Props {
  percent: number;     
  size?: number;     
  strokeWidth?: number;  
  color?: string;          
  trackColor?: string;
  label?: string;          
  showPercent?: boolean;
}
 
export default function CircularProgress({
  percent,
  size = 48,
  strokeWidth = 4,
  color = "#0ea5e9",         // sky-500
  trackColor = "#e2e8f0",    // neutral-200
  label,
  showPercent = true,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const center = size / 2;
 
  const isDone = percent >= 100;
  const activeColor = isDone ? "#22c55e" : color; // green-500 when done
 
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rotate-[-90deg]"
      aria-label={`${percent}%`}
    >
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={activeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.15s ease, stroke 0.3s ease" }}
      />
      {/* Center label — rotated back to normal */}
      {showPercent && (
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.22}
          fontWeight="700"
          fill={activeColor}
          style={{ transform: `rotate(90deg)`, transformOrigin: `${center}px ${center}px`, transition: "fill 0.3s ease" }}
        >
          {label ?? (isDone ? "✓" : `${percent}%`)}
        </text>
      )}
    </svg>
  );
}