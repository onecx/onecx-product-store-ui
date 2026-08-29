import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideRouter, Router } from '@angular/router'
import { BehaviorSubject, of, throwError } from 'rxjs'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { DataSortDirection, RowListGridData } from '@onecx/angular-accelerator'
import { UserService } from '@onecx/angular-integration-interface'
import { PermissionService } from '@onecx/angular-utils'

import {
  Product,
  ProductAbstract,
  ProductCriteria,
  ProductPageResult,
  ProductsAPIService
} from 'src/app/shared/generated'

import { ProductSearchComponent } from './product-search.component'

describe('ProductSearchComponent', () => {
  let component: ProductSearchComponent
  let fixture: ComponentFixture<ProductSearchComponent>
  let router: Router

  const product: Product = {
    id: 'id',
    name: 'name',
    basePath: 'basePath',
    displayName: 'displayName',
    provider: 'team',
    classifications: ['test']
  }
  const productSearchCriterias: ProductCriteria = {
    providers: ['team'],
    classifications: ['test']
  }
  const apiProductServiceSpy = {
    searchProducts: jasmine.createSpy('searchProducts').and.returnValue(of({ stream: [] })),
    getProductSearchCriteria: jasmine.createSpy('getProductSearchCriteria').and.returnValue(of({}))
  }
  const mockUserService = {
    lang$: new BehaviorSubject<string>('en'),
    hasPermission: jasmine.createSpy('hasPermission').and.returnValue(Promise.resolve(true)),
    getPermission: jasmine.createSpy('getPermission').and.returnValue(Promise.resolve(true))
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ProductSearchComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '', component: ProductSearchComponent }])
      ]
    })
      .overrideComponent(ProductSearchComponent, {
        add: {
          providers: [
            { provide: PermissionService, useValue: { hasPermission: () => of(true) } },
            { provide: ProductsAPIService, useValue: apiProductServiceSpy },
            { provide: UserService, useValue: mockUserService }
          ]
        }
      })
      .compileComponents()
  }))

  beforeEach(async () => {
    fixture = TestBed.createComponent(ProductSearchComponent)
    component = fixture.componentInstance
    router = TestBed.inject(Router)

    //fixture.detectChanges() // deactivated due to trouble with OneCX components
    fixture.componentInstance.ngOnInit() // solved ExpressionChangedAfterItHasBeenCheckedError
  })

  afterEach(() => {
    apiProductServiceSpy.getProductSearchCriteria.and.returnValue(of({}))
    apiProductServiceSpy.searchProducts.and.returnValue(of({ stream: [] }))
  })

  describe('initialize', () => {
    it('should create', () => {
      expect(component).toBeTruthy()
    })

    it('should expose displayedColumnKeys for all data view columns', () => {
      expect(component.displayedColumnKeys).toEqual(component.interactiveColumns.map((column) => column.id))
    })
  })

  describe('onGlobalFilter', () => {
    it('should filter the product list onGlobalFilter - empty filter', fakeAsync(() => {
      const filter = ''
      apiProductServiceSpy.searchProducts.and.returnValue(of({ stream: [product] } as ProductPageResult))

      component.onSearch()
      component.onGlobalFilter(filter)
      tick()

      expect(component.globalFilterValue).toEqual(filter)
      const data = component.filteredData$.value
      expect(data).toHaveSize(1)
    }))

    it('should filter the product list onGlobalFilter', fakeAsync(() => {
      const filter = 'name'
      apiProductServiceSpy.searchProducts.and.returnValue(of({ stream: [product] } as ProductPageResult))

      component.onSearch()
      component.onGlobalFilter(filter)
      tick()

      expect(component.globalFilterValue).toEqual(filter)
      const data = component.filteredData$.value
      expect(data).toHaveSize(1)
      expect(data[0].name).toBe(product.name)
    }))

    it('should clear the product list filter onGlobalFilter', fakeAsync(() => {
      const filter = 'non-existent'
      apiProductServiceSpy.searchProducts.and.returnValue(of({ stream: [product] } as ProductPageResult))

      component.onSearch()
      component.onGlobalFilter(filter)
      tick()

      const data = component.filteredData$.value
      expect(data).toHaveSize(0)
    }))

    it('should filter products - ignore empty column content', fakeAsync(() => {
      const filter = 'name'
      // this product should be ignored successfully
      const product2 = { ...product, name: 'new', displayName: undefined } as ProductAbstract
      apiProductServiceSpy.searchProducts.and.returnValue(of({ stream: [product, product2] } as ProductPageResult))

      component.onSearch()
      component.onGlobalFilter(filter)
      tick()

      const data = component.filteredData$.value
      expect(data).toHaveSize(1)
    }))
  })

  describe('UI actions', () => {
    it('should prepare action buttons on init', () => {
      spyOn(component, 'onAppSearch')
      spyOn(component, 'onEndpointSearch')
      spyOn(component, 'onSlotSearch')
      spyOn(component, 'onNewProduct')

      component.ngOnInit()

      let actions: any = []
      component.actions$!.subscribe((act) => (actions = act))

      actions[0].actionCallback()
      actions[1].actionCallback()
      actions[2].actionCallback()
      actions[3].actionCallback()

      expect(component.onAppSearch).toHaveBeenCalled()
      expect(component.onEndpointSearch).toHaveBeenCalled()
      expect(component.onSlotSearch).toHaveBeenCalled()
      expect(component.onNewProduct).toHaveBeenCalled()
    })

    it('should set correct value onLayoutChange', () => {
      const viewMode = 'list'

      component.onLayoutChange(viewMode)

      expect(component.viewMode).toEqual('list')
    })

    it('should set correct value onSortChange', () => {
      const interactiveSortField = 'field'

      component.onSortChange(interactiveSortField)

      expect(component.interactiveSortField).toEqual(interactiveSortField)
    })

    it('should set correct value onSortDirChange', () => {
      let asc = true
      component.onSortDirChange(asc)
      expect(component.interactiveSortOrder).toEqual(-1)

      asc = false
      component.onSortDirChange(asc)
      expect(component.interactiveSortOrder).toEqual(1)
    })

    it('should set interactive filters onInteractiveFiltersChange', () => {
      const filters = [{ columnId: 'global', value: 'test' }]

      component.onInteractiveFiltersChange(filters)

      expect(component.interactiveFilters).toEqual(filters)
    })

    it('should set sort values onInteractiveSorted', () => {
      component.onInteractiveSorted({ sortColumn: 'name', sortDirection: DataSortDirection.DESCENDING })

      expect(component.interactiveSortField).toBe('name')
      expect(component.interactiveSortDirection).toBe(DataSortDirection.DESCENDING)
      expect(component.interactiveSortOrder).toBe(-1)

      component.onInteractiveSorted({ sortColumn: 'name', sortDirection: DataSortDirection.ASCENDING })

      expect(component.interactiveSortOrder).toBe(1)
    })
  })

  describe('searching', () => {
    it('should search products - on init with success', () => {
      apiProductServiceSpy.searchProducts.and.returnValue(of({ stream: [product] } as ProductPageResult))
      apiProductServiceSpy.getProductSearchCriteria.and.returnValue(of(productSearchCriterias))
      spyOn(component, 'onSearch')
      spyOn<any>(component, 'getProductSearchCriterias')

      component.ngOnInit()

      expect(component.onSearch).toHaveBeenCalled()
      expect(component['getProductSearchCriterias']).toHaveBeenCalled()
    })

    it('should search products - on init failed', (done) => {
      apiProductServiceSpy.searchProducts.and.returnValue(of({ stream: [product] } as ProductPageResult))
      const errorResponse = { status: 401, statusText: 'Not authorized' }
      apiProductServiceSpy.getProductSearchCriteria.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.ngOnInit()

      const sub = component.productSearchCriterias$.subscribe({
        next: (result) => {
          expect(result.providers).toEqual([])
          expect(result.classifications).toEqual([])
          done()
        },
        error: done.fail
      })
      sub.unsubscribe()
      expect(console.error).toHaveBeenCalledWith('getProductSearchCriteria', errorResponse)
    })

    it('should search products - successful found', (done) => {
      apiProductServiceSpy.searchProducts.and.returnValue(of({ stream: [product] } as ProductPageResult))
      component.searchCriteriaForm.controls['name'].setValue(product.name)
      component.searchCriteriaForm.controls['providers'].setValue([])
      component.searchCriteriaForm.controls['classifications'].setValue([])

      component.onSearch()

      const sub = component.products$.subscribe({
        next: (result) => {
          expect(result).toHaveSize(1)
          result.forEach((product) => {
            expect(product.id).toEqual('id')
          })
          done()
        },
        error: done.fail
      })
      sub.unsubscribe()
    })

    it('should search products - successful not found', (done) => {
      apiProductServiceSpy.searchProducts.and.returnValue(of({ stream: [] } as ProductPageResult))

      component.onSearch()

      const sub = component.products$.subscribe({
        next: (result) => {
          expect(result).toHaveSize(0)
          done()
        },
        error: done.fail
      })
      sub.unsubscribe()
    })

    it('should search products - no stream', (done) => {
      apiProductServiceSpy.searchProducts.and.returnValue(of({} as ProductPageResult))

      component.onSearch()

      const sub = component.products$.subscribe({
        next: (result) => {
          expect(result).toHaveSize(0)
          done()
        },
        error: done.fail
      })
      sub.unsubscribe()
    })

    it('should search products - failed', (done) => {
      const errorResponse = { status: 4012, statusText: 'Not authorized' }
      apiProductServiceSpy.searchProducts.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.onSearch()

      const sub = component.products$.subscribe({
        next: (result) => {
          if (result) {
            expect(result).toHaveSize(0)
            expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.PRODUCTS')
            expect(console.error).toHaveBeenCalledWith('searchProducts', errorResponse)
          }
          done()
        },
        error: done.fail
      })
      sub.unsubscribe()
    })

    it('should reset productSearchCriteriaGroup onSearchReset', () => {
      spyOn(component.searchCriteriaForm, 'reset')

      component.onSearchReset()

      expect(component.searchCriteriaForm.reset).toHaveBeenCalled()
    })
  })

  describe('navigate', () => {
    it('should navigate to new product onNewProduct', () => {
      const routerSpy = spyOn(router, 'navigate')

      component.onNewProduct()

      expect(routerSpy).toHaveBeenCalledWith(['./new'], jasmine.any(Object))
    })

    it('should navigate to apps onAppSearch', () => {
      const routerSpy = spyOn(router, 'navigate')

      component.onAppSearch()

      expect(routerSpy).toHaveBeenCalledWith(['./apps'], jasmine.any(Object))
    })

    it('should navigate to slots onSlotSearch', () => {
      const routerSpy = spyOn(router, 'navigate')

      component.onEndpointSearch()

      expect(routerSpy).toHaveBeenCalledWith(['./endpoints'], jasmine.any(Object))
    })

    it('should navigate to slots onSlotSearch', () => {
      const routerSpy = spyOn(router, 'navigate')

      component.onSlotSearch()

      expect(routerSpy).toHaveBeenCalledWith(['./slots'], jasmine.any(Object))
    })

    it('should navigate to detail page - name exists', () => {
      const routerSpy = spyOn(router, 'navigate')

      const product = { name: 'product' }
      component.onAppClick(product as unknown as RowListGridData)

      expect(routerSpy).toHaveBeenCalledWith(['./', product.name], jasmine.any(Object))
    })

    it('should navigate to detail page - name does not exist', () => {
      const routerSpy = spyOn(router, 'navigate')

      const product = { displayName: 'product' }
      component.onAppClick(product as unknown as RowListGridData)

      expect(routerSpy).not.toHaveBeenCalled()
    })
  })

  describe('sort', () => {
    it('should sort products by display name', () => {
      const p1 = { displayName: 'b product' }
      const p2 = { displayName: 'a product' }

      const result = component.sortProductsByDisplayName(p1 as ProductAbstract, p2 as ProductAbstract)

      expect(result).toBe(1)
    })

    it('should sort products by display name - ignore non-existing display names', () => {
      const p1 = { displayName: 'a product' }
      const p2 = { name: 'b product' }

      const result = component.sortProductsByDisplayName(p1 as ProductAbstract, p2 as ProductAbstract)

      expect(result).toBe(1)
    })
  })

  describe('logo', () => {
    it('should getLogoUrl from existing product', () => {
      const product = { id: 'id', name: 'product', imageUrl: 'url' }

      const result = component.getLogoUrl(product)

      expect(result).toEqual(product.imageUrl)
    })

    it('should getLogoUrl from image api if not from existing product', () => {
      const product = { id: 'id', name: '' }

      const result = component.getLogoUrl(product)

      expect(result).toEqual('')
    })

    it('should getLogoUrl from image api if not from existing product', () => {
      const product = undefined

      const result = component.getLogoUrl(product)

      expect(result).toBeUndefined()
    })
  })
})
