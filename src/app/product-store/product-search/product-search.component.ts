import { Component, DestroyRef, inject, OnInit } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AsyncPipe } from '@angular/common'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { BehaviorSubject, finalize, map, of, Observable, catchError } from 'rxjs'

import { ButtonModule } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputGroupModule } from 'primeng/inputgroup'
import { InputGroupAddonModule } from 'primeng/inputgroupaddon'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { MultiSelectModule } from 'primeng/multiselect'
import { TooltipModule } from 'primeng/tooltip'

import {
  Action,
  AngularAcceleratorModule,
  ColumnType,
  DataSortDirection,
  DataTableColumn,
  Filter,
  RowListGridData,
  Sort
} from '@onecx/angular-accelerator'
import { PortalPageComponent } from '@onecx/angular-utils'

import {
  ImagesInternalAPIService,
  ProductAbstract,
  ProductCriteria,
  ProductPageResult,
  ProductsAPIService,
  ProductSearchCriteria,
  RefType
} from 'src/app/shared/generated'
import { Utils } from 'src/app/shared/utils'
import { ImageContainerComponent } from 'src/app/shared/image-container/image-container.component'

export interface ProductSearchCriteriaControls {
  name: FormControl<string | null>
  providers: FormControl<string[] | null>
  classifications: FormControl<string[] | null>
}

type ProductAbstractExtended = ProductAbstract & { classes?: string }

