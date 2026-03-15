# UI Diff Analysis: Prototype vs App

Generated from automated CSS extraction on March 12, 2026.
Every difference below is a measured mismatch with the exact fix.

---

## Critical Finding: Tailwind CSS is stripping padding and spacing

The most widespread issue is that **padding values are 0px across almost every
element in the app** while the prototype has explicit padding. This means
Tailwind v4's reset (`* { padding: 0; margin: 0; }` in globals.css) is
winning over the utility classes, OR the utility classes are not being
applied because of a specificity or compilation issue.

Evidence:
- Header: APP padding 0px vs PROTOTYPE 20px left/right
- Composer box: APP padding 0px vs PROTOTYPE 12px/16px
- Composer centering div: APP padding 0px vs PROTOTYPE 8px/20px/20px
- Panel header: APP padding 0px vs PROTOTYPE 14px/16px
- Panel body: APP padding 0px vs PROTOTYPE 20px/16px
- Table header cell: APP padding 0px vs PROTOTYPE 10px/14px
- Table body cell: APP padding 0px vs PROTOTYPE 10px/14px
- Chip button: APP padding 0px vs PROTOTYPE 8px/16px

**ROOT CAUSE HYPOTHESIS:** The `* { padding: 0; margin: 0; }` reset in
globals.css may have higher specificity than Tailwind utility classes in v4,
or the Tailwind classes are being purged/not compiled properly.

**FIX:** Check if your Tailwind v4 setup properly processes utility classes.
In the meantime, verify by inspecting any element: does the "Styles" tab
(not Computed) show the Tailwind utility class being applied and then
crossed out by the `*` reset? If yes, the reset needs to be scoped or
the utilities need `!important` (not ideal) or the reset needs to come
before the utilities in the cascade.

---

## Section 1: Empty State

### 1.1 Vertical Position — WRONG

| Property | Prototype | App | Issue |
|----------|-----------|-----|-------|
| Position strategy | `padding-top: 228px` on wrapper | `justify-content: center` on parent | App centers dead middle |
| Heading boundingTop | 301px | 745px | App heading is way too far down |

**Fix in `message-list.tsx`:** The empty state container currently uses
`justify-center` which puts it dead center on large viewports. Change to
a top-padding approach:

```tsx
// BEFORE:
<div className="flex-1 flex flex-col items-center justify-center px-4 py-6">

// AFTER:
<div className="flex-1 flex flex-col items-center px-4 pt-[18vh]">
```

This puts the empty state in the upper third of the screen, matching the
prototype's `padding-top: 228.6px` on a ~1270px viewport (228/1270 ≈ 18%).

### 1.2 Chip Buttons — WRONG SIZE

| Property | Prototype | App | Issue |
|----------|-----------|-----|-------|
| font-size | 13px | 14px | App is larger |
| font-weight | 500 | 400 | App is lighter |
| padding | 8px 16px | 0px 0px | **App has zero padding** |
| height | 33px | 22px | App chips are tiny despite larger font |
| border | 0.67px solid | 0.83px solid | Minor |

**Fix in `message-list.tsx`:** The chip buttons have Tailwind classes
`px-4 py-2` but the computed padding is 0px. This confirms the reset is
winning. Add explicit padding as inline style as a workaround, OR fix the
root cause (see Critical Finding above).

Also fix the font specs:
```tsx
// BEFORE:
className="px-4 py-2 rounded-full border border-border text-sm text-text ..."

// AFTER:
className="px-4 py-2 rounded-full border border-border text-[13px] font-medium text-text ..."
```

`text-sm` in Tailwind v4 computes to 14px. The prototype uses 13px.
Use `text-[13px]` for exact match. Add `font-medium` (500) to match prototype.

### 1.3 Subheading — WRONG SIZE

| Property | Prototype | App |
|----------|-----------|-----|
| font-size | 15px | 16px |

**Fix in `message-list.tsx`:**
```tsx
// BEFORE:
<p className="text-base text-text-muted mt-2">

// AFTER:
<p className="text-[15px] text-text-muted mt-2">
```

---

## Section 2: Header

### 2.1 Header Container — MISSING PADDING

| Property | Prototype | App |
|----------|-----------|-----|
| padding-left | 20px | 0px |
| padding-right | 20px | 0px |

The header in `page.tsx` has `px-4` (which should be 16px) but computed
padding is 0px. Same reset issue.

### 2.2 PLM Assistant Title — WRONG SPECS

| Property | Prototype | App |
|----------|-----------|-----|
| font-size | 13px | 14px |
| font-weight | 600 | 500 |
| letter-spacing | 0.52px | 0.35px |
| text-transform | uppercase | none |

**Fix in `page.tsx`:**
```tsx
// BEFORE:
<span className="text-sm font-medium text-text-muted tracking-wide">
  PLM Assistant
</span>

// AFTER:
<span className="text-[13px] font-semibold text-text-muted tracking-wider uppercase">
  PLM Assistant
</span>
```

