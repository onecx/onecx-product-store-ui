import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { of, throwError } from 'rxjs'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import { ProductPropertyComponent, ProductDetailForm, productNameValidator } from './product-props.component'
import { ProductsAPIService, ImagesInternalAPIService } from 'src/app/shared/generated'

const mockForm = new FormGroup<ProductDetailForm>({
  id: new FormControl<string | null>(null), // Assuming ID might not be needed or can be null for new entries
  name: new FormControl<string | null>(null, [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(255),
    productNameValidator()
  ]),
  version: new FormControl<string | null>(null, [Validators.required, Validators.maxLength(255)]),
  description: new FormControl<string | null>(null, [Validators.maxLength(255)]),
  imageUrl: new FormControl<string | null>(null, [Validators.maxLength(255)]),
  basePath: new FormControl<string | null>(null, [Validators.required, Validators.maxLength(255)]),
  displayName: new FormControl<string | null>(null, [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(255)
  ]),
  iconName: new FormControl<string | null>(null, [Validators.maxLength(255)]),
  classifications: new FormControl<string[] | null>(null, [Validators.maxLength(255)]) // Assuming this validation makes sense for your use case
})

describe('ProductPropertyComponent', () => {
  let component: ProductPropertyComponent
  let fixture: ComponentFixture<ProductPropertyComponent>

  const apiServiceSpy = {
    createProduct: jasmine.createSpy('createProduct').and.returnValue(of({})),
    updateProduct: jasmine.createSpy('updateProduct').and.returnValue(of({}))
  }
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const imgServiceSpy = {
    getImage: jasmine.createSpy('getImage').and.returnValue(of({})),
    updateImage: jasmine.createSpy('updateImage').and.returnValue(of({})),
    uploadImage: jasmine.createSpy('uploadImage').and.returnValue(of({})),
    configuration: {
      basePath: 'basepath'
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProductPropertyComponent],
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
        { provide: ImagesInternalAPIService, useValue: imgServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
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
    imgServiceSpy.getImage.calls.reset()
    imgServiceSpy.uploadImage.calls.reset()
    imgServiceSpy.updateImage.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should validate a product name', () => {
    const control = new FormControl('', [productNameValidator()])

    control.setValue('new')
    expect(control.errors).toEqual({ invalidProductName: true })

    control.setValue('apps')
    expect(control.errors).toEqual({ invalidProductName: true })

    control.setValue('validName')
    expect(control.errors).toBeNull()
  })

  it('should getImage onInit', () => {
    imgServiceSpy.getImage.and.returnValue(of({}))
    component.formGroup = mockForm
    component.formGroup.controls['name'].setValue('name')

    component.ngOnInit()

    expect(component.logoImageWasUploaded).toBeTrue()
  })

  it('should disable name form control in edit mode ', () => {
    imgServiceSpy.getImage.and.returnValue(of({}))
    component.formGroup = mockForm
    component.formGroup.controls['name'].setValue('name')
    component.changeMode = 'EDIT'

    component.ngOnInit()

    expect(component.formGroup.controls['name'].disabled).toBeTrue()
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

  it('should set product.id to undefined onChanges if product and changeMode is COPY', () => {
    const product = {
      id: 'id',
      name: 'name',
      basePath: 'path'
    }
    component.product = product
    spyOn(component.formGroup, 'patchValue')
    component.changeMode = 'COPY'

    component.ngOnChanges()

    expect(component.productId).toBeUndefined()
  })

  it('should reset formGroup onChanges if no product', () => {
    spyOn(component.formGroup, 'reset')

    component.ngOnChanges()

    expect(component.formGroup.reset).toHaveBeenCalled()
  })

  it('should call createProduct onSave in new mode', () => {
    apiServiceSpy.createProduct.and.returnValue(of({}))
    const formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl<string | null>('id'),
      name: new FormControl<string | null>('name'),
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

    component.onSave()

    expect(apiServiceSpy.createProduct).toHaveBeenCalled()
    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.CREATE.PRODUCT.OK' })
  })

  it('should call updateProduct onSave in edit mode', () => {
    apiServiceSpy.updateProduct.and.returnValue(of({}))
    const formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl<string | null>('id'),
      name: new FormControl<string | null>('name'),
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

    component.onSave()

    expect(apiServiceSpy.updateProduct).toHaveBeenCalled()
    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EDIT.PRODUCT.OK' })
  })

  it('should display error if updateProduct fails', () => {
    apiServiceSpy.updateProduct.and.returnValue(throwError(() => new Error()))
    const formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl<string | null>('id'),
      name: new FormControl<string | null>('name'),
      version: new FormControl<string | null>('version'),
      description: new FormControl<string | null>(null),
      imageUrl: new FormControl<string | null>(null),
      basePath: new FormControl<string | null>('path'),
      displayName: new FormControl<string | null>('display'),
      iconName: new FormControl<string | null>('icon'),
      classifications: new FormControl<string[] | null>(null)
    })
    component.formGroup = formGroup as FormGroup<ProductDetailForm>
    component.formGroup.controls['name'].setValue('')
    component.changeMode = 'EDIT'

    component.onSave()

    expect(component.formGroup.valid).toBeTrue()
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'ACTIONS.EDIT.PRODUCT.NOK'
    })
  })

  it('should display unique constraint error if name already exists', () => {
    const error = {
      error: {
        errorCode: 'PERSIST_ENTITY_FAILED',
        detail:
          "could not execute statement [ERROR: duplicate key value violates unique constraint 'ui_product_name' ...",
        params: [
          {
            key: 'constraint',
            value:
              "could not execute statement [ERROR: duplicate key value violates unique constraint 'ui_product_name' ..."
          },
          { key: 'constraintName', value: 'ui_product_name' }
        ]
      }
    }
    apiServiceSpy.updateProduct.and.returnValue(throwError(() => error))
    const formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl<string | null>('id'),
      name: new FormControl<string | null>('name'),
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
    component.formGroup.controls['name'].setValue('')

    component.onSave()

    expect(component.formGroup.valid).toBeTrue()
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'ACTIONS.EDIT.PRODUCT.NOK',
      detailKey: 'VALIDATION.PRODUCT.UNIQUE_CONSTRAINT.NAME'
    })
  })

  it('should display unique constraint error if basepath already exists', () => {
    const error = {
      error: {
        errorCode: 'PERSIST_ENTITY_FAILED',
        detail:
          "could not execute statement [ERROR: duplicate key value violates unique constraint 'ui_product_base_path' ...",
        params: [
          {
            key: 'constraint',
            value:
              "could not execute statement [ERROR: duplicate key value violates unique constraint 'ui_product_base_path' ..."
          },
          { key: 'constraintName', value: 'ui_product_base_path' }
        ]
      }
    }
    apiServiceSpy.updateProduct.and.returnValue(throwError(() => error))
    const formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl<string | null>('id'),
      name: new FormControl<string | null>('name'),
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
    component.formGroup.controls['basePath'].setValue('')

    component.onSave()

    expect(component.formGroup.valid).toBeTrue()
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'ACTIONS.EDIT.PRODUCT.NOK',
      detailKey: 'VALIDATION.PRODUCT.UNIQUE_CONSTRAINT.BASEPATH'
    })
  })

  it('should display error and set focus to first invalid field if form is invalid', () => {
    component.formGroup.controls['name'].setValue('')

    const focusSpy = jasmine.createSpy('focus')
    spyOn((component as any).elements.nativeElement, 'querySelector').and.returnValue({ focus: focusSpy })

    component.onSave()

    expect(component.formGroup.valid).toBeFalse()
    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'VALIDATION.FORM_INVALID' })
    expect(focusSpy).toHaveBeenCalled()
  })

  it('should display error if createProduct fails', () => {
    apiServiceSpy.createProduct.and.returnValue(throwError(() => new Error()))
    const formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl<string | null>('id'),
      name: new FormControl<string | null>('name'),
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

    component.onSave()

    expect(component.formGroup.valid).toBeTrue()
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'ACTIONS.CREATE.PRODUCT.NOK'
    })
  })

  it('should display error onSave if formGroup invalid', () => {
    const formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl<string | null>(null, Validators.required),
      name: new FormControl<string | null>('name'),
      version: new FormControl<string | null>('version'),
      description: new FormControl<string | null>(null),
      imageUrl: new FormControl<string | null>(null),
      basePath: new FormControl<string | null>('path'),
      displayName: new FormControl<string | null>('display'),
      iconName: new FormControl<string | null>('icon'),
      classifications: new FormControl<string[] | null>(null)
    })
    component.formGroup = formGroup as FormGroup<ProductDetailForm>

    component.onSave()

    expect(component.formGroup.valid).toBeFalse()
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'VALIDATION.FORM_INVALID'
    })
  })

  it('should not upload a file if productName is empty', () => {
    const event = {
      target: {
        files: ['file']
      }
    }
    component.formGroup.controls['name'].setValue('')

    component.onFileUpload(event as any, 'logo')

    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'LOGO.UPLOAD_FAILED_NAME'
    })
  })

  it('should not upload a file if productName is null', () => {
    const event = {
      target: {
        files: ['file']
      }
    }
    component.formGroup.controls['name'].setValue(null)

    component.onFileUpload(event as any, 'logo')

    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'LOGO.UPLOAD_FAILED_NAME'
    })
  })

  it('should not upload a file that is too large', () => {
    const largeBlob = new Blob(['a'.repeat(120000)], { type: 'image/png' })
    const largeFile = new File([largeBlob], 'test.png', { type: 'image/png' })
    const event = {
      target: {
        files: [largeFile]
      }
    }
    component.formGroup.controls['name'].setValue('name')

    component.onFileUpload(event as any, 'logo')

    expect(component.formGroup.valid).toBeFalse()
  })

  it('should not upload a file that is too large', () => {
    const largeBlob = new Blob(['a'.repeat(120000)], { type: 'image/png' })
    const largeFile = new File([largeBlob], 'test.png', { type: 'image/png' })
    const event = {
      target: {
        files: [largeFile]
      }
    }
    component.formGroup.controls['name'].setValue('name')

    component.onFileUpload(event as any, 'logo')

    expect(component.formGroup.valid).toBeFalse()
  })

  it('should upload a file', () => {
    imgServiceSpy.updateImage.and.returnValue(of({}))
    const blob = new Blob(['a'.repeat(10)], { type: 'image/png' })
    const file = new File([blob], 'test.png', { type: 'image/png' })
    const event = {
      target: {
        files: [file]
      }
    }
    component.formGroup.controls['name'].setValue('name')

    component.onFileUpload(event as any, 'logo')

    expect(msgServiceSpy.info).toHaveBeenCalledWith({
      summaryKey: 'LOGO.UPLOADED'
    })
  })

  it('should display error if upload fails', () => {
    imgServiceSpy.getImage.and.returnValue(throwError(() => new Error()))
    const blob = new Blob(['a'.repeat(10)], { type: 'image/png' })
    const file = new File([blob], 'test.png', { type: 'image/png' })
    const event = {
      target: {
        files: [file]
      }
    }
    component.formGroup.controls['name'].setValue('name')

    component.onFileUpload(event as any, 'logo')

    expect(msgServiceSpy.info).toHaveBeenCalledWith({
      summaryKey: 'LOGO.UPLOADED'
    })
  })

  it('should return an image url', () => {
    component.formGroup.controls['imageUrl'].setValue('url')

    const result = component.prepareImageUrl()

    expect(result).toEqual('url')
  })

  it('should change fetchingLogoUrl on inputChange: valid value', fakeAsync(() => {
    const event = {
      target: { value: 'newLogoValue' }
    } as unknown as Event

    component.inputChange(event)

    tick(1000)

    expect(component.fetchingLogoUrl).toBe('newLogoValue')
  }))

  it('should change fetchingLogoUrl on inputChange: empty value', fakeAsync(() => {
    const event = {
      target: { value: '' }
    } as unknown as Event
    component.formGroup.controls['name'].setValue('name')

    component.inputChange(event)

    tick(1000)

    expect(component.fetchingLogoUrl).toBe('basepath/images/name/logo')
  }))
})
