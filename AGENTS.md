# AI Agent Guidelines

## Project-Wide Principles

These principles apply to every change, in every milestone. They are the high-level rules; the sections below give the detailed mechanics.

### Very limited dependencies

The project operates under a **very limited dependencies** policy. The dependency closure — direct and transitive, runtime and dev — is a supply-chain attack surface, and for this codebase that surface is treated as a security property: keep it tiny.

- The default position is **no new dependency**. Everything should use platform and web-standard APIs until a dependency proves itself necessary.
- A dependency (runtime or dev) may be added only when it is **high value relative to its weight** (what it costs in bundle size, audit surface, and maintenance versus what it buys).
- **The implementing agent performs the review and presents the evidence to the operator for approval.** Before proposing adoption: run and exercise the package, read the shipped distribution code, inspect the full transitive closure, check the license and maintenance signals, and verify there are no install scripts and no network behavior. Nothing is added without explicit operator approval.
- First evaluate alternatives (reimplementing with platform APIs, restructuring the code, splitting the work differently) and present them alongside the proposal.
- **Transitive dependencies get the most scrutiny.** Reject packages whose closure explodes or pulls unreviewable code, even when the direct dependency is attractive. Prefer zero-dependency packages.
- **Dev dependencies are kept to a minimum, with the same review process, and transitive dev dependencies are avoided when possible.**
- Record every approved dependency (what, why, alternatives considered, closure size, pinned version) in the project's dependency ledger before it lands in `package.json`.
- Runtime code relies solely on web-standard platform APIs except for reviewed, operator-approved dependencies; dev tooling is kept as small as the review process allows.

### Code quality over speed

Code quality is of the utmost importance. Take the time to do things well rather than rushing a product out. Prefer clear naming, small focused functions, and obvious control flow over clever or compact code. A reviewer should be able to understand any change without further explanation. When in doubt, choose the more readable and more auditable option.

### In-memory, fast tests

Tests must run purely in-memory, must not hit the network, and must not depend on external services. Every test should run in milliseconds so the full suite is never a burden to run frequently. See "Testing Policy" below for the full rules.

### Testable business logic

Business logic must be easy to test under the above constraints. Structure code so that parsing, validation, formatting, transformation, and decision-making live in pure functions or testable orchestration functions that receive their dependencies explicitly (see "Architecture" below). Keep integration glue thin so that most logic is exercisable in-memory. If a piece of logic is hard to test, that is a signal to refactor it into the testable surface area.

### Maintainable and auditable

The codebase must be easy to maintain and audit. Prefer explicit, readable data flow over implicit globals and magic. Avoid cleverness that obscures intent. Every external input is validated (see "External Data Validation"). Behavior should be discoverable from reading the code and the project's documentation, not from tribal knowledge. A reader should be able to follow what the program does from `main` down to the leaf calls without guessing.

---

## Type Safety Rules

### No Typecasts

**Never use typecasts (`as Type`) to bypass TypeScript's type system.**

Typecasts hide real type issues and defeat the purpose of static typing. If typecheck fails, investigate why your types are wrong and fix them properly.

**Wrong:**
```typescript
const data = fetchData() as MyType // Hides type mismatches
const error = err as NodeJS.ErrnoException // Assumes type without checking
```

**Right:**
```typescript
// Use type guards to verify structure
function isValidData(data: unknown): data is MyType {
	if (typeof data !== 'object') return false
	if (data === null) return false
	if (!('requiredField' in data)) return false
	return true
}

if (isValidData(data)) {
	// data is now typed as MyType
}

// Or use proper type narrowing
if ('code' in error && error.code === 'ENOENT') {
	// error.code is accessible here
}
```

### External Data Validation

When receiving data from external sources (APIs, files, environment, etc.), always validate its structure before use:

```typescript
// Define validation function
function isValidConfiguration(maybeConfiguration: unknown): object is Configuration {
	if (typeof maybeConfiguration !== 'object') return false
	if (maybeConfiguration === null) return false
	if (!('requiredField' in maybeConfiguration)) return false
	if (typeof maybeConfiguration.requiredField !== 'string') return false
	return true
}

// Use validation
const configuration = parseConfigurationInput();
if (!isValidConfiguration(configuration)) throw new Error('Invalid configuration')
// Now configuration is properly typed
```

