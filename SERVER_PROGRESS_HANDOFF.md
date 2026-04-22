# SMS Server Progress Handoff

## Workspace Paths
- Root artifacts path:
  - `C:\Users\delar\Downloads\PETROSPHERE_PROJECT\School-System-UI\artifacts`
- Client repo:
  - `C:\Users\delar\Downloads\PETROSPHERE_PROJECT\School-System-UI\artifacts\sms-client`
- Server repo:
  - `C:\Users\delar\Downloads\PETROSPHERE_PROJECT\School-System-UI\artifacts\sms-server`

## Purpose
Backend handoff reference for continuing development from another machine/Cursor session.

## Backend Areas Relevant to Recent Client Work
The latest client modules depend heavily on existing setup + colleges reference APIs:
- academic year/term
- campuses
- academic programs
- buildings/rooms tree and room lookup
- employees (faculty subset)
- courses master list

## Buildings/Rooms API (confirmed in use)
- Route file:
  - `src/routes/buildingsRooms.routes.ts`
- Controller file:
  - `src/controllers/buildingsRooms.controller.ts`
- Service file:
  - `src/services/buildingsRooms.service.ts`

### Exposed endpoints
- `GET /api/buildings-rooms/tree`
- `GET /api/buildings-rooms/rooms?floor_id=...`
- `POST /api/buildings-rooms/buildings`
- `PUT /api/buildings-rooms/buildings/:id`
- `DELETE /api/buildings-rooms/buildings/:id`
- `POST /api/buildings-rooms/floors`
- `PUT /api/buildings-rooms/floors/:id`
- `DELETE /api/buildings-rooms/floors/:id`
- `POST /api/buildings-rooms/rooms`
- `PUT /api/buildings-rooms/rooms/:id`
- `DELETE /api/buildings-rooms/rooms/:id`

### Data behavior notes
- `getBuildingsTree()` returns institution/campus/building/floor rows.
- Room rows are fetched by floor via `getRoomsByFloorId(floorId)`.
- Client currently derives several dropdowns/lists from these endpoints.

## What Client Expects from Server (current)
The new/updated colleges screens in `sms-client` currently read these:
- `GET /api/academic-year-terms`
- `GET /api/campuses`
- `GET /api/academic-programs`
- `GET /api/courses-master-list`
- `GET /api/buildings-rooms/tree`
- `GET /api/buildings-rooms/rooms?floor_id=...`
- `GET /api/employees?hide_inactive=true`

## Known Backend Gaps for Full Feature Completion
Several colleges modules are visually complete but still shell-only behavior for actions.  
Likely next backend work:
- class section split/merge transfer endpoints
- class schedule split/merge transfer endpoints
- forecasting persistence/compute endpoints
- list-of-reports generation/preview endpoints
- schedule posting endpoints for class/room/faculty module actions

## Suggested Next Backend Tasks (priority)
1. **Transfer APIs**
   - Create transaction-safe endpoints for moving students between section/schedule contexts.
2. **Schedule APIs**
   - Provide create/update/post operations for timetable slots and related filters.
3. **Forecasting APIs**
   - Add CRUD or compute endpoint for expected enrollees by program/major/year.
4. **Reports APIs**
   - Add parameterized report endpoints and preview payloads used by list-of-reports screen.

## Dev Process Notes
- Keep API contracts backward-compatible with current client placeholder bindings.
- Return explicit validation errors for missing required params (client surfaces these quickly).
- Prefer consistent payload shape for lists (`[]`) and detail objects (`{}`) to reduce client guards.

## Resume Checklist (Server)
1. Start server and verify `/api/buildings-rooms/tree` and `/api/buildings-rooms/rooms` are healthy.
2. Confirm endpoint payloads still match client parsing assumptions.
3. Implement missing transfer/schedule/report/forecast endpoints incrementally.
4. Coordinate contract changes with `sms-client` module files under `src/components/colleges/`.

