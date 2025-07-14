import type { SVGProps } from 'react';

export function NoDebtIllustration(props: SVGProps<SVGSVGElement>) {
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
          x="30"
          y="25"
          width="68"
          height="85"
          rx="4"
          fill="hsl(var(--muted))"
        />
        <path
          d="M42 45H86"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M42 60H70"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M42 75H80"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle
          cx="80"
          cy="85"
          r="20"
          fill="hsl(var(--success))"
        />
        <path
          d="M72 85L78 91L90 79"
          stroke="hsl(var(--success-foreground))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}