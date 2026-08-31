# GitHub Copilot Instructions 

## Project overview & Context
- Angular 19 **Module Federation micro-frontend** for a OneCX project.
- Built with **standalone components**, **OnPush change detection**, and **signal-first** state management.
  - **Do not convert everything to pure Standalone components.** Follow the existing NgModule bootstrap structure for Module Federation (`app.module.ts`, `*theme*.module.ts`) as outlined in the architecture diagram.
- The project uses PrimeNG components (p-button, p-select, p-message, etc.).
- Testing framework: **Karma + Jasmine** — do NOT replace with Jest and do NOT add Jest dependencies.

## Role
- You are an expert Angular 19 developer working on a OneCX Microfrontend (Remote) environment.

## Core Directives
- You must strictly follow the rules, architecture, and syntax patterns defined in `../coding_standard.md`. Never invent patterns that deviate from that file.
- **Code Generation:** Do not generate explanations or markdown prose unless explicitly asked. Just output the code.
- **Context Awareness:** When creating or modifying components, always check if it is a Remote Component (`src/app/remotes/`) or a standard feature component, and apply the respective file-specific rules from `coding_standard.md`.
- **Refactoring:** If you see legacy patterns (like standard standalone functions instead of the `Utils` object, or missing `id`/`ariaLabel` tags), automatically fix them in your suggestions.

