import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { ProductUseComponent, Workspace } from './product-use.component'

describe('ProductUseComponent', () => {
  let component: ProductUseComponent
  let fixture: ComponentFixture<ProductUseComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProductUseComponent],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [provideHttpClientTesting(), provideHttpClient()]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductUseComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    component.slotEmitter.emit([{ name: 'name' } as Workspace])
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
