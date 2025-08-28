import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { Location } from '@angular/common'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideRouter, Router } from '@angular/router'
import { of, throwError } from 'rxjs'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { ConfigurationService, PortalMessageService, UserService } from '@onecx/angular-integration-interface'

import { ProductDetailComponent } from './product-detail.component'
import { ProductPropertyComponent } from './product-props/product-props.component'
import { ProductInternComponent } from './product-intern/product-intern.component'
import { Product, ProductsAPIService } from 'src/app/shared/generated'

const productProps: Product = {
  id: 'id',
  name: 'name',
  displayName: 'Product Name',
  basePath: 'basePath',
  imageUrl: 'imageUrl',
  version: 'version'
}
const productInternals: Partial<Product> = {
  operator: true,
  undeployed: true,
  multitenancy: false
}
const product: Product = { ...productProps, ...productInternals }

class MockProductPropertyComponent {
  public onSave(): Partial<Product> {
    return productProps
  }
  public ngOnChanges(): void {}
}
class MockProductInternComponent {
  public onSave(): Partial<Product> {
    return productInternals
  }
  public ngOnChanges(): void {}
}

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent
  let fixture: ComponentFixture<ProductDetailComponent>
  let router: Router
  const mockPropsComponent = new MockProductPropertyComponent()
  const mockInternComponent = new MockProductInternComponent()

  const productApiSpy = {
    createProduct: jasmine.createSpy('createProduct').and.returnValue(of({})),
    updateProduct: jasmine.createSpy('updateProduct').and.returnValue(of({})),
    deleteProduct: jasmine.createSpy('deleteProduct').and.returnValue(of({})),
    getProductByName: jasmine.createSpy('getProductByName').and.returnValue(of({}))
  }
  const locationSpy = jasmine.createSpyObj<Location>('Location', ['back'])
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const configServiceSpy = {
    getProperty: jasmine.createSpy('getProperty').and.returnValue('123'),
    getPortal: jasmine.createSpy('getPortal').and.returnValue({
      themeId: '1234',
      portalName: 'test',
      baseUrl: '/',
      microfrontendRegistrations: []
    }),
    lang: 'en'
  }
  const mockUserService = {
    lang$: {
      getValue: jasmine.createSpy('getValue').and.returnValue('en')
    },
    hasPermission: jasmine.createSpy('hasPermission').and.callFake((permission) => {
      return ['PRODUCT#CREATE', 'PRODUCT#EDIT', 'PRODUCT#VIEW'].includes(permission)
    })
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProductDetailComponent],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '', component: ProductDetailComponent }]),
        { provide: ProductsAPIService, useValue: productApiSpy },
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: ConfigurationService, useValue: configServiceSpy },
        { provide: UserService, useValue: mockUserService },
        { provide: Location, useValue: locationSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductDetailComponent)
    component = fixture.componentInstance
    router = TestBed.inject(Router)
    fixture.detectChanges()
  })

  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    productApiSpy.getProductByName.calls.reset()
    productApiSpy.createProduct.calls.reset()
    productApiSpy.updateProduct.calls.reset()
    productApiSpy.deleteProduct.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('initialize', () => {
    it('should be set up correctly onInit if there is a product name', () => {
      component.productName = 'name'

      component.ngOnInit()

      expect(component.changeMode).toEqual('VIEW')
    })

    it('should be set up correctly onInit if no product name', () => {
      component.productName = null

      component.ngOnInit()

      expect(component.changeMode).toEqual('CREATE')
    })

    it('should get product onInit - successful: found', (done) => {
      productApiSpy.getProductByName.and.returnValue(of(product))
      component.productName = product.name

      component.ngOnInit()

      component.product$.subscribe({
        next: (data) => {
          expect(data?.id).toBe(product.id)
          done()
        },
        error: done.fail
      })
    })

    it('should get product onInit - failed: not found', (done) => {
      const errorResponse = { status: 404, statusText: 'Not Found' }
      productApiSpy.getProductByName.and.returnValue(throwError(() => errorResponse))
      component.productName = 'unknown'
      spyOn(console, 'error')

      component.ngOnInit()

      component.product$.subscribe({
        next: (result) => {
          expect(result).toEqual({} as Product)
          expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.PRODUCT')
          expect(console.error).toHaveBeenCalledWith('getProductByName', errorResponse)
          done()
        },
        error: done.fail
      })
    })
  })

  describe('changes', () => {
    beforeEach(() => {
      component.productPropsComponent = mockPropsComponent as unknown as ProductPropertyComponent
      component.productInternComponent = mockInternComponent as unknown as ProductInternComponent
      component.productName = product.name
      component.productId = product.id
    })

    it('should save edited product - successful', () => {
      productApiSpy.updateProduct.and.returnValue(of(product))
      component.changeMode = 'EDIT'

      component.onSaveProduct()

      expect(component.changeMode).toEqual('VIEW')
      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EDIT.PRODUCT.OK' })
    })

    it('should save edited product - failed', () => {
      const errorResponse = { status: 400, statusText: 'Failed' }
      productApiSpy.updateProduct.and.returnValue(throwError(() => errorResponse))
      component.changeMode = 'EDIT'

      component.onSaveProduct()

      expect(component.changeMode).toEqual('EDIT')
      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EDIT.PRODUCT.NOK' })
    })

    it('should save created product - successful', () => {
      productApiSpy.createProduct.and.returnValue(of({ ...product, id: undefined }))
      component.changeMode = 'CREATE'
      const routerSpy = spyOn(router, 'navigate')

      component.onSaveProduct()
      component.product$.subscribe()

      expect(component.changeMode).toEqual('VIEW')
      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.CREATE.PRODUCT.OK' })
      expect(routerSpy).toHaveBeenCalledWith(['../', product.name], jasmine.any(Object))
    })

    it('should save created product - failed', () => {
      const errorResponse = { status: 400, statusText: 'Failed' }
      productApiSpy.createProduct.and.returnValue(throwError(() => errorResponse))
      component.changeMode = 'CREATE'

      component.onSaveProduct()

      expect(component.changeMode).toEqual('CREATE')
      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.CREATE.PRODUCT.NOK' })
    })

    it('should save created product - failed: existing name', () => {
      const errorResponse = {
        status: 400,
        statusText: 'Failed',
        error: { errorCode: 'PERSIST_ENTITY_FAILED', detail: ' ...ui_product_name...' }
      }
      productApiSpy.createProduct.and.returnValue(throwError(() => errorResponse))
      component.changeMode = 'CREATE'

      component.onSaveProduct()

      expect(component.changeMode).toEqual('CREATE')
      expect(msgServiceSpy.error).toHaveBeenCalledWith({
        summaryKey: 'ACTIONS.CREATE.PRODUCT.NOK',
        detailKey: 'VALIDATION.PRODUCT.UNIQUE_CONSTRAINT.NAME'
      })
    })

    it('should save created product - failed: existing basepath', () => {
      const errorResponse = {
        status: 400,
        statusText: 'Failed',
        error: { errorCode: 'PERSIST_ENTITY_FAILED', detail: ' ...ui_product_base_path...' }
      }
      productApiSpy.createProduct.and.returnValue(throwError(() => errorResponse))
      component.changeMode = 'CREATE'

      component.onSaveProduct()

      expect(component.changeMode).toEqual('CREATE')
      expect(msgServiceSpy.error).toHaveBeenCalledWith({
        summaryKey: 'ACTIONS.CREATE.PRODUCT.NOK',
        detailKey: 'VALIDATION.PRODUCT.UNIQUE_CONSTRAINT.BASEPATH'
      })
    })
  })

  describe('deletion', () => {
    it('should behave correctly deleted', () => {
      component.onDelete(product)

      expect(component.item4Delete).toEqual(product)
    })

    it('should delete a product', () => {
      productApiSpy.deleteProduct
      component.item4Delete = product
      const routerSpy = spyOn(router, 'navigate')

      component.onDeleteConfirmation()

      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.PRODUCT.OK' })
      expect(routerSpy).toHaveBeenCalledWith(['../'], jasmine.any(Object))
    })

    it('should display error message when delete fails', () => {
      productApiSpy.deleteProduct.and.returnValue(throwError(() => new Error()))
      component.item4Delete = product

      component.onDeleteConfirmation()

      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.PRODUCT.NOK' })
    })
  })

  describe('language', () => {
    it('should call this.user.lang$ from the constructor and set this.dateFormat to default format if user.lang$ is de', () => {
      mockUserService.lang$.getValue.and.returnValue('de')
      fixture = TestBed.createComponent(ProductDetailComponent)
      component = fixture.componentInstance
      fixture.detectChanges()
      expect(component.dateFormat).toEqual('dd.MM.yyyy HH:mm:ss')
    })
  })

  describe('UI actions', () => {
    it('should go directly to apps TAB', () => {
      component.uriFragment = 'apps'
      component['goToTab'](product)

      expect(component.selectedTabIndex).toEqual(1)
      expect(component.product_for_apps).toEqual(product)
    })

    it('should behave correctly onTabChange: 1', () => {
      component.onTabChange({ index: 1 }, product)

      expect(component.selectedTabIndex).toEqual(1)
      expect(component.product_for_apps).toEqual(product)
    })
  })

  describe('action buttons', () => {
    it('should prepare action buttons on init', () => {
      spyOn(component, 'onClose')
      spyOn(component, 'onCopy')
      spyOn(component, 'onEdit')
      spyOn(component, 'onCancel')
      spyOn(component, 'onSaveProduct')
      component.item4Delete = product
      component.changeMode = 'VIEW'

      component.ngOnInit()

      let actions: any = []
      component.actions$!.subscribe((act) => (actions = act))

      actions[0].actionCallback()
      actions[1].actionCallback()
      actions[2].actionCallback()
      actions[3].actionCallback()
      actions[4].actionCallback()
      actions[5].actionCallback()

      expect(component.onClose).toHaveBeenCalled()
      expect(component.onCopy).toHaveBeenCalled()
      expect(component.onEdit).toHaveBeenCalled()
      expect(component.onCancel).toHaveBeenCalled()
      expect(component.onSaveProduct).toHaveBeenCalled()
    })

    it('should fulfill all conditions for detail button', () => {
      spyOn(component, 'onEdit')
      component.changeMode = 'VIEW'

      component.preparePageAction(product)

      let actions: any = []
      component.actions$!.subscribe((act) => (actions = act))

      actions[1].actionCallback()

      expect(component.onEdit).toHaveBeenCalled()
    })

    it('should navigate back when closing', () => {
      component.onClose()

      expect(locationSpy.back).toHaveBeenCalled()
    })

    it('should behave correctly onCopy', () => {
      component.onCopy({})

      expect(component.changeMode).toEqual('COPY')
    })

    it('should behave correctly onEdit - no image URL', () => {
      productApiSpy.getProductByName.and.returnValue(of({ ...product, imageUrl: undefined }))
      component.productName = product.name

      component.ngOnInit()

      component.product$.subscribe()

      component.onEdit()

      expect(component.changeMode).toEqual('EDIT')
      expect(component.productId).toBe(product.id)
    })

    it('should behave correctly onCancel in edit mode', () => {
      component.changeMode = 'EDIT'

      component.onCancel(product)

      expect(component.changeMode).toEqual('VIEW')
    })

    it('should behave correctly onCancel in new mode', () => {
      spyOn(component, 'onClose')
      component.changeMode = 'CREATE'

      component.onCancel(product)

      expect(component.onClose).toHaveBeenCalled()
    })

    it('should behave correctly onCancel in copy mode', () => {
      spyOn(component, 'onClose')
      component.changeMode = 'COPY'

      component.onCancel(product)

      expect(component.onClose).toHaveBeenCalled()
    })
  })
})
