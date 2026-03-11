import Image from "next/image"

export function LeadivoLogo({ className }: { className?: string }) {
  return (
    <div className={className || ""}>
      <Image
        src="/logo-light.png"
        alt="Leadivo"
        width={938}
        height={244}
        className="h-full w-auto dark:hidden"
        priority
      />
      <Image
        src="/logo-dark.png"
        alt="Leadivo"
        width={938}
        height={245}
        className="hidden h-full w-auto dark:block"
        priority
      />
    </div>
  )
}
