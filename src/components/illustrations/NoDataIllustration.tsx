import type { SVGProps } from 'react';

export function NoDataIllustration(props: SVGProps<SVGSVGElement>) {
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
        <path
          d="M32 98H102"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M32 82L48 66L68 76L88 56L102 70"
          stroke="hsl(var(--muted))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="78"
          cy="54"
          r="18"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
        />
        <path
          d="M92 68L102 78"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}