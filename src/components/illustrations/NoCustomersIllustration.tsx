import type { SVGProps } from 'react';

export function NoCustomersIllustration(props: SVGProps<SVGSVGElement>) {
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
          d="M58.5 57C65.9558 57 72 50.9558 72 43.5C72 36.0442 65.9558 30 58.5 30C51.0442 30 45 36.0442 45 43.5C45 50.9558 51.0442 57 58.5 57Z"
          fill="hsl(var(--muted))"
        />
        <path
          d="M84 84.75V79.5C84 73.4294 79.0706 68.5 73 68.5H44C37.9294 68.5 33 73.4294 33 79.5V84.75"
          fill="hsl(var(--muted))"
        />
        <path
          d="M81.5 52.5C86.1944 52.5 90 48.6944 90 44C90 39.3056 86.1944 35.5 81.5 35.5C76.8056 35.5 73 39.3056 73 44C73 48.6944 76.8056 52.5 81.5 52.5Z"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M98 79.5V75.5C98 70.5294 93.9706 66.5 89 66.5H78"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M96 60H106"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M101 55V65"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}