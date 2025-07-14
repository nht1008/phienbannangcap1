import type { SVGProps } from 'react';

export function NoEmployeesIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="128"
      height="128"
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g opacity="0.8">
        <rect
          x="44"
          y="28"
          width="40"
          height="24"
          rx="4"
          fill="hsl(var(--muted))"
        />
        <path
          d="M64 52V68"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="2"
        />
        <rect
          x="28"
          y="68"
          width="72"
          height="2"
          fill="hsl(var(--muted-foreground))"
        />
        <path
          d="M40 70V84"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="2"
        />
        <path
          d="M88 70V84"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="2"
        />
        <rect
          x="28"
          y="84"
          width="24"
          height="24"
          rx="12"
          fill="hsl(var(--muted))"
        />
        <rect
          x="76"
          y="84"
          width="24"
          height="24"
          rx="12"
          fill="hsl(var(--muted))"
        />
        <circle
          cx="64"
          cy="96"
          r="12"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </g>
    </svg>
  );
}