### Const Assertions

`as const` is acceptable and encouraged for literal values. It narrows types (makes them stricter), not looser:

```typescript
// Type is literal '/review', not string
const TRIGGER_COMMAND = '/review' as const
```

### No Non-Null Assertions

**Never use the non-null assertion operator (`value!`) to silence the type checker.** It is a typecast in disguise: it declares a value present without proving it, and when the assumption breaks it fails as an opaque `undefined is not an object` far from the cause. Treat `!` exactly like `as` — if the type says a value can be absent, handle the absent case.

**Wrong:**
```typescript
// Crashes opaquely when the stack is empty
const frame = stack[stack.length - 1]!
// Asserts the map holds every key
entry.usage = byRole.get(role)!.usage
```

**Right:**
```typescript
// Restructure so absence is handled explicitly
const frame = stack[stack.length - 1]
if (frame === undefined) continue

// Or iterate the container so presence holds by construction
for (const entry of byRole.values()) { ... }
```

When a value is present by an invariant the types cannot express, check it and throw with a useful message (fail fast with debugging information — see "General Principles"); do not assert silently. Optional chaining (`?.`) and nullish coalescing (`??`) are not assertions and remain fine.

---

## Error Handling Rules

### No Try/Catch for Code Flow

**Never use try/catch to control program flow or handle expected conditions.**

Try/catch should only be used for truly exceptional cases that cannot be prevented.

**Wrong:**
```typescript
// Don't use try/catch to check if something exists
try {
	const files = fs.readdirSync(path)
	// process files
} catch (error) {
	if (error.code === 'ENOENT') {
		// Directory doesn't exist - this is expected, not exceptional
		return []
	}
	throw error
}
```

**Right:**
```typescript
// Check conditions before proceeding
if (!fs.existsSync(path)) return []

const files = fs.readdirSync(path)
// Now we know the directory exists, any error is truly exceptional
```

### Expected vs Exceptional

**Expected conditions** (check before proceeding):
- File/directory existence
- User input validation
- API response status codes
- Configuration presence

**Exceptional conditions** (use try/catch):
- Network failures during operation
- Disk I/O errors after existence check
- Unexpected system errors

### Error Type Guards

When you must handle errors, use proper type guards instead of typecasts:

```typescript
function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
	if (typeof error !== 'object') return false
	if (error === null) return false
	if (!('code' in error)) return false
	if (typeof error.code !== 'string') return false
	return true
}

// Usage
if (isErrnoException(error) && error.code === 'ENOENT') {
  // Handle missing file
}
```

---

## Testing Policy

Code should be structured so that most business logic falls into a **testable surface area** — pure functions that accept their dependencies as parameters rather than reaching for globals. The goal is to maximize the ratio of testable logic to untested integration glue.

### Testable (write tests for)

Pure functions and logic that can be exercised by passing inputs and asserting outputs. This includes parsing, validation, formatting, transformation, and decision-making logic.

### Not testable (don't write tests for)

Thin integration layers that wire dependencies to the outside world. This includes API calls, filesystem reads, subprocess spawning, and the main orchestration that composes everything together. These are inherently coupled to external systems and should be kept as thin as possible so they contain minimal logic worth testing.

### Making dependencies injectable

Functions that touch external systems (network, filesystem, subprocess, environment) should be exported as **factories** that return configured functions. The factory closes over all configuration that does not vary per call.

Orchestration functions (functions that sequence calls, make decisions, handle errors) are **testable** and receive pre-configured leaf functions via a `dependencies` object.

**No `dependencies` parameter has a default value.** `main` is the only place that assembles and passes real dependencies.

**Wrong:**
```typescript
// Coupled to global - untestable
export function parseConfiguration(): Configuration {
	const value = GLOBAL_ENVIRONMENT.MY_VAR
	// ... logic ...
}

// Default parameter hides external access
export function runAnalysis(environment: Record<string, string | undefined> = GLOBAL_ENVIRONMENT): void {
	const configuration = parseConfiguration(environment)
	// ...
}
```