@Component({
  standalone: true,
  imports: [
    AngularAcceleratorModule,
    AsyncPipe,
    ButtonModule,
    CardModule,
    FloatLabelModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    MessageModule,
    MultiSelectModule,
    ReactiveFormsModule,
    RouterModule,
    TooltipModule,
    TranslateModule,
    // components
    PortalPageComponent,
    ImageContainerComponent
  ],
  templateUrl: './product-search.component.html',
  styleUrls: ['./product-search.component.scss']
})
export class ProductSearchComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly translate = inject(TranslateService)
  private readonly productApi = inject(ProductsAPIService)
  private readonly imageApi = inject(ImagesInternalAPIService)
  // dialog
  public loading = false
  public exceptionKey: string | undefined
  public actions$: Observable<Action[]> | undefined
  public viewMode: 'grid' | 'list' = 'grid'
  // data
  public products$!: Observable<ProductAbstractExtended[]>
  public criteria$!: Observable<ProductCriteria>
  public filteredData$ = new BehaviorSubject<ProductAbstractExtended[]>([])
  public resultData$ = new BehaviorSubject<ProductAbstractExtended[]>([])
  private searchCriteria$ = new BehaviorSubject<ProductSearchCriteria>({} as ProductSearchCriteria)
  public searchCriteriaForm = new FormGroup<ProductSearchCriteriaControls>({
    name: new FormControl<string | null>(null),
    providers: new FormControl<string[] | null>(null),
    classifications: new FormControl<string[] | null>(null)
  })
  public globalFilterValue: string | undefined
  public interactiveFilters: Filter[] = []
  public sortDirection: DataSortDirection = DataSortDirection.ASCENDING
  public sortField = 'displayName'
  public sortOrder = 1
  public quickFilterItems: string[] = []
  private filterData = ''
  public dataViewColumns: DataTableColumn[] = [
    {
      id: 'displayName',
      nameKey: 'PRODUCT.DISPLAY_NAME',
      columnType: ColumnType.STRING,
      sortable: true,
      filterable: true
    },
    { id: 'provider', nameKey: 'PRODUCT.PROVIDER', columnType: ColumnType.STRING, sortable: true, filterable: true },
    {
      id: 'classes',
      nameKey: 'PRODUCT.CLASSIFICATIONS',
      columnType: ColumnType.STRING,
      sortable: true,
      filterable: true
    },
    { id: 'version', nameKey: 'PRODUCT.VERSION', columnType: ColumnType.STRING, sortable: true, filterable: true },
    { id: 'undeployed', nameKey: 'PRODUCT.UNDEPLOYED', columnType: ColumnType.STRING, filterable: true },
    { id: 'multitenancy', nameKey: 'INTERNAL.MULTITENANCY', columnType: ColumnType.STRING, filterable: true }
  ]
  public displayedColumnKeys: string[] = this.dataViewColumns.map((column) => column.id)

  ngOnInit(): void {
    this.preparePageActions()
    this.initGlobalFilter()
    this.searchProducts()
    this.getCriteria()
  }

  private initGlobalFilter(): void {
    this.resultData$
      .pipe(map((products) => (this.filterData.trim() ? this.stringFilter(this.filterData, products) : products)))
      .subscribe({
        next: (filteredData) => this.filteredData$.next(filteredData)
      })
  }

  private stringFilter(filter: string, products: ProductAbstractExtended[]): ProductAbstractExtended[] {
    const lowerCaseFilter = filter.toLowerCase()
    return products.filter((product) => {
      return ['displayName', 'name', 'provider', 'classes', 'version'].some((key: string) => {
        const value = Utils.toSearchableText(product[key as keyof ProductAbstractExtended])
        return value?.toLowerCase().includes(lowerCaseFilter)
      })
    })
  }
  private prepareSearchCriteria(): void {
    const name = this.searchCriteriaForm.controls['name'].value ?? undefined
    const providers = this.searchCriteriaForm.controls['providers'].value ?? undefined
    const classifications = this.searchCriteriaForm.controls['classifications'].value ?? undefined

    this.searchCriteria$.next({
      ...(name ? { names: [name] } : {}),
      ...(providers ? { providers: providers } : {}),
      ...(classifications ? { classifications: classifications } : {}),
      pageSize: 1000
    })
  }

  private searchProducts(): void {
    this.loading = true
    this.prepareSearchCriteria()
    const criteria = this.searchCriteria$.getValue()
    this.products$ = this.productApi.searchProducts({ productSearchCriteria: criteria }).pipe(
      map((data: ProductPageResult) => {
        const products: ProductAbstractExtended[] = []
        if (data.stream)
          for (const p of data.stream) {
            products.push({ ...p, classes: p.classifications?.join(', ') })
            if (p.classifications)
              for (const c of p.classifications) if (!this.quickFilterItems.includes(c)) this.quickFilterItems.push(c)
          }
        return products.sort(this.sortProductsByDisplayName)
      }),
      catchError((err) => {
        this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.PRODUCTS'
        console.error('searchProducts', err)
        return of([])
      }),
      finalize(() => (this.loading = false)),
      takeUntilDestroyed(this.destroyRef)
    )
    this.products$.subscribe({
      next: (products) => this.resultData$.next(products)
    })
  }
  public sortProductsByDisplayName(a: ProductAbstract, b: ProductAbstract): number {
    return (a.displayName as string).toUpperCase().localeCompare((b.displayName as string).toUpperCase())
  }

  private getCriteria(): void {
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
  public onLayoutChange(viewMode: 'grid' | 'list' | 'table'): void {
    if (viewMode !== 'table') this.viewMode = viewMode
  }
  public onGlobalFilter(filter: string): void {
    this.globalFilterValue = filter
    this.filterData = filter
    this.resultData$.next(this.resultData$.value)
  }
  public onSortChange(field: string): void {
    this.sortField = field
  }
  public onSortDirChange(asc: boolean): void {
    this.sortOrder = asc ? -1 : 1
    this.sortDirection = asc ? DataSortDirection.DESCENDING : DataSortDirection.ASCENDING
  }
  public onInteractiveFiltersChange(filters: Filter[]): void {
    this.interactiveFilters = filters
  }
  public onInteractiveSorted(sort: Sort): void {
    this.sortField = sort.sortColumn
    this.sortDirection = sort.sortDirection
    this.sortOrder = sort.sortDirection === DataSortDirection.DESCENDING ? -1 : 1
  }

  public onAppClick(item: RowListGridData): void {
    const product = item as unknown as ProductAbstract
    if (!product?.name) return
    this.router.navigate(['./', product.name], { relativeTo: this.route })
  }
  public onSearch() {
    this.searchProducts()
  }
  public onSearchReset() {
    this.searchCriteriaForm.reset()
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
    return Utils.bffImageUrl(this.imageApi.configuration.basePath, product.name, RefType.Logo)
  }
}
