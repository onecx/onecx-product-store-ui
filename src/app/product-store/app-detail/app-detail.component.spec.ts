import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { of, throwError } from 'rxjs'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { PortalMessageService, ConfigurationService, UserService } from '@onecx/portal-integration-angular'
import { AppDetailComponent, AppDetailForm } from './app-detail.component'
import { MicrofrontendsAPIService, Microfrontend } from 'src/app/shared/generated'

const form = new FormGroup<AppDetailForm>({
  appId: new FormControl('id', Validators.minLength(2)),
  appName: new FormControl(''),
  appVersion: new FormControl(''),
  productName: new FormControl(''),
  description: new FormControl(''),
  technology: new FormControl(''),
  remoteBaseUrl: new FormControl(''),
  remoteEntry: new FormControl(''),
  exposedModule: new FormControl(''),
  classifications: new FormControl(''),
  contact: new FormControl(''),
  iconName: new FormControl(''),
  note: new FormControl('')
})

const app: Microfrontend = {
  appId: 'appId',
  id: 'id',
  appName: 'name',
  remoteBaseUrl: 'url',
  productName: 'productName',
  appVersion: 'version',
  remoteEntry: 'entry',
  description: 'description',
  technology: 'technology',
  contact: 'contact',
  iconName: 'iconName',
  note: 'note',
  exposedModule: 'exposedModule',
  classifications: ['classifications']
}

