import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { Location } from '@angular/common'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { Router } from '@angular/router'
import { of, throwError } from 'rxjs'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { PortalMessageService, ConfigurationService, UserService } from '@onecx/portal-integration-angular'
import { ProductDetailComponent } from './product-detail.component'
import { ProductPropertyComponent } from './product-props/product-props.component'
import { ProductsAPIService } from 'src/app/shared/generated'

const product = {
  id: 'id',
  name: 'name',
  basePath: 'path',
  imageUrl: 'imageUrl',
  undeployed: false
}

class MockProductPropertyComponent {
  onSave = jasmine.createSpy('onSave')
}

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent
  let fixture: ComponentFixture<ProductDetailComponent>
  let router: Router
  const mockChildComponent = new MockProductPropertyComponent()

  const apiServiceSpy = {
    getProductByName: jasmine.createSpy('getProductByName').and.returnValue(of({})),
    deleteProduct: jasmine.createSpy('deleteProduct').and.returnValue(of({}))
  }
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
  const locationSpy = jasmine.createSpyObj<Location>('Location', ['back'])

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProductDetailComponent],
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
    apiServiceSpy.getProductByName.calls.reset()
    apiServiceSpy.deleteProduct.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should be set up correctly onInit if there is a product name', () => {
    component.productName = 'name'

    component.ngOnInit()

    expect(component.changeMode).toEqual('VIEW')
  })

  it('should be set up correctly onInit if no product name', () => {
    component.productName = ''

    component.ngOnInit()

    expect(component.changeMode).toEqual('CREATE')
  })

  it('should get product onInit', () => {
    const p = { id: 'id', name: 'name', basePath: 'path' }
    apiServiceSpy.getProductByName.and.returnValue(of(p))

    component.productName = 'name'

    component.ngOnInit()

    expect(component.product?.id).toEqual(p.id)
  })

  it('should prepare action buttons on init', () => {
    spyOn(component, 'onClose')
    spyOn(component, 'onCopy')
    spyOn(component, 'onEdit')
    spyOn(component, 'onCancel')
    spyOn(component, 'onSave')
    component.product = product
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
    expect(component.onSave).toHaveBeenCalled()
  })

  it('should call close() onClose', () => {
    spyOn(component, 'close')

    component.onClose()

    expect(component.close).toHaveBeenCalled()
  })

  it('should navigate back when closing', () => {
    component.close()

    expect(locationSpy.back).toHaveBeenCalled()
  })

  it('should behave correctly onCopy', () => {
    component.onCopy()

    expect(component.changeMode).toEqual('COPY')
  })

  it('should behave correctly onEdit', () => {
    spyOn(component, 'getProduct')

    component.onEdit()

    expect(component.changeMode).toEqual('EDIT')
    expect(component.getProduct).toHaveBeenCalled()
  })

  it('should behave correctly onCancel in edit mode', () => {
    spyOn(component, 'getProduct')
    component.changeMode = 'EDIT'

    component.onCancel()

    expect(component.changeMode).toEqual('VIEW')
    expect(component.getProduct).toHaveBeenCalled()
  })

  it('should behave correctly onCancel in new mode', () => {
    spyOn(component, 'close')
    component.changeMode = 'CREATE'

    component.onCancel()

    expect(component.close).toHaveBeenCalled()
  })

  it('should behave correctly onCancel in copy mode', () => {
    spyOn(component, 'close')
    component.changeMode = 'COPY'

    component.onCancel()

    expect(component.close).toHaveBeenCalled()
  })

  it('should behave correctly onSave', () => {
    component.productPropsComponent = mockChildComponent as unknown as ProductPropertyComponent

    component.onSave()

    expect(component.productPropsComponent.onSave).toHaveBeenCalled()
  })

  it('should behave correctly onCreate', () => {
    const routerSpy = spyOn(router, 'navigate')

    component.onCreate(product)

    expect(component.product).toEqual(product)
    expect(routerSpy).toHaveBeenCalledWith(['./../', product.name], jasmine.any(Object))
  })

  it('should behave correctly onChange if change false', () => {
    spyOn(component, 'getProduct')

    component.onChange()

    expect(component.getProduct).toHaveBeenCalled()
  })

  it('should behave correctly onDelete', () => {
    const event: MouseEvent = new MouseEvent('type')

    component.onDelete(event, product)

    expect(component.product).toEqual(product)
  })

  it('should delete a product', () => {
    apiServiceSpy.deleteProduct
    component.product = product

    component.onDeleteConfirmation()

    expect(component.product).toBeUndefined()
    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.PRODUCT.OK' })
  })

  it('should display error message when delete fails', () => {
    apiServiceSpy.deleteProduct.and.returnValue(throwError(() => new Error()))
    component.product = product

    component.onDeleteConfirmation()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.PRODUCT.NOK' })
  })

  it('should call this.user.lang$ from the constructor and set this.dateFormat to default format if user.lang$ is de', () => {
    mockUserService.lang$.getValue.and.returnValue('de')
    fixture = TestBed.createComponent(ProductDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    expect(component.dateFormat).toEqual('dd.MM.yyyy HH:mm:ss')
  })

  it('should behave correctly onTabChange: 2', () => {
    component.product = product
    component.onTabChange({ index: 2 })

    expect(component.selectedTabIndex).toEqual(2)
    expect(component.product_for_apps).toEqual(product)
  })

  it('should update logo url', () => {
    component.onUpdateLogoUrl('testUrl')

    expect(component.currentLogoUrl).toBe('testUrl')
  })

  it('shoult get logo url', () => {
    const result = component.getLogoUrl(product)

    expect(result).toBe(product.imageUrl)
  })
})
