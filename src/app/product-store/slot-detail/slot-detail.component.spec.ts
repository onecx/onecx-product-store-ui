import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { BehaviorSubject, of, throwError } from 'rxjs'
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
    lang$: new BehaviorSubject<string>('en'),
    hasPermission: jasmine.createSpy('hasPermission').and.callFake((permission: string) => {
      return ['APP#CREATE', 'APP#DELETE', 'APP#EDIT', 'APP#VIEW'].includes(permission)
    })
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        SlotDetailComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideNoopAnimations(),
        { provide: ConfigurationService, useValue: configServiceSpy },
        { provide: UserService, useValue: mockUserService }
      ]
    })
      .overrideComponent(SlotDetailComponent, {
        add: {
          providers: [
            { provide: PortalMessageService, useValue: msgServiceSpy },
            { provide: SlotsAPIService, useValue: slotsAPIService }
          ]
        }
      })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SlotDetailComponent)
    component = fixture.componentInstance
    fixture.componentRef.setInput('displayDialog', true)
    fixture.detectChanges()
  })

  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    slotsAPIService.getSlot.calls.reset()
    slotsAPIService.createSlot.calls.reset()
    slotsAPIService.updateSlot.calls.reset()
    component.slotForm.reset()
  })

  describe('initialize', () => {
    it('should create component', () => {
      expect(component).toBeTruthy()
    })
  })

  describe('changeMode', () => {
    beforeEach(() => {
      component.hasCreatePermission = false
      component.hasEditPermission = false
      component.hasViewPermission = false
    })

    it('should leave dialog if permissions not granted', () => {
      fixture.componentRef.setInput('changeMode', 'VIEW')
      fixture.detectChanges()
      expect(component.dialogTitleKey).toBeUndefined()

      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.detectChanges()
      expect(component.dialogTitleKey).toBeUndefined()

      fixture.componentRef.setInput('changeMode', 'CREATE')
      fixture.detectChanges()
      expect(component.dialogTitleKey).toBeUndefined()
    })

    it('should set suitable dialog title key', () => {
      component.hasViewPermission = true
      fixture.componentRef.setInput('displayDialog', false)
      fixture.componentRef.setInput('changeMode', 'VIEW')
      fixture.componentRef.setInput('displayDialog', true)

      fixture.detectChanges()

      expect(component.dialogTitleKey).toBe('ACTIONS.' + component.changeMode() + '.SLOT.HEADER')

      component.hasEditPermission = true
      fixture.componentRef.setInput('displayDialog', false)
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('displayDialog', true)

      fixture.detectChanges()

      expect(component.dialogTitleKey).toBe('ACTIONS.' + component.changeMode() + '.SLOT.HEADER')

      component.hasCreatePermission = true
      fixture.componentRef.setInput('displayDialog', false)
      fixture.componentRef.setInput('changeMode', 'CREATE')
      fixture.componentRef.setInput('displayDialog', true)

      fixture.detectChanges()

      expect(component.dialogTitleKey).toBe('ACTIONS.' + component.changeMode() + '.SLOT.HEADER')
    })
  })

  describe('get data', () => {
    beforeEach(() => {
      component.hasCreatePermission = false
      component.hasEditPermission = false
      component.hasViewPermission = false
      component.dialogTitleKey = undefined
      component.slotForm.reset()
    })

    it('should successful - VIEW', () => {
      slotsAPIService.getSlot.and.returnValue(of(slot))
      component.hasViewPermission = true
      component.slot = slot
      spyOn(component, 'getSlot')
      fixture.componentRef.setInput('displayDialog', false)
      fixture.componentRef.setInput('changeMode', 'VIEW')
      fixture.componentRef.setInput('slot', slot)
      fixture.componentRef.setInput('displayDialog', true)

      fixture.detectChanges()

      expect(component.getSlot).toHaveBeenCalled()
      expect(component.slot).toEqual(slot)
      expect(component.dialogTitleKey).toBe('ACTIONS.VIEW.SLOT.HEADER')
    })

    it('should successful - EDIT', () => {
      slotsAPIService.getSlot.and.returnValue(of(slot))
      component.hasEditPermission = true
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('slot', slot)

      fixture.detectChanges()

      expect(component.slot).toEqual(slot)
      expect(component.dialogTitleKey).toBe('ACTIONS.EDIT.SLOT.HEADER')
    })

    it('should successful - CREATE', () => {
      slotsAPIService.getSlot.and.returnValue(of(slot))
      component.hasCreatePermission = true
      fixture.componentRef.setInput('changeMode', 'CREATE')
      fixture.componentRef.setInput('slot', slot)

      fixture.detectChanges()

      expect(component.slot).toEqual(slot)
      expect(component.slot?.id).toBeUndefined()
      expect(component.dialogTitleKey).toBe('ACTIONS.CREATE.SLOT.HEADER')
    })
  })

  describe('Form', () => {
    beforeEach(() => {
      component.slotForm.reset()
    })

    it('should display error if slot form is invalid', () => {
      component.slot = slot
      component.slotForm.reset()
      component.slotForm.patchValue({ name: 'name', appId: 'a', productName: 'p' })
      component.changeMode.set('CREATE')

      component.onSave()

      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'VALIDATION.FORM_INVALID' })
    })
  })

  describe('Creation', () => {
    it('should create slot', () => {
      slotsAPIService.createSlot.and.returnValue(of({}))
      component.slot = slot
      component.slotForm = slotForm
      component.changeMode.set('CREATE')

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
      component.slotForm = slotForm
      component.changeMode.set('CREATE')

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
      component.slotForm = slotForm
      component.changeMode.set('EDIT')

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
      component.slotForm = slotForm
      component.changeMode.set('EDIT')

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
      component.slotForm = slotForm
      component.changeMode.set('EDIT')

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

      expect(component.slot?.undeployed).toBeTrue()
    })
  })

  describe('on tab change', () => {
    it('should set selectedTabIndex onTabChange', () => {
      component.onTabChange(1)
      expect(component.selectedTabIndex).toBe('1')

      component.onTabChange('2')
      expect(component.selectedTabIndex).toBe('2')
    })
  })
})
