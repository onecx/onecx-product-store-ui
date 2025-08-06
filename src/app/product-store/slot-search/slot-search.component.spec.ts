import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { Router, ActivatedRoute } from '@angular/router'
import { of, throwError } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { DataViewModule } from 'primeng/dataview'
import { Table } from 'primeng/table'

import { UserService } from '@onecx/angular-integration-interface'
import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Product, ProductsAPIService, SlotsAPIService, SlotPageResult, Slot } from 'src/app/shared/generated'
import { SlotData, SlotSearchComponent } from './slot-search.component'

const products: Product[] = [
  {
    id: 'id1',
    name: 'product1',
    displayName: 'Product 1',
    basePath: '/product1'
  },
  {
    id: 'id2',
    name: 'product2',
    displayName: 'Product 2',
    basePath: '/product2'
  }
]
const slots: Slot[] = [
  {
    id: 'id1',
    name: 'slot-1',
    appId: 'appId1',
    productName: products[0].name
  },
  {
    id: 'id2',
    name: 'slot-2',
    appId: 'appId2',
    productName: products[1].name,
    operator: true,
    deprecated: true,
    undeployed: true
  },
  {
    id: 'id4',
    name: 'slot-4',
    appId: 'appId1',
    productName: products[0].name,
    operator: true
  },
  {
    id: 'id3',
    name: 'slot-3',
    appId: 'appId2',
    productName: products[1].name,
    deprecated: true,
    undeployed: true
  }
]

