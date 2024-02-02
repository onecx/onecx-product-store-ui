import { Component, OnInit, ViewChild } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { DataView } from 'primeng/dataview'
import { Observable, finalize, map } from 'rxjs'

import { Action, DataViewControlTranslations, UserService } from '@onecx/portal-integration-angular'
import { MicrofrontendAbstract, MicrofrontendPageResult, MicrofrontendsAPIService } from 'src/app/shared/generated'
import { limitText } from 'src/app/shared/utils'
import { ChangeMode } from '../app-detail/app-detail.component'

export interface MicrofrontendSearchCriteria {
  appId: FormControl<string | null>
  appName: FormControl<string | null>
  productName: FormControl<string | null>
}

@Component({
  templateUrl: './app-search.component.html',
  styleUrls: ['./app-search.component.scss']
})
export class AppSearchComponent implements OnInit {
  public apps$!: Observable<MicrofrontendPageResult>
  public app: MicrofrontendAbstract | undefined
  public appSearchCriteriaGroup!: FormGroup<MicrofrontendSearchCriteria>
  public actions$: Observable<Action[]> | undefined
  public viewMode = 'grid'
  public changeMode: ChangeMode = 'VIEW'
  public filter: string | undefined
  public sortField = 'appName'
  public sortOrder = 1
  public searchInProgress = false
  public displayDetailDialog = false
  public displayDeleteDialog = false
  public hasCreatePermission = false
  public hasDeletePermission = false
  public limitText = limitText

  public dataViewControlsTranslations: DataViewControlTranslations = {}
  @ViewChild(DataView) dv: DataView | undefined

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private user: UserService,
    private appApi: MicrofrontendsAPIService,
    private translate: TranslateService
  ) {
    this.hasCreatePermission = this.user.hasPermission('MICROFRONTEND#CREATE')
    this.hasDeletePermission = this.user.hasPermission('MICROFRONTEND#DELETE')
    this.appSearchCriteriaGroup = new FormGroup<MicrofrontendSearchCriteria>({
      appId: new FormControl<string | null>(null),
      appName: new FormControl<string | null>(null),
      productName: new FormControl<string | null>(null)
    })
  }

  ngOnInit(): void {
    this.prepareActionButtons()
    this.searchApps()
  }

  public searchApps(): void {
    this.searchInProgress = true
    this.apps$ = this.appApi
      .searchMicrofrontends({
        microfrontendSearchCriteria: {
          appId: this.appSearchCriteriaGroup.controls['appId'].value,
          appName: this.appSearchCriteriaGroup.controls['appName'].value,
          productName: this.appSearchCriteriaGroup.controls['productName'].value,
          pageSize: 1000
        }
      })
      .pipe(finalize(() => (this.searchInProgress = false)))
  }

  private prepareActionButtons(): void {
    this.actions$ = this.translate
      .get([
        'ACTIONS.CREATE.LABEL',
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
              label: data['ACTIONS.CREATE.LABEL'],
              title: data['ACTIONS.CREATE.APP.TOOLTIP'],
              actionCallback: () => this.onCreate(),
              permission: 'MICROFRONTEND#CREATE',
              icon: 'pi pi-plus',
              show: 'always'
            }
          ]
        })
      )
  }

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
  public onSearch() {
    this.searchApps()
  }
  public onSearchReset() {
    this.appSearchCriteriaGroup.reset()
  }
  public onBack() {
    this.router.navigate(['../'], { relativeTo: this.route })
  }
  public onGotoProduct(ev: any, product: string) {
    ev.stopPropagation()
    this.router.navigate(['../', product], { relativeTo: this.route })
  }

  public onDetail(ev: any, app: MicrofrontendAbstract) {
    ev.stopPropagation()
    this.app = app
    this.changeMode = 'EDIT'
    this.displayDetailDialog = true
  }
  public onCopy(ev: any, app: MicrofrontendAbstract) {
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
  public onDelete(ev: any, app: MicrofrontendAbstract) {
    ev.stopPropagation()
    this.app = app
    this.displayDeleteDialog = true
  }
}
