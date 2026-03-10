import { LeadivoIcon } from "@/components/icons/leadivo-icon"

export function LeadivoLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-0.5 ${className || ""}`}>
      <LeadivoIcon className="h-full w-auto shrink-0" />
      <span className="text-lg font-semibold leading-none tracking-tight">
        Leadivo
      </span>
    </div>
  )
}
