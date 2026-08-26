import { Component, OnInit, OnDestroy } from '@angular/core'
import { AsyncPipe, NgClass } from '@angular/common'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { combineLatest, finalize, map, of, Observable, Subject, catchError, BehaviorSubject } from 'rxjs'

import { ButtonModule } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { DialogModule } from 'primeng/dialog'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputGroupAddonModule } from 'primeng/inputgroupaddon'
import { InputGroupModule } from 'primeng/inputgroup'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { SelectButtonModule } from 'primeng/selectbutton'
import { SelectItem } from 'primeng/api'
import { TooltipModule } from 'primeng/tooltip'

import { UserService } from '@onecx/angular-integration-interface'
import {
  Action,
  AngularAcceleratorModule,
  ColumnType,
  DataSortDirection,
  DataTableColumn,
  Filter,
  FilterType,
  Sort
} from '@onecx/angular-accelerator'
import { PortalPageComponent } from '@onecx/angular-utils'

import { Utils } from 'src/app/shared/utils'
import {
  MicrofrontendPageResult,
  MicrofrontendsAPIService,
  MicrofrontendType,
  Microservice,
  MicroservicePageResult,
  MicroservicesAPIService
} from 'src/app/shared/generated'
import { ChangeMode } from '../product-detail/product-detail.component'
import { AppDetailComponent } from '../app-detail/app-detail.component'
import { AppDeleteComponent } from '../app-delete/app-delete.component'

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
  standalone: true,
  imports: [
    AsyncPipe,
    NgClass,
    ButtonModule,
    CardModule,
    DialogModule,
    FloatLabelModule,
    FormsModule,
    InputGroupAddonModule,
    InputGroupModule,
    InputTextModule,
    MessageModule,
    ReactiveFormsModule,
    SelectButtonModule,
    TooltipModule,
    TranslateModule,
    // components
    PortalPageComponent,
    AppDetailComponent,
    AppDeleteComponent
  ],
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
  public filteredData$ = new BehaviorSubject<AppAbstract[]>([])
  public resultData$ = new BehaviorSubject<AppAbstract[]>([])
  public mfes$!: Observable<MicrofrontendPageResult>
  public mss$!: Observable<MicroservicePageResult>
  private filterData = ''
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
  public globalFilterValue: string | undefined
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
  public displayedColumnKeys: string[] = this.dataViewColumns.map((column) => column.id)

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
    this.initGlobalFilter()
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
   * GLOBAL FILTER
   */
  private initGlobalFilter(): void {
    this.resultData$
      .pipe(map((apps) => (this.filterData.trim() ? this.stringFilter(this.filterData, apps) : apps)))
      .subscribe({
        next: (filteredApps) => this.filteredData$.next(filteredApps)
      })
  }

  private stringFilter(filter: string, apps: AppAbstract[]): AppAbstract[] {
    const lowerCaseFilter = filter.toLowerCase()
    return apps.filter((app) => {
      return ['appId', 'appName', 'appType', 'appVersion', 'productName', 'classifications'].some((key: string) => {
        const value = Utils.toSearchableText(app[key as keyof AppAbstract])
        return value?.toLowerCase().includes(lowerCaseFilter)
      })
    })
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
    this.apps$.subscribe({
      next: (apps) => this.resultData$.next(apps)
    })
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
  public onQuickFilterChange(val: string): void {
    // handle PrimeNG bug - start (each 2nd click removes the value)
    if (val) this.quickFilterValueOld = this.quickFilterValue
    if (!val) this.quickFilterValue = this.quickFilterValueOld
    // handle PrimeNG bug - end
    if (val === 'ALL') {
      this.filterBy = this.filterValueDefault
      this.filterValue = ''
      this.interactiveFilters = this.interactiveFilters.filter((f) => f.columnId !== 'appType')
    } else {
      this.filterBy = 'appType'
      if (val) {
        this.filterValue = val
        this.interactiveFilters = [
          ...this.interactiveFilters.filter((f) => f.columnId !== 'appType'),
          {
            columnId: 'appType',
            value: val,
            filterType: FilterType.EQUALS
          }
        ]
      }
    }
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
