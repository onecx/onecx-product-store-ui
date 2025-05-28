import { Component, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { FormControl, FormGroup } from '@angular/forms'
import { finalize, map, of, Observable, catchError } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'
import { DataView } from 'primeng/dataview'

import { Action, DataViewControlTranslations } from '@onecx/portal-integration-angular'

import {
  ImagesInternalAPIService,
  ProductAbstract,
  ProductCriteria,
  ProductPageResult,
  ProductsAPIService,
  ProductSearchCriteria,
  RefType
} from 'src/app/shared/generated'
import { bffImageUrl } from 'src/app/shared/utils'

export interface ProductSearchCriteriaControls {
  name: FormControl<string | null>
  providers: FormControl<string[] | null>
  classifications: FormControl<string[] | null>
}

type ProductAbstractExtended = ProductAbstract & { classes?: string }

@Component({
  templateUrl: './product-search.component.html',
  styleUrls: ['./product-search.component.scss']
})
export class ProductSearchComponent implements OnInit {
  // dialog
  public loading = false
  public exceptionKey: string | undefined
  public actions$: Observable<Action[]> | undefined
  public viewMode: 'grid' | 'list' = 'grid'
  // data
  public products$!: Observable<ProductAbstractExtended[]>
  public criteria$!: Observable<ProductCriteria>
  public searchCriteria!: FormGroup<ProductSearchCriteriaControls>
  public filter: string | undefined
  public sortField = 'displayName'
  public sortOrder = 1
  public quickFilterItems: string[] = []

  @ViewChild(DataView) dv: DataView | undefined
  public dataViewControlsTranslations$: Observable<DataViewControlTranslations> | undefined

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly translate: TranslateService,
    private readonly productApi: ProductsAPIService,
    private readonly imageApi: ImagesInternalAPIService
  ) {
    this.searchCriteria = new FormGroup<ProductSearchCriteriaControls>({
      name: new FormControl<string | null>(null),
      providers: new FormControl<string[] | null>(null),
      classifications: new FormControl<string[] | null>(null)
    })
  }

  ngOnInit(): void {
    this.prepareDialogTranslations()
    this.preparePageActions()
    this.searchProducts()
    this.getCriteria()
  }

  public searchProducts(): void {
    this.loading = true
    console.log(this.searchCriteria.controls['classifications'].value)
    const criteria: ProductSearchCriteria = {
      names: this.searchCriteria.controls['name'].value ? [this.searchCriteria.controls['name'].value] : undefined,
      providers: this.searchCriteria.controls['providers'].value ?? undefined,
      classifications: this.searchCriteria.controls['classifications'].value ?? undefined,
      pageSize: 1000
    }
    this.products$ = this.productApi.searchProducts({ productSearchCriteria: criteria }).pipe(
      map((data: ProductPageResult) => {
        const products: ProductAbstractExtended[] = []
        data.stream?.forEach((p) => {
          products.push({ ...p, classes: p.classifications?.join(', ') })
          p.classifications?.forEach((c) => {
            if (!this.quickFilterItems.includes(c)) this.quickFilterItems.push(c)
          })
        })
        return products.sort(this.sortProductsByDisplayName)
      }),
      catchError((err) => {
        this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.PRODUCTS'
        console.error('searchProducts', err)
        return of([])
      }),
      finalize(() => (this.loading = false))
    )
  }
  public sortProductsByDisplayName(a: ProductAbstract, b: ProductAbstract): number {
    return (a.displayName as string).toUpperCase().localeCompare((b.displayName as string).toUpperCase())
  }

  public getCriteria(): void {
    this.criteria$ = this.productApi.getProductSearchCriteria().pipe(
      catchError((err) => {
        console.error('getProductSearchCriteria', err)
        return of({ providers: [], classifications: [] })
      })
    )
  }

  /**
   * DIALOG
   */
  private prepareDialogTranslations(): void {
    this.dataViewControlsTranslations$ = this.translate
      .get([
        'PRODUCT.DISPLAY_NAME',
        'PRODUCT.CLASSIFICATIONS',
        'PRODUCT.PROVIDER',
        'PRODUCT.DESCRIPTION',
        'PRODUCT.VERSION',
        'ACTIONS.DATAVIEW.VIEW_MODE_GRID',
        'ACTIONS.DATAVIEW.VIEW_MODE_LIST',
        'ACTIONS.DATAVIEW.VIEW_MODE_TABLE',
        'ACTIONS.DATAVIEW.FILTER',
        'ACTIONS.DATAVIEW.FILTER_OF',
        'ACTIONS.DATAVIEW.SORT_BY',
        'ACTIONS.DATAVIEW.SORT_DIRECTION_ASC',
        'ACTIONS.DATAVIEW.SORT_DIRECTION_DESC'
      ])
      .pipe(
        map((data) => {
          return {
            sortDropdownPlaceholder: data['ACTIONS.DATAVIEW.SORT_BY'],
            filterInputPlaceholder: data['ACTIONS.DATAVIEW.FILTER'],
            filterInputTooltip:
              data['ACTIONS.DATAVIEW.FILTER_OF'] +
              data['PRODUCT.DISPLAY_NAME'] +
              ', ' +
              data['PRODUCT.PROVIDER'] +
              ', ' +
              data['PRODUCT.CLASSIFICATIONS'] +
              ', ' +
              data['PRODUCT.DESCRIPTION'] +
              ', ' +
              data['PRODUCT.VERSION'],
            viewModeToggleTooltips: {
              grid: data['ACTIONS.DATAVIEW.VIEW_MODE_GRID'],
              list: data['ACTIONS.DATAVIEW.VIEW_MODE_LIST']
            },
            sortOrderTooltips: {
              ascending: data['ACTIONS.DATAVIEW.SORT_DIRECTION_ASC'],
              descending: data['ACTIONS.DATAVIEW.SORT_DIRECTION_DESC']
            },
            sortDropdownTooltip: data['ACTIONS.DATAVIEW.SORT_BY']
          } as DataViewControlTranslations
        })
      )
  }

  private preparePageActions(): void {
    this.actions$ = this.translate
      .get([
        'ACTIONS.CREATE.PRODUCT.LABEL',
        'ACTIONS.CREATE.PRODUCT.TOOLTIP',
        'DIALOG.SEARCH.APPS.LABEL',
        'DIALOG.SEARCH.APPS.TOOLTIP',
        'DIALOG.SEARCH.ENDPOINTS.LABEL',
        'DIALOG.SEARCH.ENDPOINTS.TOOLTIP',
        'DIALOG.SEARCH.SLOTS.LABEL',
        'DIALOG.SEARCH.SLOTS.TOOLTIP'
      ])
      .pipe(
        map((data) => {
          return [
            {
              label: data['DIALOG.SEARCH.ENDPOINTS.LABEL'],
              title: data['DIALOG.SEARCH.ENDPOINTS.TOOLTIP'],
              actionCallback: () => this.onEndpointSearch(),
              permission: 'ENDPOINT#SEARCH',
              icon: 'pi pi-list',
              show: 'always'
            },
            {
              label: data['DIALOG.SEARCH.APPS.LABEL'],
              title: data['DIALOG.SEARCH.APPS.TOOLTIP'],
              actionCallback: () => this.onAppSearch(),
              permission: 'APP#SEARCH',
              icon: 'pi pi-th-large',
              show: 'always'
            },
            {
              label: data['DIALOG.SEARCH.SLOTS.LABEL'],
              title: data['DIALOG.SEARCH.SLOTS.TOOLTIP'],
              actionCallback: () => this.onSlotSearch(),
              permission: 'APP#SEARCH',
              icon: 'pi pi-th-large',
              show: 'always'
            },
            {
              label: data['ACTIONS.CREATE.PRODUCT.LABEL'],
              title: data['ACTIONS.CREATE.PRODUCT.TOOLTIP'],
              actionCallback: () => this.onNewProduct(),
              permission: 'PRODUCT#CREATE',
              icon: 'pi pi-plus',
              show: 'asOverflow'
            }
          ]
        })
      )
  }

  /**
   * UI EVENTS
   */
  public onLayoutChange(viewMode: 'grid' | 'list'): void {
    this.viewMode = viewMode
  }
  public onFilterChange(filter: string): void {
    this.filter = filter
    this.dv?.filter(filter, 'contains')
  }
  public onSortChange(field: string): void {
    this.sortField = field
  }
  public onSortDirChange(asc: boolean): void {
    this.sortOrder = asc ? -1 : 1
  }

  public onSearch() {
    this.searchProducts()
  }
  public onSearchReset() {
    this.searchCriteria.reset()
  }
  public onAppSearch() {
    this.router.navigate(['./apps'], { relativeTo: this.route })
  }
  public onEndpointSearch() {
    this.router.navigate(['./endpoints'], { relativeTo: this.route })
  }
  public onSlotSearch() {
    this.router.navigate(['./slots'], { relativeTo: this.route })
  }
  public onNewProduct() {
    this.router.navigate(['./new'], { relativeTo: this.route })
  }

  public getLogoUrl(product: ProductAbstract | undefined): string | undefined {
    if (!product) return undefined
    if (product.imageUrl && product.imageUrl != '') return product.imageUrl
    return bffImageUrl(this.imageApi.configuration.basePath, product.name, RefType.Logo)
  }
}
