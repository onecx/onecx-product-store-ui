import { Component, Input, OnChanges, ViewChild } from '@angular/core'
import { SelectItem } from 'primeng/api'
import { combineLatest, finalize, map, of, Observable, startWith, catchError } from 'rxjs'

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
  public apps$!: Observable<AppAbstract[]>
  public mfes$!: Observable<MicrofrontendPageResult>
  public mss$!: Observable<MicroservicePageResult>
  public app: AppAbstract | undefined
  public iconItems: SelectItem[] = [{ label: '', value: null }]
  public filter: string | undefined
  public viewMode = 'grid'
  public sortField = 'name'
  public sortOrder = 1
  public searchInProgress = false
  public displayDetailDialog = false
  public displayDeleteDialog = false
  public hasCreatePermission = false
  public hasDeletePermission = false

  @ViewChild(DataView) dv: DataView | undefined
  public dataViewControlsTranslations: DataViewControlTranslations = {}
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

  private log(text: string, obj?: object): void {
    if (this.debug) {
      if (obj) console.log('app search: ' + text, obj)
      else console.log('app search: ' + text)
    }
  }

  public searchApps(): void {
    this.searchInProgress = true
    this.mfes$ = this.mfeApi
      .searchMicrofrontends({ mfeAndMsSearchCriteria: { productName: this.product?.name } as MfeAndMsSearchCriteria })
      .pipe(
        startWith({} as MicrofrontendPageResult),
        catchError((err) => {
          this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.APPS'
          console.error('searchMicrofrontends():', err)
          return of({} as MicrofrontendPageResult)
        }),
        finalize(() => (this.searchInProgress = false))
      )

    this.mss$ = this.msApi
      .searchMicroservice({ mfeAndMsSearchCriteria: { productName: this.product?.name } as MfeAndMsSearchCriteria })
      .pipe(
        startWith({} as MicroservicePageResult),
        catchError((err) => {
          this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.APPS'
          console.error('searchMicroservice():', err)
          return of({} as MicroservicePageResult)
        }),
        finalize(() => (this.searchInProgress = false))
      )

    this.apps$ = combineLatest([
      this.mfes$.pipe(
        map((a) => {
          return a.stream
            ? a.stream?.map((mfe) => {
                return { ...mfe, appType: 'MFE' } as AppAbstract
              })
            : []
        })
      ),
      this.mss$.pipe(
        map((a) => {
          return a.stream
            ? a.stream?.map((ms) => {
                return { ...ms, appType: 'MS' } as AppAbstract
              })
            : []
        })
      )
    ]).pipe(map(([mfes, mss]) => mfes.concat(mss)))
  }

  public onLayoutChange(viewMode: string): void {
    this.viewMode = viewMode
  }
  public onFilterChange(filter: string): void {
    this.filter = filter
    //this.dv?.filter(filter, 'contains')
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
