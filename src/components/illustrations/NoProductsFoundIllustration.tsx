import type { SVGProps } from 'react';

export function NoProductsFoundIllustration(props: SVGProps<SVGSVGElement>) {
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
        <circle
          cx="58"
          cy="58"
          r="24"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="3"
        />
        <path
          d="M76 76L92 92"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M40 98H98"
          stroke="hsl(var(--muted))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 8"
        />
         <path
          d="M30 30L40 40"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
        />
         <path
          d="M40 30L30 40"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}