import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { of, throwError } from 'rxjs'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import { ProductPropertyComponent, ProductDetailForm, productNameValidator } from './product-props.component'
import { Product, ProductCriteria, ProductsAPIService, ImagesInternalAPIService } from 'src/app/shared/generated'

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
  provider: new FormControl<string | null>(null, [Validators.maxLength(255)]),
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
  const product: Product = {
    id: 'id',
    name: 'name',
    basePath: 'basePath',
    displayName: 'displayName'
  }
  const criteria: ProductCriteria = {
    providers: ['team'],
    classifications: ['test']
  }
  const productApiSpy = {
    createProduct: jasmine.createSpy('createProduct').and.returnValue(of({})),
    updateProduct: jasmine.createSpy('updateProduct').and.returnValue(of({})),
    getProductSearchCriteria: jasmine.createSpy('getProductSearchCriteria').and.returnValue(of({}))
  }
  const imageApiSpy = {
    getImage: jasmine.createSpy('getImage').and.returnValue(of({})),
    deleteImage: jasmine.createSpy('deleteImage').and.returnValue(of({})),
    uploadImage: jasmine.createSpy('uploadImage').and.returnValue(of({})),
    configuration: { basePath: 'basepath' }
  }
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProductPropertyComponent],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        { provide: ProductsAPIService, useValue: productApiSpy },
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: ImagesInternalAPIService, useValue: imageApiSpy }
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
    productApiSpy.createProduct.calls.reset()
    productApiSpy.updateProduct.calls.reset()
    imageApiSpy.getImage.calls.reset()
    imageApiSpy.deleteImage.calls.reset()
    imageApiSpy.uploadImage.calls.reset()
  })

  describe('initialize', () => {
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
  })

  describe('on init', () => {
    it('should disable name form control in edit mode ', () => {
      imageApiSpy.getImage.and.returnValue(of({}))
      component.formGroup = mockForm
      component.formGroup.controls['name'].setValue('name')
      component.changeMode = 'EDIT'

      component.ngOnInit()

      expect(component.formGroup.controls['name'].disabled).toBeTrue()
    })
  })

  describe('on changes', () => {
    describe('search criteria', () => {
      it('should init successfully', (done) => {
        productApiSpy.getProductSearchCriteria.and.returnValue(of(criteria))

        component.ngOnChanges()

        component.criteria$.subscribe({
          next: (result) => {
            expect(result.providers).toEqual(criteria.providers)
            expect(result.classifications).toEqual(criteria.classifications)
            done()
          },
          error: done.fail
        })
      })

      it('should init failed', (done) => {
        const errorResponse = { status: 401, statusText: 'Not authorized' }
        productApiSpy.getProductSearchCriteria.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')

        component.ngOnChanges()

        component.criteria$.subscribe({
          next: (result) => {
            expect(result.providers).toEqual([])
            expect(result.classifications).toEqual([])
            done()
          },
          error: done.fail
        })
        expect(console.error).toHaveBeenCalledWith('getProductSearchCriteria', errorResponse)
      })
    })

    describe('init image URL', () => {
      it('should patchValue in formGroup with product - no image URL', () => {
        const p = { ...product, imageUrl: undefined }
        component.product = p
        component.changeMode = 'VIEW'
        spyOn(component.formGroup, 'patchValue')

        component.ngOnChanges()

        expect(component.formGroup.patchValue).toHaveBeenCalledWith(p)
        expect(component.formGroup.disabled).toBeTrue()
        expect(component.product.name).toEqual(p.name)
        expect(component.fetchingImageUrl).toEqual('basepath/images/name/logo')
      })

      it('should patchValue in formGroup with product - empty image URL', () => {
        const p = { ...product, imageUrl: '' }
        component.product = p
        component.changeMode = 'VIEW'

        component.ngOnChanges()

        expect(component.fetchingImageUrl).toEqual('basepath/images/name/logo')
      })

      it('should patchValue in formGroup with product - with image URL', () => {
        const p = { ...product, imageUrl: 'https://host/assets/images/logo.svg' }
        component.product = p
        component.changeMode = 'VIEW'

        component.ngOnChanges()

        expect(component.fetchingImageUrl).toEqual(p.imageUrl)
      })
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
  })

  it('should call createProduct onSave in new mode', () => {
    productApiSpy.createProduct.and.returnValue(of({}))
    const formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl<string | null>('id'),
      name: new FormControl<string | null>('name'),
      version: new FormControl<string | null>('version'),
      description: new FormControl<string | null>(null),
      provider: new FormControl<string | null>(null, [Validators.maxLength(255)]),
      imageUrl: new FormControl<string | null>(null),
      basePath: new FormControl<string | null>('path'),
      displayName: new FormControl<string | null>('display'),
      iconName: new FormControl<string | null>('icon'),
      classifications: new FormControl<string[] | null>(null)
    })
    component.formGroup = formGroup as FormGroup<ProductDetailForm>
    component.changeMode = 'CREATE'

    component.onSave()

    expect(productApiSpy.createProduct).toHaveBeenCalled()
    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.CREATE.PRODUCT.OK' })
  })

  it('should call updateProduct onSave in edit mode', () => {
    productApiSpy.updateProduct.and.returnValue(of({}))
    const formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl<string | null>('id'),
      name: new FormControl<string | null>('name'),
      version: new FormControl<string | null>('version'),
      description: new FormControl<string | null>(null),
      provider: new FormControl<string | null>(null, [Validators.maxLength(255)]),

      imageUrl: new FormControl<string | null>(null),
      basePath: new FormControl<string | null>('path'),
      displayName: new FormControl<string | null>('display'),
      iconName: new FormControl<string | null>('icon'),
      classifications: new FormControl<string[] | null>(null)
    })
    component.formGroup = formGroup as FormGroup<ProductDetailForm>
    component.changeMode = 'EDIT'

    component.onSave()

    expect(productApiSpy.updateProduct).toHaveBeenCalled()
    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EDIT.PRODUCT.OK' })
  })

  it('should display error if updateProduct fails', () => {
    productApiSpy.updateProduct.and.returnValue(throwError(() => new Error()))
    const formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl<string | null>('id'),
      name: new FormControl<string | null>('name'),
      version: new FormControl<string | null>('version'),
      description: new FormControl<string | null>(null),
      provider: new FormControl<string | null>(null, [Validators.maxLength(255)]),

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
    productApiSpy.updateProduct.and.returnValue(throwError(() => error))
    const formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl<string | null>('id'),
      name: new FormControl<string | null>('name'),
      version: new FormControl<string | null>('version'),
      description: new FormControl<string | null>(null),
      provider: new FormControl<string | null>(null, [Validators.maxLength(255)]),

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
    productApiSpy.updateProduct.and.returnValue(throwError(() => error))
    const formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl<string | null>('id'),
      name: new FormControl<string | null>('name'),
      version: new FormControl<string | null>('version'),
      description: new FormControl<string | null>(null),
      provider: new FormControl<string | null>(null, [Validators.maxLength(255)]),

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
    productApiSpy.createProduct.and.returnValue(throwError(() => new Error()))
    const formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl<string | null>('id'),
      name: new FormControl<string | null>('name'),
      version: new FormControl<string | null>('version'),
      description: new FormControl<string | null>(null),
      provider: new FormControl<string | null>(null, [Validators.maxLength(255)]),

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
      provider: new FormControl<string | null>(null, [Validators.maxLength(255)]),

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
    const event = { target: { files: ['file'] } }
    component.formGroup.controls['name'].setValue('')

    component.onFileUpload(event as any)

    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'IMAGE.CONSTRAINT_FAILED',
      detailKey: 'IMAGE.CONSTRAINT_NAME'
    })
  })

  it('should not upload a file if productName is null', () => {
    const event = { target: { files: ['file'] } }
    component.formGroup.controls['name'].setValue(null)

    component.onFileUpload(event as any)

    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'IMAGE.CONSTRAINT_FAILED',
      detailKey: 'IMAGE.CONSTRAINT_NAME'
    })
  })

  it('should not upload a file that is too large', () => {
    const largeBlob = new Blob(['a'.repeat(200001)], { type: 'image/png' })
    const largeFile = new File([largeBlob], 'test.png', { type: 'image/png' })
    const event = { target: { files: [largeFile] } }
    component.formGroup.controls['name'].setValue('name')

    component.onFileUpload(event as any)

    expect(component.formGroup.valid).toBeFalse()
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'IMAGE.CONSTRAINT_FAILED',
      detailKey: 'IMAGE.CONSTRAINT_SIZE'
    })
  })

  it('should not upload a file of wrong file type', () => {
    const blob = new Blob(['a'.repeat(10)], { type: 'txt' })
    const file = new File([blob], 'test.txt', { type: 'txt' })
    const event = { target: { files: [file] } }
    component.formGroup.controls['name'].setValue('name')

    component.onFileUpload(event as any)

    expect(component.formGroup.valid).toBeFalse()
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'IMAGE.CONSTRAINT_FAILED',
      detailKey: 'IMAGE.CONSTRAINT_FILE_TYPE'
    })
  })

  it('should display error if api call to upload a file fails', () => {
    imageApiSpy.uploadImage.and.returnValue(of({}))
    const blob = new Blob(['a'.repeat(10)], { type: 'image/png' })
    const file = new File([blob], 'test.png', { type: 'image/png' })
    const event = { target: { files: [file] } }
    component.formGroup.controls['name'].setValue('name')

    component.onFileUpload(event as any)

    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'IMAGE.UPLOAD_SUCCESS' })
  })

  it('should display error if file choice fails', () => {
    imageApiSpy.getImage.and.returnValue(throwError(() => new Error()))
    const event = { target: { files: undefined } }
    component.formGroup.controls['name'].setValue('name')

    component.onFileUpload(event as any)

    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'IMAGE.CONSTRAINT_FAILED',
      detailKey: 'IMAGE.CONSTRAINT_FILE_MISSING'
    })
  })

  describe('Remove logo', () => {
    it('should remove the logo URL - successful', () => {
      component.formGroup.controls['name'].setValue('name')
      component.formGroup.controls['imageUrl'].setValue('image URL')

      component.onRemoveLogo()

      expect(component.fetchingImageUrl).toEqual('basepath/images/name/logo')
      expect(component.formGroup.get('imageUrl')?.value).toBeNull()
    })

    it('should remove the uploaded logo - successful', () => {
      imageApiSpy.deleteImage.and.returnValue(of({}))
      component.formGroup.controls['name'].setValue('name')

      component.onRemoveLogo()

      expect(component.fetchingImageUrl).toBeUndefined()
      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'IMAGE.REMOVE_SUCCESS' })
    })

    it('should remove the log - failed', () => {
      const errorResponse = { status: 400, statusText: 'Error on image deletion' }
      imageApiSpy.deleteImage.and.returnValue(throwError(() => errorResponse))
      component.formGroup.controls['name'].setValue('name')
      spyOn(console, 'error')

      component.onRemoveLogo()

      expect(console.error).toHaveBeenCalledWith('deleteImage', errorResponse)
    })
  })

  describe('change image URL manually', () => {
    it('should change to valid value', fakeAsync(() => {
      const event = { target: { value: 'newLogoValue' } } as unknown as Event

      component.onInputChange(product, event)

      tick(500)
      expect(component.fetchingImageUrl).toBe('newLogoValue')
    }))

    it('should change to empty value', fakeAsync(() => {
      const event = { target: { value: '' } } as unknown as Event
      component.formGroup.controls['name'].setValue('name')

      component.onInputChange(product, event)

      tick(1000)
      expect(component.fetchingImageUrl).toBe('basepath/images/name/logo')
    }))
  })

  describe('filter provider', () => {
    it('should filter on providers', () => {
      const event = { query: 'team' }

      component.filterProviders(event, criteria.providers)

      expect(component.providerFiltered).toEqual(criteria.providers ?? [])
    })

    it('should filter on providers but no providers exist', () => {
      const event = { query: 'team' }

      component.filterProviders(event)

      expect(component.providerFiltered).toEqual([])
    })
  })
})
