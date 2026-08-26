import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { Router, ActivatedRoute } from '@angular/router'
import { BehaviorSubject, of, throwError } from 'rxjs'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { DataSortDirection, FilterType } from '@onecx/angular-accelerator'

import { UserService } from '@onecx/angular-integration-interface'

import {
  MicrofrontendAbstract,
  MicrofrontendsAPIService,
  MicrofrontendPageResult,
  Microservice,
  MicroservicePageResult,
  MicroservicesAPIService
} from 'src/app/shared/generated'
import { AppAbstract, AppType, AppSearchComponent, AppSearchCriteria } from './app-search.component'
import { PermissionService } from '@onecx/angular-utils'
import { provideNoopAnimations } from '@angular/platform-browser/animations'

const form = new FormGroup<AppSearchCriteria>({
  appName: new FormControl<string | null>(null, Validators.minLength(2)),
  appType: new FormControl<AppType | null>(null),
  productName: new FormControl<string | null>(null)
})

describe('AppSearchComponent', () => {
  let component: AppSearchComponent
  let fixture: ComponentFixture<AppSearchComponent>
  const routerSpy = jasmine.createSpyObj('Router', ['navigate'])
  const routeMock = { snapshot: { paramMap: new Map() } }

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
    lang$: new BehaviorSubject<string>('de'),
    hasPermission: jasmine.createSpy('hasPermission').and.callFake(async (permission) => {
      return ['APP#CREATE', 'APP#DELETE', 'APP#EDIT', 'APP#VIEW'].includes(permission)
    }),
    getPermission: jasmine.createSpy('getPermission').and.returnValue(Promise.resolve(true))
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        AppSearchComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: PermissionService, useValue: { hasPermission: () => of(true) } },
        { provide: MicrofrontendsAPIService, useValue: apiMfeServiceSpy },
        { provide: MicroservicesAPIService, useValue: apiMsServiceSpy },
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: routeMock }
      ]
    })
      .overrideComponent(AppSearchComponent, {
        add: {
          providers: [
            { provide: MicrofrontendsAPIService, useValue: apiMfeServiceSpy },
            { provide: MicroservicesAPIService, useValue: apiMsServiceSpy },
            { provide: UserService, useValue: mockUserService }
          ]
        }
      })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    fixture.componentInstance.ngOnInit() // solved ExpressionChangedAfterItHasBeenCheckedError
    component.hasEditPermission = true
  })

  afterEach(() => {
    apiMfeServiceSpy.searchMicrofrontends.calls.reset()
    apiMsServiceSpy.searchMicroservice.calls.reset()
    translateServiceSpy.get.calls.reset()
  })

  describe('initialize', () => {
    it('should create', () => {
      expect(component).toBeTruthy()
    })
  })

  describe('page actions', () => {
    it('should navigate to Products when button clicked and actionCallback executed', () => {
      component.ngOnInit()

      if (component.actions$) {
        component.actions$.subscribe((actions) => {
          const action = actions[0]
          action.actionCallback?.()
          expect(routerSpy.navigate).toHaveBeenCalledWith(['..'], { relativeTo: routeMock })
        })
      }
    })

    it('should navigate to Endpoints when button clicked and actionCallback executed', () => {
      component.ngOnInit()

      if (component.actions$) {
        component.actions$.subscribe((actions) => {
          const action = actions[1]
          action.actionCallback?.()
          expect(routerSpy.navigate).toHaveBeenCalledWith(['../endpoints'], { relativeTo: routeMock })
        })
      }
    })

    it('should navigate to Slots when button clicked and actionCallback executed', () => {
      component.ngOnInit()

      if (component.actions$) {
        component.actions$.subscribe((actions) => {
          const action = actions[2]
          action.actionCallback?.()
          expect(routerSpy.navigate).toHaveBeenCalledWith(['../slots'], { relativeTo: routeMock })
        })
      }
    })

    it('should call onAppCreate when actionCallback is executed', () => {
      spyOn(component, 'onAppCreate')

      component.ngOnInit()

      if (component.actions$) {
        component.actions$.subscribe((actions) => {
          const action = actions[3]
          action.actionCallback?.()
          expect(component.onAppCreate).toHaveBeenCalledWith('MFE')
        })
      }
    })

    it('should call onAppCreate when actionCallback is executed', () => {
      spyOn(component, 'onAppCreate')

      component.ngOnInit()

      if (component.actions$) {
        component.actions$.subscribe((actions) => {
          const action = actions[4]
          action.actionCallback?.()
          expect(component.onAppCreate).toHaveBeenCalledWith('MS')
        })
      }
    })
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
        expect(apps).toHaveSize(1)
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
        expect(apps).toHaveSize(0)
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
        expect(apps).toHaveSize(1)
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
        expect(apps).toHaveSize(0)
        done()
      },
      error: done.fail
    })
  })

  it('should catch error on searchApps: mfes', (done) => {
    component.appSearchCriteriaGroup.controls['appType'].setValue('MFE')
    const errorResponse = { status: 401, statusText: 'Not authorized' }
    apiMfeServiceSpy.searchMicrofrontends.and.returnValue(throwError(() => errorResponse))
    spyOn(console, 'error')

    component.searchApps()

    component.apps$.subscribe({
      next: (result) => {
        expect(result).toHaveSize(0)
        expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.APPS')
        expect(console.error).toHaveBeenCalledWith('searchMicrofrontends', errorResponse)
        done()
      },
      error: done.fail
    })
  })

  it('should catch error on searchApps: mss', (done) => {
    component.appSearchCriteriaGroup.controls['appType'].setValue('MS')
    const errorResponse = { status: 401, statusText: 'Not authorized' }
    apiMsServiceSpy.searchMicroservice.and.returnValue(throwError(() => errorResponse))
    spyOn(console, 'error')

    component.searchApps()

    component.apps$.subscribe({
      next: (result) => {
        expect(result).toHaveSize(0)
        expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.APPS')
        expect(console.error).toHaveBeenCalledWith('searchMicroservice', errorResponse)
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
        expect(result).toHaveSize(2)
        result.forEach((result, i) => {
          if (i === 0) expect(result.appType).toEqual('MFE')
          if (i === 1) expect(result.appType).toEqual('MS')
        })
        done()
      },
      error: done.fail
    })
  })

  /*
   * UI ACTIONS
   */
  it('should update viewMode onLayoutChange', () => {
    component.onLayoutChange('list')

    expect(component.viewMode).toBe('list')
  })

  it('should update filter and call dv.filter onGlobalFilter', () => {
    const filter = 'testFilter'

    component.onGlobalFilter(filter)

    expect(component.globalFilterValue).toBe(filter)
  })

  it('should filter the app list onGlobalFilter', () => {
    const filter = 'prodName'
    component.appSearchCriteriaGroup.controls['appType'].setValue('ALL')
    apiMfeServiceSpy.searchMicrofrontends.and.returnValue(of({ stream: [mfe] } as MicrofrontendPageResult))
    apiMsServiceSpy.searchMicroservice.and.returnValue(of({ stream: [ms] } as MicroservicePageResult))

    component.searchApps()
    component.onGlobalFilter(filter)

    component.filteredData$.subscribe((result) => {
      expect(result).toHaveSize(2)
      result.forEach((app) => {
        expect(app.productName).toBe('prodName')
      })
    })
  })

  it('should clear the app list filter onGlobalFilter', () => {
    const filter = 'non-existent'
    component.appSearchCriteriaGroup.controls['appType'].setValue('ALL')
    apiMfeServiceSpy.searchMicrofrontends.and.returnValue(of({ stream: [mfe] } as MicrofrontendPageResult))
    apiMsServiceSpy.searchMicroservice.and.returnValue(of({ stream: [ms] } as MicroservicePageResult))

    component.searchApps()
    component.onGlobalFilter(filter)

    component.filteredData$.subscribe((result) => {
      expect(result).toHaveSize(0)
    })
  })

  it('should filter the app list by classification onGlobalFilter', () => {
    const filter = 'test'
    const mfeWithClassification = { ...mfe, classifications: ['test'] }
    component.appSearchCriteriaGroup.controls['appType'].setValue('MFE')
    apiMfeServiceSpy.searchMicrofrontends.and.returnValue(
      of({ stream: [mfeWithClassification] } as unknown as MicrofrontendPageResult)
    )

    component.searchApps()
    component.onGlobalFilter(filter)

    component.filteredData$.subscribe((result) => {
      expect(result).toHaveSize(1)
    })
  })

  describe('onAppTypeFilterChange', () => {
    it('should set appTypeFilterValue when ev.value is provided', () => {
      const event = { value: 'testValue' }
      component.onAppTypeFilterChange(event)
      expect(component.appTypeFilterValue).toBe('testValue')
    })

    it('should not change appTypeFilterValue when ev.value is not provided', () => {
      component.appTypeFilterValue = 'initialValue'
      const event = { value: null }
      component.onAppTypeFilterChange(event)
      expect(component.appTypeFilterValue).toBe('initialValue')
    })
  })

  describe('onQuickFilterChange', () => {
    it('should update filterBy and filterValue onQuickFilterChange: ALL', () => {
      component.interactiveFilters = [{ columnId: 'someColumn', value: 'someValue' }]

      component.onQuickFilterChange('ALL')

      expect(component.filterBy).toBe(component.filterValueDefault)
      expect(component.filterValue).toBe('')
      expect(component.interactiveFilters).toEqual([{ columnId: 'someColumn', value: 'someValue' }])
    })

    it('should update filterBy and filterValue onQuickFilterChange: other', () => {
      component.onQuickFilterChange('other')

      expect(component.filterValue).toBe('other')
      expect(component.filterBy).toBe('appType')
    })

    it('should update interactiveFilters onQuickFilterChange preserving other filters', () => {
      component.interactiveFilters = [{ columnId: 'someColumn', value: 'someValue' }]

      component.onQuickFilterChange('other')

      expect(component.interactiveFilters).toEqual([
        { columnId: 'someColumn', value: 'someValue' },
        { columnId: 'appType', value: 'other', filterType: FilterType.EQUALS }
      ])
    })

    it('should set to quickFulterVaule to the original one if there is no current value', () => {
      component.quickFilterValueOld = 'old'

      component.onQuickFilterChange('')

      expect(component.quickFilterValue).toBe('old')
    })
  })

  it('should update sortField onSortChange', () => {
    component.onSortChange('field')

    expect(component.sortField).toBe('field')
  })

  describe('onSortDirChange', () => {
    it('should update sortOrder based on asc boolean onSortDirChange', () => {
      component.onSortDirChange(true)
      expect(component.sortOrder).toBe(-1)

      component.onSortDirChange(false)
      expect(component.sortOrder).toBe(1)
    })

    it('should reset appSearchCriteriaGroup onSearchReset is called', () => {
      component.appSearchCriteriaGroup = form
      spyOn(form, 'reset').and.callThrough()

      component.onSearchReset()

      expect(component.appSearchCriteriaGroup.reset).toHaveBeenCalled()
    })
  })

  describe('onInteractiveFiltersChange', () => {
    it('should update interactive filters and table filter', () => {
      const filters = [{ columnId: 'global', value: 'test' }]

      component.onInteractiveFiltersChange(filters)

      expect(component.interactiveFilters).toEqual(filters)
      expect(component.tableFilter).toBe('test')
    })

    it('should set empty table filter when there is no global filter', () => {
      component.onInteractiveFiltersChange([{ columnId: 'someColumn', value: 'someValue' }])

      expect(component.tableFilter).toBe('')
    })
  })

  describe('onInteractiveSorted', () => {
    it('should update sort values', () => {
      component.onInteractiveSorted({ sortColumn: 'appName', sortDirection: DataSortDirection.DESCENDING })

      expect(component.sortField).toBe('appName')
      expect(component.sortDirection).toBe(DataSortDirection.DESCENDING)
      expect(component.sortOrder).toBe(-1)

      component.onInteractiveSorted({ sortColumn: 'appName', sortDirection: DataSortDirection.ASCENDING })

      expect(component.sortOrder).toBe(1)
    })
  })

  it('should stop event propagation and navigate to the product onGotoProduct', () => {
    const event = { stopPropagation: jasmine.createSpy() }

    component.onGotoProduct(event as any, 'product')

    expect(event.stopPropagation).toHaveBeenCalled()
    expect(routerSpy.navigate).toHaveBeenCalledWith(['../', 'product'], { relativeTo: routeMock })
  })

  it('should assign app to component property and change to edit mode onAppDetail', () => {
    const event = { stopPropagation: jasmine.createSpy() }
    component.onAppDetail(event as any, mfeApp)

    expect(event.stopPropagation).toHaveBeenCalled()
    expect(component.app).toBe(mfeApp)
    expect(component.changeMode).toBe('EDIT')
  })

  it('should change to view mode if no editPermission onAppDetail', () => {
    const event = { stopPropagation: jasmine.createSpy() }
    component.hasEditPermission = false

    component.onAppDetail(event as any, mfeApp)

    expect(component.changeMode).toBe('VIEW')
  })

  it('should should assign app to component property and change to copy mode onAppCopy', () => {
    const event = { stopPropagation: jasmine.createSpy() }

    component.onAppCopy(event as any, mfeApp)

    expect(event.stopPropagation).toHaveBeenCalled()
    expect(component.app).toBe(mfeApp)
    expect(component.changeMode).toBe('CREATE')
  })

  it('should should assign app to component property and change to copy mode onAppCreate', () => {
    component.onAppCreate('MFE')

    expect(component.changeMode).toBe('CREATE')
    expect(component.displayDetailDialog).toBeTrue()
  })

  it('should should assign app to component property and change to copy mode onAppDelete', () => {
    const event = { stopPropagation: jasmine.createSpy() }

    component.onAppDelete(event as any, msApp)

    expect(event.stopPropagation).toHaveBeenCalled()
    expect(component.app).toBe(msApp)
  })

  /**
   * MODAL Dialog feedback
   */
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

  /**
   * Language tests
   */
  describe('language', () => {
    it('should set a German date format', () => {
      expect(component.dateFormat).toEqual('dd.MM.yyyy HH:mm:ss')
    })

    it('should set default date format', () => {
      mockUserService.lang$.next('en')
      fixture = TestBed.createComponent(AppSearchComponent)
      component = fixture.componentInstance
      fixture.detectChanges()
      expect(component.dateFormat).toEqual('M/d/yy, hh:mm:ss a')
    })
  })
})
