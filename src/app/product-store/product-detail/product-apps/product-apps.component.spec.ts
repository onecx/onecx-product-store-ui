import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { of } from 'rxjs'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import { ProductAppsComponent } from './product-apps.component'
import { ProductsAPIService, Product, MicrofrontendAbstract } from 'src/app/shared/generated'

const product: Product = {
  id: 'id',
  name: 'name',
  basePath: 'path'
}

const mockApp: MicrofrontendAbstract = {
  appId: 'appId',
  appName: 'appName',
  id: 'id',
  productName: 'prodName',
  remoteBaseUrl: 'url'
}

describe('ProductAppsComponent', () => {
  let component: ProductAppsComponent
  let fixture: ComponentFixture<ProductAppsComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const apiServiceSpy = {
    searchMicrofrontends: jasmine.createSpy('searchMicrofrontends').and.returnValue(of({})),
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
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should call loadApps onChanges if product exists', () => {
    component.product = product
    spyOn(component, 'loadApps')

    component.ngOnChanges()

    expect(component.loadApps).toHaveBeenCalled()
  })

  it('should search microfrontends on loadApps', () => {
    const searchSpy = spyOn((component as any).appApi, 'searchMicrofrontends').and.returnValue(
      of({
        totalElements: 0,
        number: 0,
        size: 0,
        totalPages: 0,
        stream: []
      })
    )

    component.loadApps()

    expect(searchSpy).toHaveBeenCalledWith({
      microfrontendSearchCriteria: { productName: component.product?.name, pageSize: 1000 }
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
})
