import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import { MicrofrontendsAPIService } from 'src/app/shared/generated'
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
    remoteBaseUrl: 'url',
    productName: 'productName'
  }
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const apiMfeServiceSpy = {
    deleteMicrofrontend: jasmine.createSpy('deleteMicrofrontend').and.returnValue(of({})),
    deleteMicroservice: jasmine.createSpy('deleteMicroservice').and.returnValue(of({}))
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AppDeleteComponent],
      imports: [
        HttpClientTestingModule,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        { provide: MicrofrontendsAPIService, useValue: apiMfeServiceSpy },
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
    apiMfeServiceSpy.deleteMicroservice.calls.reset()
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

  it('should display error if api all fails onConfirmDeletion: mfe', () => {
    apiMfeServiceSpy.deleteMicrofrontend.and.returnValue(throwError(() => new Error()))
    component.appAbstract = appMfe

    component.onConfirmDeletion()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.APP.NOK' })
  })

  xit('should delete ms onConfirmDeletion', () => {
    apiMfeServiceSpy.deleteMicroservice.and.returnValue(of({}))
    const appMs: AppAbstract = {
      id: 'id',
      appId: 'appId',
      appType: 'MS',
      appName: 'name',
      remoteBaseUrl: 'url',
      productName: 'productName'
    }
    component.appAbstract = appMs

    component.onConfirmDeletion()

    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.APP.OK' })
  })

  xit('should display error if api all fails onConfirmDeletion: mfe', () => {
    apiMfeServiceSpy.deleteMicroservice.and.returnValue(throwError(() => new Error()))
    const appMs: AppAbstract = {
      id: 'id',
      appId: 'appId',
      appType: 'MS',
      appName: 'name',
      remoteBaseUrl: 'url',
      productName: 'productName'
    }
    component.appAbstract = appMs

    component.onConfirmDeletion()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.DELETE.APP.NOK' })
  })
})
