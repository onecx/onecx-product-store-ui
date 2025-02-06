import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient, HttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { FormControl, FormGroup } from '@angular/forms'
import { Router, ActivatedRoute } from '@angular/router'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { of, throwError } from 'rxjs'

import { AppStateService } from '@onecx/angular-integration-interface'
import { Column, createTranslateLoader, PortalMessageService } from '@onecx/portal-integration-angular'

import {
  MicrofrontendAbstract,
  MicrofrontendsAPIService,
  MicrofrontendType,
  ProductAbstract,
  ProductsAPIService
} from 'src/app/shared/generated'
import { TranslateServiceMock } from 'src/app/shared/mocks/TranslateServiceMock'
import { EndpointSearchComponent, MfeEndpoint, MicrofrontendSearchCriteria } from './endpoint-search.component'

const searchCriteriaForm = new FormGroup<MicrofrontendSearchCriteria>({
  productName: new FormControl<string | null>(null)
})

const productResponseData: ProductAbstract[] = [
  {
    id: 'id1',
    name: 'product1',
    displayName: 'Product 1'
  },
  {
    id: 'id2',
    name: 'product2',
    displayName: 'Product 2'
  }
]
const mfeResponseData: MicrofrontendAbstract[] = [
  {
    id: 'id1',
    productName: 'product1',
    appName: 'MFE 1',
    appId: 'mfe1',
    exposedModule: './expMod_p1_mfe1',
    remoteBaseUrl: '/mfe1/remoteEntry.js',
    type: MicrofrontendType.Module,
    endpoints: [
      { name: 'endpoint_1_1_1', path: '/{name}' },
      { name: 'endpoint_1_1_2', path: '/{name}' }
    ]
  },
  {
    id: 'id2',
    productName: 'product2',
    appName: 'MFE 1',
    appId: 'mfe1',
    exposedModule: './expMod_p2_mfe1',
    remoteBaseUrl: '/mfe1/remoteEntry.js',
    type: MicrofrontendType.Module,
    endpoints: [{ name: 'endpoint_2_1_1', path: '/{name}' }]
  },
  {
    id: 'id3',
    productName: 'product3',
    appName: 'MFE 1',
    appId: 'mfe1',
    exposedModule: './expMod_p3_mfe1',
    remoteBaseUrl: '/mfe1/remoteEntry.js',
    type: MicrofrontendType.Module,
    endpoints: [{ name: 'endpoint_3_1_1', path: '/{name}' }]
  },
  {
    id: 'id4',
    productName: 'product4',
    appName: 'MFE 1',
    appId: 'mfe1',
    exposedModule: './expMod_p4_mfe1',
    remoteBaseUrl: '/mfe1/remoteEntry.js',
    type: MicrofrontendType.Module
  }
]
// MFEs with/without endpoints
const mfeEndpoints: MfeEndpoint[] = [
  {
    id: 'id1',
    unique_id: 'id1_0',
    productName: 'product1',
    productDisplayName: 'Product 1',
    appName: 'MFE 1',
    appId: 'mfe1',
    exposedModule: './expMod_p1_mfe1',
    remoteBaseUrl: '/mfe1/remoteEntry.js',
    type: MicrofrontendType.Module,
    endpoint_name: 'endpoint_1_1_1',
    endpoint_path: '/{name}'
  },
  {
    id: 'id1',
    unique_id: 'id1_1',
    productName: 'product1',
    productDisplayName: 'Product 1',
    appName: 'MFE 1',
    appId: 'mfe1',
    exposedModule: './expMod_p1_mfe1',
    remoteBaseUrl: '/mfe1/remoteEntry.js',
    type: MicrofrontendType.Module,
    endpoint_name: 'endpoint_1_1_2',
    endpoint_path: '/{name}'
  },
  {
    id: 'id2',
    unique_id: 'id2_0',
    productName: 'product2',
    productDisplayName: 'Product 2',
    appName: 'MFE 1',
    appId: 'mfe1',
    exposedModule: './expMod_p2_mfe1',
    remoteBaseUrl: '/mfe1/remoteEntry.js',
    type: MicrofrontendType.Module,
    endpoint_name: 'endpoint_2_1_1',
    endpoint_path: '/{name}'
  },
  {
    id: 'id3',
    unique_id: 'id3_0',
    productName: 'product3',
    productDisplayName: '',
    appName: 'MFE 1',
    appId: 'mfe1',
    exposedModule: './expMod_p3_mfe1',
    remoteBaseUrl: '/mfe1/remoteEntry.js',
    type: MicrofrontendType.Module,
    endpoint_name: 'endpoint_3_1_1',
    endpoint_path: '/{name}'
  }
]

