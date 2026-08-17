import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { FormControl, FormGroup } from '@angular/forms'
import { TranslateService } from '@ngx-translate/core'
import { BehaviorSubject, catchError, combineLatest, finalize, map, Observable, of, Subscription, tap } from 'rxjs'

import { PortalMessageService } from '@onecx/angular-integration-interface'
import { Action, ColumnType, DataSortDirection, DataTableColumn, Filter, Sort } from '@onecx/angular-accelerator'

import {
  MicrofrontendAbstract,
  MicrofrontendsAPIService,
  MicrofrontendType,
  ProductsAPIService,
  ProductAbstract,
  ProductSearchCriteria
} from 'src/app/shared/generated'
import { AppAbstract } from '../app-search/app-search.component'
import { Utils } from 'src/app/shared/utils'

export interface ProductSearchCriteriaControls {
  name: FormControl<string | null>
}
export type ChangeMode = 'VIEW' | 'COPY' | 'CREATE' | 'EDIT'
export type MfeEndpoint = MicrofrontendAbstract & {
  mfeId: string
  unique_id: string
  productDisplayName: string
  endpoint_name: string
  endpoint_path: string
}
export interface Column {
  field: string
  header: string
  active: boolean
  translationPrefix?: string
}

@Component({
  selector: 'app-endpoint-search',
  standalone: false,
  templateUrl: './endpoint-search.component.html',
  styleUrls: ['./endpoint-search.component.scss']
})
export class EndpointSearchComponent implements OnInit, OnDestroy {
  // dialog
  public loading = false
  public exceptionKey: string | undefined = undefined
  public changeMode: ChangeMode = 'VIEW'
  public actions$: Observable<Action[]> | undefined
  public filteredColumns: Column[] = []
  public displayAppDetailDialog = false
  public tableFilter = ''
  public displayedColumnKeys: string[] = []
  public interactiveFilters: Filter[] = []
  public interactiveSortField = 'productDisplayName'
  public interactiveSortDirection: DataSortDirection = DataSortDirection.ASCENDING
  public interactiveColumns: DataTableColumn[] = [
    {
      id: 'productDisplayName',
      nameKey: 'ENDPOINT.PRODUCT_NAME',
      columnType: ColumnType.STRING,
      sortable: true
    },
    { id: 'appName', nameKey: 'ENDPOINT.APP_NAME', columnType: ColumnType.STRING },
    {
      id: 'endpoint_name',
      nameKey: 'ENDPOINT.NAME.SEARCH',
      columnType: ColumnType.STRING
    },
    {
      id: 'endpoint_path',
      nameKey: 'ENDPOINT.PATH',
      columnType: ColumnType.STRING
    }
  ]
  public interactiveDisplayedColumnKeys: string[] = this.interactiveColumns.map((column) => column.id)

  // data
  public searchCriteria!: FormGroup<ProductSearchCriteriaControls>
  public endpoints$: Observable<MfeEndpoint[]> = of([])
  public mfes$: Observable<MicrofrontendAbstract[]> = of([])
  public products$: Observable<ProductAbstract[]> = of([])
  public mfeItem4Detail: AppAbstract | undefined = undefined
  public filteredData$ = new BehaviorSubject<MfeEndpoint[]>([])
  public resultData$ = new BehaviorSubject<MfeEndpoint[]>([])
  private endpointsSubscription?: Subscription
  private filterData = ''

  public columns: Column[] = [
    {
      field: 'endpoint_name',
      header: 'NAME.SEARCH',
      active: true,
      translationPrefix: 'ENDPOINT'
    },
    {
      field: 'endpoint_path',
      header: 'PATH',
      active: true,
      translationPrefix: 'ENDPOINT'
    }
  ]
  constructor(
    private readonly msgService: PortalMessageService,
    private readonly translate: TranslateService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly mfeApi: MicrofrontendsAPIService,
    private readonly productApi: ProductsAPIService
  ) {
    this.filteredColumns = this.columns.filter((a) => a.active === true)
    this.searchCriteria = new FormGroup<ProductSearchCriteriaControls>({
      name: new FormControl<string | null>(null)
    })
  }

