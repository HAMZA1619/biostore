"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { SingleImageUpload } from "@/components/dashboard/single-image-upload"
import { cn } from "@/lib/utils"
import { FONT_OPTIONS, BORDER_RADIUS_OPTIONS } from "@/lib/constants"
import type { DesignState, PreviewTab } from "./design-preview"

interface DesignControlsProps {
  state: DesignState
  onChange: (patch: Partial<DesignState>) => void
  storeId: string
  activeTab: PreviewTab
}

const themes = [
  { value: "default" as const, label: "Default", description: "Clean and classic" },
  { value: "modern" as const, label: "Modern", description: "Bold with shadows" },
  { value: "minimal" as const, label: "Minimal", description: "Simple and flat" },
]

const fontLinkHref = `https://fonts.googleapis.com/css2?${FONT_OPTIONS.map(
  (f) => `family=${f.value.replace(/ /g, "+")}:wght@400;500;600;700`
).join("&")}&display=swap`

export function DesignControls({ state, onChange, storeId, activeTab }: DesignControlsProps) {
  return (
    <div className="space-y-6">
      {/* Load Google Fonts for preview in dropdown */}
      <link rel="stylesheet" href={fontLinkHref} />

      {activeTab === "store" && (
        <>
          {/* Logo & Banner */}
          <div className="flex items-start gap-4">
            <div className="w-[120px] shrink-0 space-y-1.5">
              <h3 className="text-sm font-medium">Logo</h3>
              <div className="h-[120px]">
                <SingleImageUpload
                  storeId={storeId}
                  value={state.logoUrl}
                  onChange={(url) => onChange({ logoUrl: url })}
                  aspect="square"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">512x512px</p>
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <h3 className="text-sm font-medium">Banner</h3>
              <div className="h-[120px]">
                <SingleImageUpload
                  storeId={storeId}
                  value={state.bannerUrl}
                  onChange={(url) => onChange({ bannerUrl: url })}
                  aspect="wide"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">1200x400px</p>
            </div>
          </div>

          {/* Font */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Font</h3>
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

          {/* Colors */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Colors</h3>
            <div className="grid grid-cols-2 gap-4">
              <ColorPicker
                label="Primary"
                value={state.primaryColor}
                onChange={(v) => onChange({ primaryColor: v })}
              />
              <ColorPicker
                label="Accent"
                value={state.accentColor}
                onChange={(v) => onChange({ accentColor: v })}
              />
              <ColorPicker
                label="Background"
                value={state.backgroundColor}
                onChange={(v) => onChange({ backgroundColor: v })}
              />
              <ColorPicker
                label="Text"
                value={state.textColor}
                onChange={(v) => onChange({ textColor: v })}
              />
              <ColorPicker
                label="Button Text"
                value={state.buttonTextColor}
                onChange={(v) => onChange({ buttonTextColor: v })}
              />
            </div>
          </div>

          {/* Border Radius */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Border Radius</h3>
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
            <h3 className="text-sm font-medium">Theme</h3>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => onChange({ theme: t.value })}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition-colors",
                    state.theme === t.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <ThemeMini variant={t.value} />
                  <span className="text-xs font-medium">{t.label}</span>
                  <span className="text-[10px] text-muted-foreground">{t.description}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "checkout" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Checkout Form</h3>
          <p className="text-[11px] text-muted-foreground">Show or hide optional fields on the checkout page</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-email" className="text-sm">Email field</Label>
              <Switch
                id="show-email"
                checked={state.checkoutShowEmail}
                onCheckedChange={(v) => onChange({ checkoutShowEmail: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-country" className="text-sm">Country field</Label>
              <Switch
                id="show-country"
                checked={state.checkoutShowCountry}
                onCheckedChange={(v) => onChange({ checkoutShowCountry: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-city" className="text-sm">City field</Label>
              <Switch
                id="show-city"
                checked={state.checkoutShowCity}
                onCheckedChange={(v) => onChange({ checkoutShowCity: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-note" className="text-sm">Note field</Label>
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
          <h3 className="text-sm font-medium">Thank You Page</h3>
          <div className="space-y-1.5">
            <Label htmlFor="thank-you-msg" className="text-sm">Custom message</Label>
            <Textarea
              id="thank-you-msg"
              value={state.thankYouMessage}
              onChange={(e) => onChange({ thankYouMessage: e.target.value })}
              placeholder="Thank you for your order! We've received it and will confirm it shortly."
              rows={3}
              className="text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 cursor-pointer rounded-md border border-input p-0.5"
        />
        <Input
          value={value}
          onChange={(e) => {
            const v = e.target.value
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v) || v === "#") onChange(v)
          }}
          className="flex-1 font-mono text-sm"
          maxLength={7}
        />
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
        : "rounded border"

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="h-2 w-full rounded-sm bg-muted" />
      <div className="grid grid-cols-2 gap-1">
        <div className={`h-6 bg-muted ${card}`} />
        <div className={`h-6 bg-muted ${card}`} />
      </div>
    </div>
  )
}