describe('SlotSearchComponent', () => {
  let component: SlotSearchComponent
  let fixture: ComponentFixture<SlotSearchComponent>
  const routerSpy = jasmine.createSpyObj('Router', ['navigate'])
  const routeMock = { snapshot: { paramMap: new Map() } }

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['get'])
  const apiProductsServiceSpy = {
    searchProducts: jasmine.createSpy('searchProducts').and.returnValue(of({ stream: [] }))
  }
  const apiSlotsServiceSpy = {
    searchSlots: jasmine.createSpy('searchSlots').and.returnValue(of({ stream: [] }))
  }
  const mockUserService = {
    lang$: {
      getValue: jasmine.createSpy('getValue').and.returnValue('de')
    },
    hasPermission: jasmine.createSpy('hasPermission').and.callFake((permission) => {
      return ['APP#CREATE', 'APP#EDIT', 'APP#VIEW'].includes(permission)
    })
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SlotSearchComponent],
      imports: [
        DataViewModule,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: UserService, useValue: mockUserService },
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: ProductsAPIService, useValue: apiProductsServiceSpy },
        { provide: SlotsAPIService, useValue: apiSlotsServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(async () => {
    fixture = TestBed.createComponent(SlotSearchComponent)
    component = fixture.componentInstance
    fixture.componentInstance.ngOnInit() // solved ExpressionChangedAfterItHasBeenCheckedError
  })

  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
    apiProductsServiceSpy.searchProducts.calls.reset()
    apiSlotsServiceSpy.searchSlots.calls.reset()
    translateServiceSpy.get.calls.reset()
  })

  describe('initialize', () => {
    it('should create', () => {
      expect(component).toBeTruthy()
    })
    it('dataview translations', (done) => {
      const translationData = {
        'DIALOG.DATAVIEW.SORT_BY': 'sortBy'
      }
      const translateService = TestBed.inject(TranslateService)
      spyOn(translateService, 'get').and.returnValue(of(translationData))

      component.ngOnInit()

      component.dataViewControlsTranslations$?.subscribe({
        next: (data) => {
          if (data) {
            expect(data.sortDropdownTooltip).toEqual('sortBy')
          }
          done()
        },
        error: done.fail
      })
    })
  })

  describe('page actions', () => {
    it('should navigate to Products when button clicked and actionCallback executed', () => {
      component.ngOnInit()

      if (component.actions$) {
        component.actions$.subscribe((actions) => {
          const firstAction = actions[0]
          firstAction.actionCallback()
          expect(routerSpy.navigate).toHaveBeenCalledWith(['..'], { relativeTo: routeMock })
        })
      }
    })

    it('should navigate to Endpoints when button clicked and actionCallback executed', () => {
      component.ngOnInit()

      if (component.actions$) {
        component.actions$.subscribe((actions) => {
          const firstAction = actions[1]
          firstAction.actionCallback()
          expect(routerSpy.navigate).toHaveBeenCalledWith(['../endpoints'], { relativeTo: routeMock })
        })
      }
    })

    it('should navigate to Apps when button clicked and actionCallback executed', () => {
      component.ngOnInit()

      if (component.actions$) {
        component.actions$.subscribe((actions) => {
          const firstAction = actions[2]
          firstAction.actionCallback()
          expect(routerSpy.navigate).toHaveBeenCalledWith(['../apps'], { relativeTo: routeMock })
        })
      }
    })
  })

  describe('search', () => {
    describe('successful', () => {
      it('should search slots - successful found, no condition', (done) => {
        apiProductsServiceSpy.searchProducts.and.returnValue(of({ stream: products }))
        apiSlotsServiceSpy.searchSlots.and.returnValue(of({ stream: slots }))

        component.onSearch()

        component.slots$.subscribe({
          next: (result) => {
            expect(result.length).toBe(4)
            done()
          },
          error: done.fail
        })
      })

      it('should search slots - successful found, with condition', (done) => {
        apiProductsServiceSpy.searchProducts.and.returnValue(of({ stream: products }))
        apiSlotsServiceSpy.searchSlots.and.returnValue(of({ stream: slots }))
        component.searchCriteria.controls['productName'].setValue(products[0].name)

        component.onSearch()

        component.slots$.subscribe({
          next: (result) => {
            expect(result.length).toBe(4)
            done()
          },
          error: done.fail
        })
      })

      it('should search slots - successful not found', (done) => {
        apiProductsServiceSpy.searchProducts.and.returnValue(of({ stream: products }))
        apiSlotsServiceSpy.searchSlots.and.returnValue(of({ stream: [] } as SlotPageResult))

        component.onSearch()

        component.slotData$.subscribe({
          next: (result) => {
            expect(result.length).toBe(0)
            done()
          },
          error: done.fail
        })
      })
    })

    describe('successful without products', () => {
      it('should search slots - no product stream', (done) => {
        apiProductsServiceSpy.searchProducts.and.returnValue(of({}))
        apiSlotsServiceSpy.searchSlots.and.returnValue(of({ stream: slots }))

        component.onSearch()

        component.slotData$.subscribe({
          next: (result) => {
            expect(result.length).toBe(4)
            expect(result[0].productName).toBe(result[0].productDisplayName)
            done()
          },
          error: done.fail
        })
      })

      it('should search slots - product error', (done) => {
        const errorResponse = { status: 401, statusText: 'Not authorized' }
        apiProductsServiceSpy.searchProducts.and.returnValue(throwError(() => errorResponse))
        apiSlotsServiceSpy.searchSlots.and.returnValue(of({ stream: slots }))
        spyOn(console, 'error')

        component.onSearch()

        component.slotData$.subscribe({
          next: (result) => {
            expect(result.length).toBe(4)
            expect(result[0].productName).toBe(result[0].productDisplayName)
            expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.PRODUCTS')
            expect(console.error).toHaveBeenCalledWith('searchProducts', errorResponse)
            done()
          },
          error: done.fail
        })
      })

      it('should search slots - slot error', (done) => {
        const errorResponse = { status: 401, statusText: 'Not authorized' }
        apiProductsServiceSpy.searchProducts.and.returnValue(of({ stream: products }))
        apiSlotsServiceSpy.searchSlots.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')

        component.onSearch()

        component.slotData$.subscribe({
          next: (result) => {
            expect(result.length).toBe(0)
            expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.SLOTS')
            expect(console.error).toHaveBeenCalledWith('searchSlots', errorResponse)
            done()
          },
          error: done.fail
        })
      })
    })

    describe('slot issues', () => {
      it('should search slots - no slots', (done) => {
        apiProductsServiceSpy.searchProducts.and.returnValue(of({ stream: products }))
        apiSlotsServiceSpy.searchSlots.and.returnValue(of({ stream: [], totalElements: 0 } as SlotPageResult))

        component.onSearch()

        component.slotData$.subscribe({
          next: (result) => {
            expect(result.length).toBe(0)
            expect(msgServiceSpy.info).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.SEARCH.NOT_FOUND' })
            done()
          },
          error: done.fail
        })
      })

      it('should search slots - no slot data', (done) => {
        apiProductsServiceSpy.searchProducts.and.returnValue(of({ stream: products }))
        apiSlotsServiceSpy.searchSlots.and.returnValue(of({} as SlotPageResult))

        component.onSearch()

        component.slotData$.subscribe({
          next: (result) => {
            expect(result.length).toBe(0)
            done()
          },
          error: done.fail
        })
      })

      it('should search slots - failed: slot error', (done) => {
        const errorResponse = { status: 401, statusText: 'Not authorized' }
        apiProductsServiceSpy.searchProducts.and.returnValue(of({ stream: products }))
        apiSlotsServiceSpy.searchSlots.and.returnValue(throwError(() => errorResponse))
        spyOn(console, 'error')

        component.onSearch()

        component.slotData$.subscribe({
          next: (result) => {
            expect(result.length).toBe(0)
            expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.SLOTS')
            expect(console.error).toHaveBeenCalledWith('searchSlots', errorResponse)
            done()
          },
          error: done.fail
        })
      })
    })
  })

  describe('Helper', () => {
    it('should get displayname', () => {
      const n = component['getProductDisplayName']('name', [])
      expect(n).toBe('name')
    })
    it('should get displayname', () => {
      const n = component['getProductDisplayName']('name-xyz', [products[0]])
      expect(n).toBe('name-xyz')
    })
  })

  describe('UI actions', () => {
    it('should set filter values', () => {
      component.onFilterChange('text to filter')
      expect().nothing()
    })

    it('should reset search criteria onSearchReset', () => {
      spyOn(component.searchCriteria, 'reset')

      component.onSearchReset()

      expect(component.searchCriteria.reset).toHaveBeenCalled()
    })

    it('should navigate back onBack', () => {
      component.onBack()

      expect(routerSpy.navigate).toHaveBeenCalledWith(['../'], { relativeTo: routeMock })
    })

    it('should stop event propagation and navigate to the product onGotoProduct', () => {
      const event = { stopPropagation: jasmine.createSpy() }

      component.onGotoProduct(event as any, { ...slots[0] } as SlotData)

      expect(event.stopPropagation).toHaveBeenCalled()
      expect(routerSpy.navigate).toHaveBeenCalledWith(['../', slots[0].productName], {
        fragment: 'apps',
        relativeTo: routeMock
      })
    })

    it('should stop event propagation on click', () => {
      const event: any = { stopPropagation: jasmine.createSpy() }

      component.onClick(event)

      expect(event.stopPropagation).toHaveBeenCalled()
    })
  })

  describe('detail', () => {
    it('should stop event propagation and open slot detail in edit mode', () => {
      const event = { stopPropagation: jasmine.createSpy() }
      component.hasEditPermission = true

      component.onSlotDetail('VIEW', event as any, { ...slots[0] } as SlotData)

      expect(event.stopPropagation).toHaveBeenCalled()
      expect(component.displaySlotDetailDialog).toBeTrue()
      expect(component.changeMode).toBe('VIEW')
    })

    it('should stop event propagation and open slot detail in view mode', () => {
      const event = { stopPropagation: jasmine.createSpy() }
      component.hasEditPermission = false

      component.onSlotDetail('VIEW', event as any, { ...slots[0] } as SlotData)

      expect(event.stopPropagation).toHaveBeenCalled()
      expect(component.displaySlotDetailDialog).toBeTrue()
      expect(component.changeMode).toBe('VIEW')
    })

    it('should get slot change event', () => {
      component.slotChanged(true)

      expect().nothing()
    })
  })

  describe('delete', () => {
    it('should call deletion dialog', () => {
      const event = { stopPropagation: jasmine.createSpy() }

      component.onSlotDelete(event as any, slots[0])

      expect(event.stopPropagation).toHaveBeenCalled()
      expect(component.displaySlotDeleteDialog).toBeTrue()
    })

    it('should refresh search results after deletion', () => {
      spyOn(component, 'onSearch')
      component.slotDeleted(true)

      expect(component.displaySlotDeleteDialog).toBeFalse()
      expect(component.onSearch).toHaveBeenCalled()
    })
  })

  /**
   * Language tests
   */
  describe('language', () => {
    it('should set a German date format', () => {
      expect(component.dateFormat).toEqual('dd.MM.yyyy HH:mm:ss')
    })

    it('should set default date format', () => {
      mockUserService.lang$.getValue.and.returnValue('en')
      fixture = TestBed.createComponent(SlotSearchComponent)
      component = fixture.componentInstance
      fixture.detectChanges()
      expect(component.dateFormat).toEqual('M/d/yy, hh:mm:ss a')
    })
  })

  /*
   * FILTER
   */
  describe('table column filtering', () => {
    it('should filter data for products', () => {
      component.onFilterItemChangeProduct({ value: 'prod' })

      expect().nothing()
    })

    it('should filter data for states', () => {
      component.onFilterItemChangeState({ value: 11 })

      expect().nothing()
    })
  })

  /*
   * SORT
   */
  describe('table column sorting', () => {
    it('should return 0 when sorting permissions without appIds or prod names', () => {
      const slotData: SlotData[] = []
      slotData[0] = { ...slots[0], productDisplayName: 'abc', stateValue: 1 }
      slotData[1] = { ...slots[1], productDisplayName: 'abc', stateValue: 1 }
      slotData[2] = { ...slots[1], productDisplayName: 'bca', stateValue: 11 }

      let result = 0
      result = (component as any).sortRowByProductAsc(slotData[0], slotData[2])
      expect(result).toBe(-1)
      result = (component as any).sortRowByProductAsc(slotData[0], slotData[1])
      expect(result).toBe(-1)

      result = (component as any).sortByProductDesc(slotData[0], slotData[2])
      expect(result).toBe(1)
      result = (component as any).sortByProductDesc(slotData[0], slotData[1])
      expect(result).toBe(1)
    })

    it('should set icon class and sort by descending when icon class is "sort-amount-down"', () => {
      const slotData: SlotData[] = []
      slotData[0] = { ...slots[0], productDisplayName: 'abc', stateValue: 1 }
      slotData[1] = { ...slots[1], productDisplayName: 'abc', stateValue: 1 }
      slotData[2] = { ...slots[1], productDisplayName: 'bca', stateValue: 11 }
      const event = new MouseEvent('click')
      const icon = document.createElement('span')
      icon.className = 'pi pi-fw pi-sort-amount-down'

      spyOn(event, 'stopPropagation')
      component.dataTable = {
        clear: jasmine.createSpy(),
        _value: [slotData[0], slotData[1]],
        filterGlobal: jasmine.createSpy()
      } as unknown as Table

      component.onSortProducts(event, icon)

      expect(event.stopPropagation).toHaveBeenCalled()
      expect(component.dataTable.clear).toHaveBeenCalled()
      expect(icon.className).toBe('pi pi-fw pi-sort-amount-up-alt')
    })

    it('should set icon class and sort by descending when icon class is "sort-amount-up-alt"', () => {
      const slotData: SlotData[] = []
      slotData[0] = { ...slots[0], productDisplayName: 'abc', stateValue: 1 }
      slotData[1] = { ...slots[1], productDisplayName: 'abc', stateValue: 1 }
      slotData[2] = { ...slots[1], productDisplayName: 'bca', stateValue: 11 }
      const event = new MouseEvent('click')
      const icon = document.createElement('span')
      icon.className = 'pi pi-fw pi-sort-amount-up-alt'

      spyOn(event, 'stopPropagation')
      component.dataTable = {
        clear: jasmine.createSpy(),
        _value: [slotData[0], slotData[1]],
        filterGlobal: jasmine.createSpy()
      } as unknown as Table

      component.onSortProducts(event, icon)

      expect(event.stopPropagation).toHaveBeenCalled()
      expect(component.dataTable.clear).toHaveBeenCalled()
      expect(icon.className).toBe('pi pi-fw pi-sort-amount-down')
    })
  })
})