**Right:**
```typescript
// Leaf factory - closes over configuration at construction time
export function createParseConfiguration(environment: Record<string, string | undefined>): () => Configuration {
	return () => {
		const value = environment.MY_VAR
		// ... logic ...
	}
}

// Orchestration - receives pre-configured leaf via dependencies
export function runAnalysis(dependencies: { parseConfiguration: () => Configuration }): void {
	const configuration = dependencies.parseConfiguration()
	// ...
}
```

### In-memory tests only

Tests must run purely in-memory. Do not make network requests, touch the filesystem (including temporary directories), spawn subprocesses, or depend on external services. Use fakes for every external dependency (network clients, timers, storage, randomness, subprocesses). The goal is fast iteration: every test should run in milliseconds.

Integration against real external services is a separate concern handled outside the unit-test run (staged environments, manual verification), never in the test suite.

---

## Architecture

This codebase follows a three-tier architecture that maximizes testability while keeping the integration shell as thin as possible.

### Leaf Functions

Leaf functions directly touch external systems: network, filesystem, subprocess, and environment. They are **not tested** and should be the thinnest possible wrappers around those systems.

Leaf functions are exported as **factories** that return configured functions. All configuration that does not vary per call is closed over at construction time.

Examples: a persistence factory that closes over a base directory, an HTTP-client factory that closes over the endpoint and retry policy, a storage factory that closes over the storage root.

### Orchestration Functions

Orchestration functions sequence calls, make decisions, handle errors, and branch on conditions. They are **testable** and receive pre-configured leaf functions via a `dependencies` object.

Each orchestration function declares its own type containing **only** the configured leaf functions it **directly** uses. Do not use type unions (`&`) to compose dependency types from callees. Because TypeScript uses structural typing, a superset object is assignable to a subset type automatically.

Examples: a sync engine that sequences fetch-validate-persist, a retry loop composed over injected fetch and sleep leaves, a request-submission orchestrator that calls validation before the wire call.

### Pure Helper Functions

Pure helper functions contain parsing, validation, formatting, transformation, and decision-making logic. They are directly imported wherever needed and never injected.

Examples: input validators, formatters, URI-matching logic, and derivation or budgeting calculations.

### Important Rules

- **No default values for `dependencies` parameters.** Defaults hide external access and surprise callers. `main` is the only place that assembles and passes real dependencies.
- **Never use type unions (`&`) to compose dependency types.** List each dependency explicitly in each orchestration function's type. When a transitive dependency changes, the type checker will surface the mismatch at the call site.
- Pass the accumulated `dependencies` object down without destructuring. Because of structural typing, `main` assembles one object and passes it to each handler; handlers accept subset types, so TypeScript enforces that everything needed is provided without manual repackaging.
- **Only leaf functions go in `dependencies`.** Plain data (strings, numbers, objects), configuration values, or user input belong as regular function parameters, not inside `dependencies`. `dependencies` is exclusively for configured leaf functions that touch external systems.
- **Run-scoped in-memory state carriers (a registry, queue, tracker, recorder) may ride in `dependencies`** because they are state the call chain threads explicitly, not hidden globals.
- **Do not export functions solely for testing.** Functions should only be exported if they are part of the module's public API used by other modules. If a function is not reachable through the exported surface area, it should not be tested. Extract logic into the testable area (orchestration or pure helpers) only when it genuinely improves the architecture — not just to enable a test.

### Decision Tree

When adding a new function, use this to decide its pattern:

1. **Does it touch an external system** (network, filesystem, subprocess, environment)?
   - **Yes:** It is a **leaf**. Export a **factory** that accepts raw configuration and returns a configured function. Close over all configuration that does not vary per call. Do not export the raw function.
   - **No:** Go to step 2.