## Migration Directive (Temporary)
- This repository is being migrated from legacy hybrid Angular architecture to the unified OneCX Standard.
- If you see old constructor-based Dependency Injection, automatically refactor it to use `inject()`.
- Convert old structural directives (*ngIf/*ngFor) to the new Control Flow (@if/@for) whenever you touch a template.

---

## Commands

```bash
npm start               # Dev server on localhost:4200 (proxy via proxy.conf.js)
npm run build           # Production build → dist/onecx-theme-ui
npm run test            # Run all Karma/Jasmine tests (watch mode)
npm run karma           # CI mode: no watch, headless, with coverage → reports/
npm run lint            # ESLint + Prettier check
npm run format          # ESLint --fix + Prettier write
npm run apigen          # Regenerate OpenAPI client from openapi-bff.yaml
```

---

## Before changing code

- Read `package.json` and `angular.json` before any change.
- Follow the existing coding style precisely.
- Remove unused imports. Before removing a module import, verify it is not used in the template.
- After changing a component, check the template, the spec file, and every usage of the component's public API.
- Explain all breaking changes before modifying code.
- Use English for all comments and documentation.

### Import section order
```
Angular (@angular/core, @angular/common, @angular/forms, …)
RxJS interop (@angular/core/rxjs-interop)
RxJS (rxjs, rxjs/operators)
Third-party (primeng/*, ngx-translate/*, file-saver, …)
OneCX (@onecx/*)
Local (src/app/*)
```

### Module Imports
- Between the sections, add a blank line.
- Do not suggest legacy NgModules.
- Avoid adding redundant template imports in spec files since standalone components self-contain their template dependencies.
- If there are multiple imports from the same module, combine them into a single import statement and order them alphabetically.

---

## Angular 19 patterns (mandatory)

### Components
- All components are **standalone** (`standalone: true` in `@Component`).
- Always use **`ChangeDetectionStrategy.OnPush`**.
- Use **`inject()`** for dependency injection — never inject via constructor parameters.
- Do not use these modules in component templates: `CommonModule`, `BrowserModule`. Standalone components self-contain their template dependencies. In case of CommonModule use the specific parts of it which are needed, e.g. `AsyncPipe`, `NgIf`, `NgForOf`, `NgClass`, etc.

### Component API — signals only
| Decorator (old) | Modern equivalent |
|---|---|
| `@Input()` | `input<T>()` / `input.required<T>()` |
| `@Output() EventEmitter` | `output<T>()` |
| Two-way `@Input()` + `@Output()` | `model<T>()` / `model.required<T>()` |
| `@ViewChild()` | `viewChild<T>()` |
| `@ViewChildren()` | `viewChildren<T>()` |

- Always mark signals as `readonly` to indicate they should not be reassigned.
- Always mark computed signals as `readonly` to indicate they should not be reassigned.
- Do not use aliases for signals; always refer to them by their declared name.

**Exception:** Remote components that implement `ocxRemoteComponent` / `ocxRemoteWebcomponent` keep `@Input()` as required by the web-component interface contract.

### Signals — local state
- Writable state → `signal<T>(initialValue)` — always mark `readonly`.
- Derived state → `computed(() => ...)` — always mark `readonly`.
  - **`computed()` must be pure**: no side effects, no signal writes, no DOM access.
- Side effects reacting to signal changes → `effect(() => ...)` in the constructor.
  - Signal writes inside `effect()` are allowed in Angular 19.
- Convert observables to signals with `toSignal()` from `@angular/core/rxjs-interop`.

```typescript
// ✅ correct
public readonly count = signal(0)
public readonly doubled = computed(() => this.count() * 2)

constructor() {
  effect(() => {
    if (this.visible()) this.resetState()  // side effect
  })
}

// ❌ wrong — side effects in computed
public readonly headers = computed(() => {
  this.resetState()  // throws NG0600 at runtime
  return new HttpHeaders()
})
```

### Observables & subscriptions
- Prefer `toSignal()` over the `async` pipe for observable-to-template binding.
- Use `takeUntilDestroyed(this.destroyRef)` for subscriptions that must be cleaned up.
- Do **not** use `@UntilDestroy()` from `@ngneat/until-destroy` — use the Angular-native approach.
- For cancellable HTTP calls use a `Subject` + `switchMap` pipeline (not a manual `Subscription` variable).
- Single-emission HTTP calls (HTTP verbs that complete after one value) may use `.subscribe()` without explicit cleanup.
- `EventEmitter` is only valid as an `@Output()` or where required by an external API contract (e.g. `ocx-slot [outputs]`). Use `Subject` for all other internal event streams.

### Templates
- Use **`@if`**, **`@for`**, **`@switch`** — never `*ngIf`, `*ngFor`, `*ngSwitch`.
- Extract conditions with more than one operand into named `computed()` signals.
- Bind signal values directly: `[prop]="mySignal()"`. Use `async` pipe only for observables not converted to signals.

### Notifications (OneCX)
- Use **`PortalMessageService`** from `@onecx/angular-integration-interface` for all user-visible messages.
- Do **not** import `ToastModule` or place `<p-toast>` in component templates — the portal shell owns the global toast outlet.

---

## Unit Testing (Karma / Jasmine) in TestBed
- **100% coverage** (statements, branches, functions, lines) for all new or changed code.
- Use `TestBed.createComponent()` — no shallow rendering, no `NO_ERRORS_SCHEMA`.
- Do not stub templates via `overrideComponent({ set: { template: '' } })`.
- Set signal inputs with **`fixture.componentRef.setInput('name', value)`**.
- Trigger change detection and flush pending effects with **`fixture.detectChanges()`**.
  - Prefer `fixture.detectChanges()` over `TestBed.flushEffects()` in zone-based (Karma) tests.
- Use **`spyOn(...).and.callThrough()`** when the spy must also execute the real implementation.
- Test **one behaviour per `it()` block** — do not combine unrelated assertions.
- Name tests: `should <behaviour> when <condition>`.
- Verify that a method or signal exists in the source before writing a test for it.
- Mock services with `jasmine.createSpyObj()` or `{ provide: X, useValue: mockObj }`.
- Always mirror the exact setup from `coding_standard.md`: use `overrideComponent` for API mocks, reset spies in `beforeEach()`, and always defer component creation to a local `initTestComponent()` helper.
- Never write tests without `TranslateTestingModule` loading the real JSON files as defined in the standards.


---

For architecture, code-style rules, and project-specific patterns see [coding_standards.md](../coding_standards.md).
