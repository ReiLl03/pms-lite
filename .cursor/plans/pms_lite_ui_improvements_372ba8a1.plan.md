---
name: PMS Lite UI improvements
overview: Implement delete property flow with confirmation, dashboard UX improvements (sidebar navigation, stats cards, last updated, table polish), login panel enhancements, and global transition/animation polish — all without adding new dependencies.
todos: []
isProject: false
---

# PMS Lite improvements plan

## 1. Delete functionality ([app/dashboard/page.tsx](app/dashboard/page.tsx))

- **Imports**: Add `deleteDoc` and `doc` from `firebase/firestore`.
- **Table structure**: Add a fourth column header "Actions" (or leave header empty for a minimal look). Extend loading and empty-state rows to `colSpan={4}`.
- **Delete handler**: New `handleDeleteProperty(id: string)`:
  - Show confirmation via a **custom confirmation dialog** (small modal overlay) with message "Are you sure you want to delete this property?" and Cancel / Delete buttons. Avoid `window.confirm` for a consistent SaaS look.
  - On confirm: call `deleteDoc(doc(db, "properties", id))`, then `setProperties(prev => prev.filter(p => p.id !== id))`. Clear any delete error state. Stats (Total, Available, Booked) are already derived from `properties` via `useMemo`, so they will update automatically.
- **Per-row UI**: In the table body, add a final `<td>` with a small red icon button:
  - Use an inline trash SVG (e.g. 20x20 viewBox, path for trash can icon).
  - Classes: red hover/active states (e.g. `text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg p-2 transition-colors duration-200`). On click, open the confirmation dialog for that property `id`.
- **State**: Add `deleteConfirmId: string | null` (and optionally `deletingId: string | null` for loading state on the button). When user confirms, set `deletingId`, run `deleteDoc`, then clear both and update list.

## 2. Dashboard sidebar and navigation ([app/dashboard/page.tsx](app/dashboard/page.tsx))

- **Properties link**: Change the "Properties" nav item to an anchor: `<a href="#properties-table">Properties</a>`. Add `id="properties-table"` to the section that wraps the properties table (the `<section>` that contains the "Properties" heading and the table).
- **Settings link**: Keep as button/link; on click set a toast message (e.g. `setToast("Settings coming soon")`). Implement a minimal **toast** in the same file: state `toast: string | null`, fixed position (e.g. bottom-right or top-center), auto-clear after ~3s with `useEffect` + `setTimeout`, subtle slide-in and fade. No new dependency.
- **Active state**: Track "active" nav (e.g. `activeNav: 'dashboard' | 'properties' | 'settings'`). "Dashboard" is active when on this page and not scrolled to table; "Properties" can be considered active when hash is `#properties-table` (optional: use `usePathname`/hash or keep simple with Dashboard = active by default, Properties = link). Apply highlighted background (e.g. `bg-slate-900 ring-1 ring-slate-800`) to the active item; others keep hover styles. Ensure smooth `transition` (e.g. `transition-colors duration-200`) on all nav items.

## 3. Stats cards ([app/dashboard/page.tsx](app/dashboard/page.tsx))

- **Colored top border**: Add to `StatsCard` a `borderTop` prop or variant: blue for Total (`border-t-blue-500`), green for Available (`border-t-emerald-500`), red for Booked (`border-t-rose-500`). Apply as `border-t-4` (or thin `border-t-2`) on the card container.
- **Icons**: Add a small SVG or emoji/icon inside each card (building/home for Total, check or calendar for Available, X or calendar-off for Booked). Place next to the label or number; keep layout clean.
- **Subtitle**: Add a subtle label below the number, e.g. "of total portfolio" for Total, "available now" for Available, "currently booked" for Booked. Use a small, muted text class (e.g. `text-[11px] text-slate-500`).

## 4. Last updated ([app/dashboard/page.tsx](app/dashboard/page.tsx))

