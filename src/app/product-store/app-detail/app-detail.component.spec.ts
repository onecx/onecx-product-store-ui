import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { of, throwError } from 'rxjs'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { PortalMessageService, ConfigurationService, UserService } from '@onecx/portal-integration-angular'
import { AppDetailComponent, MfeForm, MsForm } from './app-detail.component'
import {
  MicrofrontendsAPIService,
  MicroservicesAPIService,
  Microfrontend,
  Microservice
} from 'src/app/shared/generated'
import { AppAbstract } from '../app-search/app-search.component'

const form = new FormGroup<MfeForm>({
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

const msForm = new FormGroup<MsForm>({
  appId: new FormControl('id', Validators.minLength(2)),
  appName: new FormControl('appName'),
  appVersion: new FormControl('version'),
  productName: new FormControl('product'),
  description: new FormControl('')
})

const mfe: Microfrontend = {
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

const ms: Microservice = {
  appId: 'appId',
  id: 'id',
  appName: 'name',
  productName: 'productName',
  appVersion: 'version',
  description: 'description'
}

describe('AppDetailComponent', () => {
  let component: AppDetailComponent
  let fixture: ComponentFixture<AppDetailComponent>

  const appMfe: AppAbstract = {
    id: 'id',
    appId: 'appId',
    appType: 'MFE',
    appName: 'name',
    productName: 'productName'
  }

  const appMs: AppAbstract = {
    id: 'id',
    appId: 'appId',
    appType: 'MS',
    appName: 'name',
    productName: 'productName'
  }

  const mfeApiServiceSpy = {
    getMicrofrontendByAppId: jasmine.createSpy('getMicrofrontendByAppId').and.returnValue(of({})),
    createMicrofrontend: jasmine.createSpy('createMicrofrontend').and.returnValue(of({})),
    updateMicrofrontend: jasmine.createSpy('updateMicrofrontend').and.returnValue(of({}))
  }
  const msApiServiceSpy = {
    getMicroserviceByAppId: jasmine.createSpy('getMicroserviceByAppId').and.returnValue(of({})),
    createMicroservice: jasmine.createSpy('createMicroservice').and.returnValue(of({})),
    updateMicroservice: jasmine.createSpy('updateMicroservice').and.returnValue(of({}))
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
        { provide: MicrofrontendsAPIService, useValue: mfeApiServiceSpy },
        { provide: MicroservicesAPIService, useValue: msApiServiceSpy },
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
    mfeApiServiceSpy.getMicrofrontendByAppId.calls.reset()
    mfeApiServiceSpy.createMicrofrontend.calls.reset()
    mfeApiServiceSpy.updateMicrofrontend.calls.reset()
    msApiServiceSpy.getMicroserviceByAppId.calls.reset()
    msApiServiceSpy.createMicroservice.calls.reset()
    msApiServiceSpy.updateMicroservice.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should get call getMfe onChanges if not create mode', () => {
    component.appAbstract = {
      id: 'id',
      appId: 'appId',
      appType: 'MFE',
      appName: 'name',
      productName: 'productName'
    }
    component.displayDialog = true
    component.changeMode = 'EDIT'
    spyOn(component, 'getMfe')

    component.ngOnChanges()

    expect(component.getMfe).toHaveBeenCalled()
  })

  it('should set mfe to undefined onChanges in create mode', () => {
    component.appAbstract = {
      id: 'id',
      appId: 'appId',
      appType: 'MS',
      appName: 'name',
      productName: 'productName'
    }
    component.displayDialog = true
    component.changeMode = 'CREATE'
    spyOn(component, 'getMs')

    component.ngOnChanges()

    expect(component.mfe).toBeUndefined()
  })

  it('should getMfe', () => {
    mfeApiServiceSpy.getMicrofrontendByAppId.and.returnValue(of(mfe))
    component.formGroupMfe = form

    component.getMfe()

    expect(component.mfe).toBe(mfe)
  })

  it('should getMfe and prepare copy', () => {
    mfeApiServiceSpy.getMicrofrontendByAppId.and.returnValue(of(mfe))
    component.formGroupMfe = form
    component.changeMode = 'COPY'
    component.mfe = mfe

    component.getMfe()

    expect(component.mfe.id).toBeUndefined()
  })

  it('should getMs', () => {
    msApiServiceSpy.getMicroserviceByAppId.and.returnValue(of(ms))
    component.changeMode = 'COPY'

    component.getMs()

    expect(component.ms).toBe(ms)
  })

  it('should behave correctly onDialogHide', () => {
    spyOn(component.appChanged, 'emit')

    component.onDialogHide()

    expect(component.appChanged.emit).toHaveBeenCalledWith(false)
  })

  it('should display error if form is invalid onSave', () => {
    component.appAbstract = appMfe
    component.formGroupMfe = new FormGroup<MfeForm>({
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
    mfeApiServiceSpy.createMicrofrontend.and.returnValue(of({}))
    component.appAbstract = appMfe
    component.formGroupMfe = form
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
    mfeApiServiceSpy.createMicrofrontend.and.returnValue(throwError(() => err))
    component.appAbstract = appMfe
    component.formGroupMfe = form
    component.changeMode = 'CREATE'

    component.onSave()

    const expectedKey = ''
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'ACTIONS.CREATE.APP.NOK',
      detailKey: expectedKey
    })
  })

  it('should call updateApp onSave in edit mode', () => {
    mfeApiServiceSpy.updateMicrofrontend.and.returnValue(of({}))
    component.appAbstract = appMfe
    component.formGroupMfe = form
    component.changeMode = 'EDIT'

    component.onSave()

    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EDIT.APP.OK' })
  })

  it('should display save error in edit mode: unique constraint mfe id', () => {
    const err = {
      error: {
        detail: 'error: microfrontend_app_id',
        errorCode: 'PERSIST_ENTITY_FAILED'
      }
    }
    mfeApiServiceSpy.updateMicrofrontend.and.returnValue(throwError(() => err))
    component.appAbstract = appMfe
    component.formGroupMfe = form
    component.changeMode = 'EDIT'

    component.onSave()

    const expectedKey = 'VALIDATION.APP.UNIQUE_CONSTRAINT.APP_ID'
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'ACTIONS.EDIT.APP.NOK',
      detailKey: expectedKey
    })
  })

  it('should display save error in edit mode: unique constraint mfe id', () => {
    const err = {
      error: {
        detail: 'error: microfrontend_remote_module',
        errorCode: 'PERSIST_ENTITY_FAILED'
      }
    }
    mfeApiServiceSpy.updateMicrofrontend.and.returnValue(throwError(() => err))
    component.appAbstract = appMfe
    component.formGroupMfe = form
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
    mfeApiServiceSpy.updateMicrofrontend.and.returnValue(throwError(() => err))
    component.appAbstract = appMfe
    component.formGroupMfe = form
    component.changeMode = 'EDIT'

    component.onSave()

    const expectedKey = 'VALIDATION.ERRORS.INTERNAL_ERROR'
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'ACTIONS.EDIT.APP.NOK',
      detailKey: expectedKey
    })
  })

  it('should display error if form is invalid onSave', () => {
    component.appAbstract = appMfe
    component.formGroupMfe = new FormGroup<MfeForm>({
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
    mfeApiServiceSpy.createMicrofrontend.and.returnValue(of({}))
    component.appAbstract = appMfe
    component.formGroupMfe = form
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
    mfeApiServiceSpy.createMicrofrontend.and.returnValue(throwError(() => err))
    component.appAbstract = appMfe
    component.formGroupMfe = form
    component.changeMode = 'CREATE'

    component.onSave()

    const expectedKey = ''
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'ACTIONS.CREATE.APP.NOK',
      detailKey: expectedKey
    })
  })

  it('should call updateApp onSave in edit mode', () => {
    mfeApiServiceSpy.updateMicrofrontend.and.returnValue(of({}))
    component.appAbstract = appMfe
    component.formGroupMfe = form
    component.changeMode = 'EDIT'

    component.onSave()

    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EDIT.APP.OK' })
  })

  it('should display save error in edit mode: unique constraint mfe id', () => {
    const err = {
      error: {
        detail: 'error: microfrontend_app_id',
        errorCode: 'PERSIST_ENTITY_FAILED'
      }
    }
    mfeApiServiceSpy.updateMicrofrontend.and.returnValue(throwError(() => err))
    component.appAbstract = appMfe
    component.formGroupMfe = form
    component.changeMode = 'EDIT'

    component.onSave()

    const expectedKey = 'VALIDATION.APP.UNIQUE_CONSTRAINT.APP_ID'
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'ACTIONS.EDIT.APP.NOK',
      detailKey: expectedKey
    })
  })

  it('should display save error in edit mode: unique constraint mfe id', () => {
    const err = {
      error: {
        detail: 'error: microfrontend_remote_module',
        errorCode: 'PERSIST_ENTITY_FAILED'
      }
    }
    mfeApiServiceSpy.updateMicrofrontend.and.returnValue(throwError(() => err))
    component.appAbstract = appMfe
    component.formGroupMfe = form
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
    mfeApiServiceSpy.updateMicrofrontend.and.returnValue(throwError(() => err))
    component.appAbstract = appMfe
    component.formGroupMfe = form
    component.changeMode = 'EDIT'

    component.onSave()

    const expectedKey = 'VALIDATION.ERRORS.INTERNAL_ERROR'
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'ACTIONS.EDIT.APP.NOK',
      detailKey: expectedKey
    })
  })

  // ONSAVE TESTS FOR MSS
  it('should display error if form is invalid onSave', () => {
    component.appAbstract = appMs
    component.formGroupMs = new FormGroup<MsForm>({
      appId: new FormControl('i', Validators.minLength(2)),
      appName: new FormControl(''),
      appVersion: new FormControl(''),
      productName: new FormControl(''),
      description: new FormControl('')
    })
    component.changeMode = 'CREATE'

    component.onSave()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'VALIDATION.FORM_INVALID' })
  })

  it('should call createApp onSave in create mode', () => {
    msApiServiceSpy.createMicroservice.and.returnValue(of({}))
    component.appAbstract = appMs
    component.formGroupMs = msForm
    component.changeMode = 'CREATE'

    component.onSave()

    expect(component.formGroupMs.valid).toBeTrue()
    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.CREATE.APP.OK' })
  })

  it('should display save error in create mode', () => {
    const err = {
      error: {
        detail: 'Error',
        errorCode: 'PERSIST_ENTITY_FAILED'
      }
    }
    msApiServiceSpy.createMicroservice.and.returnValue(throwError(() => err))
    component.appAbstract = appMs
    component.formGroupMs = msForm
    component.changeMode = 'CREATE'

    component.onSave()

    const expectedKey = ''
    expect(msgServiceSpy.error).toHaveBeenCalledWith({
      summaryKey: 'ACTIONS.CREATE.APP.NOK',
      detailKey: expectedKey
    })
  })

  it('should call updateApp onSave in edit mode', () => {
    msApiServiceSpy.updateMicroservice.and.returnValue(of({}))
    component.appAbstract = appMs
    component.formGroupMs = msForm
    component.changeMode = 'EDIT'

    component.onSave()

    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EDIT.APP.OK' })
  })

  it('should display save error in edit mode: other internal error', () => {
    const err = {
      error: {
        detail: 'error: microservice_remote_module',
        errorCode: 'other'
      }
    }
    msApiServiceSpy.updateMicroservice.and.returnValue(throwError(() => err))
    component.appAbstract = appMs
    component.formGroupMs = msForm
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
