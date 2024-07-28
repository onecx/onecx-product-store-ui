import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { Router, ActivatedRoute } from '@angular/router'
import { of, throwError } from 'rxjs'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { TranslateService } from '@ngx-translate/core'

import { UserService } from '@onecx/portal-integration-angular'
import { AppAbstract, AppType, AppSearchComponent, AppSearchCriteria } from './app-search.component'
import {
  MicrofrontendAbstract,
  MicrofrontendsAPIService,
  MicrofrontendPageResult,
  Microservice,
  MicroservicePageResult,
  MicroservicesAPIService
} from 'src/app/shared/generated'

const form = new FormGroup<AppSearchCriteria>({
  appId: new FormControl<string | null>(null, Validators.minLength(2)),
  appType: new FormControl<AppType | null>(null),
  productName: new FormControl<string | null>(null)
})

describe('AppSearchComponent', () => {
  let component: AppSearchComponent
  let fixture: ComponentFixture<AppSearchComponent>
  let routerSpy = jasmine.createSpyObj('Router', ['navigate'])
  let routeMock = { snapshot: { paramMap: new Map() } }

  const mfeApp: AppAbstract = {
    id: 'id',
    appId: 'appId',
    appType: 'MFE',
    appName: 'microfrontend',
    productName: 'prodName',
    appTypeKey: 'APP.MFE'
  }
  const msApp: AppAbstract = {
    id: 'id',
    appId: 'appId',
    appType: 'MS',
    appName: 'microservice',
    productName: 'prodName',
    appTypeKey: 'APP.MS'
  }
  const mfe: MicrofrontendAbstract = {
    id: 'id',
    appId: 'appId',
    appName: 'microfrontend',
    productName: 'prodName',
    remoteBaseUrl: 'remote URL'
  }
  const ms: Microservice = {
    id: 'id',
    appId: 'appId',
    appName: 'microservice',
    productName: 'prodName'
  }

  const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['get'])
  const apiMfeServiceSpy = {
    searchMicrofrontends: jasmine.createSpy('searchMicrofrontends').and.returnValue(of({}))
  }
  const apiMsServiceSpy = {
    searchMicroservice: jasmine.createSpy('searchMicroservice').and.returnValue(of({}))
  }

  const mockUserService = {
    lang$: {
      getValue: jasmine.createSpy('getValue').and.returnValue('en')
    },
    hasPermission: jasmine.createSpy('hasPermission').and.callFake((permissionName) => {
      if (permissionName === 'APP#CREATE') {
        return true
      } else if (permissionName === 'APP#EDIT') {
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
        { provide: MicrofrontendsAPIService, useValue: apiMfeServiceSpy },
        { provide: MicroservicesAPIService, useValue: apiMsServiceSpy },
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
    fixture.componentInstance.ngOnInit() // solved ExpressionChangedAfterItHasBeenCheckedError
  })

  afterEach(() => {
    apiMfeServiceSpy.searchMicrofrontends.calls.reset()
    apiMsServiceSpy.searchMicroservice.calls.reset()
    translateServiceSpy.get.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should prepare dialog translations', async () => {
    const translateService = TestBed.inject(TranslateService)
    const dialogTranslations = {
      'ACTIONS.DATAVIEW.FILTER_OF': 'searchFilterOf ',
      'APP.APP_ID': 'appId',
      'APP.APP_TYPE': 'appType',
      'APP.PRODUCT_NAME': 'productName'
    }
    spyOn(translateService, 'get').and.returnValue(of(dialogTranslations))

    await component.ngOnInit()

    expect(component.dataViewControlsTranslations).toEqual({
      filterInputTooltip: 'searchFilterOf appId, appType, productName'
    })
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

  it('should navigate to Slots when button clicked and actionCallback executed', () => {
    component.ngOnInit()

    if (component.actions$) {
      component.actions$.subscribe((actions) => {
        const firstAction = actions[1]
        firstAction.actionCallback()
        expect(routerSpy.navigate).toHaveBeenCalledWith(['../slots'], { relativeTo: routeMock })
      })
    }
  })

  it('should call onCreate when actionCallback is executed', () => {
    spyOn(component, 'onCreate')

    component.ngOnInit()

    if (component.actions$) {
      component.actions$.subscribe((actions) => {
        const firstAction = actions[2]
        firstAction.actionCallback()
        expect(component.onCreate).toHaveBeenCalledWith('MFE')
      })
    }
  })

  it('should call onCreate when actionCallback is executed', () => {
    spyOn(component, 'onCreate')

    component.ngOnInit()

    if (component.actions$) {
      component.actions$.subscribe((actions) => {
        const firstAction = actions[3]
        firstAction.actionCallback()
        expect(component.onCreate).toHaveBeenCalledWith('MS')
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

  it('should update filterBy and filterValue onQuickFilterChange: ALL', () => {
    component.onQuickFilterChange({ value: 'ALL' })

    expect(component.filterBy).toBe(component.filterValueDefault)
    expect(component.filterValue).toBe('')
  })

  it('should update filterBy and filterValue onQuickFilterChange: other', () => {
    component.onQuickFilterChange({ value: 'other' })

    expect(component.filterValue).toBe('other')
    expect(component.filterBy).toBe('appType')
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

  it('should search mfes: one mfe', (done) => {
    component.appSearchCriteriaGroup.controls['appType'].setValue('MFE')
    apiMfeServiceSpy.searchMicrofrontends.and.returnValue(of({ stream: [mfe] } as MicrofrontendPageResult))

    component.searchApps()

    component.apps$.subscribe({
      next: (apps) => {
        expect(apps.length).toBe(1)
        apps.forEach((app) => {
          expect(app.appType).toEqual('MFE')
        })
        done()
      },
      error: done.fail
    })
  })

  it('should search mfes: empty', (done) => {
    component.appSearchCriteriaGroup.controls['appType'].setValue('MFE')
    apiMfeServiceSpy.searchMicrofrontends.and.returnValue(of({} as MicrofrontendPageResult))

    component.searchApps()

    component.apps$.subscribe({
      next: (apps) => {
        expect(apps.length).toBe(0)
        done()
      },
      error: done.fail
    })
  })

  it('should search mss: one ms', (done) => {
    component.appSearchCriteriaGroup.controls['appType'].setValue('MS')
    apiMsServiceSpy.searchMicroservice.and.returnValue(of({ stream: [ms] } as MicroservicePageResult))

    component.searchApps()

    component.apps$.subscribe({
      next: (apps) => {
        expect(apps.length).toBe(1)
        apps.forEach((app) => {
          expect(app.appType).toEqual('MS')
        })
        done()
      },
      error: done.fail
    })
  })

  it('should search mss: empty', (done) => {
    component.appSearchCriteriaGroup.controls['appType'].setValue('MS')
    apiMsServiceSpy.searchMicroservice.and.returnValue(of({} as MicroservicePageResult))

    component.searchApps()

    component.apps$.subscribe({
      next: (apps) => {
        expect(apps.length).toBe(0)
        done()
      },
      error: done.fail
    })
  })

  it('should catch error on searchApps: mfes', (done) => {
    component.appSearchCriteriaGroup.controls['appType'].setValue('MFE')
    const err = { status: 404 }
    apiMfeServiceSpy.searchMicrofrontends.and.returnValue(throwError(() => err))

    component.searchApps()

    component.apps$.subscribe({
      next: (result) => {
        expect(result.length).toBe(0)
        expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_404.APPS')
        done()
      },
      error: done.fail
    })
  })

  it('should catch error on searchApps: mss', (done) => {
    component.appSearchCriteriaGroup.controls['appType'].setValue('MS')
    const err = { status: '404' }
    apiMsServiceSpy.searchMicroservice.and.returnValue(throwError(() => err))

    component.searchApps()

    component.apps$.subscribe({
      next: (result) => {
        expect(result.length).toBe(0)
        expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_404.APPS')
        done()
      },
      error: done.fail
    })
  })

  it('should combine mfe and ms streams into apps$', (done) => {
    component.appSearchCriteriaGroup.controls['appType'].setValue('ALL')
    apiMfeServiceSpy.searchMicrofrontends.and.returnValue(of({ stream: [mfe] } as MicrofrontendPageResult))
    apiMsServiceSpy.searchMicroservice.and.returnValue(of({ stream: [ms] } as MicroservicePageResult))

    component.searchApps()

    component.apps$.subscribe({
      next: (result) => {
        expect(result.length).toBe(2)
        result.forEach((result, i) => {
          if (i === 0) expect(result.appType).toEqual('MFE')
          if (i === 1) expect(result.appType).toEqual('MS')
        })
        done()
      },
      error: done.fail
    })
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

  it('should assign app to component property and change to edit mode onDetail', () => {
    const event = { stopPropagation: jasmine.createSpy() }
    component.onDetail(event as any, mfeApp)

    expect(event.stopPropagation).toHaveBeenCalled()
    expect(component.app).toBe(mfeApp)
    expect(component.changeMode).toBe('EDIT')
  })

  it('should change to view mode if no editPermission onDetail', () => {
    const event = { stopPropagation: jasmine.createSpy() }
    component.hasEditPermission = false

    component.onDetail(event as any, mfeApp)

    expect(component.changeMode).toBe('VIEW')
  })

  it('should should assign app to component property and change to copy mode onCopy', () => {
    const event = { stopPropagation: jasmine.createSpy() }

    component.onCopy(event as any, mfeApp)

    expect(event.stopPropagation).toHaveBeenCalled()
    expect(component.app).toBe(mfeApp)
    expect(component.changeMode).toBe('COPY')
  })

  it('should should assign app to component property and change to copy mode onCreate', () => {
    component.onCreate('MFE')

    expect(component.changeMode).toBe('CREATE')
    expect(component.displayDetailDialog).toBeTrue()
  })

  it('should should assign app to component property and change to copy mode onDelete', () => {
    const event = { stopPropagation: jasmine.createSpy() }

    component.onDelete(event as any, msApp)

    expect(event.stopPropagation).toHaveBeenCalled()
    expect(component.app).toBe(msApp)
  })

  it('should call searchApps if app changed', () => {
    spyOn(component, 'searchApps')

    component.appChanged(true)

    expect(component.searchApps).toHaveBeenCalled()
    expect(component.displayDetailDialog).toBeFalse()
  })

  it('should call searchApps if app deleted', () => {
    spyOn(component, 'searchApps')

    component.appDeleted(true)

    expect(component.searchApps).toHaveBeenCalled()
    expect(component.displayDetailDialog).toBeFalse()
  })
})
