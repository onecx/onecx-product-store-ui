import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { Router, ActivatedRoute } from '@angular/router'
import { BehaviorSubject, of, throwError } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { Table } from 'primeng/table'

import { PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import { PortalPageComponent } from '@onecx/angular-utils'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import {
  AngularAcceleratorModule,
  DataSortDirection,
  PageHeaderComponent,
  RowListGridData,
  SearchHeaderComponent
} from '@onecx/angular-accelerator'

import { Product, ProductsAPIService, SlotsAPIService, SlotPageResult, Slot } from 'src/app/shared/generated'
import { ONECX_MOCK_COMPONENTS } from 'src/app/shared/onecx-mock-components'

import { FilteredData, SlotData, SlotSearchComponent } from './slot-search.component'

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
  { ...slots[0], productDisplayName: products[0].displayName ?? '', state: 'undeployed' },
  { ...slots[1], productDisplayName: products[1].displayName ?? '', state: 'operator' },
  { ...slots[2], productDisplayName: products[0].displayName ?? '', state: 'deprecated' },
  { ...slots[3], productDisplayName: products[1].displayName ?? '', state: 'operator' },
  { ...slots[4], productDisplayName: products[1].displayName ?? '', state: 'operator' }
]
const defaulResponseObject = { stream: [], totalElements: 0 }

