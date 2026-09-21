# Coding Standards — onecx-product-store-ui

In this section, the term _product-store_ is used as main business topic (feature) in this project.

---

## Architecture

```
src/
  app/
    app.module.ts                     # Root NgModule, shell bootstrap
    app.component.ts                  # Root application component
    app.component.spec.ts             # Root app component tests
    app-entrypoint.component.ts       # Entry-point adapter / integration hook
    app-entrypoint.component.html
    onecx-product-store-remote.module.ts
    product-store/
      product-store.module.ts         # Lazy-loaded feature module for the product store domain
      app-search/
      app-detail/
      app-delete/
      endpoint-search/
      product-search/
      product-detail/
      slot-search/
      slot-detail/
      slot-delete/
    remotes/
      product-data/                   # Remote web components exported via Module Federation
    shared/
      generated/                     # AUTO-GENERATED; do not edit directly
      models/                        # Domain model definitions
      label.resolver.ts              # Route breadcrumb resolver
      utils.ts                       # Shared helper functions
      shared.module.ts               # Shared declarations/imports for feature modules
      iconservice.ts
      image-container/
      ocx-chip/
  assets/
    env.json                          # Runtime configuration values
    api/
      openapi-bff.yaml                # OpenAPI contract for the BFF
    i18n/
      de.json
      en.json
    images/
  environments/
    environment.ts
    environment.prod.ts
```

### Generated API layer

`src/app/shared/generated/` is **entirely auto-generated** from `src/assets/api/openapi-bff.yaml`.
Do not edit those files — run `npm run apigen` to regenerate after changing the spec.

---

## Code style

The project use Prettier + ESLint (`npm run lint`). Key settings contained in `.prettierrc.json` and `.eslintrc.json`.

- Component selectors: `app-` prefix, kebab-case element (`app-search`)
- Directive selectors: `app` prefix, camelCase attribute
- `@typescript-eslint/no-explicit-any` is disabled — but prefer typed alternatives when feasible
- Enforce the ID pattern: `<app-abbreviation>_<page|dialog|section>_<subsection>_<name>` using underscores only.
- If ID is calulated then use the pattern `[id]="'app_page_action_' + element.id"`, prevent using {{}} syntax

---

## Coding patterns

### Interactive HTML Elements

- Every interactive element (`a`, `p-button`, `input`, etc.) **MUST** have an `id`, `[ariaLabel]`, and `[pTooltip]`.

### Class member grouping

Use short inline section comments to group class members consistently:

```typescript
// signals
public readonly visible = signal(false)
// data
private readonly dataSubject$ = new BehaviorSubject<Product[]>([])
public data$: Observable<Product[]> = this.dataSubject$.asObservable()
// dialog
public loading = false
public exceptionKey: string | undefined = undefined
// image
public imageBasePath = this.imageApi.configuration.basePath
```

### Type aliases for UI state

Define string literal union types at the top of the file for component-level states and modes:

```typescript
export type ChangeMode = 'VIEW' | 'EDIT'
export type LoadingState = 'initial' | 'ready' | 'loading' | 'timeout'
```

### Error handling with `exceptionKey`

Use a single `exceptionKey` property (not a signal) to hold the i18n key for errors displayed via `<p-message>`. Map HTTP status codes through `Utils.mapping_error_status()`:

```typescript
public exceptionKey: string | undefined = undefined

catchError((err) => {
  this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + Utils.mapping_error_status(err.status) + '.PRODUCT'
  console.error('methodName', err)
  return of(undefined)
})
```

Always log the raw error with `console.error('calledMethodName', err)`.

### Data loading with Subject trigger

For reloadable lists, use a `BehaviorSubject` for the data stream and a `Subject` as the reload trigger:

```typescript
private readonly dataSubject$ = new BehaviorSubject<RowListGridData[]>([])
public data$: Observable<RowListGridData[]> = this.dataSubject$.asObservable()
private readonly loadTrigger$ = new Subject<void>()

constructor() {
  this.loadTrigger$
    .pipe(
      switchMap(() => {
        this.loading = true
        return this.api.search({}).pipe(
          map((data) => data.stream ?? []),
          catchError((err) => { this.exceptionKey = ...; return of([]) }),
          finalize(() => (this.loading = false))
        )
      }),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe((data) => this.dataSubject$.next(data))
}

public loadData(): void {
  this.loadTrigger$.next()
}
```

### Utils — object pattern for Jasmine spy compatibility

