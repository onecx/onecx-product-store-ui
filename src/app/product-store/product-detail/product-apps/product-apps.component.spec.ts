import { NO_ERRORS_SCHEMA } from '@angular/core'
//import { ComponentFixture, TestBed, fakeAsync, waitForAsync } from '@angular/core/testing'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { of, throwError } from 'rxjs'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import { ProductAppsComponent } from './product-apps.component'
import {
  MicrofrontendAbstract,
  MicrofrontendsAPIService,
  MicrofrontendPageResult,
  Microservice,
  MicroservicesAPIService,
  MicroservicePageResult,
  Product
} from 'src/app/shared/generated'

import { AppAbstract } from '../../app-search/app-search.component'

const product: Product = {
  id: 'id',
  name: 'prodName',
  basePath: 'path'
}
const mfeApp: AppAbstract = {
  id: 'id',
  appId: 'appId',
  appType: 'MFE',
  appName: 'microfrontend',
  productName: 'prodName'
}
const msApp: AppAbstract = {
  id: 'id',
  appId: 'appId',
  appType: 'MS',
  appName: 'microservice',
  productName: 'prodName'
}
const mfe: MicrofrontendAbstract = {
  id: 'id',
  appId: 'appId',
  appName: 'microfrontend',
  productName: 'prodName',
  remoteBaseUrl: 'remote URL'
}
const ms: Microservice = {
  id: 'id',
  appId: 'appId',
  appName: 'microservice',
  productName: 'prodName'
}

