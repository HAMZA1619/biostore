"use client"

import { useEffect } from "react"
import { useTiktokPixel } from "@/lib/hooks/use-tiktok-pixel"

interface Props {
  productName: string
  productId: string
  price: number
  currency: string
}

export function TiktokPixelViewContent({ productName, productId, price, currency }: Props) {
  const track = useTiktokPixel()

  useEffect(() => {
    track("ViewContent", {
      content_name: productName,
      content_id: productId,
      content_type: "product",
      value: price,
      currency: currency.toUpperCase(),
    })
  }, [track, productName, productId, price, currency])

  return null
}
