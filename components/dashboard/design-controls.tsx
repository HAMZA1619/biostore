"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { SingleImageUpload } from "@/components/dashboard/single-image-upload"
import { cn } from "@/lib/utils"
import { FONT_OPTIONS, BORDER_RADIUS_OPTIONS, COLOR_THEME_PRESETS } from "@/lib/constants"
import { Shuffle } from "lucide-react"
import type { DesignState, PreviewTab } from "./design-preview"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface DesignControlsProps {
  state: DesignState
  onChange: (patch: Partial<DesignState>) => void
  storeId: string
  activeTab: PreviewTab
}

const themes = [
  { value: "default" as const, labelKey: "design.themeDefault", descKey: "design.themeDefaultDesc" },
  { value: "modern" as const, labelKey: "design.themeModern", descKey: "design.themeModernDesc" },
  { value: "minimal" as const, labelKey: "design.themeMinimal", descKey: "design.themeMinimalDesc" },
  { value: "single" as const, labelKey: "design.themeSingle", descKey: "design.themeSingleDesc" },
]

const fontLinkHref = `https://fonts.googleapis.com/css2?${FONT_OPTIONS.map(
  (f) => `family=${f.value.replace(/ /g, "+")}:wght@400;500;600;700`
).join("&")}&display=swap`

