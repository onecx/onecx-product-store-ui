import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { Router, ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { UserService } from '@onecx/portal-integration-angular'
import { AppSearchComponent, MicrofrontendSearchCriteria } from './app-search.component'
import { MicrofrontendsAPIService /* , Microfrontend */ } from 'src/app/shared/generated'

const form = new FormGroup<MicrofrontendSearchCriteria>({
  appId: new FormControl<string | null>(null, Validators.minLength(2)),
  appName: new FormControl<string | null>(null),
  productName: new FormControl<string | null>(null)
})

describe('AppSearchComponent', () => {
  let component: AppSearchComponent
  let fixture: ComponentFixture<AppSearchComponent>
  let routerSpy = jasmine.createSpyObj('Router', ['navigate'])
  let routeMock = { snapshot: { paramMap: new Map() } }

  const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['get'])
  const apiServiceSpy = {
    searchMicrofrontends: jasmine.createSpy('searchMicrofrontends').and.returnValue(of({}))
  }
  const mockUserService = {
    lang$: {
      getValue: jasmine.createSpy('getValue').and.returnValue('en')
    },
    hasPermission: jasmine.createSpy('hasPermission').and.callFake((permissionName) => {
      if (permissionName === 'MICROFRONTEND#CREATE') {
        return true
      } else if (permissionName === 'MICROFRONTEND#EDIT') {
        return true
      } else {
        return false
      }
    })
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AppSearchComponent],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        { provide: MicrofrontendsAPIService, useValue: apiServiceSpy },
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: routeMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    apiServiceSpy.searchMicrofrontends.calls.reset()
    translateServiceSpy.get.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should call onCreate when actionCallback is executed', () => {
    spyOn(component, 'onCreate')

    component.ngOnInit()

    if (component.actions$) {
      component.actions$.subscribe((actions) => {
        const firstAction = actions[1]
        firstAction.actionCallback()
        expect(component.onCreate).toHaveBeenCalled()
      })
    }
  })

  it('should call onBack when actionCallback is executed', () => {
    spyOn(component, 'onBack')

    component.ngOnInit()

    if (component.actions$) {
      component.actions$.subscribe((actions) => {
        const firstAction = actions[0]
        firstAction.actionCallback()
        expect(component.onBack).toHaveBeenCalled()
      })
    }
  })

  it('should update viewMode onLayoutChange', () => {
    component.onLayoutChange('EDIT')

    expect(component.viewMode).toBe('EDIT')
  })

  it('should update filter and call dv.filter onFilterChange', () => {
    const filter = 'testFilter'

    component.onFilterChange(filter)

    expect(component.filter).toBe(filter)
  })

  it('should update sortField onSortChange', () => {
    component.onSortChange('field')

    expect(component.sortField).toBe('field')
  })

  it('should update sortOrder based on asc boolean onSortDirChange', () => {
    component.onSortDirChange(true)
    expect(component.sortOrder).toBe(-1)

    component.onSortDirChange(false)
    expect(component.sortOrder).toBe(1)
  })

  it('should call searchApps onSearch', () => {
    spyOn(component, 'searchApps')

    component.onSearch()

    expect(component.searchApps).toHaveBeenCalled()
  })

  it('should reset appSearchCriteriaGroup onSearchReset is called', () => {
    component.appSearchCriteriaGroup = form
    spyOn(form, 'reset').and.callThrough()

    component.onSearchReset()

    expect(component.appSearchCriteriaGroup.reset).toHaveBeenCalled()
  })

  it('should navigate back onBack', () => {
    component.onBack()

    expect(routerSpy.navigate).toHaveBeenCalledWith(['../'], { relativeTo: routeMock })
  })

  it('should stop event propagation and navigate to the product onGotoProduct', () => {
    const event = { stopPropagation: jasmine.createSpy() }

    component.onGotoProduct(event as any, 'product')

    expect(event.stopPropagation).toHaveBeenCalled()
    expect(routerSpy.navigate).toHaveBeenCalledWith(['../', 'product'], { relativeTo: routeMock })
  })

  it('should should assign app to component property and change to edit mode onDetail', () => {
    const event = { stopPropagation: jasmine.createSpy() }
    const app = {
      id: 'id',
      appId: 'appId',
      appName: 'appName',
      remoteBaseUrl: 'url',
      productName: 'product'
    }

    component.onDetail(event as any, app)

    expect(event.stopPropagation).toHaveBeenCalled()
    expect(component.app).toBe(app)
    expect(component.changeMode).toBe('EDIT')
  })

  it('should should assign app to component property and change to copy mode onCopy', () => {
    const event = { stopPropagation: jasmine.createSpy() }
    const app = {
      id: 'id',
      appId: 'appId',
      appName: 'appName',
      remoteBaseUrl: 'url',
      productName: 'product'
    }

    component.onCopy(event as any, app)

    expect(event.stopPropagation).toHaveBeenCalled()
    expect(component.app).toBe(app)
    expect(component.changeMode).toBe('COPY')
  })

  it('should should assign app to component property and change to copy mode onCreate', () => {
    component.onCreate()

    expect(component.app).toBeUndefined()
    expect(component.changeMode).toBe('CREATE')
    expect(component.displayDetailDialog).toBeTrue()
  })

  it('should should assign app to component property and change to copy mode onDelete', () => {
    const event = { stopPropagation: jasmine.createSpy() }
    const app = {
      id: 'id',
      appId: 'appId',
      appName: 'appName',
      remoteBaseUrl: 'url',
      productName: 'product'
    }

    component.onDelete(event as any, app)

    expect(event.stopPropagation).toHaveBeenCalled()
    expect(component.app).toBe(app)
  })
})
