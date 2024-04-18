import { Component, Input, OnChanges, ViewChild } from '@angular/core'
import { combineLatest, finalize, map, of, Observable, catchError } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { DataView } from 'primeng/dataview'

import { DataViewControlTranslations, UserService } from '@onecx/portal-integration-angular'
import {
  Product,
  MfeAndMsSearchCriteria,
  MicrofrontendPageResult,
  MicrofrontendsAPIService,
  MicroservicePageResult,
  MicroservicesAPIService
} from 'src/app/shared/generated'
import { dropDownSortItemsByLabel, limitText } from 'src/app/shared/utils'
import { IconService } from 'src/app/shared/iconservice'

import { AppAbstract, ChangeMode } from '../../app-search/app-search.component'

@Component({
  selector: 'app-product-apps',
  templateUrl: './product-apps.component.html',
  styleUrls: ['./product-apps.component.scss']
})
export class ProductAppsComponent implements OnChanges {
  @Input() product: Product | undefined
  @Input() dateFormat = 'medium'
  @Input() changeMode: ChangeMode = 'VIEW'

  private readonly debug = true // to be removed after finalization
  public exceptionKey = ''
  public searchInProgress = false
  public apps$!: Observable<AppAbstract[]>
  public mfes$!: Observable<MicrofrontendPageResult>
  public mss$!: Observable<MicroservicePageResult>
  public app: AppAbstract | undefined
  public iconItems: SelectItem[] = [{ label: '', value: null }]
  public filter: string | undefined
  public viewMode = 'grid'
  public sortField = 'appId'
  public sortOrder = 1
  public displayDetailDialog = false
  public displayDeleteDialog = false
  public hasCreatePermission = false
  public hasDeletePermission = false

  public dataViewControlsTranslations: DataViewControlTranslations = {}
  @ViewChild(DataView) dv: DataView | undefined
  public limitText = limitText

  constructor(
    private icon: IconService,
    private user: UserService,
    private mfeApi: MicrofrontendsAPIService,
    private msApi: MicroservicesAPIService
  ) {
    this.hasCreatePermission = this.user.hasPermission('APP#CREATE')
    this.hasDeletePermission = this.user.hasPermission('APP#DELETE')
    this.iconItems.push(...this.icon.icons.map((i) => ({ label: i, value: i })))
    this.iconItems.sort(dropDownSortItemsByLabel)
  }

  ngOnChanges(): void {
    if (this.product) this.searchApps()
  }

  /**
   * DECLARE Observables
   */
  private declareMfeObservable(): void {
    this.mfes$ = this.mfeApi
      .searchMicrofrontends({ mfeAndMsSearchCriteria: { productName: this.product?.name } as MfeAndMsSearchCriteria })
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
      .searchMicroservice({ mfeAndMsSearchCriteria: { productName: this.product?.name } as MfeAndMsSearchCriteria })
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
  private searchMss(): Observable<AppAbstract[]> {
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
    this.apps$ = combineLatest([this.searchMfes(), this.searchMss()]).pipe(
      map(([mfes, mss]) => mfes.concat(mss).sort(this.sortAppsByAppId))
    )
  }
  private sortAppsByAppId(a: AppAbstract, b: AppAbstract): number {
    return (a.appId as string).toUpperCase().localeCompare((b.appId as string).toUpperCase())
  }

  /**
   * UI EVENTS
   */
  public onLayoutChange(viewMode: string): void {
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

  public onDetail(ev: any, app: AppAbstract) {
    ev.stopPropagation()
    this.app = app
    this.changeMode = 'EDIT'
    this.displayDetailDialog = true
  }
  public onCopy(ev: any, app: AppAbstract) {
    ev.stopPropagation()
    this.app = app
    this.changeMode = 'COPY'
    this.displayDetailDialog = true
  }
  public onCreate() {
    this.changeMode = 'CREATE'
    this.app = undefined
    this.displayDetailDialog = true
  }
  public onDelete(ev: any, app: AppAbstract) {
    ev.stopPropagation()
    this.app = app
    this.displayDeleteDialog = true
  }

  public appChanged(changed: any) {
    this.displayDetailDialog = false
    if (changed) this.searchApps()
  }
  public appDeleted(deleted: any) {
    this.displayDeleteDialog = false
    if (deleted) this.searchApps()
  }
}