- **State**: Add `lastUpdated: Date | null`; set it when properties are fetched (`fetchProperties`) and when a property is added or deleted (after successful Firestore write).
- **UI**: Below the "Portfolio snapshot" heading (and above the "Add property" button row), add a line like "Last updated: {formatted time}" (e.g. `toLocaleTimeString()` or relative "Just now" / "2 min ago"). Use muted, small typography.

## 5. Empty state and table row styling ([app/dashboard/page.tsx](app/dashboard/page.tsx))

- **Empty state**: The table already shows "No properties yet. Use Add property to create your first listing." Enhance it: add a small icon (e.g. building or inbox SVG) above the text, increase padding, and use slightly larger/more prominent text so it feels like a clear empty state. Optionally add a secondary CTA button "Add your first property" that opens the Add Property modal.
- **Row left border**: For each data row, add a left border color by status: `border-l-4 border-l-emerald-500` for Available and `border-l-4 border-l-rose-500` for Booked. Apply to the `<tr>` or first `<td>` (if using first td, use `border-l-4` and extend full height; table row borders can be done via box-shadow or on first cell).

## 6. Login page — feature cards and animated background ([app/login/page.tsx](app/login/page.tsx))

- **Feature cards**: At the bottom of the left dark panel (before or after "Why PMS Lite?"), add three small feature highlight cards in a row or grid:
  - "Manage properties" (icon: e.g. home/building)
  - "Track availability" (icon: e.g. chart/bar)
  - "Secure access" (icon: e.g. lock)
  Use short copy and consistent card style (rounded, subtle border, padding). You can use emoji (as in the spec) or small SVGs for icons.
- **Animated gradient**: Add a subtle animated gradient to the left panel background. Options: (a) CSS keyframes in [app/globals.css](app/globals.css) (e.g. `@keyframes gradient-shift` moving background-position or opacity of a pseudo-element), or (b) Tailwind `animate-`* if a suitable utility exists. Apply to the left panel container so the gradient slowly shifts (e.g. from-sky-900/20 to blue-900/20) to avoid a flat look while staying professional.

## 7. General polish (dashboard, login, globals)

- **Buttons, links, nav**: Add consistent transition classes where missing: `transition-colors duration-200` (or `duration-150`), and `active:scale-[0.98]` or `active:opacity-90` for buttons. Ensure sidebar nav items, primary/secondary buttons, and the delete icon button have smooth hover and active states.
- **Card load**: Optional subtle animation on stats cards (e.g. `animate-in fade-in slide-in-from-bottom-2` with Tailwind or a short opacity/translate animation in CSS). If Tailwind doesn’t have `animate-in`, use a simple `@keyframes` in globals.css and apply to the stats grid.
- **Table**: Refine row hover (e.g. `transition-colors duration-150`) and ensure alternating row colors remain; consider slightly softer hover background.
- **Typography**: Tighten spacing where needed (e.g. consistent `tracking-tight` on headings, `leading-relaxed` on body). Ensure hierarchy is clear.
- **Global CSS**: Add any reusable keyframes (e.g. gradient animation, fade-in) in [app/globals.css](app/globals.css) and keep component-level classes in Tailwind for consistency.

## File change summary


| File                                             | Changes                                                                                                                                                                                                                                   |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [app/dashboard/page.tsx](app/dashboard/page.tsx) | Delete (deleteDoc, doc, confirmation modal, trash button, state); sidebar (anchor, active state, Settings toast); stats (top border, icon, subtitle); lastUpdated; empty state enhancement; table row left border; button/nav transitions |
| [app/login/page.tsx](app/login/page.tsx)         | Feature cards; animated gradient on left panel; button/link transitions                                                                                                                                                                   |
| [app/globals.css](app/globals.css)               | Optional keyframes for gradient animation and/or fade-in for cards                                                                                                                                                                        |


## Implementation order

1. Delete flow (imports, state, confirmation modal, handler, table column and button).
2. Sidebar: anchor + id, active state, toast state and UI for Settings.
3. Stats cards: top border, icon, subtitle.
4. Last updated state and display.
5. Empty state enhancement and table row left border.
6. Login: feature cards and animated gradient.
7. Global polish: transitions, hover/active, optional animations.

