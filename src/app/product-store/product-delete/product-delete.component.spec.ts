import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Product, ProductsAPIService } from 'src/app/shared/generated'
import { ProductDeleteComponent } from './product-delete.component'
import { provideNoopAnimations } from '@angular/platform-browser/animations'

describe('ProductDeleteComponent', () => {
  let component: ProductDeleteComponent
  let fixture: ComponentFixture<ProductDeleteComponent>
  const product: Product = {
    id: 'id',
    name: 'name',
    basePath: 'basePath'
  }
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const productApiSpy = {
    deleteProduct: jasmine.createSpy('deleteProduct').and.returnValue(of({}))
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ProductDeleteComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [provideNoopAnimations()]
    })
      .overrideComponent(ProductDeleteComponent, {
        add: {
          providers: [
            { provide: ProductsAPIService, useValue: productApiSpy },
            { provide: PortalMessageService, useValue: msgServiceSpy }
          ]
        }
      })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductDeleteComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })
  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    productApiSpy.deleteProduct.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should behave correctly onDialogHide', () => {
    spyOn(component.productDeleted, 'emit')

    component.onDialogHide()

    expect(component.productDeleted.emit).toHaveBeenCalledWith(false)
  })

  it('should delete product onConfirmDeletion', () => {
    spyOn(component.productDeleted, 'emit')
    fixture.componentRef.setInput('product', product)

    component.onConfirmDeletion()

    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.PRODUCT.OK' })
    expect(component.productDeleted.emit).toHaveBeenCalledWith(true)
  })

  it('should display error if api call fails onConfirmDeletion', () => {
    productApiSpy.deleteProduct.and.returnValue(throwError(() => new Error()))
    fixture.componentRef.setInput('product', product)

    component.onConfirmDeletion()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.PRODUCT.NOK' })
  })

  it('should do nothing onConfirmDeletion when product id is missing', () => {
    fixture.componentRef.setInput('product', {})

    component.onConfirmDeletion()

    expect(productApiSpy.deleteProduct).not.toHaveBeenCalled()
  })

  it('should show the dialog when displayDialog and product are set', () => {
    fixture.componentRef.setInput('displayDialog', true)
    fixture.componentRef.setInput('product', product)
    fixture.detectChanges()

    const dialog = fixture.nativeElement.querySelector('p-dialog')
    expect(dialog).toBeTruthy()
  })
})
