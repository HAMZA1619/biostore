import type { Metadata } from "next"
import { COUNTRIES } from "@/lib/countries"
import { generateCountryMetadata, CountryPage } from "@/lib/country-page"

const country = COUNTRIES.ar

export const metadata: Metadata = generateCountryMetadata(country)

export default function ArabicPage({ searchParams }: { searchParams: Promise<{ landing?: string }> }) {
  return <CountryPage country={country} searchParams={searchParams} />
}
