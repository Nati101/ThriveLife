import {
  BarChart,
  Callout,
  Card,
  CardBody,
  CardHeader,
  Code,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Stack,
  Stat,
  Table,
  Text,
  TodoListCard,
  UsageBar,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type Grade = "Pass" | "Partial" | "Fail" | "N/A";
type Filter = "all" | "Pass" | "Partial" | "Fail" | "N/A";

type Req = {
  id: string;
  phase: "0" | "2";
  requirement: string;
  grade: Grade;
  evidence: string;
};

const REQS: Req[] = [
  // Phase 0
  {
    id: "0.1",
    phase: "0",
    requirement: "Private GitHub repo (solo Dev; org later)",
    grade: "Pass",
    evidence: "README.md · QUESTIONS.md D2 · Nati101/ThriveLife",
  },
  {
    id: "0.2",
    phase: "0",
    requirement: "npm workspaces monorepo (apps / packages / services)",
    grade: "Pass",
    evidence: "package.json workspaces · services/README.md",
  },
  {
    id: "0.3",
    phase: "0",
    requirement: "Vite + React + TypeScript + Tailwind + React Router",
    grade: "Pass",
    evidence: "apps/web/package.json · vite.config.ts · src/main.tsx",
  },
  {
    id: "0.4",
    phase: "0",
    requirement: "Web-first client (native deferred)",
    grade: "Pass",
    evidence: "QUESTIONS.md D1 · README.md",
  },
  {
    id: "0.5",
    phase: "0",
    requirement: "Same web app for editors — not a separate admin deploy",
    grade: "Pass",
    evidence: "src/routes.tsx /admin/* · admin/README.md (deprecated stub)",
  },
  {
    id: "0.6",
    phase: "0",
    requirement: "Role matrix: user | editor | reviewer | admin",
    grade: "Pass",
    evidence: "packages/shared/src/roles.ts ROLE_PERMISSIONS",
  },
  {
    id: "0.7",
    phase: "0",
    requirement: "Fail-closed /admin (client + /api cookie)",
    grade: "Pass",
    evidence: "RequireRole.tsx · server/content-api.ts requireContentTools",
  },
  {
    id: "0.8",
    phase: "0",
    requirement: "Stub auth + local role switcher",
    grade: "Pass",
    evidence: "lib/auth.ts tl_dev_role · DevRolePage.tsx /dev/role",
  },
  {
    id: "0.9",
    phase: "0",
    requirement: "AppShell chrome (nav, logo, wellness disclaimer footer)",
    grade: "Pass",
    evidence: "AppShell.tsx · FixtureBanner.tsx",
  },
  {
    id: "0.10",
    phase: "0",
    requirement: "Member route skeleton (home, dashboard, check-in, assessments, onboarding)",
    grade: "Pass",
    evidence: "src/routes.tsx — Phase 3–6 pages labeled placeholders",
  },
  {
    id: "0.11",
    phase: "0",
    requirement: "Health probes",
    grade: "Pass",
    evidence: "public/health.json · GET /api/health (json-file). Live :3000 was down at audit.",
  },
  {
    id: "0.12",
    phase: "0",
    requirement: "Shared fixtures: 7 batteries, 4 instruments, 74 items",
    grade: "Pass",
    evidence: "packages/shared/src/fixtures/* (10 DRAIN + 7 Scan + 56 Full + 1 Mode)",
  },
  {
    id: "0.13",
    phase: "0",
    requirement: "Fixture wording labeled — not Joel-authored copy",
    grade: "Pass",
    evidence: "isFixture flags · [FIXTURE] prefixes · FixtureBanner",
  },
  {
    id: "0.14",
    phase: "0",
    requirement: "Secrets hygiene (.env.example only)",
    grade: "Pass",
    evidence: ".env.example · content-store.json gitignored",
  },
  {
    id: "0.15",
    phase: "0",
    requirement: "PR template",
    grade: "Pass",
    evidence: ".github/pull_request_template.md",
  },
  {
    id: "0.16",
    phase: "0",
    requirement: "Local JSON content store (Postgres later — not a fail)",
    grade: "Pass",
    evidence: "server/store.ts · QUESTIONS.md D6. User-locked JSON = Pass.",
  },
  {
    id: "0.17",
    phase: "0",
    requirement: "CI on PR (lint, typecheck, tests)",
    grade: "Fail",
    evidence: "No .github/workflows · zero *.test.* files",
  },
  {
    id: "0.18",
    phase: "0",
    requirement: "Branch protection on main",
    grade: "Fail",
    evidence: "TASKS.md Phase 0.1 still open",
  },
  {
    id: "0.19",
    phase: "0",
    requirement: "Environments: local / staging / production",
    grade: "Fail",
    evidence: "TASKS.md 0.1 unchecked · only local Vite",
  },
  {
    id: "0.20",
    phase: "0",
    requirement: "Base44 prior app pasted into vendor/ (real UI source)",
    grade: "Partial",
    evidence: "vendor/base44-prior/COPY-PROGRESS.md — shell + Dashboard.jsx; most pages still missing",
  },
  {
    id: "0.21",
    phase: "0",
    requirement: "Brand / design-token system",
    grade: "N/A",
    evidence: "Joel + Design (TASKS 0.4). Utilitarian Base44-like chrome is interim.",
  },
  {
    id: "0.22",
    phase: "0",
    requirement: "Logging, Sentry, feature flags",
    grade: "N/A",
    evidence: "Optional for V1 (TASKS 0.1)",
  },
  {
    id: "0.23",
    phase: "0",
    requirement: "GitHub org transfer",
    grade: "N/A",
    evidence: "Locked as later (QUESTIONS.md D2)",
  },
  // Phase 2
  {
    id: "2.1",
    phase: "2",
    requirement: "ScoringThreshold admin-editable + audit log (§4.3 / §11.2)",
    grade: "Pass",
    evidence:
      "AdminThresholdsPage.tsx · PATCH scoringThresholds. Store has audit_mst9okt6 (admin, 2026-08-14).",
  },
  {
    id: "2.2",
    phase: "2",
    requirement: "Item CRUD with version bump and soft-deactivate",
    grade: "Pass",
    evidence: "content-api.ts PATCH wording → version++ · DELETE sets active:false",
  },
  {
    id: "2.3",
    phase: "2",
    requirement: "Construct editor surfaces all timeframe variants together (§3.3)",
    grade: "Pass",
    evidence: "GET /api/content/constructs/:id timeframeVariants · AdminContentPage constructs tab",
  },
  {
    id: "2.4",
    phase: "2",
    requirement: "RechargeAction CRUD (tiers, Plan A/B, accessibility, health caution)",
    grade: "Pass",
    evidence: "recharge.ts type · AdminContentPage recharge tab · POST/PATCH rechargeActions",
  },
  {
    id: "2.5",
    phase: "2",
    requirement: "Seed + reset without a code release",
    grade: "Pass",
    evidence: "createSeedContentDocument · POST /api/content/reset (admin)",
  },
  {
    id: "2.6",
    phase: "2",
    requirement: "Never average Capacity / Strain / Recharge into one score",
    grade: "Pass",
    evidence: "BatteryResultScores keeps three fields + batteryState — no combined score type",
  },
  {
    id: "2.7",
    phase: "2",
    requirement: "Unsure / N/A stored as null — never midpoint",
    grade: "Pass",
    evidence: "schema.ts AssessmentResponse.answer documented; scale includes N/A label",
  },
  {
    id: "2.8",
    phase: "2",
    requirement: "Assessment version stamped on items / sessions",
    grade: "Pass",
    evidence: "AssessmentItem.version · AssessmentSession.version (session persist is Phase 3)",
  },
  {
    id: "2.9",
    phase: "2",
    requirement: "§4.3 provisional bands live in config, not scorer code",
    grade: "Pass",
    evidence:
      "FIXTURE_SCORING_THRESHOLDS. No scorer yet — ready, not proven. Phase 3 must read these rows.",
  },
  {
    id: "2.10",
    phase: "2",
    requirement: "Server RBAC: editor draft vs admin thresholds",
    grade: "Pass",
    evidence: "requireDraft / requireThresholdEdit in content-api.ts",
  },
  {
    id: "2.11",
    phase: "2",
    requirement: "User (Section 10): profile, timezone, consent, notifications, pathway, age, role",
    grade: "Partial",
    evidence: "schema.ts UserProfile typed. Stub cookie session only — not in JSON store.",
  },
  {
    id: "2.12",
    phase: "2",
    requirement: "Battery (Section 10): name, definition, icon, display_order, chapter ref",
    grade: "Partial",
    evidence: "7 seeded. Missing icon. covers/thinkOfItAs instead of definition. POST 405.",
  },
  {
    id: "2.13",
    phase: "2",
    requirement: "Instrument (Section 10) CRUD for four instruments",
    grade: "Partial",
    evidence: "4 seeded with dashboardAuthority. GET only — POST returns 405.",
  },
  {
    id: "2.14",
    phase: "2",
    requirement: "ResponseScale configurable (do not hard-code labels) (§3.6)",
    grade: "Partial",
    evidence:
      "Model + POST. UI can add, not edit labels. Fixture 0–4 says Never/Very often vs spec Not at all/Almost always.",
  },
  {
    id: "2.15",
    phase: "2",
    requirement: "Reviewer approve / admin publish (role matrix)",
    grade: "Partial",
    evidence: "canReviewContent / canPublishContent exist. Unused. Any drafter writes live JSON.",
  },
  {
    id: "2.16",
    phase: "2",
    requirement: "Recharge library seeded across batteries × tiers",
    grade: "Partial",
    evidence: "3 fixture actions (physical 2min, rhythms 5min, mental 60s). signalId always null.",
  },
  {
    id: "2.17",
    phase: "2",
    requirement: "Member surfaces read the content store (not hardcoded fixtures)",
    grade: "Partial",
    evidence:
      "DashboardPage FIXTURE_STATES; assessments import FIXTURE_*. Admin edits do not appear on member pages.",
  },
  {
    id: "2.18",
    phase: "2",
    requirement: "Battery Scan 7 + Unsure follow-up item (§3.1)",
    grade: "Partial",
    evidence: "7 scan items only. No disambiguating follow-up item in fixtures.",
  },
  {
    id: "2.19",
    phase: "2",
    requirement: "Result interpretation / safety / notification copy CRUD (§11.2)",
    grade: "Fail",
    evidence: "No copy entity in ContentDocument or admin tabs.",
  },
  {
    id: "2.20",
    phase: "2",
    requirement: "Draft → approve → publish workflow",
    grade: "Fail",
    evidence: "No draft/published status on items or constructs. Edits are live.",
  },
  {
    id: "2.21",
    phase: "2",
    requirement: "Instrument preview mode",
    grade: "Fail",
    evidence: "TASKS.md 2.3 unchecked. Assessment pages are static fixture lists.",
  },
  {
    id: "2.22",
    phase: "2",
    requirement: "Signal entity persisted (Section 10)",
    grade: "Fail",
    evidence: "schema.ts Signal typed. Not in ContentDocument. RechargeAction.signalId unused.",
  },
  {
    id: "2.23",
    phase: "2",
    requirement: "DRAIN items share Strain constructs, different timeframe (§3.3)",
    grade: "Fail",
    evidence: "All 10 DRAIN items on construct_drain_signal (dimension: drain), not per-battery strain.",
  },
  {
    id: "2.24",
    phase: "2",
    requirement: "Battery + instrument create/update API",
    grade: "Fail",
    evidence: "content-api.ts POST: 405 for batteries and instruments",
  },
  {
    id: "2.25",
    phase: "2",
    requirement: "Phase 2 tests (schema, permissions, threshold read path)",
    grade: "Fail",
    evidence: "No test files. Threshold read path is Phase 3 — nothing to grep-guard yet.",
  },
];

const SECTION10: Array<{
  entity: string;
  grade: Grade;
  note: string;
}> = [
  { entity: "User", grade: "Partial", note: "Typed + stub cookie. Not in JSON store." },
  { entity: "Battery", grade: "Partial", note: "7 seeded. No icon. No mutate API." },
  { entity: "Construct", grade: "Pass", note: "CRUD. Extra dimensions drain|mode vs spec enum." },
  { entity: "Instrument", grade: "Partial", note: "4 seeded. GET only." },
  { entity: "Item", grade: "Pass", note: "CRUD, version, active, isFixture." },
  { entity: "Response Scale", grade: "Partial", note: "Configurable object. UI add-only." },
  { entity: "Assessment Session", grade: "N/A", note: "Typed empty — Phase 3 persist." },
  { entity: "Assessment Response", grade: "N/A", note: "Typed; answer nullable." },
  { entity: "Battery Result", grade: "N/A", note: "Three scores kept separate." },
  { entity: "Overcharge Flag", grade: "N/A", note: "Typed as flag, not a 5th state." },
  { entity: "Driving Mode", grade: "N/A", note: "Typed. Extra source daily_check_in vs spec." },
  { entity: "Signal", grade: "Fail", note: "Typed only. Not stored. FK unused." },
  { entity: "Recharge Action", grade: "Pass", note: "CRUD. 3 fixture rows." },
  { entity: "Recharge Plan", grade: "N/A", note: "Typed — Phase 3/5." },
  { entity: "Daily Check-In", grade: "N/A", note: "Typed — Phase 5." },
  { entity: "Tune-Up", grade: "N/A", note: "Typed — Phase 5." },
  { entity: "Scoring Threshold", grade: "Pass", note: "Admin CRUD + audit. §4.3 seed." },
  { entity: "Escalation Event", grade: "N/A", note: "Typed — Phase 7." },
];

function toneFor(grade: Grade): "success" | "warning" | "danger" | "info" | "neutral" {
  if (grade === "Pass") return "success";
  if (grade === "Partial") return "warning";
  if (grade === "Fail") return "danger";
  return "info";
}

function countGrade(grade: Grade, phase?: "0" | "2"): number {
  return REQS.filter((r) => r.grade === grade && (phase ? r.phase === phase : true)).length;
}

function inScope(rows: Req[]): Req[] {
  return rows.filter((r) => r.grade !== "N/A");
}

export default function Phase02Audit() {
  const theme = useHostTheme();
  const [filter, setFilter] = useCanvasState<Filter>("grade-filter", "all");

  const shown = REQS.filter((r) => (filter === "all" ? true : r.grade === filter));
  const p0 = shown.filter((r) => r.phase === "0");
  const p2 = shown.filter((r) => r.phase === "2");
  const s10 = SECTION10.filter((r) => (filter === "all" ? true : r.grade === filter));

  const pass = countGrade("Pass");
  const partial = countGrade("Partial");
  const fail = countGrade("Fail");
  const na = countGrade("N/A");
  const scoped = inScope(REQS).length;

  return (
    <Stack gap={28}>
      <Stack gap={8}>
        <H1>ThriveLife Phase 0–2 spec audit</H1>
        <Text tone="secondary">
          Developer Specification v1.0 (July 2026) vs disk on 14 Aug 2026. Phases 3–10
          out of scope except where the app already pretends they work.
        </Text>
      </Stack>

      <Callout tone="warning" title="Partial — usable local foundation, not Phase 2 complete">
        The Vite shell, role-gated JSON admin, and Section 10 types are real. Joel still
        cannot edit result/safety copy, publish through review, or coordinate DRAIN with
        Strain constructs — the §11.2 bar is not met. JSON-instead-of-Postgres is a Pass
        (locked). Live http://127.0.0.1:3000 was not up; API graded from code plus a
        residual threshold audit row in content-store.json.
      </Callout>

      <Grid columns={4} gap={16}>
        <Stat value={String(pass)} label="Pass" tone="success" />
        <Stat value={String(partial)} label="Partial" tone="warning" />
        <Stat value={String(fail)} label="Fail" tone="danger" />
        <Stat value={String(na)} label="N/A (later / Joel)" tone="info" />
      </Grid>

      <Stack gap={6}>
        <H3>In-scope requirement grades (Phase 0 + 2)</H3>
        <UsageBar
          total={scoped}
          topLeftLabel={`${pass} pass · ${partial} partial · ${fail} fail`}
          topRightLabel={`${scoped} graded (N/A excluded)`}
          segments={[
            { id: "pass", value: pass, color: "green" },
            { id: "partial", value: partial, color: "yellow" },
            { id: "fail", value: fail, color: "orange" },
          ]}
        />
        <Text size="small" tone="tertiary">
          Source: repo audit 2026-08-14 · Developer Spec v1.0 Parts 10–11.2 + locked
          QUESTIONS.md decisions. Counts are requirement rows, not weighted effort.
        </Text>
      </Stack>

      <Stack gap={8}>
        <H3>Pass / Partial / Fail counts by phase</H3>
        <BarChart
          height={200}
          categories={["Phase 0 foundation", "Phase 2 data + admin"]}
          series={[
            {
              name: "Pass",
              data: [countGrade("Pass", "0"), countGrade("Pass", "2")],
              tone: "success",
            },
            {
              name: "Partial",
              data: [countGrade("Partial", "0"), countGrade("Partial", "2")],
              tone: "warning",
            },
            {
              name: "Fail",
              data: [countGrade("Fail", "0"), countGrade("Fail", "2")],
              tone: "danger",
            },
          ]}
          showValues
        />
        <Text size="small" tone="tertiary">
          Y-axis: requirement count · X-axis: phase · Source: same requirement set as
          tables below.
        </Text>
      </Stack>

      <Grid columns={2} gap={20}>
        <Stack gap={8}>
          <H3>Locked decisions (not fails)</H3>
          <Text>
            Persistence is a <Code>JSON</Code> file at{" "}
            <Code>apps/web/data/content-store.json</Code> via Vite{" "}
            <Code>/api</Code> middleware. Canada-region Postgres is deferred until
            sessions/beta. Auth is a stub cookie. That matches QUESTIONS.md D6–D7 —
            Pass for now.
          </Text>
        </Stack>
        <Stack gap={8}>
          <H3>Out of scope (do not grade as missing)</H3>
          <Text>
            Scoring engine, battery state matrix, overcharge, declared Driving Mode
            writes, dashboard five elements, recommendation lookup, daily loop,
            onboarding wiring, safety/privacy, telemetry, real auth. Scaffold routes
            exist and are labeled fixture/placeholder.
          </Text>
        </Stack>
      </Grid>

      <Stack gap={10}>
        <H2>Top 5 gaps</H2>
        <Table
          headers={["#", "Gap", "Why it matters", "Where"]}
          columnAlign={["right", "left", "left", "left"]}
          rowTone={["danger", "danger", "danger", "warning", "danger"]}
          rows={[
            [
              "1",
              "No draft → approve → publish",
              "canPublishContent / canReviewContent never enforced. Editors write live store.",
              "roles.ts · content-api.ts",
            ],
            [
              "2",
              "No result / safety / notification copy CRUD",
              "Spec §11.2: Joel must edit result wording without a release. No entity.",
              "content-store.ts ContentDocument",
            ],
            [
              "3",
              "DRAIN not on Strain constructs",
              "§3.3: same construct, different timeframe. All DRAIN items sit on construct_drain_signal.",
              "fixtures/items.ts",
            ],
            [
              "4",
              "Section 10 holes",
              "Battery.icon missing; batteries/instruments POST 405; Signal not stored; User not persisted.",
              "batteries.ts · content-api.ts · schema.ts",
            ],
            [
              "5",
              "No tests/CI; member UI ignores the store",
              "Zero tests. Dashboard hardcodes FIXTURE_STATES. Admin edits never reach member pages.",
              "DashboardPage.tsx · no *.test.*",
            ],
          ]}
        />
      </Stack>

      <Divider />

      <Stack gap={10}>
        <Row gap={8} align="center" wrap>
          <Text weight="semibold">Filter grades</Text>
          {(["all", "Fail", "Partial", "Pass", "N/A"] as Filter[]).map((key) => (
            <span key={key}>
              <Pill active={filter === key} onClick={() => setFilter(key)}>
                {key === "all" ? "All" : key}
              </Pill>
            </span>
          ))}
        </Row>
        <Text size="small" tone="tertiary">
          Filter persists on this canvas. Tables below hide non-matching rows.
        </Text>
      </Stack>

      {p0.length > 0 ? (
        <Stack gap={8}>
          <H2>Phase 0 — foundation</H2>
          <Text tone="secondary">
            Repo, Vite shell, roles, fixtures, UI chrome. {countGrade("Pass", "0")} pass ·{" "}
            {countGrade("Partial", "0")} partial · {countGrade("Fail", "0")} fail.
          </Text>
          <Table
            headers={["ID", "Requirement", "Grade", "Evidence"]}
            rowTone={p0.map((r) => toneFor(r.grade))}
            stickyHeader
            rows={p0.map((r) => [r.id, r.requirement, r.grade, r.evidence])}
          />
        </Stack>
      ) : null}

      {p2.length > 0 ? (
        <Stack gap={8}>
          <H2>Phase 2 — data model and admin</H2>
          <Text tone="secondary">
            Spec Parts 10–11.2. {countGrade("Pass", "2")} pass · {countGrade("Partial", "2")}{" "}
            partial · {countGrade("Fail", "2")} fail.
          </Text>
          <Table
            headers={["ID", "Requirement", "Grade", "Evidence"]}
            rowTone={p2.map((r) => toneFor(r.grade))}
            stickyHeader
            rows={p2.map((r) => [r.id, r.requirement, r.grade, r.evidence])}
          />
        </Stack>
      ) : null}

      {s10.length > 0 ? (
        <Stack gap={8}>
          <H2>Section 10 entities</H2>
          <Text tone="secondary">
            Content-admin rows should be persisted in Phase 2. Runtime assessment rows
            typed-empty is N/A until Phase 3.
          </Text>
          <Table
            headers={["Entity", "Grade", "On disk"]}
            rowTone={s10.map((r) => toneFor(r.grade))}
            rows={s10.map((r) => [r.entity, r.grade, r.note])}
          />
        </Stack>
      ) : null}

      <Grid columns={2} gap={16}>
        <Card>
          <CardHeader trailing={<span style={{ color: theme.text.tertiary }}>store</span>}>
            Seeded JSON document
          </CardHeader>
          <CardBody>
            <Table
              framed={false}
              headers={["Collection", "Count"]}
              columnAlign={["left", "right"]}
              rows={[
                ["Batteries", "7"],
                ["Constructs", "23"],
                ["Instruments", "4"],
                ["Response scales", "4"],
                ["Items", "74"],
                ["Recharge actions", "3"],
                ["Scoring thresholds", "9"],
                ["Threshold audit entries", "1 (admin edit test)"],
              ]}
            />
            <Text size="small" tone="tertiary">
              Source: packages/shared fixtures + apps/web/data/content-store.json
              (gitignored, seeded 2026-08-14).
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<span style={{ color: theme.text.tertiary }}>pretend</span>}>
            Surfaces that fake later phases
          </CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text>
                <Code>/dashboard</Code> paints hardcoded battery states and a fixture
                recharge — not Full Assessment / Scan authority (§8 / §3.2).
              </Text>
              <Text>
                Instrument pages list fixture wording; they are not sessions. Check-in
                controls are disabled. Onboarding is an eight-step list.
              </Text>
              <Text size="small" tone="tertiary">
                Acceptable as Phase 0 chrome if nobody treats it as the engine. Do not
                grade Phases 3–6 as delivered.
              </Text>
            </Stack>
          </CardBody>
        </Card>
      </Grid>

      <Stack gap={8}>
        <H2>RBAC vs spec intent</H2>
        <Table
          headers={["Permission", "user", "editor", "reviewer", "admin", "Enforced?"]}
          rows={[
            ["Member app", "yes", "yes", "yes", "yes", "Routes always open"],
            ["Draft content", "no", "yes", "yes", "yes", "API requireDraft"],
            ["Review content", "no", "no", "yes", "yes", "Display only — no workflow"],
            ["Publish content", "no", "no", "no", "yes", "Never checked"],
            ["Edit thresholds", "no", "no", "no", "yes", "API + /admin/thresholds gate"],
            ["Manage users", "no", "no", "no", "yes", "Not built (stub session)"],
          ]}
        />
        <Text size="small" tone="tertiary">
          Source: packages/shared/src/roles.ts vs apps/web/server/content-api.ts and
          RequireRole.tsx. Cookie auth is expected until Phase 9.
        </Text>
      </Stack>

      <Callout tone="info" title="vendor/base44-prior is not the spec product">
        Prior Base44 app (habits, teams, quizzes) is reference chrome only. Do not
        merge those flows as ThriveLife V1. Spec product is capacity-navigation with
        four instruments and seven batteries. Copy-progress still missing most pages.
      </Callout>

      <Stack gap={8}>
        <H2>Next — Phase 3 assessment engine</H2>
        <Text tone="secondary">
          Spec §§3–6 / §11.3. Keep using fixtures until Joel’s item bank; do not ship
          invented clinical wording as real scores.
        </Text>
        <TodoListCard
          defaultExpanded
          todos={[
            {
              id: "p3-store",
              content:
                "Point instrument UIs at the JSON store (not FIXTURE_* imports) so admin edits are what users see.",
              status: "pending",
            },
            {
              id: "p3-session",
              content:
                "Persist AssessmentSession + AssessmentResponse (skip / N/A / Unsure as null).",
              status: "pending",
            },
            {
              id: "p3-scorer",
              content:
                "Scorer reads ScoringThreshold rows only — no magic numbers. Table-test §4.4 matrix.",
              status: "pending",
            },
            {
              id: "p3-authority",
              content:
                "Enforce §3.2: DRAIN never writes battery state; Scan never overwrites Full Assessment; no blending.",
              status: "pending",
            },
            {
              id: "p3-constructs",
              content:
                "Before scoring: re-link DRAIN items to Strain constructs (timeframe variants) per §3.3.",
              status: "pending",
            },
            {
              id: "p3-lockout",
              content: "14-day Full Assessment floor + version stamp; block cross-version numeric compare.",
              status: "pending",
            },
          ]}
        />
      </Stack>
    </Stack>
  );
}
