import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClient } from '@angular/common/http'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { of, throwError } from 'rxjs'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import { HttpLoaderFactory } from 'src/app/shared/shared.module'
import { ProductDetailComponent } from './product-detail.component'
import { ProductsAPIService } from 'src/app/generated'

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent
  let fixture: ComponentFixture<ProductDetailComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const apiServiceSpy = {
    searchProducts: jasmine.createSpy('searchProducts').and.returnValue(of({})),
    getProduct: jasmine.createSpy('getProduct').and.returnValue(of({}))
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProductDetailComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
          }
        })
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ProductsAPIService, useValue: apiServiceSpy },
        { provide: PortalMessageService, useValue: msgServiceSpy }
      ]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
    apiServiceSpy.searchProducts.calls.reset()
    apiServiceSpy.getProduct.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should be set up correctly onInit if no product name', () => {
    component.productName = 'name'

    component.ngOnInit()

    expect(component.changeMode).toEqual('VIEW')
  })

  it('should search products onInit', () => {
    const productPageResult = {
      stream: [
        {
          id: 'id',
          name: 'name',
          basePath: 'path'
        }
      ]
    }
    apiServiceSpy.searchProducts.and.returnValue(of(productPageResult))
    apiServiceSpy.getProduct.and.returnValue(of({ id: 'id' }))
    component.productName = 'name'

    component.ngOnInit()

    expect(component.product?.id).toEqual(productPageResult.stream[0].id)
  })

  it('should display error if searchProducts fails', () => {
    const errorMsg = 'Product was not found'
    const mockError = new Error(errorMsg)
    apiServiceSpy.searchProducts.and.returnValue(throwError(() => mockError))
    component.productName = 'name'

    component.ngOnInit()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'DIALOG.LOAD_ERROR'
    })
  })

  it('should prepare action buttons callbacks on init: close', () => {
    spyOn(component, 'close')

    component.ngOnInit()

    const action = component.actions[0]
    action.actionCallback()

    expect(component.close).toHaveBeenCalled()
  })

  it('should prepare action buttons on init: onEdit', () => {
    spyOn(component, 'onEdit')

    component.ngOnInit()

    const action = component.actions[1]
    action.actionCallback()

    expect(component.onEdit).toHaveBeenCalled()
  })

  it('should prepare action buttons on init: onCancel', () => {
    spyOn(component, 'onCancel')

    component.ngOnInit()

    const action = component.actions[2]
    action.actionCallback()

    expect(component.onCancel).toHaveBeenCalled()
  })

  it('should prepare action buttons on init: onSave', () => {
    spyOn(component, 'onSave')

    component.ngOnInit()

    const action = component.actions[3]
    action.actionCallback()

    expect(component.onSave).toHaveBeenCalled()
  })

  it('should call close() onClose', () => {
    spyOn(component, 'close')

    component.onClose()

    expect(component.close).toHaveBeenCalled()
  })

  it('should behave correctly onEdit', () => {
    spyOn(component, 'getProduct')

    component.onEdit()

    expect(component.changeMode).toEqual('EDIT')
    expect(component.getProduct).toHaveBeenCalled()
  })

  it('should behave correctly onCancel in edit mode', () => {
    spyOn(component, 'getProduct')
    spyOn(component, 'prepareTranslations')
    component.changeMode = 'EDIT'

    component.onCancel()

    expect(component.changeMode).toEqual('VIEW')
    expect(component.getProduct).toHaveBeenCalled()
    expect(component.prepareTranslations).toHaveBeenCalled()
  })

  it('should behave correctly onCancel in new mode', () => {
    spyOn(component, 'close')
    component.changeMode = 'CREATE'

    component.onCancel()

    expect(component.close).toHaveBeenCalled()
  })

  xit('should behave correctly onSave', () => {
    spyOn(component.productPropsComponent, 'onSubmit')

    component.onSave()

    expect(component.productPropsComponent.onSubmit).toHaveBeenCalled()
  })
  /*
  it('should behave correctly onCreate', () => {
    const data: any = { id: 'id ', name: 'name' }

    component.onCreate(data)

    expect(component.product).toEqual(data)
  })
*/
  it('should behave correctly onNameChange if change true', () => {
    spyOn(component, 'close')

    component.onChange(true)

    expect(component.close).toHaveBeenCalled()
  })

  it('should behave correctly onChange if change false', () => {
    spyOn(component, 'getProduct')

    component.onChange(false)

    expect(component.getProduct).toHaveBeenCalled()
  })
})
