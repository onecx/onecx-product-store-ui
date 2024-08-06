import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { AppInternComponent } from './app-intern.component'
import { Microfrontend, Microservice } from 'src/app/shared/generated'

const appMfe: Microfrontend = {
  operator: true,
  deprecated: false,
  undeployed: true
} as Microfrontend

const appMs: Microservice = {
  operator: true,
  undeployed: true
}

describe('AppInternComponent', () => {
  let component: AppInternComponent
  let fixture: ComponentFixture<AppInternComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AppInternComponent],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppInternComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnChanges', () => {
    it('should set relevant values correctly when viewed app is Microfrontend', () => {
      component.app = appMfe

      component.ngOnChanges()

      expect(component.undeployed).toBe(true)
      expect(component.operator).toBe(true)
      expect(component.deprecated).toBe(false)
    })

    it('should set relevant values to false when viewed app is Microservice', () => {
      component.app = appMs

      component.ngOnChanges()

      expect(component.undeployed).toBe(true)
      expect(component.operator).toBe(true)
      expect(component.deprecated).toBe(false)
    })

    it('should set all properties to false when app is undefined', () => {
      component.app = undefined

      component.ngOnChanges()

      expect(component.undeployed).toBe(false)
      expect(component.operator).toBe(false)
      expect(component.deprecated).toBe(false)
    })

    it('should set deprecated to false if app is a Microfrontend and deprecated property is missing', () => {
      const appMfeNoDeprecated: Partial<Microfrontend> = {
        operator: true,
        undeployed: true
      }
      component.app = appMfeNoDeprecated as Microfrontend

      component.ngOnChanges()

      expect(component.deprecated).toBe(false)
    })
  })
})
