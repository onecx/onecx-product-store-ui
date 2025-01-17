import { Component, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { FormControl, FormGroup } from '@angular/forms'
import { TranslateService } from '@ngx-translate/core'
import { catchError, finalize, map, Observable, of, tap } from 'rxjs'
import { Table } from 'primeng/table'

import { UserService } from '@onecx/angular-integration-interface'
import { Action, Column, DataViewControlTranslations, PortalMessageService } from '@onecx/portal-integration-angular'

import {
  MicrofrontendAbstract,
  MicrofrontendsAPIService,
  MicrofrontendPageResult,
  MicrofrontendType
} from 'src/app/shared/generated'
import { limitText } from 'src/app/shared/utils'

export interface MicrofrontendSearchCriteria {
  productName: FormControl<string | null>
}
export type ChangeMode = 'VIEW' | 'COPY' | 'CREATE' | 'EDIT'
export type MfeEndpoint = MicrofrontendAbstract & { unique_id: string; endpoint_name: string; endpoint_path: string }
type ExtendedColumn = Column & {
  hasFilter?: boolean
  isDate?: boolean
  isDropdown?: boolean
  limit?: boolean
  css?: string
}

@Component({
  selector: 'app-endpoint-search',
  templateUrl: './endpoint-search.component.html',
  styleUrls: ['./endpoint-search.component.scss']
})
export class EndpointSearchComponent implements OnInit {
  // dialog
  public loading = false
  public exceptionKey: string | undefined = undefined
  public changeMode: ChangeMode = 'VIEW'
  public dateFormat: string
  public actions$: Observable<Action[]> | undefined
  public mfeSearchCriteriaGroup!: FormGroup<MicrofrontendSearchCriteria>

  public filteredColumns: Column[] = []
  public limitText = limitText

  @ViewChild('dataTable', { static: false }) dataTable: Table | undefined
  public dataViewControlsTranslations: DataViewControlTranslations = {}

  // data
  public endpoints$: Observable<MfeEndpoint[]> | undefined

  public columns: ExtendedColumn[] = [
    {
      field: 'productName',
      header: 'PRODUCT_NAME',
      active: true,
      translationPrefix: 'APP',
      limit: false
    },
    {
      field: 'appId',
      header: 'APP_ID',
      active: true,
      translationPrefix: 'APP',
      limit: false
    },
    {
      field: 'endpoint_name',
      header: 'NAME',
      active: true,
      translationPrefix: 'APP.ENDPOINT',
      limit: false
    },
    {
      field: 'endpoint_path',
      header: 'PATH',
      active: true,
      translationPrefix: 'APP.ENDPOINT',
      limit: false
    }
  ]
  constructor(
    private readonly user: UserService,
    private readonly msgService: PortalMessageService,
    private readonly translate: TranslateService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly mfeApi: MicrofrontendsAPIService
  ) {
    this.dateFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'M/d/yy, hh:mm:ss a'
    this.filteredColumns = this.columns.filter((a) => a.active === true)
    this.mfeSearchCriteriaGroup = new FormGroup<MicrofrontendSearchCriteria>({
      productName: new FormControl<string | null>(null)
    })
  }

  ngOnInit(): void {
    this.prepareDialogTranslations()
    this.preparePageActions()
    this.searchEndpoints()
  }

  /**
   * DIALOG
   */
  private prepareDialogTranslations(): void {
    this.translate
      .get([
        'APP.APP_NAME',
        'APP.PRODUCT_NAME',
        'APP.ENDPOINT.NAME',
        'ACTIONS.DATAVIEW.VIEW_MODE_TABLE',
        'ACTIONS.DATAVIEW.FILTER',
        'ACTIONS.DATAVIEW.FILTER_OF',
        'ACTIONS.DATAVIEW.SORT_BY',
        'ACTIONS.DATAVIEW.SORT_DIRECTION_ASC',
        'ACTIONS.DATAVIEW.SORT_DIRECTION_DESC'
      ])
      .subscribe((data) => {
        this.dataViewControlsTranslations = {
          sortDropdownPlaceholder: data['ACTIONS.DATAVIEW.SORT_BY'],
          filterInputPlaceholder: data['ACTIONS.DATAVIEW.FILTER'],
          filterInputTooltip:
            data['ACTIONS.DATAVIEW.FILTER_OF'] +
            data['PRODUCT.NAME'] +
            ', ' +
            data['APP.APP_NAME'] +
            ', ' +
            data['APP.ENDPOINT.NAME'],
          viewModeToggleTooltips: {
            table: data['ACTIONS.DATAVIEW.VIEW_MODE_TABLE']
          },
          sortOrderTooltips: {
            ascending: data['ACTIONS.DATAVIEW.SORT_DIRECTION_ASC'],
            descending: data['ACTIONS.DATAVIEW.SORT_DIRECTION_DESC']
          },
          sortDropdownTooltip: data['ACTIONS.DATAVIEW.SORT_BY']
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
              icon: 'pi pi-bars',
              show: 'always'
            },
            {
              label: data['DIALOG.SEARCH.SLOTS.LABEL'],
              title: data['DIALOG.SEARCH.SLOTS.TOOLTIP'],
              actionCallback: () => this.router.navigate(['../slots'], { relativeTo: this.route }),
              permission: 'APP#SEARCH',
              icon: 'pi pi-bars',
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
    this.dataTable?.filterGlobal(event, 'contains')
  }
  public onSearch() {
    this.searchEndpoints()
  }
  public onCriteriaReset() {
    this.mfeSearchCriteriaGroup.reset()
  }

  /****************************************************************************
   *  SEARCHING
   */
  public searchEndpoints(): void {
    this.loading = true
    this.endpoints$ = this.mfeApi
      .searchMicrofrontends({
        mfeAndMsSearchCriteria: {
          productName: this.mfeSearchCriteriaGroup.controls['productName'].value,
          type: MicrofrontendType.Module,
          pageSize: 1000
        }
      })
      .pipe(
        // map from page result to mfe endpoint....
        tap((data: any) => {
          if (data.totalElements === 0) {
            this.msgService.info({ summaryKey: 'ACTIONS.SEARCH.MESSAGE.NO_RESULTS' })
            return data.size
          }
        }),
        map((data: MicrofrontendPageResult) => {
          const mfeend: MfeEndpoint[] = []
          if (!data.stream || data.stream.length === 0) return mfeend
          data.stream.forEach((mfe) => {
            mfe.endpoints?.forEach((ep, i) => {
              mfeend.push({
                id: mfe.id,
                appId: mfe.appId,
                appName: mfe.appName,
                productName: mfe.productName,
                exposedModule: mfe.exposedModule,
                remoteBaseUrl: mfe.remoteBaseUrl,
                type: mfe.type,
                unique_id: mfe.id + '_' + i,
                endpoint_name: ep.name,
                endpoint_path: ep.path
              })
            })
          })
          mfeend.sort(this.sortMfes)
          return mfeend
        }),
        catchError((err) => {
          this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.PRODUCTS'
          console.error('searchMicrofrontends', err)
          return of([] as MfeEndpoint[])
        }),
        finalize(() => (this.loading = false))
      )
  }
  public sortMfes(a: MfeEndpoint, b: MfeEndpoint): number {
    return (
      a.productName.toUpperCase().localeCompare(b.productName.toUpperCase()) ||
      (a.exposedModule ? a.exposedModule.toUpperCase() : '').localeCompare(
        b.exposedModule ? b.exposedModule.toUpperCase() : ''
      ) ||
      a.endpoint_name.toUpperCase().localeCompare(b.endpoint_name.toUpperCase())
    )
  }
}