describe('SlotSearchComponent', () => {
  let component: SlotSearchComponent
  let fixture: ComponentFixture<SlotSearchComponent>
  const routerSpy = jasmine.createSpyObj('Router', ['navigate'])
  const routeMock = { snapshot: { paramMap: new Map() } }
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['get'])
  const apiProductsServiceSpy = {
    searchProducts: jasmine.createSpy('searchProducts').and.returnValue(of(defaulResponseObject))
  }
  const apiSlotsServiceSpy = {
    searchSlots: jasmine.createSpy('searchSlots').and.returnValue(of(defaulResponseObject))
  }
  const mockUserService = {
    lang$: new BehaviorSubject<string>('de'),
    hasPermission: jasmine.createSpy('hasPermission').and.callFake((permission) => {
      return ['APP#CREATE', 'APP#EDIT', 'APP#VIEW'].includes(permission)
    }),
    getPermission: jasmine.createSpy('getPermission').and.returnValue(Promise.resolve(true))
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        SlotSearchComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: routeMock }
      ]
    })
      // replace problematic components with mocks to avoid errors during testing
      .overrideComponent(SlotSearchComponent, {
        remove: {
          imports: [AngularAcceleratorModule, PortalPageComponent, PageHeaderComponent, SearchHeaderComponent]
        },
        add: {
          imports: [...ONECX_MOCK_COMPONENTS],
          providers: [
            { provide: UserService, useValue: mockUserService },
            { provide: PortalMessageService, useValue: msgServiceSpy },
            { provide: ProductsAPIService, useValue: apiProductsServiceSpy },
            { provide: SlotsAPIService, useValue: apiSlotsServiceSpy }
          ]
        }
      })
      .compileComponents()
  }))

  beforeEach(async () => {
    fixture = TestBed.createComponent(SlotSearchComponent)
    component = fixture.componentInstance
    // fixture.detectChanges()
    //  await fixture.whenStable()
    fixture.componentInstance.ngOnInit() // solved ExpressionChangedAfterItHasBeenCheckedError
  })

  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
    apiProductsServiceSpy.searchProducts.calls.reset()
    apiSlotsServiceSpy.searchSlots.calls.reset()
    translateServiceSpy.get.calls.reset()

    apiProductsServiceSpy.searchProducts.and.returnValue(of(defaulResponseObject))
    apiSlotsServiceSpy.searchSlots.and.returnValue(of(defaulResponseObject))
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

      component.filterStateValues$?.subscribe({
        next: (data) => {
          if (data) {
            expect(data).toHaveSize(3)
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
          firstAction.actionCallback?.()
          expect(routerSpy.navigate).toHaveBeenCalledWith(['..'], { relativeTo: routeMock })
        })
      }
    })

    it('should navigate to Endpoints when button clicked and actionCallback executed', () => {
      component.ngOnInit()

      if (component.actions$) {
        component.actions$.subscribe((actions) => {
          const firstAction = actions[1]
          firstAction.actionCallback?.()
          expect(routerSpy.navigate).toHaveBeenCalledWith(['../endpoints'], { relativeTo: routeMock })
        })
      }
    })

    it('should navigate to Apps when button clicked and actionCallback executed', () => {
      component.ngOnInit()

      if (component.actions$) {
        component.actions$.subscribe((actions) => {
          const firstAction = actions[2]
          firstAction.actionCallback?.()
          expect(routerSpy.navigate).toHaveBeenCalledWith(['../apps'], { relativeTo: routeMock })
        })
      }
    })
  })

  describe('searching', () => {
    it('should load slots and products successfully, use cached products when appropriate', fakeAsync(() => {
      const mockP = [{ id: 'p1', name: 'prod1' }]
      const mockS = [{ id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }, { id: 's5', productName: 'prod1' }]

      apiProductsServiceSpy.searchProducts.and.returnValue(of({ stream: mockP, totalElements: mockP.length }))
      apiSlotsServiceSpy.searchSlots.and.returnValue(of({ stream: mockS, totalElements: mockS.length }))
      // search condition set only to trigger the requests, but does not influence the actual filtering logic
      component.searchCriteriaForm.controls['productName'].setValue('prod1')
      component.searchCriteriaForm.controls['slotName'].setValue('s5')
      component['cachedProducts'] = []

      component.onSearch()
      tick()
      //fixture.detectChanges()

      const res = component['resultData$'].getValue()
      expect(res).toHaveSize(5)
      expect(component.loading).toBeFalse()
      expect(component['cachedProducts']).toEqual(mockP)

      // test caching: if product conddition has not changed, cached products should be reused
      component.searchCriteriaForm.controls['slotName'].setValue('s4')

      component.onSearch()
      tick()

      const res2 = component['resultData$'].getValue()
      expect(res2).toHaveSize(5)
      expect(component.loading).toBeFalse()
    }))

    it('should search slots - exceptinal case: no product stream', fakeAsync(() => {
      // empty response object => result should be []
      apiProductsServiceSpy.searchProducts.and.returnValue(of({}))
      apiSlotsServiceSpy.searchSlots.and.returnValue(of({ stream: slots, totalElements: slots.length }))
      // search condition set only to trigger the requests, but does not influence the actual filtering logic
      component.searchCriteriaForm.controls['productName'].setValue(products[1].displayName ?? null)
      component.searchCriteriaForm.controls['slotName'].setValue('slot-3')

      component.onSearch()
      tick()

      const res = component['resultData$'].getValue()
      expect(res).toHaveSize(5)
      expect(component.loading).toBeFalse()
    }))

    it('should search slots - exceptinal case: no slot stream', fakeAsync(() => {
      apiProductsServiceSpy.searchProducts.and.returnValue(of({ stream: products, totalElements: products.length }))
      apiSlotsServiceSpy.searchSlots.and.returnValue(of({} as SlotPageResult))

      // search condition set only to trigger the requests, but does not influence the actual filtering logic
      component.searchCriteriaForm.controls['productName'].setValue(products[1].displayName ?? null)
      component.searchCriteriaForm.controls['slotName'].setValue('slot-3')

      component.onSearch()
      tick()

      const res = component['resultData$'].getValue()
      expect(res).toHaveSize(0)
      expect(component.loading).toBeFalse()
    }))

    it('should search slots - exceptinal case: product request exception', fakeAsync(() => {
      const errorResponse = { status: 401, statusText: 'Not authorized' }
      apiProductsServiceSpy.searchProducts.and.returnValue(throwError(() => errorResponse))
      apiSlotsServiceSpy.searchSlots.and.returnValue(of({} as SlotPageResult))
      // search condition set only to trigger the requests, but does not influence the actual filtering logic
      component.searchCriteriaForm.controls['productName'].setValue(products[1].displayName ?? null)
      component.searchCriteriaForm.controls['slotName'].setValue('slot-3')
      spyOn(console, 'error')

      component.onSearch()
      tick()

      expect(component.exceptionKey).toBe('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.PRODUCTS')
      expect(console.error).toHaveBeenCalledWith('searchProducts', errorResponse)
      const res = component['resultData$'].getValue()
      expect(res).toHaveSize(0)
      expect(component.loading).toBeFalse()
    }))

    it('should search slots - exceptinal case: slot request exception', fakeAsync(() => {
      // no status provided in the error response, should default to 0
      const errorResponse = { statusText: 'Not authorized' }
      apiProductsServiceSpy.searchProducts.and.returnValue(of({ stream: products }))
      apiSlotsServiceSpy.searchSlots.and.returnValue(throwError(() => errorResponse))
      // search condition set only to trigger the requests, but does not influence the actual filtering logic
      component.searchCriteriaForm.controls['productName'].setValue(products[1].displayName ?? null)
      component.searchCriteriaForm.controls['slotName'].setValue('slot-3')
      spyOn(console, 'error')

      component.onSearch()
      tick()

      expect(component.exceptionKey).toBe('EXCEPTIONS.HTTP_STATUS_0.SLOTS')
      expect(console.error).toHaveBeenCalledWith('searchSlots', errorResponse)
      const res = component['resultData$'].getValue()
      expect(res).toHaveSize(0)
      expect(component.loading).toBeFalse()
    }))
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
    it('should return empty slot state when no state is set', () => {
      expect(component['getSlotState']({} as Slot)).toBe('')
    })
    it('should upperValue handle nullish values', () => {
      expect(component['upperValue'](null)).toBe('')
      expect(component['upperValue'](undefined)).toBe('')
    })
    it('should compare slot names when appIds are missing', () => {
      const a = { name: 'same', appId: undefined } as unknown as SlotData
      const b = { name: 'same', appId: undefined } as unknown as SlotData

      expect(component['compareSlotNames'](a, b)).toBe(0)
    })
    it('should compare products when appIds are missing', () => {
      const a = { productDisplayName: 'same' } as unknown as SlotData
      const b = { productDisplayName: 'same' } as unknown as SlotData

      expect(component['compareProducts'](a, b)).toBe(0)
    })
  })

  describe('UI actions', () => {
    it('should set filter values', () => {
      component.onFilterChange('text to filter')
      expect().nothing()
    })

    it('should reset search criteria onSearchReset', () => {
      spyOn(component.searchCriteriaForm, 'reset')

      component.onSearchReset()

      expect(component.searchCriteriaForm.reset).toHaveBeenCalled()
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

    it('should set interactive filters and global filter', () => {
      const filters = [{ columnId: 'global', value: 'test' }]

      component.onInteractiveFiltersChange(filters)

      expect(component.interactiveFilters).toEqual(filters)
      expect(component.filter).toBe('test')
    })

    it('should keep the filter if there is no global filter', () => {
      component.filter = 'test'

      component.onInteractiveFiltersChange([{ columnId: 'someColumn', value: 'someValue' }])

      expect(component.filter).toBe('test')
    })

    it('should set interactive sort values', () => {
      component.onInteractiveSorted({ sortColumn: 'slotName', sortDirection: DataSortDirection.DESCENDING })

      expect(component.interactiveSortField).toBe('slotName')
      expect(component.interactiveSortDirection).toBe(DataSortDirection.DESCENDING)
    })

    it('should handle layout change', () => {
      component.onLayoutChange('list')

      expect().nothing()
    })

    it('should call onSlotCreate from interactive action callback', () => {
      spyOn(component, 'onSlotCreate')

      component.interactiveAdditionalActions[0].callback?.({ ...slots[0] })

      expect(component.onSlotCreate).toHaveBeenCalledWith({ ...slots[0] })
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

    it('should open slot detail dialog in view mode onViewFromInteractive', () => {
      component.onViewFromInteractive({ ...slots[0] } as RowListGridData)

      expect(component.item4Detail).toEqual({ ...slots[0] })
      expect(component.changeMode).toBe('VIEW')
      expect(component.displaySlotDetailDialog).toBeTrue()
    })

    it('should open slot detail dialog in edit mode onEditFromInteractive', () => {
      component.onEditFromInteractive({ ...slots[0] } as RowListGridData)

      expect(component.item4Detail).toEqual({ ...slots[0] })
      expect(component.changeMode).toBe('EDIT')
      expect(component.displaySlotDetailDialog).toBeTrue()
    })

    it('should open slot detail dialog in create mode onSlotCreate', () => {
      component.onSlotCreate({ ...slots[0] } as SlotData)

      expect(component.item4Detail).toEqual({ ...slots[0] })
      expect(component.changeMode).toBe('CREATE')
      expect(component.displaySlotDetailDialog).toBeTrue()
    })
  })

  describe('delete', () => {
    it('should call deletion dialog', () => {
      const event = { stopPropagation: jasmine.createSpy() }

      component.onSlotDelete(event as any, slots[0] as SlotData)

      expect(event.stopPropagation).toHaveBeenCalled()
      expect(component.displaySlotDeleteDialog).toBeTrue()
    })

    it('should refresh search results after deletion', () => {
      spyOn(component, 'onSearch')
      component.slotDeleted(true)

      expect(component.displaySlotDeleteDialog).toBeFalse()
      expect(component.onSearch).toHaveBeenCalled()
    })

    it('should open delete dialog onDeleteFromInteractive', () => {
      component.onDeleteFromInteractive({ ...slots[0] } as RowListGridData)

      expect(component.item4Delete).toEqual({ ...slots[0] } as SlotData)
      expect(component.displaySlotDeleteDialog).toBeTrue()
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
      mockUserService.lang$.next('en')
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
        ;(component as any)['resultData$'] = new BehaviorSubject(slotData)
        component['filterData'] = slots[0].name
        component.filteredData$ = new BehaviorSubject(slotData as FilteredData[])

        component['initGlobalFilter']()

        component.filteredData$.subscribe((filteredData) => {
          expect(filteredData).toHaveSize(1)
        })
      })

      it('should filter object data based on filterData', () => {
        ;(component as any)['resultData$'] = new BehaviorSubject(slotData)
        component['filterData'] = ['operator', 'undeployed', 'deprecated']
        component.filteredData$ = new BehaviorSubject(slotData as FilteredData[])

        component['initGlobalFilter']()

        component.filteredData$.subscribe((filteredData) => {
          expect(filteredData).toHaveSize(5)
        })
      })
      it('should filter object data based on filterData', () => {
        ;(component as any)['resultData$'] = new BehaviorSubject(slotData)
        component['filterData'] = ['undeployed']
        component.filteredData$ = new BehaviorSubject(slotData as FilteredData[])

        component['initGlobalFilter']()

        component.filteredData$.subscribe((filteredData) => {
          expect(filteredData).toHaveSize(4)
        })
      })
      it('should filter object data based on filterData', () => {
        ;(component as any)['resultData$'] = new BehaviorSubject(slotData)
        component['filterData'] = ['deprecated']
        component.filteredData$ = new BehaviorSubject(slotData as FilteredData[])

        component['initGlobalFilter']()

        component.filteredData$.subscribe((filteredData) => {
          expect(filteredData).toHaveSize(3)
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
