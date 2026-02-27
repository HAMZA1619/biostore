interface QrCodeProps {
  url: string
  size?: number
  className?: string
}

export function QrCode({ url, size = 180, className }: QrCodeProps) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=8`

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="QR Code"
      width={size}
      height={size}
      className={className}
      loading="eager"
    />
  )
}
