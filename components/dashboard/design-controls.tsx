"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { SingleImageUpload } from "@/components/dashboard/single-image-upload"
import { cn } from "@/lib/utils"
import { FONT_OPTIONS, BORDER_RADIUS_OPTIONS, COLOR_THEME_PRESETS, BUTTON_STYLE_OPTIONS, CARD_SHADOW_OPTIONS, PRODUCT_IMAGE_RATIO_OPTIONS, LAYOUT_SPACING_OPTIONS } from "@/lib/constants"
import { Shuffle, Palette, Type, LayoutGrid, Settings2, ImageIcon, CreditCard, Heart } from "lucide-react"
import type { DesignState, PreviewTab } from "./design-preview"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

type SectionId = "branding" | "colors" | "typography" | "layout" | "checkout" | "thankyou" | "preferences"

const sections: { id: SectionId; icon: React.ComponentType<{ className?: string }>; labelKey: string; previewTab: PreviewTab }[] = [
  { id: "branding", icon: ImageIcon, labelKey: "design.branding", previewTab: "store" },
  { id: "colors", icon: Palette, labelKey: "design.colors", previewTab: "store" },
  { id: "typography", icon: Type, labelKey: "design.typography", previewTab: "store" },
  { id: "layout", icon: LayoutGrid, labelKey: "design.layoutStyle", previewTab: "store" },
  { id: "checkout", icon: CreditCard, labelKey: "design.checkout", previewTab: "checkout" },
  { id: "thankyou", icon: Heart, labelKey: "design.thankYou", previewTab: "thankyou" },
  { id: "preferences", icon: Settings2, labelKey: "design.preferences", previewTab: "store" },
]

interface DesignControlsProps {
  state: DesignState
  onChange: (patch: Partial<DesignState>) => void
  storeId: string
  previewTab: PreviewTab
  onPreviewTabChange: (tab: PreviewTab) => void
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

const defaultSectionForTab: Record<PreviewTab, SectionId> = {
  store: "branding",
  checkout: "checkout",
  thankyou: "thankyou",
}

export function DesignControls({ state, onChange, storeId, previewTab, onPreviewTabChange }: DesignControlsProps) {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<SectionId>("branding")

  // Sync sidebar when preview tab changes externally (e.g. clicking preview tabs)
  useEffect(() => {
    const currentSection = sections.find((s) => s.id === activeSection)
    if (currentSection && currentSection.previewTab !== previewTab) {
      setActiveSection(defaultSectionForTab[previewTab])
    }
  }, [previewTab])

  function handleSectionChange(id: SectionId) {
    setActiveSection(id)
    const section = sections.find((s) => s.id === id)
    if (section) onPreviewTabChange(section.previewTab)
  }

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
  }