describe('ProductAppsComponent', () => {
  let component: ProductAppsComponent
  let fixture: ComponentFixture<ProductAppsComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const apiMfeServiceSpy = {
    searchMicrofrontends: jasmine.createSpy('searchMicrofrontends').and.returnValue(of({}))
  }
  const apiMsServiceSpy = {
    searchMicroservice: jasmine.createSpy('searchMicroservice').and.returnValue(of({}))
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProductAppsComponent],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        { provide: MicrofrontendsAPIService, useValue: apiMfeServiceSpy },
        { provide: MicroservicesAPIService, useValue: apiMsServiceSpy },
        { provide: PortalMessageService, useValue: msgServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductAppsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    apiMfeServiceSpy.searchMicrofrontends.calls.reset()
    apiMsServiceSpy.searchMicroservice.calls.reset()
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should call searchApps onChanges if product exists', () => {
    component.product = product
    spyOn(component, 'searchApps')

    component.ngOnChanges()

    expect(component.searchApps).toHaveBeenCalled()
  })

  it('should search microfrontends and microservices on searchApps', (done) => {
    component.mfes$ = of({ stream: [mfe] })
    component.mss$ = of({ stream: [ms] })

    component.searchApps()

    component.apps$.subscribe({
      next: (result) => {
        expect(result.length).toBe(2)
        done()
      },
      error: done.fail
    })
  })

  xit('should search microfrontends and microservices on searchApps', (done) => {
    apiMfeServiceSpy.searchMicrofrontends.and.returnValue({ stream: [mfe] } as MicrofrontendPageResult)
    apiMsServiceSpy.searchMicroservice.and.returnValue({ stream: [ms] } as MicroservicePageResult)

    //spyOn((component as any).mfeApi, 'searchMicrofrontends').and.returnValue(of({ stream: [mfe] }))
    //const searchMsSpy = spyOn((component as any).msApi, 'searchMicroservices').and.returnValue(of({ stream: [ms] }))

    //component.searchApps()
    component.ngOnChanges()
    /*
    component.apps$.subscribe({
      next: (result) => {
        expect(result.length).toBe(2)
        done()
      },
      error: done.fail
    })
*/
    expect(component.searchApps).toHaveBeenCalled()
  })

  //  fit('should display console error msg on searchApps', fakeAsync((done: DoneFn) => {
  xit('should display console error msg on searchApps', (done) => {
    const err = { status: 404 }
    //apiMfeServiceSpy.searchMicrofrontends.and.returnValue(throwError(() => err))
    //apiMsServiceSpy.searchMicroservice.and.returnValue(of({ stream: [ms] }))
    const searchMfeSpy = spyOn((component as any).mfeApi, 'searchMicrofrontends').and.returnValue(throwError(() => err))
    const searchMsSpy = spyOn((component as any).msApi, 'searchMicroservices').and.returnValue(of({ stream: [ms] }))
    /*
     */
    spyOn(console, 'error')

    component.searchApps()

    component.apps$.subscribe({
      next: (result) => {
        expect(result.length).toBe(1)
        done()
      },
      error: done.fail
    })
    expect(searchMfeSpy).toHaveBeenCalledWith({
      mfeAndMsSearchCriteria: { productName: component.product?.name }
    })
    expect(searchMsSpy).toHaveBeenCalledWith({
      mfeAndMsSearchCriteria: { productName: component.product?.name }
    })
    /*
     */
    expect(console.error).toHaveBeenCalled()
  })

  it('should set correct value onLayoutChange', () => {
    const viewMode = 'EDIT'

    component.onLayoutChange(viewMode)

    expect(component.viewMode).toEqual('EDIT')
  })

  it('should set correct values onFilterChange', () => {
    const filter = 'filter'

    component.onFilterChange(filter)

    expect(component.filter).toEqual(filter)
  })

  it('should set correct value onSortChange', () => {
    const sortField = 'field'

    component.onSortChange(sortField)

    expect(component.sortField).toEqual(sortField)
  })

  it('should set correct value onSortDirChange', () => {
    let asc = true
    component.onSortDirChange(asc)
    expect(component.sortOrder).toEqual(-1)

    asc = false
    component.onSortDirChange(asc)
    expect(component.sortOrder).toEqual(1)
  })

  it('should behave correctly onDetail for MFE', () => {
    const mockEvent = { stopPropagation: jasmine.createSpy() }

    component.onDetail(mockEvent, mfeApp)

    expect(component.app).toEqual(mfeApp)
    expect(component.changeMode).toEqual('EDIT')
    expect(component.displayDetailDialog).toBeTrue()
  })

  it('should behave correctly onDetail for MS', () => {
    const mockEvent = { stopPropagation: jasmine.createSpy() }

    component.onDetail(mockEvent, msApp)

    expect(component.app).toEqual(msApp)
    expect(component.changeMode).toEqual('EDIT')
    expect(component.displayDetailDialog).toBeTrue()
  })

  it('should behave correctly onCopy', () => {
    const mockEvent = { stopPropagation: jasmine.createSpy() }

    component.onCopy(mockEvent, mfeApp)

    expect(component.app).toEqual(mfeApp)
    expect(component.changeMode).toEqual('COPY')
    expect(component.displayDetailDialog).toBeTrue()
  })

  it('should should behave correctly onCreate', () => {
    component.onCreate()

    expect(component.changeMode).toEqual('CREATE')
    expect(component.app).toBeUndefined()
    expect(component.displayDetailDialog).toBeTrue()
  })

  it('should behave correctly onDelete', () => {
    const mockEvent = { stopPropagation: jasmine.createSpy() }

    component.onDelete(mockEvent, mfeApp)

    expect(component.app).toEqual(mfeApp)
    expect(component.displayDeleteDialog).toBeTrue()
  })

  it('should call searchApps if app changed', () => {
    spyOn(component, 'searchApps')

    component.appChanged(true)

    expect(component.searchApps).toHaveBeenCalled()
    expect(component.displayDetailDialog).toBeFalse()
  })

  it('should call searchApps if app deleted', () => {
    spyOn(component, 'searchApps')

    component.appDeleted(true)

    expect(component.searchApps).toHaveBeenCalled()
    expect(component.displayDetailDialog).toBeFalse()
  })
})
