import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideRouter, Router } from '@angular/router'
import { of, throwError } from 'rxjs'
import { DataViewModule } from 'primeng/dataview'
import { TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'

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
  const criteria: ProductCriteria = {
    providers: ['team'],
    classifications: ['test']
  }
  const apiProductServiceSpy = {
    searchProducts: jasmine.createSpy('searchProducts').and.returnValue(of({ stream: [] })),
    getProductSearchCriteria: jasmine.createSpy('getProductSearchCriteria').and.returnValue(of({}))
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProductSearchComponent],
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
        provideRouter([{ path: '', component: ProductSearchComponent }]),
        { provide: ProductsAPIService, useValue: apiProductServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(async () => {
    fixture = TestBed.createComponent(ProductSearchComponent)
    component = fixture.componentInstance
    router = TestBed.inject(Router)
    fixture.componentInstance.ngOnInit() // solved ExpressionChangedAfterItHasBeenCheckedError
  })

  describe('initialize', () => {
    it('should create', () => {
      expect(component).toBeTruthy()
    })

    it('dataview translations', (done) => {
      const translationData = {
        'ACTIONS.DATAVIEW.SORT_BY': 'sortBy'
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

  describe('UI page actions', () => {
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
  })

  describe('searching', () => {
    it('should search products - on init with success', () => {
      apiProductServiceSpy.searchProducts.and.returnValue(of({ stream: [product] } as ProductPageResult))
      apiProductServiceSpy.getProductSearchCriteria.and.returnValue(of(criteria))
      spyOn<any>(component, 'searchProducts')
      spyOn<any>(component, 'getCriteria')

      component.ngOnInit()

      expect(component['searchProducts']).toHaveBeenCalled()
      expect(component['getCriteria']).toHaveBeenCalled()
    })

    it('should search products - on init failed', (done) => {
      apiProductServiceSpy.searchProducts.and.returnValue(of({ stream: [product] } as ProductPageResult))
      const errorResponse = { status: 401, statusText: 'Not authorized' }
      apiProductServiceSpy.getProductSearchCriteria.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.ngOnInit()

      component.criteria$.subscribe({
        next: (result) => {
          expect(result.providers).toEqual([])
          expect(result.classifications).toEqual([])
          done()
        },
        error: done.fail
      })
      expect(console.error).toHaveBeenCalledWith('getProductSearchCriteria', errorResponse)
    })

    it('should search products - successful found', (done) => {
      apiProductServiceSpy.searchProducts.and.returnValue(of({ stream: [product] } as ProductPageResult))
      component.searchCriteria.controls['name'].setValue(product.name)

      component.onSearch()

      component.products$.subscribe({
        next: (result) => {
          expect(result.length).toBe(1)
          result.forEach((product) => {
            expect(product.id).toEqual('id')
          })
          done()
        },
        error: done.fail
      })
    })

    it('should search products - successful not found', (done) => {
      apiProductServiceSpy.searchProducts.and.returnValue(of({ stream: [] } as ProductPageResult))

      component.onSearch()

      component.products$.subscribe({
        next: (result) => {
          expect(result.length).toBe(0)
          done()
        },
        error: done.fail
      })
    })

    it('should search products - no stream', (done) => {
      apiProductServiceSpy.searchProducts.and.returnValue(of({} as ProductPageResult))

      component.onSearch()

      component.products$.subscribe({
        next: (result) => {
          expect(result.length).toBe(0)
          done()
        },
        error: done.fail
      })
    })

    it('should search products - failed', (done) => {
      const errorResponse = { status: 401, statusText: 'Not authorized' }
      apiProductServiceSpy.searchProducts.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.onSearch()

      component.products$.subscribe({
        next: (result) => {
          if (result) {
            expect(result.length).toBe(0)
            expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.PRODUCTS')
            expect(console.error).toHaveBeenCalledWith('searchProducts', errorResponse)
          }
          done()
        },
        error: done.fail
      })
    })
  })

  it('should reset productSearchCriteriaGroup onSearchReset', () => {
    spyOn(component.searchCriteria, 'reset')

    component.onSearchReset()

    expect(component.searchCriteria.reset).toHaveBeenCalled()
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
  })

  it('should sort products by display name', () => {
    const p1 = { displayName: 'b product' }
    const p2 = { displayName: 'a product' }

    const result = component.sortProductsByDisplayName(p1 as ProductAbstract, p2 as ProductAbstract)

    expect(result).toBe(1)
  })

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
