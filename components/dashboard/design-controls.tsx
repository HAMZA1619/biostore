"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SingleImageUpload } from "@/components/dashboard/single-image-upload"
import { cn } from "@/lib/utils"
import type { DesignState } from "./design-preview"

interface DesignControlsProps {
  state: DesignState
  onChange: (patch: Partial<DesignState>) => void
  storeId: string
}

const themes = [
  { value: "default" as const, label: "Default", description: "Clean and classic" },
  { value: "modern" as const, label: "Modern", description: "Bold with shadows" },
  { value: "minimal" as const, label: "Minimal", description: "Simple and flat" },
]

export function DesignControls({ state, onChange, storeId }: DesignControlsProps) {
  return (
    <div className="space-y-6">
      {/* Logo & Banner */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Logo</h3>
        <SingleImageUpload
          storeId={storeId}
          value={state.logoUrl}
          onChange={(url) => onChange({ logoUrl: url })}
          aspect="square"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Banner</h3>
        <SingleImageUpload
          storeId={storeId}
          value={state.bannerUrl}
          onChange={(url) => onChange({ bannerUrl: url })}
          aspect="wide"
        />
      </div>

      {/* Colors */}
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