All shared utility functions live in the `Utils` const object in `src/app/shared/utils.ts` — not as standalone exports. This allows `spyOn(Utils, 'methodName')` in Jasmine:

```typescript
// ✅ correct — spyable
export const Utils = {
  sortByDisplayName(a: { displayName?: string }, b: { displayName?: string }): number { ... }
}

// ❌ wrong — standalone functions cannot be spied on in Jasmine
export function sortByDisplayName(...): number { ... }
```

### Locale-aware date formatting

Read the user's language from `UserService.lang$.getValue()` in `ngOnInit()` and derive `dateFormat`:

```typescript
this.dateFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'M/d/yy, hh:mm:ss a'
```

### Slot mechanism (cross-micro-frontend communication)

Use `injectInitializedSlotService()` instead of injecting `SlotService` directly:

```typescript
private readonly slotService = injectInitializedSlotService()
public readonly isComponentDefined = toSignal(
  this.slotService.isSomeComponentDefinedForSlot('slot-name'), { initialValue: false }
)
```

When receiving data back from a slot, use `EventEmitter` (not `Subject`) because `ocx-slot [outputs]` calls `.emit()` on the provided instance:

```typescript
// EventEmitter required here — ocx-slot [outputs] is typed as { [key: string]: EventEmitter<any> }
public readonly slotEmitter = new EventEmitter<Workspace[]>()
```

Subscribe in `ngOnInit()` with `takeUntilDestroyed(this.destroyRef)`. Requires: `destroyRef = inject(DestroyRef)` within the inject() section.

### Remote components

Components in `src/app/remotes/` implement `ocxRemoteComponent` and `ocxRemoteWebcomponent`. They **must** use `@Input()` (not `input()`) for the web-component interface contract:

```typescript
@Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
  this.ocxInitRemoteComponent(config)
}
// output to the host via @Input EventEmitter — required by the remote component protocol
@Input() imageLoadingFailed = new EventEmitter<boolean>()
```

All other inputs on the same remote component may use `input()` signals.

---

## Testing patterns (project-specific)

The use of a TestBed setup is mandatory.

### Standard TestBed setup (for example XComponent)

- `X` is used in the following as a placeholder for a feature name

```typescript
describe('XComponent', () => {
  let component: XComponent
  let fixture: ComponentFixture<XComponent>

  // Declare spies at describe-level for access across all beforeEach/it blocks
  const apiSpy = jasmine.createSpyObj<APIService>('APIService', ['getX', 'updateX'])
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])

  function initTestComponent(): void {
    fixture = TestBed.createComponent(XComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        XComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        providePermissionService(),
        provideNoopAnimations(),
        provideRouter([{ path: '', component: XComponent }])
      ]
    })
      .overrideComponent(XComponent, {
        add: {
          providers: [
            { provide: XAPIService, useValue: apiSpy },
            { provide: PortalMessageService, useValue: msgServiceSpy }
          ]
        }
      })
      .compileComponents()
  })

  beforeEach(() => {
    // Reset all spies and set sensible defaults BEFORE creating the component
    apiSpy.getX.calls.reset()
    msgServiceSpy.success.calls.reset()
    apiSpy.getX.and.returnValue(of({ resource: {} }) as XResponse)

    initTestComponent()
  })
})
```

**Rules:**

- Inject API services via `overrideComponent(..., { add: { providers: [...] } })`, not in root `providers`.
- Type spy objects: `jasmine.createSpyObj<ServiceType>()`.
- Reset **all** spy call counters and re-set default return values in `beforeEach()` **before** `initTestComponent()`.
- Use `TranslateTestingModule.withTranslations({ de: require(...), en: require(...) })` — never stub `TranslatePipe` inline.
- Always add `provideNoopAnimations()` and `providePermissionService()`.
- Keep `initTestComponent()` as a local helper so tests can re-create the component after changing spy defaults (e.g. to cover constructor branches).

### Testing signals and effects

- Set `model`/`input` signal values with `fixture.componentRef.setInput('name', value)` followed by `fixture.detectChanges()`
- To test constructor logic that depends on a spy return value, change the spy **then** call `initTestComponent()`.
- Avoid `fakeAsync` + `tick()` entirely. It depends on legacy Zone.js and is incompatible with zoneless Angular architectures.
- For standard asynchronous tasks (Promises, Observables, Rendering), always use native `async/await` combined with `await fixture.whenStable()`.
- For time-delayed logic (e.g., `setTimeout` or debounce timers), use the native fake timers of your test runner (`jasmine.clock().tick()` or `jest.advanceTimersByTime()`).
