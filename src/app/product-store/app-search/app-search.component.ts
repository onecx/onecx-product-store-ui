import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { SelectItem } from 'primeng/api'
import { DataView } from 'primeng/dataview'
import { combineLatest, finalize, map, of, Observable, Subject, catchError } from 'rxjs'

import { Action, DataViewControlTranslations, UserService } from '@onecx/portal-integration-angular'
import {
  MicrofrontendPageResult,
  MicrofrontendsAPIService,
  Microservice,
  MicroservicePageResult,
  MicroservicesAPIService
} from 'src/app/shared/generated'
import { limitText } from 'src/app/shared/utils'

export interface AppSearchCriteria {
  appId: FormControl<string | null>
  appType: FormControl<AppFilterType | null>
  productName: FormControl<string | null>
}
export type AppType = 'MS' | 'MFE'
export type AppName = 'Microservice' | 'Microfrontend'
export type AppFilterType = 'ALL' | AppType
export type AppAbstract = Microservice & { appType: AppType; appTypeKey?: string }
export type ChangeMode = 'VIEW' | 'CREATE' | 'EDIT' | 'COPY'

@Component({
  templateUrl: './app-search.component.html',
  styleUrls: ['./app-search.component.scss']
})
export class AppSearchComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject()
  public exceptionKey: string | undefined
  public loading = true
  public actions$: Observable<Action[]> | undefined

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
  public filterValueDefault = 'appId,appType,appVersion,productName,classifications'
  public filterBy = this.filterValueDefault
  public filter: string | undefined
  public sortField = 'appId'
  public sortOrder = 1
  public searchInProgress = false
  public displayDetailDialog = false
  public displayDeleteDialog = false
  public hasCreatePermission = false
  public hasEditPermission = false
  public hasDeletePermission = false
  public limitText = limitText

  public dataViewControlsTranslations: DataViewControlTranslations = {}
  @ViewChild(DataView) dv: DataView | undefined

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly user: UserService,
    private readonly mfeApi: MicrofrontendsAPIService,
    private readonly msApi: MicroservicesAPIService,
    private readonly translate: TranslateService
  ) {
    this.hasCreatePermission = this.user.hasPermission('APP#CREATE')
    this.hasDeletePermission = this.user.hasPermission('APP#DELETE')
    this.hasEditPermission = this.user.hasPermission('APP#EDIT')
    // search criteria
    this.appTypeItems = [
      { label: 'ACTIONS.SEARCH.APP.QUICK_FILTER.ALL', value: 'ALL' },
      { label: 'ACTIONS.SEARCH.APP.QUICK_FILTER.MFE', value: 'MFE' },
      { label: 'ACTIONS.SEARCH.APP.QUICK_FILTER.MS', value: 'MS' }
    ]
    this.appSearchCriteriaGroup = new FormGroup<AppSearchCriteria>({
      appId: new FormControl<string | null>(null),
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
    this.prepareDialogTranslations()
    this.prepareActionButtons()
    this.searchApps()
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
          appId: this.appSearchCriteriaGroup.controls['appId'].value,
          productName: this.appSearchCriteriaGroup.controls['productName'].value,
          pageSize: 100
        }
      })
      .pipe(
        catchError((err) => {
          this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.APPS'
          console.error('searchMicrofrontends():', err)
          return of({} as MicrofrontendPageResult)
        }),
        finalize(() => (this.searchInProgress = false))
      )
  }
  private declareMsObservable(): void {
    this.mss$ = this.msApi
      .searchMicroservice({
        mfeAndMsSearchCriteria: {
          appId: this.appSearchCriteriaGroup.controls['appId'].value,
          productName: this.appSearchCriteriaGroup.controls['productName'].value,
          pageSize: 100
        }
      })
      .pipe(
        catchError((err) => {
          this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.APPS'
          console.error('searchMicroservice():', err)
          return of({} as MicroservicePageResult)
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
                return { ...mfe, appType: 'MFE', appTypeKey: 'APP.MFE.' + mfe.type } as AppAbstract
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
  private prepareActionButtons(): void {
    this.actions$ = this.translate
      .get([
        'DIALOG.SEARCH.SLOTS.LABEL',
        'DIALOG.SEARCH.SLOTS.TOOLTIP',
        'ACTIONS.CREATE.MFE.LABEL',
        'ACTIONS.CREATE.MS.LABEL',
        'ACTIONS.CREATE.APP.TOOLTIP',
        'ACTIONS.NAVIGATION.BACK',
        'ACTIONS.NAVIGATION.BACK.TOOLTIP'
      ])
      .pipe(
        map((data) => {
          return [
            {
              label: data['ACTIONS.NAVIGATION.BACK'],
              title: data['ACTIONS.NAVIGATION.BACK.TOOLTIP'],
              actionCallback: () => this.onBack(),
              icon: 'pi pi-arrow-left',
              show: 'always'
            },
            {
              label: data['DIALOG.SEARCH.SLOTS.LABEL'],
              title: data['DIALOG.SEARCH.SLOTS.TOOLTIP'],
              actionCallback: () => this.router.navigate(['../slots'], { relativeTo: this.route }),
              permission: 'APP#SEARCH',
              icon: 'pi pi-bars',
              show: 'always'
            },
            {
              label: data['ACTIONS.CREATE.MFE.LABEL'],
              title: data['ACTIONS.CREATE.APP.TOOLTIP'],
              actionCallback: () => this.onCreate('MFE'),
              permission: 'APP#CREATE',
              icon: 'pi pi-plus',
              show: 'asOverflow'
            },
            {
              label: data['ACTIONS.CREATE.MS.LABEL'],
              title: data['ACTIONS.CREATE.APP.TOOLTIP'],
              actionCallback: () => this.onCreate('MS'),
              permission: 'APP#CREATE',
              icon: 'pi pi-plus',
              show: 'asOverflow'
            }
          ]
        })
      )
  }

  public prepareDialogTranslations(): void {
    this.translate
      .get([
        'APP.APP_ID',
        'APP.APP_TYPE',
        'APP.APP_VERSION',
        'APP.CLASSIFICATIONS',
        'APP.PRODUCT_NAME',
        'ACTIONS.DATAVIEW.FILTER_OF'
      ])
      .pipe(
        map((data) => {
          this.dataViewControlsTranslations = {
            filterInputTooltip:
              data['ACTIONS.DATAVIEW.FILTER_OF'] +
              data['APP.APP_ID'] +
              ', ' +
              data['APP.APP_TYPE'] +
              ', ' +
              data['APP.APP_VERSION'] +
              ', ' +
              data['APP.CLASSIFICATIONS'] +
              ', ' +
              data['APP.PRODUCT_NAME']
          }
        })
      )
      .subscribe()
  }

  /**
   * UI EVENTS
   */
  public onLayoutChange(viewMode: 'grid' | 'list'): void {
    this.viewMode = viewMode
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
      this.dv?.filter(this.filterValue, 'contains')
    } else {
      this.filterBy = 'appType'
      if (ev.value) {
        this.filterValue = ev.value
        this.dv?.filter(ev.value, 'equals')
      }
    }
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
    this.searchApps()
  }
  public onSearchReset() {
    this.appSearchCriteriaGroup.reset({ appType: 'ALL' })
  }
  public onBack() {
    this.router.navigate(['../'], { relativeTo: this.route })
  }
  public onGotoProduct(ev: any, product: string) {
    ev.stopPropagation()
    this.router.navigate(['../', product], { relativeTo: this.route })
  }

  public onDetail(ev: any, app: AppAbstract) {
    ev.stopPropagation()
    this.app = app
    this.changeMode = this.hasEditPermission ? 'EDIT' : 'VIEW'
    this.displayDetailDialog = true
  }
  public onCopy(ev: any, app: AppAbstract) {
    ev.stopPropagation()
    this.app = app
    this.changeMode = 'COPY'
    this.displayDetailDialog = true
  }
  public onCreate(type: AppType) {
    this.changeMode = 'CREATE'
    this.app = { appType: type } as AppAbstract
    this.displayDetailDialog = true
  }
  public onDelete(ev: any, app: AppAbstract) {
    ev.stopPropagation()
    this.app = app
    this.displayDeleteDialog = true
  }

  /**
   * MODAL Dialog feedback => trigger search after changes on detail level
   */
  public appChanged(changed: any) {
    this.displayDetailDialog = false
    if (changed) this.searchApps()
  }
  public appDeleted(deleted: any) {
    this.displayDeleteDialog = false
    if (deleted) this.searchApps()
  }
}
