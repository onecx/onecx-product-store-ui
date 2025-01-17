import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { of, throwError } from 'rxjs'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import { AppType, ProductAppsComponent } from './product-apps.component'
import {
  MicrofrontendAbstract,
  MicrofrontendPageResult,
  MicrofrontendType,
  Microservice,
  Product,
  ProductDetails,
  ProductsAPIService,
  Slot,
  SlotPageItem
} from 'src/app/shared/generated'

import { AppAbstract } from '../../app-search/app-search.component'

describe('ProductAppsComponent', () => {
  let component: ProductAppsComponent
  let fixture: ComponentFixture<ProductAppsComponent>

  const product: Product = { id: 'id', name: 'prodName', basePath: 'path' }
  const mfeApp: AppAbstract = {
    id: 'id',
    appId: 'appId',
    appType: 'MFE',
    appName: 'microfrontend',
    productName: 'prodName',
    appTypeKey: 'APP.MFE'
  }
  const msApp: AppAbstract = {
    id: 'id',
    appId: 'appId',
    appType: 'MS',
    appName: 'microservice',
    productName: 'prodName',
    appTypeKey: 'APP.MS'
  }
  const mfe: MicrofrontendAbstract = {
    id: 'id',
    appId: 'appId',
    appName: 'microfrontend',
    productName: 'prodName',
    remoteBaseUrl: 'remote URL'
  }
  const ms: Microservice = { id: 'id', appId: 'appId', appName: 'microservice', productName: 'prodName' }

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const productServiceSpy = {
    getProductDetailsByCriteria: jasmine.createSpy('getProductDetailsByCriteria').and.returnValue(of({}))
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProductAppsComponent],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        { provide: ProductsAPIService, useValue: productServiceSpy },
        { provide: PortalMessageService, useValue: msgServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductAppsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    productServiceSpy.getProductDetailsByCriteria.and.returnValue(of({} as MicrofrontendPageResult))
    component.product = product
    component.exceptionKey = ''
  })

  afterEach(() => {
    productServiceSpy.getProductDetailsByCriteria.calls.reset()
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should call searchApps onChanges if product exists', () => {
    component.product = product
    spyOn(component, 'searchProducts')

    component.ngOnChanges()

    expect(component.searchProducts).toHaveBeenCalled()
  })

  /**
   * SEARCH
   */
  describe('searchProducts', () => {
    it('should search microfrontends and microservices', (done) => {
      component.product = product
      productServiceSpy.getProductDetailsByCriteria.and.returnValue(
        of({ microfrontends: [mfe], microservices: [ms] } as ProductDetails)
      )

      component.searchProducts()

      component.productDetails$.subscribe({
        next: (result) => {
          expect(result.microfrontends?.length).toBe(1)
          expect(result.microservices?.length).toBe(1)
          done()
        },
        error: done.fail
      })
    })

    it('should catch error on searchProducts', (done) => {
      const errorResponse = { status: 401, statusText: 'Not authorized' }
      productServiceSpy.getProductDetailsByCriteria.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.searchProducts()

      component.productDetails$.subscribe({
        next: (result) => {
          expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.APPS')
          expect(console.error).toHaveBeenCalledWith('getProductDetailsByCriteria', errorResponse)
          done()
        },
        error: done.fail
      })
    })
  })

  describe('sortMfesByTypeAndExposedModule', () => {
    it('should sort by type and then by exposedModule', () => {
      const mfeA: MicrofrontendAbstract = {
        type: MicrofrontendType.Component,
        exposedModule: 'moduleA'
      } as MicrofrontendAbstract
      const mfeB: MicrofrontendAbstract = {
        type: MicrofrontendType.Component,
        exposedModule: 'moduleB'
      } as MicrofrontendAbstract
      const mfeC: MicrofrontendAbstract = {
        type: MicrofrontendType.Module,
        exposedModule: 'moduleC'
      } as MicrofrontendAbstract

      expect(component.sortMfesByTypeAndExposedModule(mfeA, mfeB)).toBeLessThan(0)
      expect(component.sortMfesByTypeAndExposedModule(mfeB, mfeA)).toBeGreaterThan(0)
      expect(component.sortMfesByTypeAndExposedModule(mfeA, mfeC)).toBeLessThan(0)
      expect(component.sortMfesByTypeAndExposedModule(mfeC, mfeA)).toBeGreaterThan(0)
      expect(component.sortMfesByTypeAndExposedModule(mfeA, mfeA)).toBe(0)
    })

    it('should handle undefined or empty values', () => {
      let mfeA, mfeB: MicrofrontendAbstract
      // test undefined exposedModule
      mfeA = { type: MicrofrontendType.Component } as MicrofrontendAbstract
      mfeB = { type: MicrofrontendType.Component } as MicrofrontendAbstract
      expect(component.sortMfesByTypeAndExposedModule(mfeA, mfeB)).toBe(0)

      // test undefined type
      mfeA = { exposedModule: 'modA' } as MicrofrontendAbstract
      mfeB = { exposedModule: 'modB' } as MicrofrontendAbstract
      expect(component.sortMfesByTypeAndExposedModule(mfeA, mfeB)).toBe(-1)
    })
  })

  describe('sortMssByAppId', () => {
    it('should sort by appId', () => {
      const msA: Microservice = { appId: 'a' } as Microservice
      const msB: Microservice = { appId: 'b' } as Microservice
      const msC: Microservice = { appId: 'a' } as Microservice

      expect(component.sortMssByAppId(msA, msB)).toBeLessThan(0)
      expect(component.sortMssByAppId(msB, msA)).toBeGreaterThan(0)
      expect(component.sortMssByAppId(msA, msC)).toBe(0)
    })

    it('should handle undefined or empty values', () => {
      const msA: Microservice = { appId: 'a' } as Microservice
      const msB: Microservice = {} as Microservice
      const msC: Microservice = { appId: '' } as Microservice

      expect(component.sortMssByAppId(msA, msB)).toBeGreaterThan(0)
      expect(component.sortMssByAppId(msB, msA)).toBeLessThan(0)
      expect(component.sortMssByAppId(msB, msC)).toBe(0)
    })
  })

  describe('sortSlotsByName', () => {
    it('should sort by name', () => {
      const slotA: SlotPageItem = { name: 'a' } as SlotPageItem
      const slotB: SlotPageItem = { name: 'b' } as SlotPageItem
      const slotC: SlotPageItem = { name: 'a' } as SlotPageItem

      expect(component.sortSlotsByName(slotA, slotB)).toBeLessThan(0)
      expect(component.sortSlotsByName(slotB, slotA)).toBeGreaterThan(0)
      expect(component.sortSlotsByName(slotA, slotC)).toBe(0)
    })

    it('should handle undefined or empty values', () => {
      const slotA: SlotPageItem = { name: 'a' } as SlotPageItem
      const slotB: SlotPageItem = {} as SlotPageItem
      const slotC: SlotPageItem = { name: '' } as SlotPageItem

      expect(component.sortSlotsByName(slotA, slotB)).toBeGreaterThan(0)
      expect(component.sortSlotsByName(slotB, slotA)).toBeLessThan(0)
      expect(component.sortSlotsByName(slotB, slotC)).toBe(0)
    })
  })

  /**
   * UI EVENTS
   */
  describe('onDetail', () => {
    const mockEvent = { stopPropagation: jasmine.createSpy() }

    it('should display details of an mfe', () => {
      component.onDetail(mockEvent, mfeApp, AppType.MFE)

      expect(component.app).toEqual(mfeApp)
      expect(component.changeMode).toEqual('EDIT')
      expect(component.displayDetailDialog).toBeTrue()
    })

    it('should display details of an ms', () => {
      component.onDetail(mockEvent, msApp, AppType.MS)

      expect(component.app).toEqual(msApp)
      expect(component.changeMode).toEqual('EDIT')
      expect(component.displayDetailDialog).toBeTrue()
    })
  })

  it('should display details to copy', () => {
    const mockEvent = { stopPropagation: jasmine.createSpy() }

    component.onCopy(mockEvent, mfeApp, AppType.MFE)

    expect(component.app).toEqual(mfeApp)
    expect(component.changeMode).toEqual('COPY')
    expect(component.displayDetailDialog).toBeTrue()
  })

  it('should should show create dialog', () => {
    component.onCreate()

    expect(component.changeMode).toEqual('CREATE')
    expect(component.app).toBeUndefined()
    expect(component.displayDetailDialog).toBeTrue()
  })

  it('should display delete dialog', () => {
    const mockEvent = { stopPropagation: jasmine.createSpy() }

    component.onDelete(mockEvent, mfeApp, AppType.MFE)

    expect(component.app).toEqual(mfeApp)
    expect(component.displayDeleteDialog).toBeTrue()
  })

  it('should call searchProducts if app changed', () => {
    spyOn(component, 'searchProducts')

    component.appChanged(true)

    expect(component.searchProducts).toHaveBeenCalled()
    expect(component.displayDetailDialog).toBeFalse()
  })

  it('should call searchProducts if app deleted', () => {
    spyOn(component, 'searchProducts')

    component.appDeleted(true)

    expect(component.searchProducts).toHaveBeenCalled()
    expect(component.displayDetailDialog).toBeFalse()
  })

  describe('onSlotDelete', () => {
    it('should prepare slot deletion', () => {
      const event = { stopPropagation: jasmine.createSpy('stopPropagation') }
      const slot: Slot = { id: 'id', name: 'Test Slot' } as Slot

      component.onSlotDelete(event, slot)

      expect(event.stopPropagation).toHaveBeenCalled()
      expect(component.slot).toEqual(slot)
      expect(component.displaySlotDeleteDialog).toBe(true)
    })
  })

  describe('slotDeleted', () => {
    it('should set displaySlotDeleteDialog to false', () => {
      component.displaySlotDeleteDialog = true

      component.slotDeleted(false)

      expect(component.displaySlotDeleteDialog).toBe(false)
    })

    it('should call searchProducts when slot has been deleted', () => {
      spyOn(component, 'searchProducts')
      component.displaySlotDeleteDialog = true

      component.slotDeleted(true)

      expect(component.displaySlotDeleteDialog).toBe(false)
      expect(component.searchProducts).toHaveBeenCalled()
    })

    it('should not call searchProducts when slot has not been deleted', () => {
      spyOn(component, 'searchProducts')
      component.displaySlotDeleteDialog = true

      component.slotDeleted(false)

      expect(component.displaySlotDeleteDialog).toBe(false)
      expect(component.searchProducts).not.toHaveBeenCalled()
    })
  })
})