  ngOnInit(): void {
    this.initGlobalFilter()
    this.preparePageActions()
    this.declareDataSources()
    this.loadData()
  }

  ngOnDestroy(): void {
    this.endpointsSubscription?.unsubscribe()
  }

  /****************************************************************************
   *  SEARCHING
   */
  public declareDataSources(): void {
    // Products => to get the product display name
    const criteria: ProductSearchCriteria = {
      names: this.searchCriteria.controls['name'].value ? [this.searchCriteria.controls['name'].value] : undefined,
      pageSize: 1000
    }
    this.products$ = this.productApi.searchProducts({ productSearchCriteria: criteria }).pipe(
      map((data) => data.stream ?? []),
      catchError((err) => {
        this.exceptionKey = this.getHttpExceptionKey(err, 'PRODUCTS')
        console.error('searchProducts', err)
        return of([])
      })
    )
    // Microfrontends
    this.mfes$ = this.mfeApi
      .searchMicrofrontends({
        mfeAndMsSearchCriteria: {
          productName: this.searchCriteria.controls['name'].value,
          type: MicrofrontendType.Module,
          pageSize: 1000
        }
      })
      .pipe(
        tap((data: any) => {
          if (data.totalElements === 0) {
            this.msgService.info({ summaryKey: 'ACTIONS.SEARCH.NOT_FOUND' })
            return data.size
          }
        }),
        map((data) => data.stream ?? []),
        catchError((err) => {
          this.exceptionKey = this.getHttpExceptionKey(err, 'MFES')
          console.error('searchMicrofrontends', err)
          return of([])
        }),
        finalize(() => (this.loading = false))
      )
  }

  public sortMfes(a: MfeEndpoint, b: MfeEndpoint): number {
    return (
      this.upperValue(a.productName).localeCompare(this.upperValue(b.productName)) ||
      this.upperValue(a.exposedModule).localeCompare(this.upperValue(b.exposedModule)) ||
      this.upperValue(a.endpoint_name).localeCompare(this.upperValue(b.endpoint_name))
    )
  }

  private upperValue(value: string | null | undefined): string {
    return (value ?? '').toUpperCase()
  }

  private getProductDisplayName(name: string, pas: ProductAbstract[]): string {
    const pf = pas.find((p) => p.name === name)
    return pf?.displayName ?? ''
  }

  private getHttpExceptionKey(err: unknown, domain: 'PRODUCTS' | 'MFES'): string {
    const maybeStatus = (err as { status?: number })?.status
    const status = typeof maybeStatus === 'number' ? maybeStatus : 0
    return `EXCEPTIONS.HTTP_STATUS_${status}.${domain}`
  }

  // complete refresh: getting meta data and trigger search
  private loadData(): void {
    this.loading = true
    this.exceptionKey = undefined
    this.endpoints$ = combineLatest([this.products$, this.mfes$]).pipe(
      map(([ps, mfes]) => {
        const eps: MfeEndpoint[] = []
        if (mfes?.length > 0) {
          for (const mfe of mfes)
            if (mfe.endpoints)
              for (const [i, ep] of mfe.endpoints.entries()) {
                eps.push({
                  id: mfe.id + '_' + i,
                  mfeId: mfe.id,
                  unique_id: mfe.id + '_' + i,
                  appId: mfe.appId,
                  appName: mfe.appName,
                  productName: mfe.productName,
                  productDisplayName: this.getProductDisplayName(mfe.productName, ps),
                  exposedModule: mfe.exposedModule,
                  remoteBaseUrl: mfe.remoteBaseUrl,
                  type: mfe.type,
                  endpoint_name: ep.name,
                  endpoint_path: ep.path
                })
              }
          eps.sort((a, b) => this.sortMfes(a, b))
        }
        return eps
      }),
      finalize(() => (this.loading = false))
    )

    this.endpointsSubscription?.unsubscribe()
    this.endpointsSubscription = this.endpoints$.subscribe({
      next: (eps) => {
        this.resultData$.next(eps)
        this.filteredData$.next(eps)
      },
      error: (err) => {
        this.exceptionKey = this.exceptionKey ?? 'EXCEPTIONS.HTTP_STATUS_0.MFES'
        console.error('loadData endpoints subscription', err)
      }
    })
  }