describe('AppDetailComponent', () => {
  let component: AppDetailComponent
  let fixture: ComponentFixture<AppDetailComponent>

  const apiServiceSpy = {
    getMicrofrontendByAppId: jasmine.createSpy('getMicrofrontendByAppId').and.returnValue(of({})),
    createMicrofrontend: jasmine.createSpy('createMicrofrontend').and.returnValue(of({})),
    updateMicrofrontend: jasmine.createSpy('updateMicrofrontend').and.returnValue(of({}))
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
    hasPermission: jasmine.createSpy('hasPermission').and.callFake((permissionName) => {
      if (permissionName === 'APP#CREATE') {
        return true
      } else if (permissionName === 'APP#EDIT') {
        return true
      } else {
        return false
      }
    })
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AppDetailComponent],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        { provide: MicrofrontendsAPIService, useValue: apiServiceSpy },
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: ConfigurationService, useValue: configServiceSpy },
        { provide: UserService, useValue: mockUserService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    apiServiceSpy.getMicrofrontendByAppId.calls.reset()
    apiServiceSpy.createMicrofrontend.calls.reset()
    apiServiceSpy.updateMicrofrontend.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should get call getApp onChanges if not create mode', () => {
    component.appAbstract = {
      appId: 'appId',
      appName: 'name',
      remoteBaseUrl: 'url',
      id: 'id',
      productName: 'productName'
    }
    component.displayDetailDialog = true
    component.changeMode = 'EDIT'
    spyOn(component, 'getApp')

    component.ngOnChanges()

    expect(component.getApp).toHaveBeenCalled()
  })

  it('should set app to undefined onChanges in create mode', () => {
    component.appAbstract = {
      appId: 'appId',
      appName: 'name',
      remoteBaseUrl: 'url',
      id: 'id',
      productName: 'productName'
    }
    component.displayDetailDialog = true
    component.changeMode = 'CREATE'
    spyOn(component, 'getApp')

    component.ngOnChanges()

    expect(component.app).toBeUndefined()
  })

  it('should getApp', () => {
    apiServiceSpy.getMicrofrontendByAppId.and.returnValue(of(app))
    component.formGroup = form

    component.getApp()

    expect(component.app).toBe(app)
  })

  it('should getApp and prepare copy', () => {
    apiServiceSpy.getMicrofrontendByAppId.and.returnValue(of(app))
    component.formGroup = form
    component.changeMode = 'COPY'
    component.app = app

    component.getApp()

    expect(component.app.id).toBeUndefined()
  })

  it('should behave correctly onDialogHide', () => {
    spyOn(component.displayDetailDialogChange, 'emit')

    component.onDialogHide()

    expect(component.displayDetailDialogChange.emit).toHaveBeenCalledWith(false)
  })

  it('should display error if form is invalid onSave', () => {
    component.formGroup = new FormGroup<AppDetailForm>({
      appId: new FormControl('i', Validators.minLength(2)),
      appName: new FormControl(''),
      appVersion: new FormControl(''),
      productName: new FormControl(''),
      description: new FormControl(''),
      technology: new FormControl(''),
      remoteBaseUrl: new FormControl(''),
      remoteEntry: new FormControl(''),
      exposedModule: new FormControl(''),
      classifications: new FormControl(''),
      contact: new FormControl(''),
      iconName: new FormControl(''),
      note: new FormControl('')
    })
    component.changeMode = 'CREATE'

    component.onSave()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'VALIDATION.FORM_INVALID' })
  })

  it('should call createApp onSave in create mode', () => {
    apiServiceSpy.createMicrofrontend.and.returnValue(of({}))
    component.formGroup = form
    component.changeMode = 'CREATE'

    component.onSave()

    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.CREATE.APP.OK' })
  })

  it('should display save error in create mode', () => {
    const err = {
      error: {
        detail: 'Error',
        errorCode: 'PERSIST_ENTITY_FAILED'
      }
    }
    apiServiceSpy.createMicrofrontend.and.returnValue(throwError(() => err))
    component.formGroup = form
    component.changeMode = 'CREATE'

    component.onSave()

    const expectedKey = ''
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'ACTIONS.CREATE.APP.NOK',
      detailKey: expectedKey
    })
  })

  it('should call updateApp onSave in edit mode', () => {
    apiServiceSpy.updateMicrofrontend.and.returnValue(of({}))
    component.formGroup = form
    component.changeMode = 'EDIT'

    component.onSave()

    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EDIT.APP.OK' })
  })

  it('should display save error in edit mode: unique constraint app id', () => {
    const err = {
      error: {
        detail: 'error: microfrontend_app_id',
        errorCode: 'PERSIST_ENTITY_FAILED'
      }
    }
    apiServiceSpy.updateMicrofrontend.and.returnValue(throwError(() => err))
    component.formGroup = form
    component.changeMode = 'EDIT'

    component.onSave()

    const expectedKey = 'VALIDATION.APP.UNIQUE_CONSTRAINT.APP_ID'
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'ACTIONS.EDIT.APP.NOK',
      detailKey: expectedKey
    })
  })

  it('should display save error in edit mode: unique constraint app id', () => {
    const err = {
      error: {
        detail: 'error: microfrontend_remote_module',
        errorCode: 'PERSIST_ENTITY_FAILED'
      }
    }
    apiServiceSpy.updateMicrofrontend.and.returnValue(throwError(() => err))
    component.formGroup = form
    component.changeMode = 'EDIT'

    component.onSave()

    const expectedKey = 'VALIDATION.APP.UNIQUE_CONSTRAINT.REMOTE_MODULE'
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'ACTIONS.EDIT.APP.NOK',
      detailKey: expectedKey
    })
  })

  it('should display save error in edit mode: other internal error', () => {
    const err = {
      error: {
        detail: 'error: microfrontend_remote_module',
        errorCode: 'other'
      }
    }
    apiServiceSpy.updateMicrofrontend.and.returnValue(throwError(() => err))
    component.formGroup = form
    component.changeMode = 'EDIT'

    component.onSave()

    const expectedKey = 'VALIDATION.ERRORS.INTERNAL_ERROR'
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'ACTIONS.EDIT.APP.NOK',
      detailKey: expectedKey
    })
  })

  it('should call this.user.lang$ from the constructor and set this.dateFormat to the default format if user.lang$ is not de', () => {
    mockUserService.lang$.getValue.and.returnValue('de')
    fixture = TestBed.createComponent(AppDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    expect(component.dateFormat).toEqual('dd.MM.yyyy HH:mm:ss')
  })
})
