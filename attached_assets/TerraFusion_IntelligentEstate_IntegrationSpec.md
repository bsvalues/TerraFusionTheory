# TerraFusion Integration Spec for IntelligentEstate Platform

## Mission Objective
Integrate TerraFusion cognitive components into the IntelligentEstate platform to:
- Enhance valuation transparency
- Inject real-time AI insights
- Build audit-ready, user-cooperative workflows

This is a **precision guide**. Follow each step exactly.

---

## 1. Parcel Details Page (Route: `/parcel/:id`)

### Inject:
- `URARForm.jsx` below the property details

### Behavior:
- Listens for SHAP-driven or override-triggered agent events
- Auto-scrolls and highlights when relevant fields are activated
- ForecastAgent auto-fetches 12-month income projection from `/forecast/{parcel_id}`

### Wire:
- `highlighted` prop from `AgentFeedPanel` event to `URARForm`
- Fetch call to ForecastAgent at mount

---

## 2. Valuation Summary Page (Route: `/valuation/:id`)

### Inject:
- `AgentFeedPanel.jsx` to right column or as full-width collapsible panel

### Behavior:
- Displays all agent activity in chronological order
- Clicking an event highlights linked form field
- Allows filtering by agent, search, and override status

### Optional:
- Below feed, add “Replay Override Trail” → filter `type === 'ValueUpdated'` with human override trigger

---

## 3. Comp Selection Screen (Route: `/comps/:parcelId`)

### Inject:
- CompsAgent backend logic and UI indicator

### Behavior:
- Auto-suggest top 3 AI-chosen comps
- Tag comps with “AI Suggestion” badge
- Clicking “Why this comp?” runs SHAP-based justification modal

---

## 4. Audit Trail Tab (New Route or Tab)

### Inject:
- Event stream viewer (reuse `AgentFeedPanel` in read-only mode)
- Option to export as JSON/PDF
- Render valuation diff tree (optional bonus)

### Behavior:
- Shows all agent-triggered activity for parcel
- Replayable in-order (simulate scroll over form via timestamp)

---

## 5. Dashboard (Route: `/dashboard`)

### Inject:
- Recent agent insights module

### Tiles:
- “Top Forecast Today” (from ForecastAgent)
- “Override Count This Week” (from ValuationAgent logs)
- “Most Used Comp” (from CompsAgent)
- “Top SHAP Feature of Week” (aggregated)

---

## Integration Notes

### Event Handling:
- Use `onHighlight(event)` prop from `AgentFeedPanel`
- Connect to `URARForm`, CompCards, SHAPExplainers

### API:
- ForecastAgent: `GET /forecast/{parcel_id}`
- Event log feed: `GET /agent_feed.json` or live WebSocket `/agent-stream`

---

## Command Signature
Every component must:
- Be test-mounted in isolation
- Support prop-driven event injection
- Be documented via JSDoc block or Notion link

---

Execute in order. Do not skip. Respect agent-triggered interactions.
You are not injecting features — you are enabling **cognitive transparency.**