export function DesignControls({ state, onChange, storeId, activeTab }: DesignControlsProps) {
  const { t } = useTranslation()
  const [expandedColor, setExpandedColor] = useState<string | null>(null)

  const colorSlots = [
    { key: "primaryColor" as const, label: t("design.colorPrimary"), value: state.primaryColor },
    { key: "accentColor" as const, label: t("design.colorAccent"), value: state.accentColor },
    { key: "backgroundColor" as const, label: t("design.colorBackground"), value: state.backgroundColor },
    { key: "textColor" as const, label: t("design.colorText"), value: state.textColor },
    { key: "buttonTextColor" as const, label: t("design.colorButtonText"), value: state.buttonTextColor },
  ]

  const matchingPreset = COLOR_THEME_PRESETS.find(
    (p) =>
      state.primaryColor === p.colors.primary_color &&
      state.accentColor === p.colors.accent_color &&
      state.backgroundColor === p.colors.background_color &&
      state.textColor === p.colors.text_color &&
      state.buttonTextColor === p.colors.button_text_color
  )

  function handleShuffle() {
    const others = COLOR_THEME_PRESETS.filter((p) => p !== matchingPreset)
    const pick = others[Math.floor(Math.random() * others.length)]
    onChange({
      primaryColor: pick.colors.primary_color,
      accentColor: pick.colors.accent_color,
      backgroundColor: pick.colors.background_color,
      textColor: pick.colors.text_color,
      buttonTextColor: pick.colors.button_text_color,
    })
    setExpandedColor(null)
  }

  return (
    <div className="space-y-6">
      {/* Load Google Fonts for preview in dropdown */}
      <link rel="stylesheet" href={fontLinkHref} />

      {activeTab === "store" && (
        <>
          {/* Logo & Banner */}
          <div className="flex items-start gap-4">
            <div className="w-[120px] shrink-0 space-y-1.5">
              <h3 className="text-sm font-medium">{t("design.logo")}</h3>
              <div className="h-[120px]">
                <SingleImageUpload
                  storeId={storeId}
                  value={state.logoUrl}
                  onChange={(url) => onChange({ logoUrl: url })}
                  aspect="square"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">{t("design.logoSize")}</p>
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <h3 className="text-sm font-medium">{t("design.banner")}</h3>
              <div className="h-[120px]">
                <SingleImageUpload
                  storeId={storeId}
                  value={state.bannerUrl}
                  onChange={(url) => onChange({ bannerUrl: url })}
                  aspect="wide"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">{t("design.bannerSize")}</p>
            </div>
          </div>

          {/* Font */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">{t("design.font")}</h3>
            <Select value={state.fontFamily} onValueChange={(v) => onChange({ fontFamily: v })}>
              <SelectTrigger className="w-full" style={{ fontFamily: `'${state.fontFamily}', sans-serif` }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((font) => (
                  <SelectItem
                    key={font.value}
                    value={font.value}
                    style={{ fontFamily: `'${font.value}', sans-serif` }}
                  >
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color Theme */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{t("design.colorPresets")}</h3>
              <button
                type="button"
                onClick={handleShuffle}
                className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Shuffle className="h-3 w-3" />
                {t("design.shuffle")}
              </button>
            </div>

            <p className="text-xs font-medium">
              {matchingPreset ? t(matchingPreset.nameKey) : t("design.customTheme")}
            </p>

            <div className="flex items-center justify-center gap-3">
              {colorSlots.map((slot) => (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() => setExpandedColor(expandedColor === slot.key ? null : slot.key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg p-1.5 transition-all",
                    expandedColor === slot.key ? "bg-muted" : "hover:bg-muted/50"
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full border-2 cursor-pointer transition-all",
                      expandedColor === slot.key
                        ? "border-primary ring-2 ring-primary/20 scale-110"
                        : "border-black/10 hover:scale-105"
                    )}
                    style={{ backgroundColor: slot.value }}
                  />
                  <span className="text-[9px] text-muted-foreground max-w-[3rem] truncate">{slot.label}</span>
                </button>
              ))}
            </div>

            <p className="text-center text-[11px] text-muted-foreground">{t("design.colorPresetsHint")}</p>

            {expandedColor && (() => {
              const slot = colorSlots.find((s) => s.key === expandedColor)!
              return (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                  <Label className="text-xs">{slot.label}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={slot.value}
                      onChange={(e) => onChange({ [slot.key]: e.target.value } as Partial<DesignState>)}
                      className="h-9 w-9 cursor-pointer rounded-md border border-input p-0.5"
                    />
                    <Input
                      value={slot.value}
                      onChange={(e) => {
                        const v = e.target.value
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v) || v === "#") onChange({ [slot.key]: v } as Partial<DesignState>)
                      }}
                      className="flex-1 font-mono text-sm"
                      maxLength={7}
                    />
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Border Radius */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">{t("design.borderRadius")}</h3>
            <div className="grid grid-cols-5 gap-2">
              {BORDER_RADIUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ borderRadius: opt.value as DesignState["borderRadius"] })}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-colors",
                    state.borderRadius === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <div
                    className="h-8 w-8 border-2 border-muted-foreground/40 bg-muted"
                    style={{ borderRadius: opt.css }}
                  />
                  <span className="text-[10px] font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">{t("design.theme")}</h3>
            <div className="grid grid-cols-4 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  type="button"
                  onClick={() => onChange({ theme: theme.value })}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-center transition-colors",
                    state.theme === theme.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <ThemeMini variant={theme.value} />
                  <span className="text-[10px] font-medium">{t(theme.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Floating Cart Button */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-floating-cart" className="text-sm">{t("design.floatingCart")}</Label>
              <p className="text-[11px] text-muted-foreground">{t("design.floatingCartHint")}</p>
            </div>
            <Switch
              id="show-floating-cart"
              checked={state.showFloatingCart}
              onCheckedChange={(v) => onChange({ showFloatingCart: v })}
            />
          </div>

          {/* Search Input */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-search" className="text-sm">{t("design.searchInput")}</Label>
              <p className="text-[11px] text-muted-foreground">{t("design.searchInputHint")}</p>
            </div>
            <Switch
              id="show-search"
              checked={state.showSearch}
              onCheckedChange={(v) => onChange({ showSearch: v })}
            />
          </div>
        </>
      )}

      {activeTab === "checkout" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">{t("design.checkoutForm")}</h3>
          <p className="text-[11px] text-muted-foreground">{t("design.checkoutFormHint")}</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-email" className="text-sm">{t("design.emailField")}</Label>
              <Switch
                id="show-email"
                checked={state.checkoutShowEmail}
                onCheckedChange={(v) => onChange({ checkoutShowEmail: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-country" className="text-sm">{t("design.countryField")}</Label>
              <Switch
                id="show-country"
                checked={state.checkoutShowCountry}
                onCheckedChange={(v) => onChange({ checkoutShowCountry: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-city" className="text-sm">{t("design.cityField")}</Label>
              <Switch
                id="show-city"
                checked={state.checkoutShowCity}
                onCheckedChange={(v) => onChange({ checkoutShowCity: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-note" className="text-sm">{t("design.noteField")}</Label>
              <Switch
                id="show-note"
                checked={state.checkoutShowNote}
                onCheckedChange={(v) => onChange({ checkoutShowNote: v })}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "thankyou" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">{t("design.thankYouPage")}</h3>
          <div className="space-y-1.5">
            <Label htmlFor="thank-you-msg" className="text-sm">{t("design.customMessage")}</Label>
            <Textarea
              id="thank-you-msg"
              value={state.thankYouMessage}
              onChange={(e) => onChange({ thankYouMessage: e.target.value })}
              placeholder={t("design.thankYouPlaceholder")}
              rows={3}
              className="text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ThemeMini({ variant }: { variant: string }) {
  const card =
    variant === "modern"
      ? "rounded-lg shadow"
      : variant === "minimal"
        ? "border-b"
        : variant === "single"
          ? ""
          : "rounded border"

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="h-2 w-full rounded-sm bg-muted" />
      {variant === "single" ? (
        <div className="flex flex-col gap-1">
          <div className={`h-6 bg-muted ${card}`} />
          <div className={`h-6 bg-muted ${card}`} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1">
          <div className={`h-6 bg-muted ${card}`} />
          <div className={`h-6 bg-muted ${card}`} />
        </div>
      )}
    </div>
  )
}
