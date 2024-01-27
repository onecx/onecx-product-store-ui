import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClient } from '@angular/common/http'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { of, throwError } from 'rxjs'
import { FormControl, FormGroup, Validators } from '@angular/forms'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import { HttpLoaderFactory } from 'src/app/shared/shared.module'
import { ProductPropertyComponent, ProductDetailForm } from './product-props.component'
import { ProductsAPIService } from 'src/app/generated'

describe('ProductPropertyComponent', () => {
  let component: ProductPropertyComponent
  let fixture: ComponentFixture<ProductPropertyComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const apiServiceSpy = {
    createProduct: jasmine.createSpy('createProduct').and.returnValue(of({})),
    updateProduct: jasmine.createSpy('updateProduct').and.returnValue(of({}))
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProductPropertyComponent],
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
    fixture = TestBed.createComponent(ProductPropertyComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
    apiServiceSpy.createProduct.calls.reset()
    apiServiceSpy.updateProduct.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should patchValue in formGroup onChanges if product', () => {
    const product = {
      id: 'id',
      name: 'name',
      basePath: 'path'
    }
    component.product = product
    spyOn(component.formGroup, 'patchValue')

    component.ngOnChanges()

    expect(component.formGroup.patchValue).toHaveBeenCalledWith({ ...product })
    expect(component.product.name).toEqual(product.name)
  })

  it('should reset formGroup onChanges if no product', () => {
    spyOn(component.formGroup, 'reset')

    component.ngOnChanges()

    expect(component.formGroup.reset).toHaveBeenCalled()
  })

  it('should call createProduct onSubmit in new mode', () => {
    apiServiceSpy.createProduct.and.returnValue(of({}))
    const formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl<string | null>('id'),
      name: new FormControl<string | null>('name'),
      operator: new FormControl<boolean | null>(null),
      version: new FormControl<string | null>('version'),
      description: new FormControl<string | null>(null),
      imageUrl: new FormControl<string | null>(null),
      basePath: new FormControl<string | null>('path'),
      displayName: new FormControl<string | null>('display'),
      iconName: new FormControl<string | null>('icon'),
      classifications: new FormControl<string[] | null>(null)
    })
    component.formGroup = formGroup as FormGroup<ProductDetailForm>
    component.changeMode = 'CREATE'

    component.onSubmit()

    expect(apiServiceSpy.createProduct).toHaveBeenCalled()
    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.CREATE.PRODUCT.OK' })
  })

  it('should call updateProduct onSubmit in edit mode', () => {
    apiServiceSpy.updateProduct.and.returnValue(of({}))
    const formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl<string | null>('id'),
      name: new FormControl<string | null>('name'),
      operator: new FormControl<boolean | null>(null),
      version: new FormControl<string | null>('version'),
      description: new FormControl<string | null>(null),
      imageUrl: new FormControl<string | null>(null),
      basePath: new FormControl<string | null>('path'),
      displayName: new FormControl<string | null>('display'),
      iconName: new FormControl<string | null>('icon'),
      classifications: new FormControl<string[] | null>(null)
    })
    component.formGroup = formGroup as FormGroup<ProductDetailForm>
    component.changeMode = 'EDIT'

    component.onSubmit()

    expect(apiServiceSpy.updateProduct).toHaveBeenCalled()
    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EDIT.PRODUCT.OK' })
  })

  it('should display error if updateProduct fails', () => {
    apiServiceSpy.updateProduct.and.returnValue(throwError(() => new Error()))
    const formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl<string | null>('id'),
      name: new FormControl<string | null>('name'),
      operator: new FormControl<boolean | null>(null),
      version: new FormControl<string | null>('version'),
      description: new FormControl<string | null>(null),
      imageUrl: new FormControl<string | null>(null),
      basePath: new FormControl<string | null>('path'),
      displayName: new FormControl<string | null>('display'),
      iconName: new FormControl<string | null>('icon'),
      classifications: new FormControl<string[] | null>(null)
    })
    component.formGroup = formGroup as FormGroup<ProductDetailForm>
    component.changeMode = 'EDIT'

    component.onSubmit()

    expect(component.formGroup.valid).toBeTrue()
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'ACTIONS.EDIT.PRODUCT.NOK'
    })
  })

  it('should display error if createProduct fails', () => {
    apiServiceSpy.createProduct.and.returnValue(throwError(() => new Error()))
    const formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl<string | null>('id'),
      name: new FormControl<string | null>('name'),
      operator: new FormControl<boolean | null>(null),
      version: new FormControl<string | null>('version'),
      description: new FormControl<string | null>(null),
      imageUrl: new FormControl<string | null>(null),
      basePath: new FormControl<string | null>('path'),
      displayName: new FormControl<string | null>('display'),
      iconName: new FormControl<string | null>('icon'),
      classifications: new FormControl<string[] | null>(null)
    })
    component.formGroup = formGroup as FormGroup<ProductDetailForm>
    component.changeMode = 'CREATE'

    component.onSubmit()

    expect(component.formGroup.valid).toBeTrue()
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'ACTIONS.CREATE.PRODUCT.NOK'
    })
  })

  it('should display error onSubmit if formGroup invalid', () => {
    const formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl<string | null>(null, Validators.required),
      name: new FormControl<string | null>('name'),
      operator: new FormControl<boolean | null>(null),
      version: new FormControl<string | null>('version'),
      description: new FormControl<string | null>(null),
      imageUrl: new FormControl<string | null>(null),
      basePath: new FormControl<string | null>('path'),
      displayName: new FormControl<string | null>('display'),
      iconName: new FormControl<string | null>('icon'),
      classifications: new FormControl<string[] | null>(null)
    })
    component.formGroup = formGroup as FormGroup<ProductDetailForm>

    component.onSubmit()

    expect(component.formGroup.valid).toBeFalse()
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'VALIDATION.FORM_INVALID'
    })
  })

  it('should display error onSubmit if formGroup invalid', () => {
    const event = {
      target: {
        files: ['file']
      }
    }

    component.onFileUpload(event as any, 'logo')

    expect(component.formGroup.valid).toBeFalse()
  })
})
