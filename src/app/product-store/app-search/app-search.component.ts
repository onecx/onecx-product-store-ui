import { Component, OnInit, ViewChild } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Action, DataViewControlTranslations } from '@onecx/portal-integration-angular'
import { DataView } from 'primeng/dataview'
import { Observable, finalize } from 'rxjs'
import { MicrofrontendAbstract, MicrofrontendPageResult, MicrofrontendsAPIService } from 'src/app/generated'
import { limitText } from 'src/app/shared/utils'

export interface MicrofrontendSearchCriteria {
  appId: FormControl<string | null>
  appName: FormControl<string | null>
  productName: FormControl<string | null>
}
type ChangeMode = 'VIEW' | 'CREATE' | 'EDIT'

@Component({
  templateUrl: './app-search.component.html',
  styleUrls: ['./app-search.component.scss']
})
export class AppSearchComponent implements OnInit {
  public apps$!: Observable<MicrofrontendPageResult>
  public app: MicrofrontendAbstract | undefined
  public appSearchCriteriaGroup!: FormGroup<MicrofrontendSearchCriteria>
  public actions: Action[] = []
  public viewMode = 'grid'
  public changeMode: ChangeMode = 'VIEW'
  public filter: string | undefined
  public sortField = 'appName'
  public sortOrder = 1
  public searchInProgress = false
  public displayDetailDialog = false
  public limitText = limitText

  public dataViewControlsTranslations: DataViewControlTranslations = {}
  @ViewChild(DataView) dv: DataView | undefined

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appApi: MicrofrontendsAPIService,
    private translate: TranslateService
  ) {
    this.appSearchCriteriaGroup = new FormGroup<MicrofrontendSearchCriteria>({
      appId: new FormControl<string | null>(null),
      appName: new FormControl<string | null>(null),
      productName: new FormControl<string | null>(null)
    })
  }

  ngOnInit(): void {
    //this.prepareTranslations()
    this.searchData()
  }

  public searchData(): void {
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

  private prepareTranslations(): void {
    this.translate
      .get([
        'MFE.APP_ID',
        'MFE.APP_NAME',
        'MFE.PRODUCT_NAME',
        'ACTIONS.NAVIGATION.BACK',
        'ACTIONS.NAVIGATION.BACK.TOOLTIP',
        'ACTIONS.CREATE.LABEL',
        'ACTIONS.CREATE.APP.TOOLTIP',
        'ACTIONS.DATAVIEW.VIEW_MODE_LIST',
        'ACTIONS.DATAVIEW.VIEW_MODE_TABLE',
        'ACTIONS.DATAVIEW.SORT_BY',
        'ACTIONS.DATAVIEW.FILTER',
        'ACTIONS.DATAVIEW.FILTER_OF',
        'ACTIONS.DATAVIEW.SORT_DIRECTION_ASC',
        'ACTIONS.DATAVIEW.SORT_DIRECTION_DESC'
      ])
      .subscribe((data) => {
        this.dataViewControlsTranslations = {
          sortDropdownPlaceholder: data['ACTIONS.DATAVIEW.SORT_BY'],
          filterInputPlaceholder: data['ACTIONS.DATAVIEW.FILTER'],
          filterInputTooltip:
            data['ACTIONS.DATAVIEW.FILTER_OF'] +
            data['MFE.APP_ID'] +
            ', ' +
            data['MFE.APP_NAME'] +
            ', ' +
            data['MFE.PRODUCT_NAME'],
          viewModeToggleTooltips: {
            grid: data['ACTIONS.DATAVIEW.VIEW_MODE_GRID'],
            table: data['ACTIONS.DATAVIEW.VIEW_MODE_TABLE']
          },
          sortOrderTooltips: {
            ascending: data['ACTIONS.DATAVIEW.SORT_DIRECTION_ASC'],
            descending: data['ACTIONS.DATAVIEW.SORT_DIRECTION_DESC']
          },
          sortDropdownTooltip: data['ACTIONS.DATAVIEW.SORT_BY']
        }
        this.prepareActionButtons(data)
      })
  }

  private prepareActionButtons(data: any): void {
    this.actions = [] // provoke change event
    this.actions.push(
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
    this.searchData()
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
  public onCreate() {
    this.changeMode = 'CREATE'
    this.app = undefined
    this.displayDetailDialog = true
  }
}
