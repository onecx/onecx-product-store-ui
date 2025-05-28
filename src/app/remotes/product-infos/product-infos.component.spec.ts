import { TestBed } from '@angular/core/testing'
import { CommonModule } from '@angular/common'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, ReplaySubject, throwError } from 'rxjs'

import { BASE_URL, RemoteComponentConfig } from '@onecx/angular-remote-components'

import { ProductAbstract, ProductsAPIService, ProductPageResult } from 'src/app/shared/generated'
import { OneCXProductInfosComponent } from './product-infos.component'

const app1 = {
  appName: 'App1',
  appId: 'app1',
  undeployed: false,
  deprecated: false
}
const app2 = {
  appName: 'App2',
  appId: 'app2',
  undeployed: true,
  deprecated: true
}
const product1: ProductAbstract = {
  id: 'p1',
  name: 'product1',
  displayName: 'Product 1',
  applications: [app1],
  undeployed: false
}
const product2: ProductAbstract = {
  id: 'p2',
  name: 'product2',
  displayName: 'Product 2',
  applications: [app2],
  undeployed: true
}
const products: ProductAbstract[] = [product1, product2]

describe('OneCXProductInfosComponent', () => {
  const productApiSpy = {
    searchProducts: jasmine.createSpy('searchProducts').and.returnValue(of({}))
  }

  function setUp() {
    const fixture = TestBed.createComponent(OneCXProductInfosComponent)
    const component = fixture.componentInstance
    fixture.detectChanges()
    return { fixture, component }
  }

  let baseUrlSubject: ReplaySubject<any>
  beforeEach(() => {
    baseUrlSubject = new ReplaySubject<any>(1)
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en'),
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: BASE_URL,
          useValue: baseUrlSubject
        }
      ]
    })
      .overrideComponent(OneCXProductInfosComponent, {
        set: {
          imports: [TranslateTestingModule, CommonModule],
          providers: [{ provide: ProductsAPIService, useValue: productApiSpy }]
        }
      })
      .compileComponents()

    baseUrlSubject.next('base_url_mock')
    productApiSpy.searchProducts.calls.reset()
  })

  describe('initialize', () => {
    it('should create', () => {
      const { component } = setUp()

      expect(component).toBeTruthy()
    })

    it('should call ocxInitRemoteComponent with the correct config', () => {
      const { component } = setUp()
      const mockConfig: RemoteComponentConfig = {
        appId: 'appId',
        productName: 'prodName',
        permissions: ['permission'],
        baseUrl: 'base'
      }
      spyOn(component, 'ocxInitRemoteComponent')

      component.ocxRemoteComponentConfig = mockConfig

      expect(component.ocxInitRemoteComponent).toHaveBeenCalledWith(mockConfig)
    })

    it('should init remote component', (done: DoneFn) => {
      const { component } = setUp()

      component.ocxInitRemoteComponent({ baseUrl: 'base_url' } as RemoteComponentConfig)

      baseUrlSubject.asObservable().subscribe((item) => {
        expect(item).toEqual('base_url')
        done()
      })
    })
  })

  describe('getting products', () => {
    it('should get products - successful without search criteria => get all data', (done) => {
      const { component } = setUp()
      const mockResponse: ProductPageResult = { stream: products }
      productApiSpy.searchProducts.and.returnValue(of(mockResponse))

      component.ngOnChanges()

      component.productsAndApplications$?.subscribe({
        next: (data) => {
          if (data) {
            expect(data).toEqual(products)
          }
          done()
        },
        error: done.fail
      })
    })

    it('should get products - successful with search criteria: a name => get data', (done) => {
      const { component } = setUp()
      const mockResponse: ProductPageResult = { stream: products }
      productApiSpy.searchProducts.and.returnValue(of(mockResponse))
      component.productName = 'product1'

      component.ngOnChanges()

      component.productsAndApplications$?.subscribe({
        next: (data) => {
          if (data) {
            expect(data).toEqual(products)
          }
          done()
        },
        error: done.fail
      })
    })

    it('should get products - successful without data', (done) => {
      const { component } = setUp()
      const mockResponse: ProductPageResult = { stream: [] }
      productApiSpy.searchProducts.and.returnValue(of(mockResponse))

      component.ngOnChanges()

      component.productsAndApplications$?.subscribe({
        next: (data) => {
          if (data) {
            expect(data).toEqual([])
          }
          done()
        },
        error: done.fail
      })
    })

    it('should get products - successful without stream', (done) => {
      const { component } = setUp()
      const mockResponse: ProductPageResult = { stream: undefined }
      productApiSpy.searchProducts.and.returnValue(of(mockResponse))

      component.ngOnChanges()

      component.productsAndApplications$?.subscribe({
        next: (data) => {
          if (data) {
            expect(data).toEqual([])
          }
          done()
        },
        error: done.fail
      })
    })

    it('should get products - failed', (done) => {
      const { component } = setUp()
      const errorResponse = { status: 400, statusText: 'Error on getting products' }
      productApiSpy.searchProducts.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.ngOnChanges()
      component.productsAndApplications$?.subscribe({
        next: (data) => {
          if (data) {
            expect(console.error).toHaveBeenCalledWith('onecx-product-infos.searchProducts', errorResponse)
          }
          done()
        },
        error: done.fail
      })
    })
  })

  describe('sorting', () => {
    it('should return negative value when first product name comes before second alphabetically', () => {
      const { component } = setUp()
      const productA = { id: 'a', name: 'name', displayName: 'Admin' }
      const productB = { id: 'b', name: 'name', displayName: 'User' }
      expect(component['sortByDisplayName'](productA, productB)).toBeLessThan(0)
    })

    it('should return positive value when first product name comes after second alphabetically', () => {
      const { component } = setUp()
      const productA = { id: 'a', name: 'name', displayName: 'User' }
      const productB = { id: 'b', name: 'name', displayName: 'Admin' }
      expect(component['sortByDisplayName'](productA, productB)).toBeGreaterThan(0)
    })

    it('should return zero when product names are the same', () => {
      const { component } = setUp()
      const productA = { id: 'a', name: 'name', displayName: 'Admin' }
      const productB = { id: 'b', name: 'name', displayName: 'Admin' }
      expect(component['sortByDisplayName'](productA, productB)).toBe(0)
    })

    it('should be case-insensitive', () => {
      const { component } = setUp()
      const productA = { id: 'a', name: 'name', displayName: 'admin' }
      const productB = { id: 'b', name: 'name', displayName: 'Admin' }
      expect(component['sortByDisplayName'](productA, productB)).toBe(0)
    })

    it('should handle undefined names', () => {
      const { component } = setUp()
      const productA = { id: 'a', name: 'name', displayName: undefined }
      const productB = { id: 'b', name: 'name', displayName: 'Admin' }
      expect(component['sortByDisplayName'](productA, productB)).toBeLessThan(0)
    })

    it('should handle empty string names', () => {
      const { component } = setUp()
      const productA = { id: 'a', name: 'name', displayName: '' }
      const productB = { id: 'b', name: 'name', displayName: 'Admin' }
      expect(component['sortByDisplayName'](productA, productB)).toBeLessThan(0)
    })

    it('should handle both names being undefined', () => {
      const { component } = setUp()
      const productA = { id: 'a', name: 'name', displayName: undefined }
      const productB = { id: 'b', name: 'name', displayName: undefined }
      expect(component['sortByDisplayName'](productA, productB)).toBe(0)
    })
  })
})
