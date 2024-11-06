import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { ProductInternComponent } from './product-intern.component'
import { Product } from 'src/app/shared/generated'
import { provideHttpClient } from '@angular/common/http'

const prodAndWsUndeployed: Product = {
  id: 'id',
  name: 'name',
  basePath: 'basePath',
  undeployed: true
}

const prodAndWsDeployed: Product = {
  id: 'id',
  name: 'name',
  basePath: 'basePath'
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

  it('should set undeployed according to the input product undeployed attribute', () => {
    component.product = prodAndWsUndeployed
    component.ngOnChanges()
    expect(component.undeployed).toBeTrue()

    component.product = prodAndWsDeployed
    component.ngOnChanges()
    expect(component.undeployed).toBeFalse()
  })
})
