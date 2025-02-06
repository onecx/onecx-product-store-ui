import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { PortalMessageService } from '@onecx/portal-integration-angular'

import { MicrofrontendsAPIService, MicroservicesAPIService } from 'src/app/shared/generated'
import { AppAbstract } from '../app-search/app-search.component'
import { AppDeleteComponent } from './app-delete.component'

describe('AppDeleteComponent', () => {
  let component: AppDeleteComponent
  let fixture: ComponentFixture<AppDeleteComponent>
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
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const apiMfeServiceSpy = {
    deleteMicrofrontend: jasmine.createSpy('deleteMicrofrontend').and.returnValue(of({}))
  }
  const apiMsServiceSpy = {
    deleteMicroservice: jasmine.createSpy('deleteMicroservice').and.returnValue(of({}))
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AppDeleteComponent],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MicrofrontendsAPIService, useValue: apiMfeServiceSpy },
        { provide: MicroservicesAPIService, useValue: apiMsServiceSpy },
        { provide: PortalMessageService, useValue: msgServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppDeleteComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })
  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    apiMfeServiceSpy.deleteMicrofrontend.calls.reset()
    apiMsServiceSpy.deleteMicroservice.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should behave correctly onDialogHide', () => {
    spyOn(component.appDeleted, 'emit')

    component.onDialogHide()

    expect(component.appDeleted.emit).toHaveBeenCalledWith(false)
  })

  it('should delete mfe onConfirmDeletion', () => {
    spyOn(component.appDeleted, 'emit')
    component.appAbstract = appMfe

    component.onConfirmDeletion()

    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.APP.OK' })
    expect(component.appDeleted.emit).toHaveBeenCalledWith(true)
  })

  it('should display error if api call fails onConfirmDeletion: mfe', () => {
    apiMfeServiceSpy.deleteMicrofrontend.and.returnValue(throwError(() => new Error()))
    component.appAbstract = appMfe

    component.onConfirmDeletion()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.APP.NOK' })
  })

  it('should delete ms onConfirmDeletion', () => {
    apiMsServiceSpy.deleteMicroservice.and.returnValue(of({}))
    component.appAbstract = appMs

    component.onConfirmDeletion()

    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.APP.OK' })
  })

  it('should display error if api call fails onConfirmDeletion: ms', () => {
    apiMsServiceSpy.deleteMicroservice.and.returnValue(throwError(() => new Error()))
    component.appAbstract = appMs

    component.onConfirmDeletion()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.APP.NOK' })
  })
})
