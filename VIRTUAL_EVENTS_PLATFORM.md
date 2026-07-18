# Virtual Events Platform Feature Specification & Scope Isolation Plan

## Objective
Isolated feature development for `/virtual-events-platform` path in SyncoraXP. Ensures zero disruption to core team codebase, shared components, or API contracts.

---

## 1. Scope Isolation & Boundaries

### Included (Isolated Work Area)
- **Route**: `/virtual-events-platform` in `apps/web/src/App.tsx`
- **Page Component**: `apps/web/src/pages/VirtualEventsPage.tsx`
- **Isolated Sub-components**: `apps/web/src/components/virtual-events/*` (New folder)
- **Isolated Styles**: `apps/web/src/styles/virtual-events.css` or scoped CSS modules
- **Isolated Assets**: `/public/virtual-events/*`

### Excluded (Shared / Do Not Modify Without Team Sync)
- `apps/web/src/styles.css` (Global styles - use scoped classes or isolated css file)
- Shared UI components in core app (`Header`, `AuthContext`, `ProtectedRoute`)
- API endpoints & DB schema in `apps/api/` unless isolated under `/api/virtual-events/*`

---

## 2. Feature Roadmap & Architecture

### Phase 1: Modular UI Component Refactoring
- [ ] Split `VirtualEventsPage.tsx` monolithic layout into sub-components:
  - `EventHeader.tsx`: Navigation bar and CTA demo booking
  - `HeroSection.tsx`: Headline, kicker, primary/secondary CTAs
  - `LiveStagePreview.tsx`: Keynote, live chat widget, attendee count, host stream
  - `CapabilitiesSection.tsx`: Platform capabilities grid
  - `EventCTASection.tsx`: Action banner leading to registration
- [ ] Move inline styles into `apps/web/src/styles/virtual-events.css` to prevent global CSS pollution.

### Phase 2: Interactive Virtual Event Stage Capabilities
- [ ] **Interactive Chat Simulation**: Mock real-time messages & reactions in `EventStageChat`.
- [ ] **Live Attendee Meter**: Dynamic counter with visual sparkline graph.
- [ ] **Interactive Stream Selector**: Switch between Keynote Speaker, Host Cam, and Attendee Grid.
- [ ] **Networking Sandbox**: Expandable networking panel showing online attendee cards.

### Phase 3: Dedicated Virtual Event APIs & State
- [ ] Client-side state hook (`useVirtualEventState.ts`) for real-time toggles.
- [ ] Optional isolated API route (`/api/v1/virtual-events`) for event registration & schedule data.

---

## 3. Team Collaboration Safety Rules

1. **CSS Namespace Prefixing**: All custom CSS classes MUST use `ve-` or `virtual-events-` prefix to avoid clashing with global styles.
2. **Dedicated Directory**: Keep all components inside `apps/web/src/components/virtual-events/`.
3. **No Direct Edits to Shared State**: Keep auth/user session consumption read-only.
4. **Git Branching Strategy**: Feature branch `feature/virtual-events-platform`.

---

## 4. Verification & Testing Checklist

- [ ] Route `/virtual-events-platform` loads without layout shift or styling side-effects on `/` or `/login`.
- [ ] Responsiveness verified on Mobile (<768px), Tablet (<1024px), and Desktop (>1280px).
- [ ] Zero lint/build errors (`pnpm --filter @voice/web build`).