describe('EndpointSearchComponent', () => {
  let component: EndpointSearchComponent
  let fixture: ComponentFixture<EndpointSearchComponent>
  const routerSpy = jasmine.createSpyObj('Router', ['navigate'])
  const routeMock = { snapshot: { paramMap: new Map() } }

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const productApiServiceSpy = { searchProducts: jasmine.createSpy('searchProducts').and.returnValue(of([])) }
  const mfeApiServiceSpy = { searchMicrofrontends: jasmine.createSpy('searchMicrofrontends').and.returnValue(of([])) }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [EndpointSearchComponent],
      imports: [
        TranslateModule.forRoot({
          isolate: true,
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
            deps: [HttpClient, AppStateService]
          }
        })
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TranslateService, useClass: TranslateServiceMock },
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: ProductsAPIService, useValue: productApiServiceSpy },
        { provide: MicrofrontendsAPIService, useValue: mfeApiServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: routeMock }
      ]
    }).compileComponents()
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
    // reset data services
    productApiServiceSpy.searchProducts.calls.reset()
    mfeApiServiceSpy.searchMicrofrontends.calls.reset()
    // to spy data: refill with neutral data
    productApiServiceSpy.searchProducts.and.returnValue(of([]))
    mfeApiServiceSpy.searchMicrofrontends.and.returnValue(of([]))
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(EndpointSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  describe('construction', () => {
    it('should create', () => {
      expect(component).toBeTruthy()
    })

    it('should call OnInit and populate filteredColumns/actions correctly', () => {
      component.ngOnInit()
      expect(component.filteredColumns[0]).toEqual(component.columns[0])
    })
  })

  describe('search', () => {
    it('should search enpoints without search criteria', (done) => {
      productApiServiceSpy.searchProducts.and.returnValue(of({ stream: productResponseData }))
      mfeApiServiceSpy.searchMicrofrontends.and.returnValue(of({ stream: mfeResponseData }))

      component.prepareSearching()
      component.onSearch()

      component.endpoints$?.subscribe({
        next: (data) => {
          expect(data).toEqual(mfeEndpoints)
          done()
        },
        error: done.fail
      })
    })

    it('should display an info message if there is no result', (done) => {
      productApiServiceSpy.searchProducts.and.returnValue(of({ stream: productResponseData }))
      mfeApiServiceSpy.searchMicrofrontends.and.returnValue(of({ totalElements: 0, stream: [] }))

      component.ngOnInit()

      component.endpoints$?.subscribe({
        next: (data) => {
          expect(data.length).toEqual(0)
          expect(msgServiceSpy.info).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.SEARCH.MESSAGE.NO_RESULTS' })
          done()
        },
        error: done.fail
      })
    })

    it('should display an error message if the search for Microfrontends fails', (done) => {
      const errorResponse = { status: '403', statusText: 'Not authorized' }
      mfeApiServiceSpy.searchMicrofrontends.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.ngOnInit()

      component.endpoints$?.subscribe({
        next: (data) => {
          expect(data).toEqual([])
          done()
        },
        error: () => {
          expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.SEARCH.MESSAGE.SEARCH_FAILED' })
          expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.MFES')
          expect(console.error).toHaveBeenCalledWith('searchParametersByCriteria', errorResponse)
          done.fail
        }
      })
    })

    it('should display an error message if the search for products fails', (done) => {
      const errorResponse = { status: '403', statusText: 'Not authorized' }
      productApiServiceSpy.searchProducts.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.ngOnInit()

      component.products$?.subscribe({
        next: (data) => {
          expect(data).toEqual([])
          done()
        },
        error: () => {
          expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.PRODUCTS')
          expect(console.error).toHaveBeenCalledWith('searchParametersByCriteria', errorResponse)
          done.fail
        }
      })
    })
  })

  describe('page actions', () => {
    it('should navigate to Products when button clicked and actionCallback executed', () => {
      component.ngOnInit()

      if (component.actions$) {
        component.actions$.subscribe((actions) => {
          const action = actions[0]
          action.actionCallback()
          expect(routerSpy.navigate).toHaveBeenCalledWith(['..'], { relativeTo: routeMock })
        })
      }
    })

    it('should navigate to Apps when button clicked and actionCallback executed', () => {
      component.ngOnInit()

      if (component.actions$) {
        component.actions$.subscribe((actions) => {
          const action = actions[1]
          action.actionCallback()
          expect(routerSpy.navigate).toHaveBeenCalledWith(['../apps'], { relativeTo: routeMock })
        })
      }
    })

    it('should navigate to Slots when button clicked and actionCallback executed', () => {
      component.ngOnInit()

      if (component.actions$) {
        component.actions$.subscribe((actions) => {
          const action = actions[2]
          action.actionCallback()
          expect(routerSpy.navigate).toHaveBeenCalledWith(['../slots'], { relativeTo: routeMock })
        })
      }
    })
  })

  /*
   * UI ACTIONS
   */
  describe('filter columns', () => {
    it('should update the columns that are seen in data', () => {
      const columns: Column[] = [{ field: 'productName', header: 'PRODUCT_NAME' }]
      const expectedColumn = { field: 'productName', header: 'PRODUCT_NAME' }
      component.columns = columns

      component.onColumnsChange(['productName'])

      expect(component.filteredColumns).not.toContain(columns[1])
      expect(component.filteredColumns).toEqual([jasmine.objectContaining(expectedColumn)])
    })

    it('should apply a filter to the result table', () => {
      component.dataTable = jasmine.createSpyObj('dataTable', ['filterGlobal'])

      component.onFilterChange('test')

      expect(component.dataTable?.filterGlobal).toHaveBeenCalledWith('test', 'contains')
    })
  })

  describe('search criteria reset', () => {
    it('should reset the form group', () => {
      component.mfeSearchCriteriaGroup = searchCriteriaForm
      spyOn(searchCriteriaForm, 'reset').and.callThrough()

      component.onCriteriaReset()

      expect(component.mfeSearchCriteriaGroup.reset).toHaveBeenCalled()
    })
  })

  describe('app detail', () => {
    it('should trigger the opening the dialog', () => {
      component.onAppDetail(new Event('click'), mfeEndpoints[0])

      expect(component.mfeItem4Detail?.id).toBe(mfeEndpoints[0].id)
      expect(component.displayAppDetailDialog).toBeTrue()
    })

    it('should react on closing the dialog - false', () => {
      component.onMfeChanged(false)

      expect(component.mfeItem4Detail).toBeUndefined()
      expect(component.displayAppDetailDialog).toBeFalse()
    })

    it('should react on closing the dialog - true', () => {
      component.onMfeChanged(true)

      expect(component.mfeItem4Detail).toBeUndefined()
      expect(component.displayAppDetailDialog).toBeFalse()
    })
  })

  describe('sort endpoints', () => {
    it('should correctly sort items by product', () => {
      const items: MfeEndpoint[] = mfeEndpoints
      const sortedItems = items.sort(component.sortMfes)

      expect(sortedItems[0]).toEqual(mfeEndpoints[0])
    })

    it("should treat falsy values for SelectItem.label as ''", () => {
      const items: MfeEndpoint[] = mfeEndpoints
      items.push({ ...mfeEndpoints[1], exposedModule: undefined })
      const sortedItems = items.sort(component.sortMfes)

      expect(sortedItems[1]).toEqual(mfeEndpoints[1])
    })

    it("should treat falsy values for SelectItem.label as ''", () => {
      const items: MfeEndpoint[] = mfeEndpoints
      items.push({ ...mfeEndpoints[1], exposedModule: undefined })
      items.push({ ...mfeEndpoints[2], exposedModule: undefined })
      const sortedItems = items.sort(component.sortMfes)

      expect(sortedItems[1]).toEqual(mfeEndpoints[1])
    })
  })
})