  private preparePageActions(): void {
    this.actions$ = this.translate
      .get([
        'DIALOG.SEARCH.PRODUCTS.LABEL',
        'DIALOG.SEARCH.PRODUCTS.TOOLTIP',
        'DIALOG.SEARCH.APPS.LABEL',
        'DIALOG.SEARCH.APPS.TOOLTIP',
        'DIALOG.SEARCH.SLOTS.LABEL',
        'DIALOG.SEARCH.SLOTS.TOOLTIP'
      ])
      .pipe(
        map((data) => {
          return [
            {
              label: data['DIALOG.SEARCH.PRODUCTS.LABEL'],
              title: data['DIALOG.SEARCH.PRODUCTS.TOOLTIP'],
              actionCallback: () => this.router.navigate(['..'], { relativeTo: this.route }),
              permission: 'PRODUCT#SEARCH',
              icon: 'pi pi-cog',
              show: 'always'
            },
            {
              label: data['DIALOG.SEARCH.APPS.LABEL'],
              title: data['DIALOG.SEARCH.APPS.TOOLTIP'],
              actionCallback: () => this.router.navigate(['../apps'], { relativeTo: this.route }),
              permission: 'APP#SEARCH',
              icon: 'pi pi-th-large',
              show: 'always'
            },
            {
              label: data['DIALOG.SEARCH.SLOTS.LABEL'],
              title: data['DIALOG.SEARCH.SLOTS.TOOLTIP'],
              actionCallback: () => this.router.navigate(['../slots'], { relativeTo: this.route }),
              permission: 'APP#SEARCH',
              icon: 'pi pi-th-large',
              show: 'always'
            }
          ]
        })
      )
  }

  /**
   * UI EVENTS
   */
  public onColumnsChange(activeIds: string[]) {
    this.filteredColumns = activeIds.map((id) => this.columns.find((col) => col.field === id)) as Column[]
  }
  public onFilterChange(event: string): void {
    this.tableFilter = event
    this.filterData = event
    this.resultData$.next(this.resultData$.value)
  }
  public onInteractiveFiltersChange(filters: Filter[]): void {
    this.interactiveFilters = filters
  }
  public onInteractiveSorted(sort: Sort): void {
    this.interactiveSortField = sort.sortColumn
    this.interactiveSortDirection = sort.sortDirection
  }
  public onLayoutChange(viewMode: 'grid' | 'list' | 'table'): void {
    // Layout change handler for interactive data view - table-only component
  }
  public onSearch() {
    this.declareDataSources()
    this.loadData()
  }
  public onCriteriaReset() {
    this.searchCriteria.reset()
    this.onFilterChange('')
  }
  public onAppDetail(ev: Event, data: MfeEndpoint) {
    ev.stopPropagation()
    this.mfeItem4Detail = { id: data.mfeId, appType: 'MFE', mfeType: MicrofrontendType.Module }
    this.displayAppDetailDialog = true
  }
  public onMfeChanged(changed: any) {
    this.displayAppDetailDialog = false
    this.mfeItem4Detail = undefined
    if (changed) this.loadData()
  }

  private initGlobalFilter(): void {
    this.resultData$
      .pipe(map((endpoints) => (this.filterData.trim() ? this.stringFilter(this.filterData, endpoints) : endpoints)))
      .subscribe({
        next: (filteredData) => {
          this.filteredData$.next(filteredData)
        }
      })
  }

  private stringFilter(filter: string, endpoints: MfeEndpoint[]): MfeEndpoint[] {
    const lowerCaseFilter = filter.toLowerCase()
    return endpoints.filter((endpoint) => {
      return ['productDisplayName', 'appName', 'endpoint_name', 'endpoint_path'].some((key: string) => {
        const searchableText = Utils.toSearchableText(endpoint[key as keyof MfeEndpoint])
        if (!searchableText) return false
        return searchableText.toLowerCase().includes(lowerCaseFilter)
      })
    })
  }
}