  return (
    <div className="flex gap-6">
      {/* Load Google Fonts for preview in dropdown */}
      <link rel="stylesheet" href={fontLinkHref} />

      {/* Sidebar */}
      <nav className="flex w-[160px] shrink-0 flex-col gap-1 pt-1">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => handleSectionChange(section.id)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-colors",
              activeSection === section.id
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <section.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{t(section.labelKey)}</span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="min-w-0 flex-1 max-w-md">
        <div className="space-y-6">

          {/* Branding */}
          {activeSection === "branding" && (
            <>
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

              <div className="space-y-2">
                <h3 className="text-sm font-medium">{t("storefront.storefrontLanguage")}</h3>
                <Select value={state.language} onValueChange={(v) => onChange({ language: v as DesignState["language"] })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t("language.en")}</SelectItem>
                    <SelectItem value="fr">{t("language.fr")}</SelectItem>
                    <SelectItem value="ar">{t("language.ar")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Colors */}
          {activeSection === "colors" && (
            <div className="space-y-6">
              {/* Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{t("design.colorPresets")}</h3>
                  <button
                    type="button"
                    onClick={handleShuffle}
                    className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Shuffle className="h-3 w-3" />
                    {t("design.shuffle")}
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_THEME_PRESETS.map((preset) => {
                    const isActive = matchingPreset?.id === preset.id
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        title={t(preset.nameKey)}
                        onClick={() => {
                          onChange({
                            primaryColor: preset.colors.primary_color,
                            accentColor: preset.colors.accent_color,
                            backgroundColor: preset.colors.background_color,
                            textColor: preset.colors.text_color,
                            buttonTextColor: preset.colors.button_text_color,
                          })
                        }}
                        className={cn(
                          "flex h-10 overflow-hidden rounded-lg border-2 transition-all",
                          isActive
                            ? "border-primary ring-2 ring-primary/20 scale-105"
                            : "border-transparent hover:border-muted-foreground/30 hover:scale-105"
                        )}
                      >
                        <div className="flex-1" style={{ backgroundColor: preset.colors.primary_color }} />
                        <div className="flex-1" style={{ backgroundColor: preset.colors.accent_color }} />
                        <div className="flex-1" style={{ backgroundColor: preset.colors.background_color }} />
                        <div className="flex-1" style={{ backgroundColor: preset.colors.text_color }} />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Individual colors */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">{t("design.customColors")}</h3>
                <div className="space-y-2">
                  {colorSlots.map((slot) => (
                    <div key={slot.key} className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={slot.value}
                          onChange={(e) => onChange({ [slot.key]: e.target.value } as Partial<DesignState>)}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                        <div
                          className="h-8 w-8 rounded-md border border-input shadow-sm"
                          style={{ backgroundColor: slot.value }}
                        />
                      </div>
                      <span className="min-w-0 flex-1 text-sm">{slot.label}</span>
                      <Input
                        value={slot.value}
                        onChange={(e) => {
                          const v = e.target.value
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(v) || v === "#") onChange({ [slot.key]: v } as Partial<DesignState>)
                        }}
                        className="w-24 font-mono text-xs"
                        maxLength={7}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Typography */}
          {activeSection === "typography" && (
            <div className="space-y-6">
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

              <div className="space-y-2">
                <h3 className="text-sm font-medium">{t("design.headingFont")}</h3>
                <Select value={state.headingFont || ""} onValueChange={(v) => onChange({ headingFont: v || null })}>
                  <SelectTrigger className="w-full" style={state.headingFont ? { fontFamily: `'${state.headingFont}', sans-serif` } : undefined}>
                    <SelectValue placeholder={t("design.headingFontPlaceholder")} />
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
            </div>
          )}

          {/* Layout & Style */}
          {activeSection === "layout" && (
            <div className="space-y-6">
              {/* Theme */}
              <div className="space-y-2">
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

              {/* Button Style */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">{t("design.buttonStyle")}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {BUTTON_STYLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onChange({ buttonStyle: opt.value as DesignState["buttonStyle"] })}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-colors",
                        state.buttonStyle === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                    >
                      <div
                        className={cn(
                          "h-6 w-full text-[9px] font-medium flex items-center justify-center",
                          opt.value === "filled" && "bg-primary text-primary-foreground rounded-md",
                          opt.value === "outline" && "border-2 border-primary text-primary rounded-md",
                          opt.value === "pill" && "bg-primary text-primary-foreground rounded-full"
                        )}
                      >
                        {t(`design.buttonStyle${opt.label}`)}
                      </div>
                    </button>
                  ))}
                </div>
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

              {/* Card Shadow */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">{t("design.cardShadow")}</h3>
                <div className="grid grid-cols-4 gap-2">
                  {CARD_SHADOW_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onChange({ cardShadow: opt.value as DesignState["cardShadow"] })}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-colors",
                        state.cardShadow === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                    >
                      <div
                        className="h-8 w-full rounded bg-background"
                        style={{ boxShadow: opt.css }}
                      />
                      <span className="text-[10px] font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Image Ratio */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">{t("design.productImageRatio")}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {PRODUCT_IMAGE_RATIO_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onChange({ productImageRatio: opt.value as DesignState["productImageRatio"] })}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-colors",
                        state.productImageRatio === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                    >
                      <div className="flex items-center justify-center" style={{ width: "2.5rem", aspectRatio: opt.css }}>
                        <div className="h-full w-full rounded border-2 border-muted-foreground/40 bg-muted" />
                      </div>
                      <span className="text-[10px] font-medium">{t(`design.ratio${opt.label}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Spacing */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">{t("design.layoutSpacing")}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {LAYOUT_SPACING_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onChange({ layoutSpacing: opt.value as DesignState["layoutSpacing"] })}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-colors",
                        state.layoutSpacing === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                    >
                      <div className="flex w-full gap-0.5" style={{ gap: opt.gap }}>
                        <div className="h-4 flex-1 rounded-sm bg-muted" />
                        <div className="h-4 flex-1 rounded-sm bg-muted" />
                      </div>
                      <span className="text-[10px] font-medium">{t(`design.spacing${opt.label}`)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Checkout */}
          {activeSection === "checkout" && (
            <div className="space-y-4">
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

          {/* Thank You */}
          {activeSection === "thankyou" && (
            <div className="space-y-4">
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

          {/* Preferences */}
          {activeSection === "preferences" && (
            <div className="space-y-4">
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
            </div>
          )}

        </div>
      </div>
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