`text-sm` = 14px, need `text-[13px]`.
`font-medium` = 500, need `font-semibold` = 600.
`tracking-wide` = 0.025em ≈ 0.35px at 14px, need `tracking-wider` = 0.05em ≈ 0.65px.
Missing `uppercase`.

---

## Section 3: Composer

### 3.1 Send Button — WAY TOO SMALL

| Property | Prototype | App |
|----------|-----------|-----|
| width | 34px | 16px |
| height | 34px | 16px |
| border-radius | 10px | 8px |

The app send button is 16x16px. The prototype is 34x34px. That is more
than 2x smaller.

**Fix in `chat-input.tsx`:**
```tsx
// BEFORE:
className="flex-shrink-0 rounded-lg bg-primary text-white px-3 py-1.5 ..."

// AFTER:
className="flex-shrink-0 w-[34px] h-[34px] rounded-[10px] bg-primary text-white
           flex items-center justify-center ..."
```

Remove `px-3 py-1.5` (padding-based sizing) and use explicit `w-[34px] h-[34px]`.

### 3.2 Attach Button — MISSING IN APP

| Property | Prototype | App |
|----------|-----------|-----|
| exists | Yes (32x32px) | No |

The prototype has a paperclip attach button. The app does not.

**Fix in `chat-input.tsx`:** Add an attach button (non-functional for V1)
to the left side of the composer bottom bar:
```tsx
<div className="flex items-center justify-between">
  <button type="button" className="w-8 h-8 flex items-center justify-center
    rounded-lg text-text-muted hover:bg-surface-hover hover:text-text
    transition-colors" title="Attach file" aria-label="Attach file">
    <Paperclip size={18} />
  </button>
  {/* send button on the right */}
</div>
```

### 3.3 Composer Box — ZERO PADDING

| Property | Prototype | App |
|----------|-----------|-----|
| padding | 12px 16px 10px 16px | 0px all |

Same reset issue. The `p-3` class (12px) is being overridden.

### 3.4 Composer Centering — ZERO PADDING ON WRAPPER

| Property | Prototype | App |
|----------|-----------|-----|
| Centering wrapper padding | 8px 20px 20px 20px | 0px all |

The `page.tsx` wrapper has `px-4 pb-5 pt-2` but computed is 0px.

### 3.5 Composer Position — LEFT-ALIGNED

| Property | Prototype (post-chat) | App (post-chat) |
|----------|----------------------|-----------------|
| Composer box margin-left | 328px (centered) | 0px (flush left) |
| Composer box boundingLeft | 349px | 0px |

In the prototype post-chat, the composer has `margin-left: 328.667px`
(auto margin from `max-w-3xl mx-auto`). In the app, margin is 0px and
boundingLeft is 0px. The centering is not working.

**Most likely cause:** The centering div has `max-w-3xl mx-auto` in
the JSX but the `mx-auto` margin is being reset to 0 by the `* { margin: 0 }`
rule.

---

## Section 4: Messages

### 4.1 Message Column — ZERO PADDING

| Property | Prototype | App |
|----------|-----------|-----|
| padding | 24px 20px 16px 20px | 0px all |
| margin-left | 348px (centered) | 0px |

The `max-w-3xl mx-auto px-4 py-6` on the message column computes to
zero padding and zero margins.

### 4.2 User Bubble — MISSING PADDING AND WRONG SHAPE

| Property | Prototype | App |
|----------|-----------|-----|
| padding | 10px 16px | 0px |
| border-radius | 20px 20px 4px | 16px |
| height | 43px | 24px |
| max-width | 85% | none |
| background | rgb(226,228,233) | rgb(226,228,233) | ✓ Match |

The bubble color is correct but has no padding, wrong border-radius, and
no max-width constraint.

**Fix in `message-bubble.tsx`:**
```tsx
// BEFORE:
className="rounded-2xl px-4 py-2.5 bg-surface-hover text-text"

// AFTER:
className="rounded-[20px_20px_4px_20px] px-4 py-2.5 bg-surface-hover text-text max-w-[85%]"
```

Note: Tailwind v4 may not support the multi-value border-radius shorthand.
Use inline style instead:
```tsx
style={{ borderRadius: "20px 20px 4px 20px" }}
```

### 4.3 Message Gap

| Property | Prototype | App |
|----------|-----------|-----|
| gap between messages | (normal spacing) | 0px |

The `space-y-5` on the message list container should give 20px gap.
Computed is 0px. Same reset issue.

### 4.4 Tool Indicator Position

| Property | Prototype | App |
|----------|-----------|-----|
| boundingLeft | 369px (centered in column) | 22px (flush left) |

The tool indicator is at x=22px in the app (left edge) but x=369px in
the prototype (inside the centered message column). This confirms the
message column centering is completely broken.

