import { BiostoreIcon } from "@/components/icons/biostore-icon"

export function BiostoreLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-0 ${className || ""}`}>
      <BiostoreIcon className="h-[28px] w-auto" />
      <span className="text-lg font-semibold leading-none tracking-tight">
        BioStore
      </span>
    </div>
  )
}
