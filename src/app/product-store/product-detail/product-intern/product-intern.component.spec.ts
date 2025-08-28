import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { Product } from 'src/app/shared/generated'
import { ProductInternComponent } from './product-intern.component'

const productProps: Product = {
  id: 'id',
  name: 'name',
  displayName: 'Product Name',
  basePath: 'basePath',
  version: 'version'
}
const productInternals: Partial<Product> = {
  operator: true,
  undeployed: true,
  multitenancy: false
}

describe('ProductInternComponent', () => {
  let component: ProductInternComponent
  let fixture: ComponentFixture<ProductInternComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProductInternComponent],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [provideHttpClientTesting(), provideHttpClient()],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductInternComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('form', () => {
    it('should fill form only on view mode', () => {
      component.product = { ...productProps, ...productInternals }
      component.editMode = false

      component.ngOnChanges()

      expect(component.formGroup.value).toEqual(productInternals)
      expect(component.formGroup.controls['undeployed'].disabled).toBeTrue()
    })

    it('should fill form only on edit mode', () => {
      component.product = { ...productProps, ...productInternals }
      component.editMode = true

      component.ngOnChanges()

      expect(component.formGroup.value).toEqual({ undeployed: true })
      expect(component.formGroup.controls['undeployed'].enabled).toBeTrue()
    })

    it('should reset form without a product', () => {
      component.product = undefined
      component.editMode = false
      spyOn(component.formGroup, 'reset')

      component.ngOnChanges()

      expect(component.formGroup.reset).toHaveBeenCalled()
    })
  })

  describe('save', () => {
    it('should display error onSave if formGroup invalid', () => {
      component.product = { ...productProps }
      component.editMode = true

      component.ngOnChanges()
      const form = component.onSave()

      expect(form).toEqual({})
      expect(component.formGroup.get('undeployed')?.value).toBeUndefined()
    })

    it('should fill form correctly - EDIT mode', () => {
      component.product = { ...productProps, ...productInternals }
      component.editMode = true

      component.ngOnChanges()
      const form = component.onSave()

      expect(form).toEqual({ undeployed: true })
      expect(component.formGroup.get('undeployed')?.value).toBeTrue()
    })
  })
})
