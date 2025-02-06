import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { PortalMessageService } from '@onecx/portal-integration-angular'

import { Slot, SlotsAPIService } from 'src/app/shared/generated'
import { SlotDeleteComponent } from './slot-delete.component'

describe('SlotDeleteComponent', () => {
  let component: SlotDeleteComponent
  let fixture: ComponentFixture<SlotDeleteComponent>
  const slot: Slot = {
    id: 'id',
    appId: 'appId',
    name: 'name',
    productName: 'productName'
  }
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const apiSlotServiceSpy = {
    deleteSlot: jasmine.createSpy('deleteSlot').and.returnValue(of({}))
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SlotDeleteComponent],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        { provide: SlotsAPIService, useValue: apiSlotServiceSpy },
        { provide: PortalMessageService, useValue: msgServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SlotDeleteComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })
  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    apiSlotServiceSpy.deleteSlot.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should behave correctly onDialogHide', () => {
    spyOn(component.slotDeleted, 'emit')

    component.onDialogHide()

    expect(component.slotDeleted.emit).toHaveBeenCalledWith(false)
  })

  it('should delete slot onConfirmDeletion', () => {
    spyOn(component.slotDeleted, 'emit')
    component.slot = slot

    component.onConfirmDeletion()

    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.SLOT.OK' })
    expect(component.slotDeleted.emit).toHaveBeenCalledWith(true)
  })

  it('should display error if api call fails onConfirmDeletion: mfe', () => {
    apiSlotServiceSpy.deleteSlot.and.returnValue(throwError(() => new Error()))
    component.slot = slot

    component.onConfirmDeletion()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.SLOT.NOK' })
  })
})