2. **Does it orchestrate or make decisions** (sequence calls, handle errors, branch on conditions)?
   - **Yes:** It is **testable orchestration**. Accept a `dependencies` object containing only the configured leaf functions it needs. Do not provide defaults.
   - **No:** It is a **pure helper**. Import it directly wherever needed.

---

## Control Flow Rules

### Prefer Guard Clauses

**Keep the primary code path at the root level of functions.** When a condition should cause an early exit, use a guard clause rather than wrapping the rest of the function in a conditional block.

**Wrong:**
```typescript
function process(entries) {
	for (const entry of entries) {
		if (entry.isValid) {
			doSomething(entry)
			doMore(entry)
		}
	}
}
```

**Right:**
```typescript
function process(entries) {
	for (const entry of entries) {
		if (!entry.isValid) continue
		doSomething(entry)
		doMore(entry)
	}
}
```

One-line `return` or `continue` guards are especially encouraged when they let the main logic sit unindented at the top level of the function or loop.

---

## Naming Conventions

Prefer verbose, descriptive names. Avoid abbreviations, acronyms, and single-letter names in identifiers, folders, and files.

- `userRepository` rather than `userRepo`
- `configuration` rather than `cfg`
- `manifest.json` rather than `m.json`
- `persistence.ts` rather than `persist.ts`

Single-letter names are acceptable only where the language idiom requires them (e.g., a `for` loop index). Common short forms that are already part of the project's vocabulary (`id`, `url`, `json`) are fine. The goal is clarity over brevity; do not invent new abbreviations.

## Formatting

Newlines carry semantic meaning. They separate statements, definitions, and logical groups. Do not insert blank lines purely to shorten a line or for visual breathing room.

- If a line is too long, refactor the code (extract a variable, split a function, introduce a helper) rather than wrapping it with arbitrary newlines.
- Long parameter lists, long import statements, and long string literals are acceptable as single lines when wrapping would reduce clarity.
- Do not hand-wrap prose, comments, doc blocks, or string/format/error-message literals. Write each sentence on one line and let the editor soft-wrap. A newline in prose marks a sentence or paragraph boundary; a newline in a struct separates logically grouped fields; a newline in a function separates distinct phases. A break in the middle of a single sentence or expression is wrong even if the line is long.
- This project ships no code formatter and no linter by policy — lint rule sets are both a dependency/supply-chain cost and a rigidity cost, and lint/format tooling never gates a change (the actual CI gates are defined in the development plan). Style compliance comes from the guidelines in this file (split into a dedicated `STYLE.md` if they outgrow it) and from periodic manual style reviews scheduled in the development plan. Wrapping is a manual judgment governed by this section, not a tool config; do not hand-wrap to defeat an imagined width, and do not introduce a formatter or linter dependency to "fix" it.
- Use exactly one blank line between top-level definitions and between logical groups. Never use two or more consecutive blank lines.
- Files end with a single trailing newline; do not leave trailing whitespace on any line.

## Comments

Source code must stand on its own. The development plan (`PLAN.md`) is a transient planning artifact; it must never be referenced from source files, tests, or commit messages.

- Do not write "step N", "phase N", "the plan", "see PLAN.md", or any equivalent in source comments, identifiers, error messages, or test names. A reader of the source (who has no plan in front of them) must be able to understand every file without it.
- Comments that need to point to design context reference the permanent design docs (`docs/*.md`), which outlive the plan. Reference a doc by its filename and section heading, e.g. `docs/protocol.md "Key hierarchy"`.
- Comments that need to point to a sibling module reference it by module path or symbol name (e.g. "applied by the lock manager", "the input to scoring"), not by the step that builds it. The plan's milestone boundaries are an implementation scheduling detail, not a property of the finished code.
- `PLAN.md` is the only place that discusses steps, phases, sequencing, or the plan itself. `AGENTS.md` and `PLAN.md` are the exception: they govern the plan's own hygiene.

### Comments explain why, never what

A comment earns its place only by adding something the name, signature, and type cannot: the reason for a non-obvious choice, a constraint the code assumes but does not enforce, a hazard a reader would not anticipate, or a link to the decision that motivated it. A comment that paraphrases the item's name, signature, type, or obvious behavior is noise and a future source of drift — delete it.

