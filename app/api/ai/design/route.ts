import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { FONT_OPTIONS, COLOR_THEME_PRESETS } from "@/lib/constants"

const VALID_FONTS: Set<string> = new Set(FONT_OPTIONS.map((f) => f.value))
const VALID_BORDER_RADIUS = new Set(["none", "sm", "md", "lg", "xl"])
const VALID_THEMES = new Set(["default", "modern", "minimal", "single"])
const VALID_BUTTON_STYLES = new Set(["filled", "outline", "pill"])
const VALID_CARD_SHADOWS = new Set(["none", "sm", "md", "lg"])
const VALID_IMAGE_RATIOS = new Set(["square", "portrait", "landscape"])
const VALID_LAYOUT_SPACING = new Set(["compact", "normal", "spacious"])
const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/

const COLOR_KEYS = [
  "primaryColor",
  "accentColor",
  "backgroundColor",
  "textColor",
  "buttonTextColor",
] as const

const BOOLEAN_KEYS = [
  "showBranding",
  "showFloatingCart",
  "showSearch",
  "checkoutShowEmail",
  "checkoutShowCountry",
  "checkoutShowCity",
  "checkoutShowNote",
] as const

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { prompt, currentState, history } = await request.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      )
    }

    const systemPrompt = buildDesignPrompt(currentState || {})

    const chatHistory = (history || []).map(
      (msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })
    )

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      { role: "user", content: prompt },
    ]

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          max_tokens: 1024,
          response_format: { type: "json_object" },
        }),
      }
    )

    if (!groqResponse.ok) {
      const errBody = await groqResponse.text()
      const isRateLimit = groqResponse.status === 429
      return NextResponse.json(
        {
          error: isRateLimit
            ? "Rate limit exceeded. Please wait a moment and try again."
            : `AI service error: ${errBody.substring(0, 200)}`,
        },
        { status: isRateLimit ? 429 : 500 }
      )
    }

    const data = await groqResponse.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      )
    }

    let parsed: { changes?: Record<string, unknown>; explanation?: string }
    try {
      parsed = JSON.parse(content)
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      )
    }

    const changes = validateChanges(parsed.changes || {})
    const explanation =
      typeof parsed.explanation === "string"
        ? parsed.explanation
        : "Design changes suggested."

    return NextResponse.json({ changes, explanation })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function validateChanges(
  raw: Record<string, unknown>
): Record<string, unknown> {
  const clean: Record<string, unknown> = {}

  for (const key of COLOR_KEYS) {
    if (key in raw && typeof raw[key] === "string" && HEX_COLOR_RE.test(raw[key] as string)) {
      clean[key] = (raw[key] as string).toUpperCase()
    }
  }

  if ("fontFamily" in raw && typeof raw.fontFamily === "string" && VALID_FONTS.has(raw.fontFamily)) {
    clean.fontFamily = raw.fontFamily
  }

  if ("headingFont" in raw && typeof raw.headingFont === "string") {
    if (raw.headingFont === "" || raw.headingFont === null) {
      clean.headingFont = null
    } else if (VALID_FONTS.has(raw.headingFont)) {
      clean.headingFont = raw.headingFont
    }
  }

  if ("borderRadius" in raw && typeof raw.borderRadius === "string" && VALID_BORDER_RADIUS.has(raw.borderRadius)) {
    clean.borderRadius = raw.borderRadius
  }

  if ("theme" in raw && typeof raw.theme === "string" && VALID_THEMES.has(raw.theme)) {
    clean.theme = raw.theme
  }

  if ("buttonStyle" in raw && typeof raw.buttonStyle === "string" && VALID_BUTTON_STYLES.has(raw.buttonStyle)) {
    clean.buttonStyle = raw.buttonStyle
  }

  if ("cardShadow" in raw && typeof raw.cardShadow === "string" && VALID_CARD_SHADOWS.has(raw.cardShadow)) {
    clean.cardShadow = raw.cardShadow
  }

  if ("productImageRatio" in raw && typeof raw.productImageRatio === "string" && VALID_IMAGE_RATIOS.has(raw.productImageRatio)) {
    clean.productImageRatio = raw.productImageRatio
  }

  if ("layoutSpacing" in raw && typeof raw.layoutSpacing === "string" && VALID_LAYOUT_SPACING.has(raw.layoutSpacing)) {
    clean.layoutSpacing = raw.layoutSpacing
  }

  for (const key of BOOLEAN_KEYS) {
    if (key in raw && typeof raw[key] === "boolean") {
      clean[key] = raw[key]
    }
  }

  if ("thankYouMessage" in raw && typeof raw.thankYouMessage === "string") {
    clean.thankYouMessage = raw.thankYouMessage.slice(0, 500)
  }

  if ("customCss" in raw && typeof raw.customCss === "string") {
    const sanitized = raw.customCss
      .replace(/<\/style>/gi, "")
      .replace(/<script/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/expression\s*\(/gi, "")
      .slice(0, 5000)
    clean.customCss = sanitized
  }

  return clean
}

function buildDesignPrompt(currentState: Record<string, unknown>): string {
  const fontList = FONT_OPTIONS.map((f) => f.value).join(", ")

  const presetList = COLOR_THEME_PRESETS.map(
    (p) =>
      `- ${p.id}: primary=${p.colors.primary_color}, accent=${p.colors.accent_color}, bg=${p.colors.background_color}, text=${p.colors.text_color}, btnText=${p.colors.button_text_color}`
  ).join("\n")

  return `You are a store design assistant. You help users style their online store by suggesting changes to visual properties.

You can change these style properties:

COLORS (hex format, e.g., "#1D4ED8"):
- primaryColor: main brand color for headings and prices
- accentColor: buttons and interactive elements
- backgroundColor: page background
- textColor: body text
- buttonTextColor: text inside buttons

TYPOGRAPHY:
- fontFamily: body text font — one of [${fontList}]
- headingFont: separate heading font (store name, product titles) — one of [${fontList}], or null to use fontFamily

LAYOUT & CARDS:
- borderRadius: corner rounding — one of "none", "sm", "md", "lg", "xl"
- theme: card style — "default" (bordered), "modern" (shadow), "minimal" (bottom border), "single" (single column)
- buttonStyle: button appearance — "filled" (solid bg), "outline" (border only), "pill" (fully rounded)
- cardShadow: product card shadow — "none", "sm", "md", "lg"
- productImageRatio: product image shape — "square" (1:1), "portrait" (3:4), "landscape" (4:3)
- layoutSpacing: gap between elements — "compact", "normal", "spacious"

TOGGLES (boolean):
- showFloatingCart: show floating cart button on storefront
- showSearch: show search bar on storefront
- showBranding: show "Powered by" branding
- checkoutShowEmail: show email field in checkout
- checkoutShowCountry: show country field in checkout
- checkoutShowCity: show city field in checkout
- checkoutShowNote: show note field in checkout

TEXT:
- thankYouMessage: custom message shown after order is placed (max 500 chars)

CUSTOM CSS:
- customCss: raw CSS injected into the store's <style> tag. Use this for advanced styling that doesn't fit the properties above.
  Available CSS selectors:
  - .store-card — product card container
  - .product-grid — product grid container
  - header — store header
  - main — main content area
  - button — all buttons
  CSS variables you can use: --store-primary, --store-accent, --store-bg, --store-text, --store-btn-text, --store-radius, --store-font, --store-heading-font
  Examples: gradient backgrounds, text shadows, hover animations, border effects, custom scrollbar styles.
  IMPORTANT: Only output valid CSS. No HTML tags, no <script>, no JavaScript. Max 5000 characters.

You CANNOT change: logoPath, bannerPath, or any component HTML/layout structure.

AVAILABLE COLOR PRESETS (use these when the user asks for a named theme):
${presetList}

CURRENT STORE DESIGN:
${JSON.stringify(currentState, null, 2)}

RULES:
1. Respond ONLY with valid JSON: { "changes": { ...only fields being changed... }, "explanation": "short description of what you changed" }
2. Only include fields that are actually being changed from the current state.
3. All colors must be valid 6-digit hex codes starting with #.
4. fontFamily and headingFont must be exactly one of the allowed values listed above.
5. Ensure good contrast between background, text, and button colors.
6. Keep explanations concise (1-2 sentences).
7. If the user asks for something you cannot do (e.g., change the logo), explain that in the explanation and return an empty changes object.
8. When suggesting a complete style overhaul, consider changing multiple properties together (colors + font + button style + card shadow + spacing) for a cohesive look.
9. For a "luxury" or "premium" feel, combine dark backgrounds, gold/serif fonts, pill buttons, and large shadows.
10. For a "minimal" or "clean" feel, combine light backgrounds, sans-serif fonts, no shadows, and compact spacing.
11. Use customCss for advanced effects the user requests that can't be achieved with the predefined properties (e.g., gradient backgrounds, text shadows, animations, hover effects). When using customCss, APPEND to the existing customCss value rather than replacing it.`
}
