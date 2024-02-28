import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, fakeAsync, waitForAsync } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { of, throwError } from 'rxjs'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import { ProductAppsComponent } from './product-apps.component'
import { ProductsAPIService, Product } from 'src/app/shared/generated'

import { AppAbstract } from '../../app-search/app-search.component'

const product: Product = {
  id: 'id',
  name: 'name',
  basePath: 'path'
}

const mockApp: AppAbstract = {
  id: 'id',
  appId: 'appId',
  appType: 'MFE',
  appName: 'appName',
  productName: 'prodName',
  remoteBaseUrl: ''
}

describe('ProductAppsComponent', () => {
  let component: ProductAppsComponent
  let fixture: ComponentFixture<ProductAppsComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const apiServiceSpy = {
    searchMicrofrontends: jasmine.createSpy('searchMicrofrontends').and.returnValue(of({})),
    searchMicroservice: jasmine.createSpy('searchMicroservice').and.returnValue(of({})),
    updateProduct: jasmine.createSpy('updateProduct').and.returnValue(of({}))
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProductAppsComponent],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        { provide: ProductsAPIService, useValue: apiServiceSpy },
        { provide: PortalMessageService, useValue: msgServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductAppsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    apiServiceSpy.searchMicrofrontends.calls.reset()
    apiServiceSpy.searchMicroservice.calls.reset()
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should call searchApps onChanges if product exists', () => {
    component.product = product
    spyOn(component, 'searchApps')

    component.ngOnChanges()

    expect(component.searchApps).toHaveBeenCalled()
  })

  it('should search microfrontends on searchApps', () => {
    const searchSpy = spyOn((component as any).mfeApi, 'searchMicrofrontends').and.returnValue(
      of({
        totalElements: 0,
        number: 0,
        size: 0,
        totalPages: 0,
        stream: []
      })
    )

    component.searchApps()

    expect(searchSpy).toHaveBeenCalledWith({
      mfeAndMsSearchCriteria: { productName: component.product?.name }
    })
  })

  xit('should display console error msg on searchApps', fakeAsync((done: DoneFn) => {
    const searchSpy = spyOn((component as any).mfeApi, 'searchMicrofrontends').and.returnValue(
      throwError(() => new Error())
    )
    // apiServiceSpy.searchMicrofrontends.and.callFake(() => {
    //   throw error
    // })
    spyOn(console, 'error')

    component.searchApps()

    component.mfes$.subscribe({
      next: (obj) => {
        console.log('NEXT', obj)
        done()
      },
      error: (err) => {
        console.log('ERROR', err)
        // expect(console.error).toHaveBeenCalled()
      }
    })

    expect(searchSpy).toHaveBeenCalledWith({
      mfeAndMsSearchCriteria: { productName: component.product?.name }
    })
    expect(console.error).toHaveBeenCalled()

    // tick()
  }))

  xit('should combine mfe and ms streams into apps$ with appType', (done: DoneFn) => {
    component.mfes$ = of({
      stream: [
        {
          id: 'mfe1',
          appId: 'appId1',
          appName: 'Microfrontend 1',
          productName: 'p1',
          remoteBaseUrl: 'url'
        }
      ]
    })
    component.mss$ = of({
      stream: [{ id: 'ms1', appId: 'appId3', appName: 'Microservice 1', productName: 'p1' }]
    })

    component.searchApps()

    component.apps$.subscribe({
      next: (result) => {
        expect(result.length).toBe(2)
        done()
      },
      error: done.fail
    })
  })

  it('should set correct value onLayoutChange', () => {
    const viewMode = 'EDIT'

    component.onLayoutChange(viewMode)

    expect(component.viewMode).toEqual('EDIT')
  })

  it('should set correct values onFilterChange', () => {
    const filter = 'filter'

    component.onFilterChange(filter)

    expect(component.filter).toEqual(filter)
  })

  it('should set correct value onSortChange', () => {
    const sortField = 'field'

    component.onSortChange(sortField)

    expect(component.sortField).toEqual(sortField)
  })

  it('should set correct value onSortDirChange', () => {
    let asc = true
    component.onSortDirChange(asc)
    expect(component.sortOrder).toEqual(-1)

    asc = false
    component.onSortDirChange(asc)
    expect(component.sortOrder).toEqual(1)
  })

  it('should behave correctly onDetail', () => {
    const mockEvent = { stopPropagation: jasmine.createSpy() }

    component.onDetail(mockEvent, mockApp)

    expect(component.app).toEqual(mockApp)
    expect(component.changeMode).toEqual('EDIT')
    expect(component.displayDetailDialog).toBeTrue()
  })

  it('should behave correctly onCopy', () => {
    const mockEvent = { stopPropagation: jasmine.createSpy() }

    component.onCopy(mockEvent, mockApp)

    expect(component.app).toEqual(mockApp)
    expect(component.changeMode).toEqual('COPY')
    expect(component.displayDetailDialog).toBeTrue()
  })

  it('should should behave correctly onCreate', () => {
    component.onCreate()

    expect(component.changeMode).toEqual('CREATE')
    expect(component.app).toBeUndefined()
    expect(component.displayDetailDialog).toBeTrue()
  })

  it('should behave correctly onDelete', () => {
    const mockEvent = { stopPropagation: jasmine.createSpy() }

    component.onDelete(mockEvent, mockApp)

    expect(component.app).toEqual(mockApp)
    expect(component.displayDeleteDialog).toBeTrue()
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
