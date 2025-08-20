import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { Router, ActivatedRoute } from '@angular/router'
import { BehaviorSubject, of, throwError } from 'rxjs'
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
    productName: products[0].name,
    undeployed: true
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
    deprecated: true
  },
  {
    id: 'id3',
    name: 'slot-3',
    appId: 'appId2',
    productName: products[1].name,
    operator: true,
    deprecated: true,
    undeployed: true
  },
  {
    id: 'id5',
    name: 'slot-3',
    appId: 'appId3',
    productName: products[1].name,
    operator: true,
    deprecated: false,
    undeployed: true
  }
]
const slotData: SlotData[] = [
  { ...slots[0], productDisplayName: products[0].displayName ?? '' },
  { ...slots[1], productDisplayName: products[1].displayName ?? '' },
  { ...slots[2], productDisplayName: products[0].displayName ?? '' },
  { ...slots[3], productDisplayName: products[1].displayName ?? '' },
  { ...slots[4], productDisplayName: products[1].displayName ?? '' }
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
    it('slot state translations', (done) => {
      const translationData = {
        'INTERNAL.OPERATOR': 'operator',
        'INTERNAL.UNDEPLOYED': 'undeployed',
        'INTERNAL.DEPRECATED': 'deprecated'
      }
      const translateService = TestBed.inject(TranslateService)
      spyOn(translateService, 'get').and.returnValue(of(translationData))

      component.ngOnInit()

      component.filterStateValues$?.subscribe({
        next: (data) => {
          if (data) {
            expect(data.length).toBe(3)
          }
          done()
        },
        error: done.fail
      })
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

  describe('search slots', () => {
    describe('successful', () => {
      it('should search slots - successful found, no condition', (done) => {
        apiProductsServiceSpy.searchProducts.and.returnValue(of({ stream: products }))
        apiSlotsServiceSpy.searchSlots.and.returnValue(of({ stream: slots }))

        component.onSearch()

        component.slots$.subscribe({
          next: (result) => {
            expect(result.length).toBe(5)
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
            expect(result.length).toBe(5)
            done()
          },
          error: done.fail
        })
      })

      it('should search slots - successful not found', (done) => {
        apiProductsServiceSpy.searchProducts.and.returnValue(of({ stream: products }))
        apiSlotsServiceSpy.searchSlots.and.returnValue(of({ stream: [], totalElements: 0 } as SlotPageResult))

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
      it('should get slots - no product stream', (done) => {
        apiProductsServiceSpy.searchProducts.and.returnValue(of({}))
        apiSlotsServiceSpy.searchSlots.and.returnValue(of({ stream: slots }))

        component.onSearch()

        component.slotData$.subscribe({
          next: (result) => {
            expect(result.length).toBe(5)
            expect(result[0].productName).toBe(result[0].productDisplayName)
            done()
          },
          error: done.fail
        })
      })

      it('should get slots - ignore product error', (done) => {
        const errorResponse = { status: 401, statusText: 'Not authorized' }
        apiProductsServiceSpy.searchProducts.and.returnValue(throwError(() => errorResponse))
        apiSlotsServiceSpy.searchSlots.and.returnValue(of({ stream: slots }))
        spyOn(console, 'error')

        component.onSearch()

        component.slotData$.subscribe({
          next: (result) => {
            expect(result.length).toBe(5)
            expect(result[0].productName).toBe(result[0].productDisplayName)
            expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.PRODUCTS')
            expect(console.error).toHaveBeenCalledWith('searchProducts', errorResponse)
            done()
          },
          error: done.fail
        })
      })
    })

    describe('slot issues', () => {
      beforeEach(() => {
        apiProductsServiceSpy.searchProducts.and.returnValue(of({ stream: products }))
      })

      it('should manage no slot data', (done) => {
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

      it('should display slot search error', (done) => {
        const errorResponse = { status: 402, statusText: 'Not authorized' }
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

      component.onSlotDetail('VIEW', event as any, { ...slots[0] } as SlotData)

      expect(event.stopPropagation).toHaveBeenCalled()
      expect(component.displaySlotDetailDialog).toBeTrue()
      expect(component.changeMode).toBe('VIEW')
    })

    it('should stop event propagation and open slot detail in view mode', () => {
      const event = { stopPropagation: jasmine.createSpy() }

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
   * FILTER Basics
   */
  describe('table filtering', () => {
    describe('global filter', () => {
      it('should filter string data based on filterData', () => {
        component.resultData$ = new BehaviorSubject(slotData)
        ;(component as any).filterData = slots[0].name

        component.filteredData$ = new BehaviorSubject(slotData)

        component.ngOnInit()

        component.filteredData$.subscribe((filteredData) => {
          expect(filteredData.length).toEqual(1)
        })
      })

      it('should filter object data based on filterData', () => {
        component.resultData$ = new BehaviorSubject(slotData)
        ;(component as any).filterData = ['operator', 'undeployed', 'deprecated']

        component.filteredData$ = new BehaviorSubject(slotData)

        component.ngOnInit()

        component.filteredData$.subscribe((filteredData) => {
          expect(filteredData.length).toEqual(5)
        })
      })
      it('should filter object data based on filterData', () => {
        component.resultData$ = new BehaviorSubject(slotData)
        ;(component as any).filterData = ['undeployed']

        component.filteredData$ = new BehaviorSubject(slotData)

        component.ngOnInit()

        component.filteredData$.subscribe((filteredData) => {
          expect(filteredData.length).toEqual(4)
        })
      })
      it('should filter object data based on filterData', () => {
        component.resultData$ = new BehaviorSubject(slotData)
        ;(component as any).filterData = ['deprecated']

        component.filteredData$ = new BehaviorSubject(slotData)

        component.ngOnInit()

        component.filteredData$.subscribe((filteredData) => {
          expect(filteredData.length).toEqual(3)
        })
      })
    })

    describe('column filter with icon toggle', () => {
      it('should use string filter - with/without slash/fill icon', () => {
        let filter = 'newFilter'
        const resultDataSpy = spyOn(component.resultData$, 'next')
        const icon = document.createElement('span')
        icon.className = 'pi pi-filter'

        component.onFilterChange(filter, icon)

        expect((component as any).filterData).toEqual(filter)
        expect(resultDataSpy).toHaveBeenCalledWith(component.resultData$.value)

        component.onFilterChange(filter, icon, true)
        icon.className = 'pi pi-filter-slash'
        component.onFilterChange(filter, icon)
        filter = ''
        component.onFilterChange(filter, icon)
      })

      it('should use object filter - with/without slash/fill icon', () => {
        let filter = ['operator', 'deprecated']
        const resultDataSpy = spyOn(component.resultData$, 'next')
        const icon = document.createElement('span')

        icon.className = 'pi pi-filter'
        component.onFilterChange(filter, icon)

        expect((component as any).filterData).toEqual(filter)
        expect(resultDataSpy).toHaveBeenCalledWith(component.resultData$.value)

        icon.className = 'pi pi-filter-slash'
        component.onFilterChange(filter, icon)
        filter = []
        component.onFilterChange(filter, icon)
      })
    })
  })

  /*
   * FILTER UI Actions
   */
  describe('filter actions', () => {
    it('should toggle slot state filter', () => {
      const ev: MouseEvent = new MouseEvent('type')
      const options = {
        show: () => {
          /* do something */
        },
        hide: () => {
          /* do something */
        }
      }
      spyOn(ev, 'stopPropagation')

      component.filterPanelSlotStateVisible = true
      component.onToggleFilterSlotState(ev, options)

      expect(ev.stopPropagation).toHaveBeenCalled()

      component.filterPanelSlotStateVisible = false
      component.onToggleFilterSlotState(ev, options)
    })

    it('should toggle slot name filter', () => {
      const ev: MouseEvent = new MouseEvent('type')
      const options = {
        show: () => {
          /* do something */
        },
        hide: () => {
          /* do something */
        }
      }
      const icon = document.createElement('span')
      icon.className = 'pi pi-filter-slash'
      spyOn(ev, 'stopPropagation')

      component.filterPanelSlotNameVisible = true
      component.onToggleFilterSlotName(ev, options, icon)

      expect(ev.stopPropagation).toHaveBeenCalled()

      component.filterPanelSlotNameVisible = false
      component.onToggleFilterSlotName(ev, options, icon)
    })

    it('should toggle product filter', () => {
      const ev: MouseEvent = new MouseEvent('type')
      const options = {
        show: () => {
          /* do something */
        },
        hide: () => {
          /* do something */
        }
      }
      const icon = document.createElement('span')
      icon.className = 'pi pi-filter-slash'
      spyOn(ev, 'stopPropagation')

      component.filterPanelProductVisible = true
      component.onToggleFilterProduct(ev, options, icon)

      expect(ev.stopPropagation).toHaveBeenCalled()

      component.filterPanelProductVisible = false
      component.onToggleFilterProduct(ev, options, icon)
    })

    it('should reset filter icons', () => {
      const defaultIcon = 'pi pi-filter'
      const elemRef1 = { nativeElement: { className: 'test' } }
      const elemRef2 = { nativeElement: { className: 'test' } }
      const elemRef3 = { nativeElement: { className: 'test' } }
      component.headerFilterIconSlotName = elemRef1
      component.headerFilterIconSlotState = elemRef2
      component.headerFilterIconProduct = elemRef3

      component.onResetFilterIcons('filter value', ['slotName', 'slotState', 'product'])

      expect(component.headerFilterIconSlotName.nativeElement.className).toBe(defaultIcon)
      expect(component.headerFilterIconSlotState.nativeElement.className).toBe(defaultIcon)
      expect(component.headerFilterIconProduct.nativeElement.className).toBe(defaultIcon)
    })
  })

  /*
   * SORT
   */
  describe('table column sorting', () => {
    beforeEach(() => {
      component.dataTable = {
        clear: () => {},
        _value: slotData,
        filterGlobal: jasmine.createSpy()
      } as unknown as Table
    })

    it('should sort slot states - up', () => {
      const event = { stopPropagation: jasmine.createSpy() } as any
      const icon = document.createElement('span')
      icon.className = 'pi pi-sort-amount-up-alt'

      component.onSortColumn(event, 'slotName', icon)

      expect(event.stopPropagation).toHaveBeenCalled()
      expect(icon.className).toBe('pi pi-sort-amount-down')
    })

    it('should sort slot states - down', () => {
      const event = { stopPropagation: jasmine.createSpy() } as any
      const icon = document.createElement('span')
      icon.className = 'pi pi-sort-amount-down'

      component.onSortColumn(event, 'slotName', icon)

      expect(event.stopPropagation).toHaveBeenCalled()
      expect(icon.className).toBe('pi pi-sort-amount-up-alt')
    })

    it('should sort slot states - up', () => {
      const event = { stopPropagation: jasmine.createSpy() } as any
      const icon = document.createElement('span')
      icon.className = 'pi pi-sort-amount-up-alt'

      component.onSortColumn(event, 'slotState', icon)

      expect(event.stopPropagation).toHaveBeenCalled()
      expect(icon.className).toBe('pi pi-sort-amount-down')
    })

    it('should sort slot states - down', () => {
      const event = { stopPropagation: jasmine.createSpy() } as any
      const icon = document.createElement('span')
      icon.className = 'pi pi-sort-amount-down'

      component.onSortColumn(event, 'slotState', icon)

      expect(event.stopPropagation).toHaveBeenCalled()
      expect(icon.className).toBe('pi pi-sort-amount-up-alt')
    })

    it('should sort slot states - up', () => {
      const event = { stopPropagation: jasmine.createSpy() } as any
      const icon = document.createElement('span')
      icon.className = 'pi pi-sort-amount-up-alt'

      component.onSortColumn(event, 'product', icon)

      expect(event.stopPropagation).toHaveBeenCalled()
      expect(icon.className).toBe('pi pi-sort-amount-down')
    })

    it('should sort slot states - down', () => {
      const event = { stopPropagation: jasmine.createSpy() } as any
      const icon = document.createElement('span')
      icon.className = 'pi pi-sort-amount-down'

      component.onSortColumn(event, 'product', icon)

      expect(event.stopPropagation).toHaveBeenCalled()
      expect(icon.className).toBe('pi pi-sort-amount-up-alt')
    })
  })
})
