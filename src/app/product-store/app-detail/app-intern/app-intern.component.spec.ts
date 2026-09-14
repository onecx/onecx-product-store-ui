import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { Microfrontend, Microservice } from 'src/app/shared/generated'
import { AppInternComponent } from './app-intern.component'

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
      imports: [
        AppInternComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ]
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
      fixture.componentRef.setInput('mfe', appMfe)
      fixture.detectChanges()

      expect(component.appForm.get('operator')?.value).toBeTrue()
      expect(component.appForm.get('undeployed')?.value).toBeTrue()
      expect(component.appForm.get('deprecated')?.value).toBeFalse()
    })

    it('should set relevant values to false when viewed app is Microservice', () => {
      fixture.componentRef.setInput('ms', appMs)
      fixture.detectChanges()

      expect(component.appForm.get('operator')?.value).toBeTrue()
      expect(component.appForm.get('undeployed')?.value).toBeTrue()
      expect(component.appForm.get('deprecated')?.value).toBeUndefined()
    })

    it('should set all properties to false when app is undefined', () => {
      fixture.componentRef.setInput('mfe', undefined)
      fixture.componentRef.setInput('ms', undefined)
      fixture.detectChanges()

      expect(component.appForm.get('operator')?.value).toBeNull()
      expect(component.appForm.get('undeployed')?.value).toBeNull()
      expect(component.appForm.get('deprecated')?.value).toBeNull()
    })

    it('should exclude deprecated flag if deprecated property is missing', () => {
      const appMfeNoDeprecated: Partial<Microfrontend> = {
        operator: true,
        undeployed: true
      }
      fixture.componentRef.setInput('mfe', appMfeNoDeprecated as Microfrontend)
      fixture.detectChanges()

      expect(component.appForm.get('deprecated')?.value).toBeUndefined()
    })

    it('should enable undeployed field', () => {
      fixture.componentRef.setInput('ms', appMs)
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.detectChanges()

      expect(component.appForm.get('undeployed')?.enabled).toBeTrue()
    })
  })

  describe('additionals', () => {
    it('should emit undeployed value', () => {
      fixture.componentRef.setInput('ms', appMs)
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.detectChanges()
      component.onChangeUndeployed({ checked: true })

      expect().nothing()
    })
  })
})