- Keep comments that explain an invariant, a hazard, an RAII/destructor-style contract, a deliberately-omitted API, a magic constant's meaning, or a non-obvious rationale. When in doubt whether a comment carries information the code itself does not, keep it.
- No comments addressed to a future author. Bare `TODO`, `FIXME`, `XXX`, `HACK`, "later", "placeholder", and "not yet supported" notes do not belong in source. If the underlying work is real, record it in the development plan's open-items list (and name the milestone that will remove it) or in `docs/`, and leave an inline reference only if the project convention requires one.
- One sentence per line in comments and doc blocks. Do not break a single sentence across multiple lines for width; let the reader's editor soft-wrap. (See "Formatting" below.)

**Good** — explains *why*, information the code cannot carry:

```typescript
// A present but malformed meta is treated as absent: meta.json is written atomically at run completion, so a malformed read is most likely a torn read mid-write, and the UI should fall back to "in progress" rather than crash.
function parseMeta(metaText: string | null): RunMeta | null {
```

**Bad** — restates *what* the signature already says:

```typescript
// Validates an eval.json object and returns it typed as EvalConfig.
// Throws a ValidationError with a path-based message when the input is malformed.
export function parseEvalConfig(value: unknown): EvalConfig {
```

### Comment Necessity Test

Before adding or keeping a comment, ask: **"Would a reader who has read the entire codebase (including related files and documentation) still need this information?"** If the answer is **no**, the comment is redundant and should be removed.

**Specific checks:**

1. **Is the behavior evident from the code?**
   If the comment describes what the code does (e.g., `// sets background color`), it's redundant. The code itself shows this.

2. **Is the information duplicated elsewhere?**
   If the same fact is already documented in another file (e.g., a comment explaining when a constant is used, but that logic appears in the submission flow), don't repeat it. Reference the existing documentation instead.

3. **Does it explain a non-obvious design choice?**
   Keep comments that reveal:
   - Why an approach was chosen over alternatives
   - Constraints the code must satisfy
   - Invariants that aren't enforced by types
   - Reasons for architectural decisions (e.g., why something is centralized)
   - Hazards or edge cases not obvious from the implementation

4. **Is it a design rationale or a behavior description?**
   Good: "This uses a mutex because the operation isn't atomic."
   Bad: "This increments the counter." (The `counter++` already shows this.)

**When in doubt, err on the side of fewer comments.** Code should be self-documenting through clear names and structure. Comments exist only to explain what code cannot.

### Enforcement

Comment and newline quality is a review judgment, not a build-gate failure. No automated check is wired into the test suite: mechanically detecting "reiterative comments" or "arbitrary wraps" produces false positives that make a check a burden rather than a safety net, and a bare-`TODO` gate was rejected because this project has no issue tracker for such notes to reference (real work is tracked in the development plan's open-items list instead). Re-check comment and newline hygiene against this section and "Formatting" before declaring any change done — reiterative comments and mid-sentence wraps accumulate silently. Periodic manual style reviews (scheduled in the development plan) are the backstop for everything this file governs.

---

## General Principles

1. **TypeScript should catch errors at compile time, not runtime**
2. **If you need a typecast, your types are wrong - fix them**
3. **Validate external data before use**
4. **Check preconditions before operations, don't catch expected errors**
5. **Use type guards, not typecasts, for narrowing**
6. **Fail fast on invalid input, unexpected results, or any other failure — do not suppress, compensate for, or guess around problems. Throw with useful debugging information instead.**

---

## Knowledge Freshness

**Do not rely on internal memory for version numbers, release dates, package versions, or any other time-sensitive facts that may have changed since training.** Always use available tools to look up the latest information online before making claims about:

- Software or library versions
- Release dates or version lifecycles
- Current best practices, standards, or specifications
- API behavior, endpoints, or schemas of external services
- Security advisories, CVE status, or vulnerability reports

If you are unsure whether a fact is static or time-sensitive, treat it as time-sensitive and verify it with a tool.
