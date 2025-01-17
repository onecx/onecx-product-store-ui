import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient, HttpClient } from '@angular/common/http'
import { FormControl, FormGroup } from '@angular/forms'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { of, throwError } from 'rxjs'

import { AppStateService, UserService } from '@onecx/angular-integration-interface'
import { Column, createTranslateLoader, PortalMessageService } from '@onecx/portal-integration-angular'

import { MicrofrontendsAPIService, MicrofrontendType } from 'src/app/shared/generated'
import { TranslateServiceMock } from 'src/app/shared/TranslateServiceMock'
import { EndpointSearchComponent, MfeEndpoint, MicrofrontendSearchCriteria } from './endpoint-search.component'

const searchCriteriaForm = new FormGroup<MicrofrontendSearchCriteria>({
  productName: new FormControl<string | null>(null)
})

const itemData: MfeEndpoint[] = [
  {
    id: 'id1',
    unique_id: 'id1_1',
    productName: 'product1',
    appName: 'MFE 1',
    appId: 'mfe1',
    remoteBaseUrl: '/mfe1/remoteEntry.js',
    type: MicrofrontendType.Module,
    endpoint: { name: 'endpoint1', path: '/{name}' }
  },
  {
    id: 'id1',
    unique_id: 'id1_2',
    productName: 'product1',
    appName: 'MFE 1',
    appId: 'mfe1',
    remoteBaseUrl: '/mfe1/remoteEntry.js',
    type: MicrofrontendType.Module,
    endpoint: { name: 'endpoint2', path: '/{name}' }
  },
  {
    id: 'id2',
    unique_id: 'id2_1',
    productName: 'product2',
    appName: 'MFE 2',
    appId: 'mfe2',
    remoteBaseUrl: '/mfe2/remoteEntry.js',
    type: MicrofrontendType.Module,
    endpoint: { name: 'endpoint1', path: '/{name}' }
  }
]

describe('ParameterSearchComponent', () => {
  let component: EndpointSearchComponent
  let fixture: ComponentFixture<EndpointSearchComponent>

  const mockUserService = { lang$: { getValue: jasmine.createSpy('getValue') } }
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const mfeApiServiceSpy = { searchMicrofrontends: jasmine.createSpy('searchMicrofrontends').and.returnValue(of({})) }

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
        { provide: UserService, useValue: mockUserService },
        { provide: TranslateService, useClass: TranslateServiceMock },
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: MicrofrontendsAPIService, useValue: mfeApiServiceSpy }
      ]
    }).compileComponents()
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
    mockUserService.lang$.getValue.and.returnValue('de')
    // reset data services
    mfeApiServiceSpy.searchMicrofrontends.calls.reset()
    // to spy data: refill with neutral data
    mfeApiServiceSpy.searchMicrofrontends.and.returnValue(of({}))
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
      mfeApiServiceSpy.searchMicrofrontends.and.returnValue(of({ stream: itemData }))

      component.onSearch()

      component.endpoints$?.subscribe({
        next: (data) => {
          expect(data).toEqual(itemData)
          done()
        },
        error: done.fail
      })
    })

    it('should display an info message if there is no result', (done) => {
      mfeApiServiceSpy.searchMicrofrontends.and.returnValue(of({ totalElements: 0, stream: [] }))

      component.onSearch()

      component.endpoints$?.subscribe({
        next: (data) => {
          expect(data.length).toEqual(0)
          expect(msgServiceSpy.info).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.SEARCH.MESSAGE.NO_RESULTS' })
          done()
        },
        error: done.fail
      })
    })

    it('should display an error message if the search fails', (done) => {
      const errorResponse = { status: '403', statusText: 'Not authorized' }
      mfeApiServiceSpy.searchMicrofrontends.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.onSearch()

      component.endpoints$?.subscribe({
        next: (data) => {
          expect(data).toEqual([])
          done()
        },
        error: () => {
          expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.SEARCH.MESSAGE.SEARCH_FAILED' })
          expect(console.error).toHaveBeenCalledWith('searchParametersByCriteria', errorResponse)
          done.fail
        }
      })
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

  describe('onCriteriaReset', () => {
    it('should reset criteria, reset the form group, and disable the applicationId control', () => {
      component.mfeSearchCriteriaGroup = searchCriteriaForm
      spyOn(searchCriteriaForm, 'reset').and.callThrough()

      component.onCriteriaReset()

      expect(component.mfeSearchCriteriaGroup.reset).toHaveBeenCalled()
    })
  })

  /**
   * Language tests
   */
  describe('Language tests', () => {
    it('should set a German date format', () => {
      expect(component.dateFormat).toEqual('dd.MM.yyyy HH:mm:ss')
    })

    it('should set default date format', () => {
      mockUserService.lang$.getValue.and.returnValue('en')
      fixture = TestBed.createComponent(EndpointSearchComponent)
      component = fixture.componentInstance
      fixture.detectChanges()
      expect(component.dateFormat).toEqual('M/d/yy, hh:mm:ss a')
    })
  })
})
