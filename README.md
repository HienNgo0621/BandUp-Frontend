# BandUp IELTS – React + Vite + TypeScript (Phase 1)

This project contains the Phase 1 foundation migration from `BandUp_IELTS_Prototype_v10.html`.

## Phase 1 scope

Included:

- React 18 + Vite + TypeScript setup.
- Tailwind CSS 3.4.17 installed locally (the Tailwind CDN is no longer used).
- Design tokens extracted from the v10 HTML style block.
- Base CSS and the existing v10 component/feature CSS retained in dedicated files.
- Shared UI primitives: `Icon`, `Button`, `Card`, `Badge`, `Input`, `Modal`, `Toast`.
- Public website header/footer and Public Layout.
- Student, Teacher / Volunteer and Admin workspace shells.
- Responsive mobile navigation, desktop sidebar and student horizontal navigation.
- React Router routes for public pages and the major role workspaces.
- Phase placeholder page to verify layouts, routes, controls and notifications.
- Vitest + React Testing Library smoke tests for Button and Input.

Not included in Phase 1:

- Authentication, role-based route protection or real account switching.
- Migration of localStorage/sessionStorage application data.
- Practice, exam, Forum, submission, grading, learning management or admin business logic.
- Backend/API integration.

The `/workspace/student`, `/workspace/teacher` and `/workspace/admin` routes are layout previews only. They are intentionally not secured until the authentication and route-guard work in Phase 2.

## Requirements

- Node.js 20.19+ or 22.12+ recommended.
- npm 10+

## Install and run

Open this directory in VS Code, then run:

```bash
npm install
npm run dev
```

Vite prints the local address, usually `http://localhost:5173/`.

## Build and checks

```bash
npm run typecheck
npm test
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Useful routes for manual testing

### Public layout

- `/`
- `/about`
- `/practice/listening`
- `/practice/reading`
- `/practice/writing`
- `/practice/speaking`
- `/mocks`
- `/forum`
- `/login`
- `/signup`

### Student layout preview

- `/workspace/student`
- `/workspace/student/practice/listening`
- `/workspace/student/practice/reading`
- `/workspace/student/mocks`
- `/workspace/student/forum`
- `/workspace/student/study-plan`

### Teacher / Volunteer layout preview

- `/workspace/teacher`
- `/workspace/teacher/forum`
- `/workspace/teacher/grading-history`

### Admin layout preview

- `/workspace/admin`
- `/workspace/admin/applications`
- `/workspace/admin/users`
- `/workspace/admin/moderation`
- `/workspace/admin/question-bank`

## Phase 1 manual test checklist

1. Open `/` and confirm the Public Header, dropdowns, page content and Public Footer render.
2. Resize to mobile width and confirm the menu button opens/closes the mobile navigation.
3. Open a Practice link and confirm React Router changes the route without a full-page reload.
4. Open each `/workspace/...` route and confirm the correct role shell is used.
5. On Teacher and Admin layouts, collapse and expand the desktop sidebar.
6. On mobile, open the workspace menu, navigate to another page and confirm the drawer closes.
7. In the placeholder page, enter text and click **Test toast**.
8. Click **Open modal**, press Escape, reopen it, and click the backdrop to verify close behavior.
9. Run `npm run typecheck`, `npm test` and `npm run build`.

## File creation order used in Phase 1

1. Root configuration: `package.json`, `index.html`, `vite.config.ts`, `tailwind.config.cjs`, `postcss.config.cjs`, TypeScript configs and `vitest.config.ts`.
2. Core types: `src/types/common.ts`, `src/types/navigation.ts`.
3. Design system: `src/styles/tokens.css`, `src/styles/index.css`, `src/styles/base.css`, `src/styles/components.css`, `src/styles/app.css`.
4. Shared data and UI: `src/data/navigation.ts`, then `src/components/ui/*`.
5. Layout components: `PublicHeader`, `PublicFooter`, `AppHeader`, `AppSidebar`, `MobileNav`.
6. Layouts: `PublicLayout`, `AppLayout`.
7. Pages and routing: `PlaceholderPage`, `NotFoundPage`, `src/app/router.tsx`.
8. Application entry: `src/App.tsx`, `src/main.tsx`.
9. Tests: `src/test/setup.ts` and UI component smoke tests.

## Design-system migration note

The original v10 CSS was moved out of the HTML file and split into:

- `src/styles/tokens.css`: the original light-theme root design-token block.
- `src/styles/base.css`: reset and global base rules.
- `src/styles/components.css`: existing reusable and feature-level CSS selectors retained from the source prototype.
- `src/styles/app.css`: new React shell and primitive-specific styles.

Some feature-specific CSS remains intentionally present even though its React page is not yet migrated. Later phases can reuse these selectors and refactor them into feature stylesheets after visual parity is verified.
