import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { of, throwError } from 'rxjs'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { ConfigurationService, PortalMessageService, UserService } from '@onecx/angular-integration-interface'

import { SlotsAPIService, Slot } from 'src/app/shared/generated'
import { SlotDetailComponent, SlotForm } from './slot-detail.component'

const slotForm = new FormGroup<SlotForm>({
  name: new FormControl('name'),
  appId: new FormControl('appId', Validators.minLength(2)),
  productName: new FormControl('product'),
  description: new FormControl('description')
})

const slot: Slot = {
  id: 'id',
  name: 'name',
  appId: 'appId',
  productName: 'product',
  description: 'description'
}

describe('SlotDetailComponent', () => {
  let component: SlotDetailComponent
  let fixture: ComponentFixture<SlotDetailComponent>

  const slotsAPIService = {
    getSlot: jasmine.createSpy('getSlot').and.returnValue(of({})),
    createSlot: jasmine.createSpy('createSlot').and.returnValue(of({})),
    updateSlot: jasmine.createSpy('updateSlot').and.returnValue(of({}))
  }
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const configServiceSpy = {
    lang: 'en',
    getProperty: jasmine.createSpy('getProperty').and.returnValue('123'),
    getPortal: jasmine.createSpy('getPortal').and.returnValue({
      themeId: '1234',
      portalName: 'test',
      baseUrl: '/',
      microfrontendRegistrations: []
    })
  }
  const mockUserService = {
    lang$: {
      getValue: jasmine.createSpy('getValue').and.returnValue('en')
    },
    hasPermission: jasmine.createSpy('hasPermission').and.callFake((permission: string) => {
      return ['APP#CREATE', 'APP#DELETE', 'APP#EDIT', 'APP#VIEW'].includes(permission)
    })
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SlotDetailComponent],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SlotsAPIService, useValue: slotsAPIService },
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: ConfigurationService, useValue: configServiceSpy },
        { provide: UserService, useValue: mockUserService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SlotDetailComponent)
    component = fixture.componentInstance
    component.displayDialog = true
    fixture.detectChanges()
  })

  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    slotsAPIService.getSlot.calls.reset()
    slotsAPIService.createSlot.calls.reset()
    slotsAPIService.updateSlot.calls.reset()
    component.formGroupSlot.reset()
  })

  describe('initialize', () => {
    it('should create component', () => {
      expect(component).toBeTruthy()
    })

    it('should switch to EDIT', () => {
      component.hasEditPermission = true
      component.changeMode = 'VIEW'

      component.ngOnInit()

      expect(component.changeMode).toBe('EDIT')
    })

    it('should not switching to EDIT when creation', () => {
      component.hasEditPermission = true
      component.changeMode = 'CREATE'

      component.ngOnInit()

      expect(component.changeMode).toBe('CREATE')
    })

    it('should allow editing', () => {
      component.hasCreatePermission = true
      component.changeMode = 'CREATE'

      const val = component.allowEditing()

      expect(val).toBeTrue()
    })
  })

  describe('get data', () => {
    beforeEach(() => {
      component.formGroupSlot.reset()
    })

    it('should successful in VIEW mode', () => {
      slotsAPIService.getSlot.and.returnValue(of(slot))
      component.slot = slot
      spyOn(component, 'getSlot')

      component.ngOnChanges()

      expect(component.changeMode).toBe('VIEW')
      expect(component.getSlot).toHaveBeenCalled()
    })

    it('should successful with return data - VIEW', () => {
      slotsAPIService.getSlot.and.returnValue(of(slot))
      component.changeMode = 'VIEW'
      component.hasEditPermission = false
      component.slot = slot

      component.ngOnChanges()

      expect(component.slot).toEqual(slot)
      expect(component.dialogTitleKey).toBe('ACTIONS.VIEW.SLOT.HEADER')
    })

    it('should successful with return data - EDIT', () => {
      slotsAPIService.getSlot.and.returnValue(of(slot))
      component.hasEditPermission = true
      component.changeMode = 'EDIT'
      component.slot = slot

      component.ngOnChanges()

      expect(component.slot).toEqual(slot)
      expect(component.dialogTitleKey).toBe('ACTIONS.EDIT.SLOT.HEADER')
    })

    it('should getSlot and prepare copy', () => {
      slotsAPIService.getSlot.and.returnValue(of(slot))
      component.changeMode = 'CREATE'
      component.slot = slot

      component.getSlot()

      expect(component.slot).toEqual(slot)
      expect(component.slot?.id).toBeUndefined()
      expect(component.dialogTitleKey).toBe('ACTIONS.CREATE.SLOT.HEADER')
    })
  })

  describe('Form', () => {
    beforeEach(() => {
      component.formGroupSlot.reset()
    })

    it('should display error if slot form is invalid', () => {
      component.slot = slot
      component.formGroupSlot.reset()
      component.formGroupSlot.patchValue({ name: 'name', appId: 'a', productName: 'p' })
      component.changeMode = 'CREATE'

      component.onSave()

      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'VALIDATION.FORM_INVALID' })
    })
  })

  describe('Creation', () => {
    it('should successful reset slot properties', () => {
      component.slot = {
        id: 'id',
        appId: 'appId',
        name: 'name',
        productName: 'productName'
      }
      component.changeMode = 'CREATE'

      component.ngOnChanges()

      expect(component.slot).toBeUndefined()
      expect(component.dialogTitleKey).toBe('ACTIONS.CREATE.SLOT.HEADER')
    })

    it('should create slot', () => {
      slotsAPIService.createSlot.and.returnValue(of({}))
      component.slot = slot
      component.formGroupSlot = slotForm

      component.changeMode = 'CREATE'

      component.onSave()

      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.CREATE.SLOT.OK' })
    })

    it('should display save error in create mode', () => {
      const errorResponse = {
        error: {
          detail: 'Error',
          errorCode: 'PERSIST_ENTITY_FAILED'
        }
      }
      slotsAPIService.createSlot.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')
      component.slot = slot
      component.formGroupSlot = slotForm
      component.changeMode = 'CREATE'

      component.onSave()

      const expectedKey = ''
      expect(msgServiceSpy.error).toHaveBeenCalledWith({
        summaryKey: 'ACTIONS.CREATE.SLOT.NOK',
        detailKey: expectedKey
      })
      expect(console.error).toHaveBeenCalledWith('createSlot', errorResponse)
    })
  })

  describe('Updating', () => {
    it('should call updateApp onSave in edit mode', () => {
      slotsAPIService.updateSlot.and.returnValue(of({}))
      component.slot = slot
      component.formGroupSlot = slotForm
      component.changeMode = 'EDIT'

      component.onSave()

      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EDIT.SLOT.OK' })
    })

    it('should display save error in edit mode: unique constraint slot name', () => {
      const errorResponse = {
        error: {
          detail: 'error: slot_name',
          errorCode: 'PERSIST_ENTITY_FAILED'
        }
      }
      slotsAPIService.updateSlot.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')
      component.slot = slot
      component.formGroupSlot = slotForm
      component.changeMode = 'EDIT'

      component.onSave()

      const expectedKey = 'VALIDATION.SLOT.UNIQUE_CONSTRAINT.SLOT_NAME'
      expect(msgServiceSpy.error).toHaveBeenCalledWith({
        summaryKey: 'ACTIONS.EDIT.SLOT.NOK',
        detailKey: expectedKey
      })
      expect(console.error).toHaveBeenCalledWith('updateSlot', errorResponse)
    })

    it('should display save error in edit mode: other internal error', () => {
      const errorResponse = {
        error: {
          detail: 'error: slot_name',
          errorCode: 'other'
        }
      }
      slotsAPIService.updateSlot.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')
      component.slot = slot
      component.formGroupSlot = slotForm
      component.changeMode = 'EDIT'

      component.onSave()

      const expectedKey = 'VALIDATION.ERRORS.INTERNAL_ERROR'
      expect(msgServiceSpy.error).toHaveBeenCalledWith({
        summaryKey: 'ACTIONS.EDIT.SLOT.NOK',
        detailKey: expectedKey
      })
      expect(console.error).toHaveBeenCalledWith('updateSlot', errorResponse)
    })
  })

  describe('various', () => {
    it('should behave correctly onDialogHide', () => {
      spyOn(component.changed, 'emit')

      component.onDialogHide()

      expect(component.changed.emit).toHaveBeenCalledWith(false)
    })
  })

  describe('on undeployed changes', () => {
    it('should set selectedTabIndex onChange', () => {
      component.slot = slot
      component.onChangeUndeployedValue(true)

      expect(component.slot.undeployed).toBeTrue()
    })
  })
})
