export function BiostoreIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BioStore"
    >
      <rect x="8" y="16" width="26" height="26" rx="4" className="fill-primary" />
      <path
        d="M16 16v-4a5 5 0 0 1 10 0v4"
        className="stroke-primary"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="16" cy="17.5" r="1.3" fill="white" />
      <circle cx="26" cy="17.5" r="1.3" fill="white" />
      <defs>
        <clipPath id="bag-clip">
          <rect x="8" y="16" width="26" height="26" rx="4" />
        </clipPath>
      </defs>
      <path d="M22 27l0 15 4.5-3.5 3 6.5 3-1.4-3-6.5 5.5 0z" className="fill-primary" stroke="white" strokeWidth="1.5" strokeLinejoin="miter" clipPath="url(#bag-clip)" />
    </svg>
  )
}
