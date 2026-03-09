import { LeadivoIcon } from "@/components/icons/leadivo-icon"

export function LeadivoLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-0 ${className || ""}`}>
      <LeadivoIcon className="h-[28px] w-auto" />
      <span className="text-lg font-semibold leading-none tracking-tight">
        Leadivo
      </span>
    </div>
  )
}
