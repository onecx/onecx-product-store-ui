import { Component, OnInit, OnDestroy } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { SelectItem } from 'primeng/api'
import { combineLatest, finalize, map, of, Observable, Subject, catchError } from 'rxjs'

import { UserService } from '@onecx/angular-integration-interface'
import {
  Action,
  ColumnType,
  DataSortDirection,
  DataTableColumn,
  Filter,
  FilterType,
  Sort
} from '@onecx/angular-accelerator'
import { ChangeMode } from '../product-detail/product-detail.component'

import {
  MicrofrontendPageResult,
  MicrofrontendsAPIService,
  MicrofrontendType,
  Microservice,
  MicroservicePageResult,
  MicroservicesAPIService
} from 'src/app/shared/generated'

export interface AppSearchCriteria {
  appName: FormControl<string | null>
  appType: FormControl<AppFilterType | null>
  productName: FormControl<string | null>
}
export type AppType = 'MS' | 'MFE'
export type AppName = 'Microservice' | 'Microfrontend'
export type AppFilterType = 'ALL' | AppType
export type AppAbstract = Microservice & { appType: AppType; appTypeKey?: string; mfeType?: MicrofrontendType }

@Component({
  standalone: false,
  templateUrl: './app-search.component.html',
  styleUrls: ['./app-search.component.scss']
})
export class AppSearchComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject()
  public exceptionKey: string | undefined
  public loading = true
  public actions$: Observable<Action[]> | undefined
  public dateFormat = 'medium'
  public apps$!: Observable<AppAbstract[]>
  public mfes$!: Observable<MicrofrontendPageResult>
  public mss$!: Observable<MicroservicePageResult>
  public app: AppAbstract | undefined
  public appSearchCriteriaGroup!: FormGroup<AppSearchCriteria>
  public viewMode: 'grid' | 'list' = 'grid'
  public changeMode: ChangeMode = 'VIEW'
  public appTypeItems: SelectItem[]
  public appTypeFilterValue: string = 'ALL'
  public quickFilterValueOld: string = 'ALL'
  public quickFilterValue: string = 'ALL'
  public quickFilterItems: SelectItem[]
  public filterValue: string | undefined
  public filterValueDefault = 'appId,appName,appType,appVersion,productName,classifications'
  public filterBy = this.filterValueDefault
  public filter: string | undefined
  public tableFilter = ''
  public interactiveFilters: Filter[] = []
  public sortDirection: DataSortDirection = DataSortDirection.ASCENDING
  public sortField = 'appId'
  public sortOrder = 1
  public searchInProgress = false
  public displayDetailDialog = false
  public displayDeleteDialog = false
  public hasCreatePermission = false
  public hasEditPermission = false
  public hasDeletePermission = false
  public dataViewColumns: DataTableColumn[] = [
    { id: 'appId', nameKey: 'APP.APP_ID', columnType: ColumnType.STRING, sortable: true, filterable: true },
    { id: 'appType', nameKey: 'APP.APP_TYPE', columnType: ColumnType.STRING, sortable: true, filterable: true },
    { id: 'productName', nameKey: 'APP.PRODUCT_NAME', columnType: ColumnType.STRING, sortable: true, filterable: true },
    {
      id: 'classifications',
      nameKey: 'APP.CLASSIFICATIONS',
      columnType: ColumnType.STRING,
      sortable: false,
      filterable: true
    },
    { id: 'undeployed', nameKey: 'APP.UNDEPLOYED', columnType: ColumnType.STRING, filterType: FilterType.EQUALS },
    { id: 'deprecated', nameKey: 'APP.DEPRECATED', columnType: ColumnType.STRING, filterType: FilterType.EQUALS }
  ]

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly user: UserService,
    private readonly mfeApi: MicrofrontendsAPIService,
    private readonly msApi: MicroservicesAPIService,
    private readonly translate: TranslateService
  ) {
    this.dateFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'M/d/yy, hh:mm:ss a'
    // search criteria
    this.appTypeItems = [
      { label: 'ACTIONS.SEARCH.APP.QUICK_FILTER.ALL', value: 'ALL' },
      { label: 'ACTIONS.SEARCH.APP.QUICK_FILTER.MFE', value: 'MFE' },
      { label: 'ACTIONS.SEARCH.APP.QUICK_FILTER.MS', value: 'MS' }
    ]
    this.appSearchCriteriaGroup = new FormGroup<AppSearchCriteria>({
      appName: new FormControl<string | null>(null),
      appType: new FormControl<AppFilterType | null>('ALL'),
      productName: new FormControl<string | null>(null)
    })
    this.appSearchCriteriaGroup.controls['appType'].setValue('ALL') // default: all app types
    // quick filter
    this.quickFilterItems = [
      { label: 'ACTIONS.SEARCH.APP.QUICK_FILTER.ALL', value: 'ALL' },
      { label: 'ACTIONS.SEARCH.APP.QUICK_FILTER.MFE', value: 'MFE' },
      { label: 'ACTIONS.SEARCH.APP.QUICK_FILTER.MS', value: 'MS' }
    ]
  }

  public ngOnInit(): void {
    void this.initPermissions()
    this.preparePageActions()
    this.searchApps()
  }

  private async initPermissions(): Promise<void> {
    this.hasCreatePermission = await this.user.hasPermission('APP#CREATE')
    this.hasDeletePermission = await this.user.hasPermission('APP#DELETE')
    this.hasEditPermission = await this.user.hasPermission('APP#EDIT')
  }
  public ngOnDestroy(): void {
    this.destroy$.next(undefined)
    this.destroy$.complete()
  }

  /**
   * DECLARE Observables
   */
  private declareMfeObservable(): void {
    this.mfes$ = this.mfeApi
      .searchMicrofrontends({
        mfeAndMsSearchCriteria: {
          appName: this.appSearchCriteriaGroup.controls['appName'].value,
          productName: this.appSearchCriteriaGroup.controls['productName'].value,
          pageSize: 1000
        }
      })
      .pipe(
        catchError((err) => {
          this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.APPS'
          console.error('searchMicrofrontends', err)
          return of({})
        }),
        finalize(() => (this.searchInProgress = false))
      )
  }
  private declareMsObservable(): void {
    this.mss$ = this.msApi
      .searchMicroservice({
        mfeAndMsSearchCriteria: {
          appName: this.appSearchCriteriaGroup.controls['appName'].value,
          productName: this.appSearchCriteriaGroup.controls['productName'].value,
          pageSize: 1000
        }
      })
      .pipe(
        catchError((err) => {
          this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.APPS'
          console.error('searchMicroservice', err)
          return of({})
        }),
        finalize(() => (this.searchInProgress = false))
      )
  }

  /**
   * SEARCH
   */
  private searchMfes(): Observable<AppAbstract[]> {
    this.declareMfeObservable()
    return this.mfes$.pipe(
      map((a) => {
        return a.stream
          ? a.stream
              ?.map((mfe) => {
                return { ...mfe, appType: 'MFE', appTypeKey: 'APP.MFE.' + mfe.type, mfeType: mfe.type } as AppAbstract
              })
              .sort(this.sortAppsByAppId)
          : []
      })
    )
  }
  public searchMss(): Observable<AppAbstract[]> {
    this.declareMsObservable()
    return this.mss$.pipe(
      map((a) => {
        return a.stream
          ? a.stream
              ?.map((ms) => {
                return { ...ms, appType: 'MS', appTypeKey: 'APP.MS' } as AppAbstract
              })
              .sort(this.sortAppsByAppId)
          : []
      })
    )
  }

  public searchApps(): void {
    this.searchInProgress = true
    this.exceptionKey = undefined
    switch (this.appSearchCriteriaGroup.controls['appType'].value) {
      case 'ALL':
        this.apps$ = combineLatest([this.searchMfes(), this.searchMss()]).pipe(
          map(([mfes, mss]) => mfes.concat(mss).sort(this.sortAppsByAppId))
        )
        break
      case 'MFE':
        this.apps$ = this.searchMfes()
        break
      case 'MS':
        this.apps$ = this.searchMss()
        break
    }
  }
  private sortAppsByAppId(a: AppAbstract, b: AppAbstract): number {
    return (a.appId as string).toUpperCase().localeCompare((b.appId as string).toUpperCase())
  }

  /**
   * DIALOG
   */
  private preparePageActions(): void {
    this.actions$ = this.translate
      .get([
        'DIALOG.SEARCH.PRODUCTS.LABEL',
        'DIALOG.SEARCH.PRODUCTS.TOOLTIP',
        'DIALOG.SEARCH.ENDPOINTS.LABEL',
        'DIALOG.SEARCH.ENDPOINTS.TOOLTIP',
        'DIALOG.SEARCH.SLOTS.LABEL',
        'DIALOG.SEARCH.SLOTS.TOOLTIP',
        'ACTIONS.CREATE.MFE.LABEL',
        'ACTIONS.CREATE.MS.LABEL',
        'ACTIONS.CREATE.APP.TOOLTIP'
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
              label: data['DIALOG.SEARCH.ENDPOINTS.LABEL'],
              title: data['DIALOG.SEARCH.ENDPOINTS.TOOLTIP'],
              actionCallback: () => this.router.navigate(['../endpoints'], { relativeTo: this.route }),
              permission: 'ENDPOINT#SEARCH',
              icon: 'pi pi-list',
              show: 'always'
            },
            {
              label: data['DIALOG.SEARCH.SLOTS.LABEL'],
              title: data['DIALOG.SEARCH.SLOTS.TOOLTIP'],
              actionCallback: () => this.router.navigate(['../slots'], { relativeTo: this.route }),
              permission: 'APP#SEARCH',
              icon: 'pi pi-th-large',
              show: 'always'
            },
            {
              label: data['ACTIONS.CREATE.MFE.LABEL'],
              title: data['ACTIONS.CREATE.APP.TOOLTIP'],
              actionCallback: () => this.onAppCreate('MFE'),
              permission: 'APP#CREATE',
              icon: 'pi pi-plus',
              show: 'asOverflow'
            },
            {
              label: data['ACTIONS.CREATE.MS.LABEL'],
              title: data['ACTIONS.CREATE.APP.TOOLTIP'],
              actionCallback: () => this.onAppCreate('MS'),
              permission: 'APP#CREATE',
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

  public onAppTypeFilterChange(ev: any): void {
    if (ev.value) this.appTypeFilterValue = ev.value
  }
  public onQuickFilterChange(ev: any): void {
    // handle PrimeNG bug - start (each 2nd click removes the value)
    if (ev.value) this.quickFilterValueOld = this.quickFilterValue
    if (!ev.value) this.quickFilterValue = this.quickFilterValueOld
    // handle PrimeNG bug - end
    if (ev.value === 'ALL') {
      this.filterBy = this.filterValueDefault
      this.filterValue = ''
      this.interactiveFilters = this.interactiveFilters.filter((f) => f.columnId !== 'appType')
    } else {
      this.filterBy = 'appType'
      if (ev.value) {
        this.filterValue = ev.value
        this.interactiveFilters = [
          ...this.interactiveFilters.filter((f) => f.columnId !== 'appType'),
          {
            columnId: 'appType',
            value: ev.value,
            filterType: FilterType.EQUALS
          }
        ]
      }
    }
  }
  public onFilterChange(filter: string): void {
    this.filter = filter
  }
  public onGlobalFilter(filterValue: string): void {
    this.tableFilter = filterValue
    const globalFilter = { columnId: 'global', value: filterValue }
    if (!filterValue) {
      this.interactiveFilters = this.interactiveFilters.filter((f) => f.columnId !== 'global')
      return
    }
    this.interactiveFilters = [...this.interactiveFilters.filter((f) => f.columnId !== 'global'), globalFilter]
  }
  public onClearGlobalFilter(filterInput: HTMLInputElement): void {
    filterInput.value = ''
    this.onGlobalFilter('')
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
    const globalFilter = filters.find((filter) => filter.columnId === 'global')
    this.tableFilter = (globalFilter?.value as string) ?? ''
  }
  public onInteractiveSorted(sort: Sort): void {
    this.sortField = sort.sortColumn
    this.sortDirection = sort.sortDirection
    this.sortOrder = sort.sortDirection === DataSortDirection.DESCENDING ? -1 : 1
  }
  public onSearch() {
    this.searchApps()
  }
  public onSearchReset() {
    this.appSearchCriteriaGroup.reset({ appType: 'ALL' })
  }
  public onGotoProduct(ev: any, product: string) {
    ev.stopPropagation()
    this.router.navigate(['../', product], { relativeTo: this.route })
  }

  public onAppDetail(ev: any, app: AppAbstract) {
    ev.stopPropagation()
    this.app = app
    this.changeMode = this.hasEditPermission ? 'EDIT' : 'VIEW'
    this.displayDetailDialog = true
  }
  public onAppCopy(ev: any, app: AppAbstract) {
    ev.stopPropagation()
    this.app = app
    this.changeMode = 'CREATE'
    this.displayDetailDialog = true
  }
  public onAppCreate(type: AppType) {
    this.changeMode = 'CREATE'
    this.app = { appType: type }
    this.displayDetailDialog = true
  }
  public onAppDelete(ev: any, app: AppAbstract) {
    ev.stopPropagation()
    this.app = app
    this.displayDeleteDialog = true
  }

  /**
   * MODAL Dialog feedback => trigger search after changes on detail level
   */
  public appChanged(changed: any) {
    this.displayDetailDialog = false
    this.displayDeleteDialog = false
    if (changed) this.searchApps()
  }
  public appDeleted(deleted: any) {
    this.displayDeleteDialog = false
    if (deleted) this.searchApps()
  }
}
