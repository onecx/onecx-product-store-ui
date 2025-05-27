import { TestBed } from '@angular/core/testing'
import { CommonModule } from '@angular/common'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, ReplaySubject, throwError } from 'rxjs'

import { BASE_URL, RemoteComponentConfig } from '@onecx/angular-remote-components'

import { ProductPageResult, Product, ProductAbstract, ProductsAPIService } from 'src/app/shared/generated'
import { OneCXProductDataComponent } from './product-data.component'

const product1: ProductAbstract = {
  id: 'p1',
  name: 'product1',
  displayName: 'Product 1',
  imageUrl: 'base_url/bff/images/product1/logo'
}
const product2: ProductAbstract = {
  id: 'p2',
  name: 'product2',
  displayName: 'Product 2'
}
const products: ProductAbstract[] = [product1, product2]

describe('OneCXProductDataComponent', () => {
  const productAPISpy = {
    searchProducts: jasmine.createSpy('searchProducts').and.returnValue(of({})),
    getProductByName: jasmine.createSpy('getProductByName').and.returnValue(of({}))
  }

  function setUp() {
    const fixture = TestBed.createComponent(OneCXProductDataComponent)
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
      .overrideComponent(OneCXProductDataComponent, {
        set: {
          imports: [TranslateTestingModule, CommonModule],
          providers: [{ provide: ProductsAPIService, useValue: productAPISpy }]
        }
      })
      .compileComponents()

    baseUrlSubject.next('base_url_mock')
    productAPISpy.searchProducts.calls.reset()
    productAPISpy.getProductByName.calls.reset()
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
    it('should get products - successful with data', (done) => {
      const { component } = setUp()
      const mockResponse: ProductPageResult = { stream: products }
      productAPISpy.searchProducts.and.returnValue(of(mockResponse))
      component.dataType = 'products'

      component.ngOnChanges()

      component.products$?.subscribe({
        next: (data) => {
          if (data) {
            expect(data[0]).toEqual(products[0])
          }
          done()
        },
        error: done.fail
      })
    })

    it('should get products - successful without data', (done) => {
      const { component } = setUp()
      const mockResponse: ProductPageResult = { stream: [] }
      productAPISpy.searchProducts.and.returnValue(of(mockResponse))
      component.dataType = 'products'

      component.ngOnChanges()

      component.products$?.subscribe({
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
      productAPISpy.searchProducts.and.returnValue(of(mockResponse))
      component.dataType = 'products'

      component.ngOnChanges()

      component.products$?.subscribe({
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
      productAPISpy.searchProducts.and.returnValue(throwError(() => errorResponse))
      component.dataType = 'products'
      spyOn(console, 'error')

      component.ngOnChanges()
      component.products$?.subscribe({
        next: (data) => {
          if (data) {
            expect(console.error).toHaveBeenCalledWith('onecx-product-data.searchProducts', errorResponse)
          }
          done()
        },
        error: done.fail
      })
    })
  })

  describe('getting a product', () => {
    it('should get product - failed: missing name', () => {
      const { component } = setUp()
      component.dataType = 'product'

      component.ngOnChanges()
    })

    it('should get product - successful with data', (done) => {
      const { component } = setUp()
      const mockResponse: ProductPageResult = { stream: [product1] }
      productAPISpy.searchProducts.and.returnValue(of(mockResponse))
      component.dataType = 'product'
      component.productName = product1.name

      component.ngOnChanges()

      component.product$?.subscribe({
        next: (data) => {
          expect(data).toEqual(product1 as Product)
          done()
        },
        error: done.fail
      })
    })

    it('should get product - successful with data and extra image URL', (done) => {
      const { component } = setUp()
      const mockResponse: ProductPageResult = { stream: [product2] }
      productAPISpy.searchProducts.and.returnValue(of(mockResponse))
      component.dataType = 'product'
      component.productName = product1.name

      component.ngOnChanges()

      component.product$?.subscribe({
        next: (data) => {
          expect(data).toEqual({ ...product2, imageUrl: 'base_url/bff/images/product2/logo' } as Product)
          done()
        },
        error: done.fail
      })
    })

    it('should get product - failed', (done) => {
      const { component } = setUp()
      const errorResponse = { status: 400, statusText: 'Error on getting products' }
      productAPISpy.searchProducts.and.returnValue(throwError(() => errorResponse))
      component.dataType = 'product'
      component.productName = product1.name
      spyOn(console, 'error')

      component.ngOnChanges()

      component.product$?.subscribe({
        next: (data) => {
          expect(console.error).toHaveBeenCalledWith('onecx-product-data.searchProducts', errorResponse)
          done()
        },
        error: done.fail
      })
    })
  })

  describe('provide logo', () => {
    it('should load - initially', (done) => {
      const { component } = setUp()
      component.logEnabled = true // log with prefix
      component.logPrefix = 'get image url'
      component.productName = product1.name
      component.dataType = 'logo'

      component.ngOnChanges()
      component.onImageLoad()

      component.imageUrl$?.subscribe({
        next: (data) => {
          if (data) {
            expect(data).toBe('base_url/bff/images/product1/logo')
          }
          done()
        },
        error: done.fail
      })
    })

    describe('provide logo - on error', () => {
      it('should load - failed - used: url', () => {
        const { component } = setUp()
        component.logEnabled = true // log without prefix !
        component.productName = product1.name
        component.imageUrl = 'http://image/url'
        component.dataType = 'logo'

        component.onImageLoadError(component.imageUrl)
      })

      it('should use image - failed - use default', () => {
        const { component } = setUp()
        component.logEnabled = false
        component.logPrefix = 'default logo'
        component.productName = product1.name
        component.dataType = 'logo'

        component.onImageLoadError('base_url/bff/images/product1/logo')
      })
    })

    describe('provide logo - get url', () => {
      it('should get image url - data type undefined', () => {
        const { component } = setUp()
        component.dataType = undefined
        component.productName = product1.name

        const url = component.getImageUrl(product1.name, 'other')

        expect(url).toBeUndefined()
      })

      it('should get image url - use input image url', () => {
        const { component } = setUp()
        component.dataType = 'logo'
        component.logEnabled = false
        component.logPrefix = 'url'
        component.productName = product1.name
        component.imageUrl = '/url'

        const url = component.getImageUrl(product1.name, 'url')

        expect(url).toBe(component.imageUrl)
      })

      it('should get url - use default image url', () => {
        const { component } = setUp()
        component.dataType = 'logo'
        component.logEnabled = false
        component.logPrefix = 'default url'
        component.productName = product1.name
        component.defaultImageUrl = '/default/url'
        component.useDefaultLogo = true // enable use of default image

        const url = component.getImageUrl(product1.name, 'default')

        expect(url).toBe(component.defaultImageUrl)
      })
    })
  })
})
