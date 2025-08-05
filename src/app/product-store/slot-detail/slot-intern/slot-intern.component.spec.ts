import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { Slot } from 'src/app/shared/generated'
import { SlotInternComponent } from './slot-intern.component'

const slot: Slot = {
  operator: true,
  deprecated: false,
  undeployed: true
} as Slot

describe('SlotInternComponent', () => {
  let component: SlotInternComponent
  let fixture: ComponentFixture<SlotInternComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SlotInternComponent],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SlotInternComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnChanges', () => {
    it('should set relevant values correctly', () => {
      component.slot = slot

      component.ngOnChanges()

      expect(component.slotForm.get('operator')?.value).toBeTrue()
      expect(component.slotForm.get('undeployed')?.value).toBeTrue()
      expect(component.slotForm.get('deprecated')?.value).toBeFalse()
    })

    it('should unset all properties when slot is undefined', () => {
      component.slot = undefined

      component.ngOnChanges()

      expect(component.slotForm.get('operator')?.value).toBeNull()
      expect(component.slotForm.get('undeployed')?.value).toBeNull()
      expect(component.slotForm.get('deprecated')?.value).toBeNull()
    })

    it('should exclude deprecated flag if this property is missing', () => {
      const slotNoDeprecated: Partial<Slot> = {
        operator: true,
        undeployed: true
      }
      component.slot = slotNoDeprecated as Slot

      component.ngOnChanges()

      expect(component.slotForm.get('deprecated')?.value).toBeUndefined()
    })

    it('should enable undeployed field', () => {
      component.slot = slot
      component.changeMode = 'EDIT'

      component.ngOnChanges()

      expect(component.slotForm.get('undeployed')?.enabled).toBeTrue()
    })
  })

  describe('additionals', () => {
    it('should emit undeployed value', () => {
      component.slot = slot
      component.changeMode = 'EDIT'

      component.ngOnChanges()
      component.onChangeUndeployed({ checked: true })

      expect().nothing()
    })
  })
})
