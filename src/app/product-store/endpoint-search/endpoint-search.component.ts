import { Component, DestroyRef, inject, OnInit } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AsyncPipe } from '@angular/common'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { BehaviorSubject, catchError, combineLatest, finalize, map, Observable, of } from 'rxjs'

import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputGroupAddonModule } from 'primeng/inputgroupaddon'
import { InputGroupModule } from 'primeng/inputgroup'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { TooltipModule } from 'primeng/tooltip'

import {
  Action,
  AngularAcceleratorModule,
  ColumnType,
  DataSortDirection,
  DataTableColumn,
  Filter,
  Sort
} from '@onecx/angular-accelerator'
import { PortalPageComponent } from '@onecx/angular-utils'

import {
  MfeAndMsSearchCriteria,
  MicrofrontendAbstract,
  MicrofrontendsAPIService,
  MicrofrontendType,
  ProductsAPIService,
  ProductAbstract,
  ProductSearchCriteria
} from 'src/app/shared/generated'
import { Utils } from 'src/app/shared/utils'
import { AppAbstract } from '../app-search/app-search.component'
import { AppDetailComponent } from '../app-detail/app-detail.component'

export type ChangeMode = 'VIEW' | 'COPY' | 'CREATE' | 'EDIT'
export type MfeEndpoint = MicrofrontendAbstract & {
  mfeId: string
  unique_id: string
  productDisplayName: string
  endpoint_name: string
  endpoint_path: string
}
export interface ProductSearchCriteriaControls {
  name: FormControl<string | null>
}

@Component({
  selector: 'app-endpoint-search',
  standalone: true,
  imports: [
    AngularAcceleratorModule,
    AsyncPipe,
    ButtonModule,
    DialogModule,
    FloatLabelModule,
    InputGroupAddonModule,
    InputGroupModule,
    InputTextModule,
    MessageModule,
    ReactiveFormsModule,
    TooltipModule,
    TranslateModule,
    // components
    PortalPageComponent,
    AppDetailComponent
  ],
  templateUrl: './endpoint-search.component.html',
  styleUrls: ['./endpoint-search.component.scss']
})
export class EndpointSearchComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly mfeApi = inject(MicrofrontendsAPIService)
  private readonly productApi = inject(ProductsAPIService)
  private readonly translate = inject(TranslateService)
  // dialog
  public loading = false
  public exceptionKey: string | undefined = undefined
  public changeMode: ChangeMode = 'VIEW'
  public actions$: Observable<Action[]> | undefined
  public displayAppDetailDialog = false
  public globalFilterValue = ''
  public interactiveFilters: Filter[] = []
  public interactiveSortDirection: DataSortDirection = DataSortDirection.ASCENDING
  public interactiveSortField = 'productDisplayName'
  public interactiveColumns: DataTableColumn[] = [
    {
      id: 'productDisplayName',
      nameKey: 'ENDPOINT.PRODUCT_NAME',
      columnType: ColumnType.STRING,
      sortable: true,
      filterable: true
    },
    { id: 'appName', nameKey: 'ENDPOINT.APP_NAME', columnType: ColumnType.STRING, sortable: true, filterable: true },
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
  public searchCriteriaForm = new FormGroup<ProductSearchCriteriaControls>({
    name: new FormControl<string | null>(null)
  })
  public endpoints$: Observable<MfeEndpoint[]> = of([])
  public mfes$: Observable<MicrofrontendAbstract[]> = of([])
  public products$: Observable<ProductAbstract[]> = of([])
  public mfeItem4Detail: AppAbstract | undefined = undefined
  public filteredData$ = new BehaviorSubject<MfeEndpoint[]>([])
  public resultData$ = new BehaviorSubject<MfeEndpoint[]>([])

  public ngOnInit(): void {
    this.preparePageActions()
    this.onSearch()
  }

  /****************************************************************************
   *  SEARCHING
   */
  // Prepare criteria for product and mfe search
  private prepareSearchCriteria(): { productCriteria: {}; mfeCriteria: {} } {
    const name = this.searchCriteriaForm.controls['name'].value
    const productCriteria: ProductSearchCriteria = {
      ...(name ? { names: [name] } : {}),
      pageSize: 1000
    }
    const mfeCriteria: MfeAndMsSearchCriteria = {
      ...(name ? { productName: name } : {}),
      type: MicrofrontendType.Module,
      pageSize: 1000
    }
    return { productCriteria, mfeCriteria }
  }
  public declareDataSources(): void {
    const criteria = this.prepareSearchCriteria()

    // Products => to get the product display name
    this.products$ = this.productApi.searchProducts({ productSearchCriteria: criteria.productCriteria }).pipe(
      map((data) => data.stream ?? []),
      catchError((err) => {
        this.exceptionKey = this.getHttpExceptionKey(err, 'PRODUCTS')
        console.error('searchProducts', err)
        return of([])
      })
    )
    // Microfrontends
    this.mfes$ = this.mfeApi.searchMicrofrontends({ mfeAndMsSearchCriteria: criteria.mfeCriteria }).pipe(
      map((data) => data.stream ?? []),
      catchError((err) => {
        this.exceptionKey = this.getHttpExceptionKey(err, 'MFES')
        console.error('searchMicrofrontends', err)
        return of([])
      })
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
            if (mfe.endpoints && mfe.endpoints?.length > 0)
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
      finalize(() => (this.loading = false)),
      takeUntilDestroyed(this.destroyRef)
    )
    this.endpoints$.subscribe({
      next: (eps) => {
        this.resultData$.next(eps)
        this.filteredData$.next(eps)
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
  public onGlobalFilter(val: string): void {
    this.globalFilterValue = val.trim().toLowerCase()
    this.resultData$.asObservable().subscribe((data) => {
      if (this.globalFilterValue === '') {
        this.filteredData$.next(data)
        return
      }
      const fd = this.stringFilter(this.globalFilterValue, data)
      this.filteredData$.next(fd)
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

  public onLayoutChange(viewMode: 'grid' | 'list' | 'table'): void {
    // Layout change handler for interactive data view - table-only component
  }

  public onInteractiveFiltersChange(filters: Filter[]): void {
    this.interactiveFilters = filters
  }
  public onInteractiveSorted(sort: Sort): void {
    this.interactiveSortField = sort.sortColumn
    this.interactiveSortDirection = sort.sortDirection
  }
  public onSearch() {
    this.declareDataSources()
    this.loadData()
  }
  public onCriteriaReset() {
    this.searchCriteriaForm.reset()
    this.onGlobalFilter('')
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
}