---

## Section 5: Panel

### 5.1 Panel Header — COLLAPSED

| Property | Prototype | App |
|----------|-----------|-----|
| height | 57px | 21px |
| padding | 14px 16px | 0px |

The panel header is 21px tall in the app vs 57px in the prototype.
Zero padding is the cause.

### 5.2 Type Badge — MISSING PADDING

| Property | Prototype | App |
|----------|-----------|-----|
| font-size | 11px | 12px |
| font-weight | 600 | 500 |
| padding | 2px 10px | 0px |
| height | 18px | 16px |
| letter-spacing | 0.44px | normal |
| text-transform | uppercase | none |

**Fix in `context-panel.tsx`:**
```tsx
// BEFORE:
className="inline-flex items-center gap-1 text-xs font-medium text-primary
           bg-primary-subtle px-2 py-0.5 rounded-full"

// AFTER:
className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary
           bg-primary-subtle px-2.5 py-0.5 rounded-full uppercase tracking-wider"
```

### 5.3 Table Header Cells — ZERO PADDING

| Property | Prototype | App |
|----------|-----------|-----|
| padding | 10px 14px | 0px |
| height | 34px | 16px |

### 5.4 Table Body Cells — ZERO PADDING, WRONG FONT

| Property | Prototype | App |
|----------|-----------|-----|
| padding | 10px 14px | 0px |
| height | 39px | 21px |
| font-family | JetBrains Mono (ID cells) | DM Sans |
| font-size | 12px (ID cells) | 14px |

### 5.5 Status Badge — MISSING PADDING

| Property | Prototype | App |
|----------|-----------|-----|
| font-weight | 600 | 500 |
| padding | 2px 10px | 0px |
| height | 18px | 16px |
| width | 80px | 59px |

### 5.6 Panel Body — ZERO PADDING

| Property | Prototype | App |
|----------|-----------|-----|
| padding | 20px 16px | 0px |

---

## Root Cause: The CSS Reset

**Every single padding and margin issue traces to the same root cause.**

In `globals.css`:
```css
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}
```

This universal reset sets `padding: 0` and `margin: 0` on EVERY element.
In Tailwind v4, the cascade order means this reset may be winning over
utility classes because:

1. The `*` selector applies to all elements
2. Tailwind v4 uses CSS cascade layers, and the reset may be in a higher
   priority layer than the utilities
3. The `@import "tailwindcss"` directive should handle the reset, but
   having a SECOND reset in your own CSS creates a conflict

**THE FIX:**

Remove the `padding: 0` and `margin: 0` from the `*` selector. Tailwind v4's
preflight (included via `@import "tailwindcss"`) already provides a proper
reset. Your custom reset is DOUBLING it and winning in the cascade.

In `globals.css`, change:
```css
/* BEFORE */
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

/* AFTER */
* {
  box-sizing: border-box;
}
```

This single change should fix: header padding, composer padding, composer
centering (mx-auto), chip padding, message column padding, panel header
padding, panel body padding, table cell padding, status badge padding,
message spacing (space-y), and empty state layout.

After this fix, re-run the extraction script on the app and re-compare.
Most of the 30+ differences should disappear.

---

## Remaining Fixes After Reset Fix

These are genuine spec mismatches (not caused by the reset):

### Fix 1: Empty state vertical position
File: `message-list.tsx`
Change `justify-center` to `pt-[18vh]` on the empty state wrapper.

### Fix 2: PLM Assistant title
File: `page.tsx`
Change to `text-[13px] font-semibold tracking-wider uppercase`.

### Fix 3: Subheading font size
File: `message-list.tsx`
Change `text-base` (16px) to `text-[15px]`.

### Fix 4: Chip font specs
File: `message-list.tsx`
Change `text-sm` (14px) to `text-[13px]`, add `font-medium`.

### Fix 5: Send button size
File: `chat-input.tsx`
Change to explicit `w-[34px] h-[34px] rounded-[10px]`.

### Fix 6: Add attach button
File: `chat-input.tsx`
Add a paperclip icon button to the left of the send button area.

### Fix 7: User bubble border-radius
File: `message-bubble.tsx`
Change to `borderRadius: "20px 20px 4px 20px"` via inline style.

### Fix 8: Type badge specs
File: `context-panel.tsx`
Change to `text-[11px] font-semibold uppercase tracking-wider`.

### Fix 9: Panel position (static vs overlay)
File: `context-panel.tsx`
The panel is `lg:static` which prevents backdrop-filter from being visible.
Change to always-fixed overlay (discussed in previous conversation).

---

## Priority Order

1. **Fix the CSS reset** (globals.css) — fixes ~25 of the 30+ differences
2. Re-extract and verify the padding issues are resolved
3. Apply Fixes 1-9 for the remaining spec mismatches
4. Fix the panel positioning for frosted glass effect
