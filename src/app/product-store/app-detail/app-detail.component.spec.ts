import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { of, throwError } from 'rxjs'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { ConfigurationService, PortalMessageService, UserService } from '@onecx/angular-integration-interface'

import {
  MicrofrontendsAPIService,
  MicroservicesAPIService,
  Microfrontend,
  Microservice,
  MicrofrontendType
} from 'src/app/shared/generated'
import { AppAbstract } from '../app-search/app-search.component'
import { AppDetailComponent, MfeForm, MsForm } from './app-detail.component'

const mfeForm = new FormGroup<MfeForm>({
  appId: new FormControl('id', Validators.minLength(2)),
  appName: new FormControl(''),
  appVersion: new FormControl(''),
  productName: new FormControl(''),
  description: new FormControl(''),
  technology: new FormControl(''),
  type: new FormControl(''),
  remoteBaseUrl: new FormControl(''),
  remoteEntry: new FormControl(''),
  remoteName: new FormControl(''),
  tagName: new FormControl(''),
  exposedModule: new FormControl(''),
  classifications: new FormControl([]),
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
  remoteName: 'remoteName',
  tagName: 'tagName',
  description: 'description',
  technology: 'technology',
  type: MicrofrontendType.Module,
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
    productName: 'productName',
    appTypeKey: 'APP.MFE'
  }

  const appMs: AppAbstract = {
    id: 'id',
    appId: 'appId',
    appType: 'MS',
    appName: 'name',
    productName: 'productName',
    appTypeKey: 'APP.MS'
  }

  const mfeApiServiceSpy = {
    getMicrofrontend: jasmine.createSpy('getMicrofrontend').and.returnValue(of({})),
    createMicrofrontend: jasmine.createSpy('createMicrofrontend').and.returnValue(of({})),
    updateMicrofrontend: jasmine.createSpy('updateMicrofrontend').and.returnValue(of({}))
  }
  const msApiServiceSpy = {
    getMicroservice: jasmine.createSpy('getMicroservice').and.returnValue(of({})),
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
    hasPermission: jasmine.createSpy('hasPermission').and.callFake((permission: string) => {
      return ['APP#CREATE', 'APP#DELETE', 'APP#EDIT', 'APP#VIEW'].includes(permission)
    })
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AppDetailComponent],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
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
    component.displayDialog = true
    fixture.detectChanges()
  })

  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    mfeApiServiceSpy.getMicrofrontend.calls.reset()
    mfeApiServiceSpy.createMicrofrontend.calls.reset()
    mfeApiServiceSpy.updateMicrofrontend.calls.reset()
    msApiServiceSpy.getMicroservice.calls.reset()
    msApiServiceSpy.createMicroservice.calls.reset()
    msApiServiceSpy.updateMicroservice.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('get data on changes', () => {
    describe('mfe', () => {
      beforeEach(() => {
        component.formGroupMfe.reset()
      })

      it('should successful in EDIT mode', () => {
        mfeApiServiceSpy.getMicrofrontend.and.returnValue(of(mfe))
        component.appAbstract = {
          id: 'id',
          appId: 'appId',
          appType: 'MFE',
          appName: 'name',
          productName: 'productName'
        }
        spyOn(component, 'getMfe')

        component.ngOnChanges()

        expect(component.getMfe).toHaveBeenCalled()
      })

      it('should successful with return data - EDIT', () => {
        mfeApiServiceSpy.getMicrofrontend.and.returnValue(of(mfe))
        component.formGroupMfe = mfeForm

        component.getMfe()

        expect(component.mfe).toBe(mfe)
        expect(component.dialogTitleKey).toBe('ACTIONS.EDIT.MFE.HEADER')
      })

      it('should successful with return data - VIEW', () => {
        mfeApiServiceSpy.getMicrofrontend.and.returnValue(of(mfe))
        component.formGroupMfe = mfeForm
        component.hasEditPermission = false

        component.getMfe()

        expect(component.mfe).toBe(mfe)
        expect(component.dialogTitleKey).toBe('ACTIONS.VIEW.MFE.HEADER')
      })

      it('should getMfe and prepare copy', () => {
        mfeApiServiceSpy.getMicrofrontend.and.returnValue(of(mfe))
        component.changeMode = 'COPY'
        component.formGroupMfe = mfeForm

        component.getMfe()

        expect(component.mfe).toBe(mfe)
        expect(component.mfe?.id).toBeUndefined()
        expect(component.dialogTitleKey).toBe('ACTIONS.CREATE.MFE.HEADER')
      })
    })

    describe('ms', () => {
      beforeEach(() => {
        component.formGroupMs.reset()
      })

      it('should set mfe to undefined onChanges in create mode', () => {
        component.appAbstract = {
          id: 'id',
          appId: 'appId',
          appType: 'MS',
          appName: 'name',
          productName: 'productName'
        }
        component.changeMode = 'EDIT'
        spyOn(component, 'getMs')

        component.ngOnChanges()

        expect(component.mfe).toBeUndefined()
      })

      it('should successful with return data - EDIT', () => {
        msApiServiceSpy.getMicroservice.and.returnValue(of(ms))
        component.formGroupMs = msForm

        component.getMs()

        expect(component.ms).toBe(ms)
        expect(component.dialogTitleKey).toBe('ACTIONS.EDIT.MS.HEADER')
      })

      it('should successful with return data - VIEW', () => {
        msApiServiceSpy.getMicroservice.and.returnValue(of(ms))
        component.formGroupMs = msForm
        component.hasEditPermission = false

        component.getMs()

        expect(component.ms).toBe(ms)
        expect(component.dialogTitleKey).toBe('ACTIONS.VIEW.MS.HEADER')
      })

      it('should getMs', () => {
        msApiServiceSpy.getMicroservice.and.returnValue(of(ms))
        component.formGroupMs = msForm
        component.changeMode = 'COPY'

        component.getMs()

        expect(component.ms).toBe(ms)
        expect(component.ms?.id).toBeUndefined()
        expect(component.dialogTitleKey).toBe('ACTIONS.CREATE.MS.HEADER')
      })
    })
  })

  describe('Form', () => {
    it('should display error if mfe form is invalid', () => {
      component.appAbstract = appMfe
      component.formGroupMfe = new FormGroup<MfeForm>({
        appId: new FormControl('i', Validators.minLength(2)),
        appName: new FormControl(''),
        appVersion: new FormControl(''),
        productName: new FormControl(''),
        description: new FormControl(''),
        technology: new FormControl(''),
        type: new FormControl(''),
        remoteBaseUrl: new FormControl(''),
        remoteEntry: new FormControl(''),
        remoteName: new FormControl(''),
        tagName: new FormControl(''),
        exposedModule: new FormControl(''),
        classifications: new FormControl([]),
        contact: new FormControl(''),
        iconName: new FormControl(''),
        note: new FormControl('')
      })
      component.changeMode = 'CREATE'

      component.onSave()

      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'VALIDATION.FORM_INVALID' })
    })

    it('should display error if ms form is invalid', () => {
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
  })

  describe('Creation', () => {
    describe('mfe', () => {
      it('should successful reset', () => {
        component.appAbstract = {
          id: 'id',
          appId: 'appId',
          appType: 'MFE',
          appName: 'name',
          productName: 'productName'
        }
        component.changeMode = 'CREATE'
        spyOn(component, 'getMfe')

        component.ngOnChanges()

        expect(component.mfe).toBeUndefined()
        expect(component.dialogTitleKey).toBe('ACTIONS.CREATE.MFE.HEADER')
      })

      it('should create app', () => {
        mfeApiServiceSpy.createMicrofrontend.and.returnValue(of({}))
        component.appAbstract = appMfe
        component.formGroupMfe = mfeForm
        component.changeMode = 'CREATE'
        component.endpoints = [
          { name: 'name', path: 'path' },
          { name: '', path: 'path' }
        ]

        component.onSave()

        expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.CREATE.APP.OK' })
      })

      it('should display save error in create mode', () => {
        const errorResponse = {
          error: {
            detail: 'Error',
            errorCode: 'PERSIST_ENTITY_FAILED'
          }
        }
        mfeApiServiceSpy.createMicrofrontend.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')
        component.appAbstract = appMfe
        component.formGroupMfe = mfeForm
        component.changeMode = 'CREATE'

        component.onSave()

        const expectedKey = ''
        expect(msgServiceSpy.error).toHaveBeenCalledWith({
          summaryKey: 'ACTIONS.CREATE.APP.NOK',
          detailKey: expectedKey
        })
        expect(console.error).toHaveBeenCalledWith('createMicrofrontend', errorResponse)
      })
    })

    describe('ms', () => {
      it('should successful reset', () => {
        component.appAbstract = {
          id: 'id',
          appId: 'appId',
          appType: 'MS',
          appName: 'name',
          productName: 'productName'
        }
        component.changeMode = 'CREATE'
        spyOn(component, 'getMs')

        component.ngOnChanges()

        expect(component.ms).toBeUndefined()
        expect(component.dialogTitleKey).toBe('ACTIONS.CREATE.MS.HEADER')
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
        const errorResponse = {
          error: {
            detail: 'Error',
            errorCode: 'PERSIST_ENTITY_FAILED'
          }
        }
        msApiServiceSpy.createMicroservice.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')
        component.appAbstract = appMs
        component.formGroupMs = msForm
        component.changeMode = 'CREATE'

        component.onSave()

        const expectedKey = ''
        expect(msgServiceSpy.error).toHaveBeenCalledWith({
          summaryKey: 'ACTIONS.CREATE.APP.NOK',
          detailKey: expectedKey
        })
        expect(console.error).toHaveBeenCalledWith('createMicroservice', errorResponse)
      })
    })
  })

  describe('Updating', () => {
    describe('mfe', () => {
      it('should call updateApp onSave in edit mode', () => {
        mfeApiServiceSpy.updateMicrofrontend.and.returnValue(of({}))
        component.appAbstract = appMfe
        component.formGroupMfe = mfeForm
        component.changeMode = 'EDIT'

        component.onSave()

        expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EDIT.APP.OK' })
      })

      it('should display save error in edit mode: unique constraint mfe id', () => {
        const errorResponse = {
          error: {
            detail: 'error: microfrontend_app_id',
            errorCode: 'PERSIST_ENTITY_FAILED'
          }
        }
        mfeApiServiceSpy.updateMicrofrontend.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')
        component.appAbstract = appMfe
        component.formGroupMfe = mfeForm
        component.changeMode = 'EDIT'

        component.onSave()

        const expectedKey = 'VALIDATION.APP.UNIQUE_CONSTRAINT.APP_ID'
        expect(msgServiceSpy.error).toHaveBeenCalledWith({
          summaryKey: 'ACTIONS.EDIT.APP.NOK',
          detailKey: expectedKey
        })
        expect(console.error).toHaveBeenCalledWith('updateMicrofrontend', errorResponse)
      })

      it('should display save error in edit mode: unique constraint mfe id', () => {
        const errorResponse = {
          error: {
            detail: 'error: microfrontend_remote_module',
            errorCode: 'PERSIST_ENTITY_FAILED'
          }
        }
        mfeApiServiceSpy.updateMicrofrontend.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')
        component.appAbstract = appMfe
        component.formGroupMfe = mfeForm
        component.changeMode = 'EDIT'

        component.onSave()

        const expectedKey = 'VALIDATION.APP.UNIQUE_CONSTRAINT.REMOTE_MODULE'
        expect(msgServiceSpy.error).toHaveBeenCalledWith({
          summaryKey: 'ACTIONS.EDIT.APP.NOK',
          detailKey: expectedKey
        })
        expect(console.error).toHaveBeenCalledWith('updateMicrofrontend', errorResponse)
      })

      it('should display save error in edit mode: other internal error', () => {
        const errorResponse = {
          error: {
            detail: 'error: microfrontend_remote_module',
            errorCode: 'other'
          }
        }
        mfeApiServiceSpy.updateMicrofrontend.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')
        component.appAbstract = appMfe
        component.formGroupMfe = mfeForm
        component.changeMode = 'EDIT'

        component.onSave()

        const expectedKey = 'VALIDATION.ERRORS.INTERNAL_ERROR'
        expect(msgServiceSpy.error).toHaveBeenCalledWith({
          summaryKey: 'ACTIONS.EDIT.APP.NOK',
          detailKey: expectedKey
        })
        expect(console.error).toHaveBeenCalledWith('updateMicrofrontend', errorResponse)
      })
    })

    describe('ms', () => {
      it('should update app', () => {
        msApiServiceSpy.updateMicroservice.and.returnValue(of({}))
        component.appAbstract = appMs
        component.formGroupMs = msForm
        component.changeMode = 'EDIT'

        component.onSave()

        expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EDIT.APP.OK' })
      })

      it('should display save error in edit mode: other internal error', () => {
        const errorResponse = {
          error: {
            detail: 'error: microservice_remote_module',
            errorCode: 'other'
          }
        }
        msApiServiceSpy.updateMicroservice.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')
        component.appAbstract = appMs
        component.formGroupMs = msForm
        component.changeMode = 'EDIT'

        component.onSave()

        const expectedKey = 'VALIDATION.ERRORS.INTERNAL_ERROR'
        expect(msgServiceSpy.error).toHaveBeenCalledWith({
          summaryKey: 'ACTIONS.EDIT.APP.NOK',
          detailKey: expectedKey
        })
        expect(console.error).toHaveBeenCalledWith('updateMicroservice', errorResponse)
      })
    })
  })

  describe('various', () => {
    it('should call this.user.lang$ from the constructor and set this.dateFormat to the default format if user.lang$ is not de', () => {
      mockUserService.lang$.getValue.and.returnValue('de')
      fixture = TestBed.createComponent(AppDetailComponent)
      component = fixture.componentInstance
      fixture.detectChanges()
      expect(component.dateFormat).toEqual('dd.MM.yyyy HH:mm:ss')
    })

    it('should behave correctly onDialogHide', () => {
      spyOn(component.appChanged, 'emit')

      component.onDialogHide()

      expect(component.appChanged.emit).toHaveBeenCalledWith(false)
    })
  })

  describe('endpoint', () => {
    it('should delete an endpoint item', () => {
      component.endpoints = [
        { name: 'name', path: 'path' },
        { name: '', path: 'path' }
      ]

      component.onDeleteEndpointRow(1)

      expect(component.endpoints.length).toBe(1)
    })
  })
})
