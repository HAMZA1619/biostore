"use client"

import { useEffect } from "react"
import { usePixel } from "@/lib/hooks/use-pixel"

interface Props {
  productName: string
  productId: string
  price: number
  currency: string
}

export function PixelViewContent({ productName, productId, price, currency }: Props) {
  const track = usePixel()

  useEffect(() => {
    track("ViewContent", {
      content_name: productName,
      content_ids: [productId],
      content_type: "product",
      value: price,
      currency: currency.toUpperCase(),
    })
  }, [track, productName, productId, price, currency])

  return null
}
