import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
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
      imports: [
        ProductInternComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ]
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
      fixture.componentRef.setInput('product', { ...productProps, ...productInternals })
      fixture.componentRef.setInput('editMode', false)
      fixture.detectChanges()

      expect(component.formGroup.value).toEqual(productInternals)
      expect(component.formGroup.controls['undeployed'].disabled).toBeTrue()
    })

    it('should fill form only on edit mode', () => {
      fixture.componentRef.setInput('product', { ...productProps, ...productInternals })
      fixture.componentRef.setInput('editMode', true)
      fixture.detectChanges()

      expect(component.formGroup.value).toEqual({ undeployed: true })
      expect(component.formGroup.controls['undeployed'].enabled).toBeTrue()
    })

    it('should reset form without a product', () => {
      fixture.componentRef.setInput('product', { ...productProps, ...productInternals })
      fixture.detectChanges()
      spyOn(component.formGroup, 'reset')

      fixture.componentRef.setInput('product', undefined)
      fixture.componentRef.setInput('editMode', false)
      fixture.detectChanges()

      expect(component.formGroup.reset).toHaveBeenCalled()
    })
  })

  describe('save', () => {
    it('should display error onSave if formGroup invalid', () => {
      fixture.componentRef.setInput('product', { ...productProps })
      fixture.componentRef.setInput('editMode', true)
      fixture.detectChanges()

      const form = component.onSave()

      expect(form).toEqual({})
      expect(component.formGroup.get('undeployed')?.value).toBeUndefined()
    })

    it('should fill form correctly - EDIT mode', () => {
      fixture.componentRef.setInput('product', { ...productProps, ...productInternals })
      fixture.componentRef.setInput('editMode', true)
      fixture.detectChanges()

      const form = component.onSave()

      expect(form).toEqual({ undeployed: true })
      expect(component.formGroup.get('undeployed')?.value).toBeTrue()
    })
  })
})
