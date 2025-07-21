import { Component, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { FormControl, FormGroup } from '@angular/forms'
import { catchError, combineLatest, finalize, map, of, Observable, tap } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'
import { Table } from 'primeng/table'

import { PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import { Action, Column, DataViewControlTranslations } from '@onecx/portal-integration-angular'

import {
  ProductsAPIService,
  ProductAbstract,
  ProductSearchCriteria,
  Slot,
  SlotPageResult,
  SlotsAPIService
} from 'src/app/shared/generated'
import { limitText } from 'src/app/shared/utils'

export interface SlotSearchCriteria {
  slotName: FormControl<string | null>
  productName: FormControl<string | null>
}
export type SlotData = Slot & { productDisplayName: string }
export type ExtendedColumn = Column & { sort?: boolean; css?: string }

@Component({
  templateUrl: './slot-search.component.html',
  styleUrls: ['./slot-search.component.scss']
})
export class SlotSearchComponent implements OnInit {
  // dialog
  public loading = false
  public exceptionKey: string | undefined = undefined
  public searchInProgress = false
  public actions$: Observable<Action[]> | undefined
  // data
  public searchCriteria: FormGroup<SlotSearchCriteria>
  public products$: Observable<ProductAbstract[]> = of([])
  public slots$: Observable<Slot[]> = of([])
  public slotData$: Observable<SlotData[]> = of([])

  public filter: string | undefined
  public filteredColumns: ExtendedColumn[] = []
  public sortField = 'name'
  public sortOrder = 1
  public limitText = limitText

  @ViewChild('dataTable', { static: false }) dataTable: Table | undefined
  public dataViewControlsTranslations$: Observable<DataViewControlTranslations> | undefined

  public columns: ExtendedColumn[] = [
    {
      field: 'state',
      header: 'STATE',
      active: true,
      css: 'text-center',
      translationPrefix: 'SLOT'
    },
    {
      field: 'name',
      header: 'NAME',
      active: true,
      translationPrefix: 'SLOT'
    },
    {
      field: 'description',
      header: 'DESCRIPTION',
      active: true,
      translationPrefix: 'SLOT'
    }
  ]
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly user: UserService,
    private readonly productApi: ProductsAPIService,
    private readonly slotApi: SlotsAPIService,
    private readonly translate: TranslateService,
    private readonly msgService: PortalMessageService
  ) {
    this.filteredColumns = this.columns.filter((a) => a.active === true)
    this.searchCriteria = new FormGroup<SlotSearchCriteria>({
      slotName: new FormControl<string | null>(null),
      productName: new FormControl<string | null>(null)
    })
  }

  ngOnInit(): void {
    this.prepareDialogTranslations()
    this.prepareActionButtons()
    this.declareDataSources()
    this.loadData()
  }

  /****************************************************************************
   *  SEARCHING
   */
  public declareDataSources(): void {
    // Products => to get the product display name
    const criteria: ProductSearchCriteria = {
      names: this.searchCriteria.controls['productName'].value
        ? [this.searchCriteria.controls['productName'].value]
        : undefined,
      pageSize: 1000
    }
    this.products$ = this.productApi.searchProducts({ productSearchCriteria: criteria }).pipe(
      map((data) => data.stream ?? []),
      catchError((err) => {
        this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.PRODUCTS'
        console.error('searchProducts', err)
        return of([])
      })
    )
    // Slots
    this.slots$ = this.slotApi
      .searchSlots({
        slotSearchCriteria: {
          name: this.searchCriteria.controls['slotName'].value ?? undefined,
          productName: this.searchCriteria.controls['productName'].value ?? undefined,
          pageSize: 1000
        }
      })
      .pipe(
        tap((data: SlotPageResult) => {
          if (data?.totalElements === 0) this.msgService.info({ summaryKey: 'ACTIONS.SEARCH.NOT_FOUND' })
        }),
        map((data: SlotPageResult) => data.stream ?? []),
        catchError((err) => {
          this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.SLOTS'
          console.error('searchSlots', err)
          return of([])
        }),
        finalize(() => (this.loading = false))
      )
  }

  // complete refresh: getting meta data and trigger search
  private loadData(): void {
    this.loading = true
    this.exceptionKey = undefined
    this.slotData$ = combineLatest([this.products$, this.slots$]).pipe(
      map(([ps, slots]) => {
        const sd: SlotData[] = []
        slots.forEach((s) => {
          sd.push({ ...s, productDisplayName: this.getProductDisplayName(s.productName, ps) })
        })
        sd.sort(this.sortSlots)
        return sd
      }),
      finalize(() => (this.loading = false))
    )
  }
  private getProductDisplayName(name: string, pas: ProductAbstract[]): string {
    const pf = pas.find((p) => p.name === name)
    return pf?.displayName ?? name
  }
  public sortSlots(a: SlotData, b: SlotData): number {
    return (
      a.productName.toUpperCase().localeCompare(b.productName.toUpperCase()) ||
      a.appId.toUpperCase().localeCompare(b.appId.toUpperCase()) ||
      a.name.toUpperCase().localeCompare(b.name.toUpperCase())
    )
  }

  /**
   * DIALOG
   */
  private prepareDialogTranslations(): void {
    this.dataViewControlsTranslations$ = this.translate
      .get([
        'SLOT.NAME',
        'SLOT.PRODUCT_NAME',
        'SLOT.APP_ID',
        'ACTIONS.DATAVIEW.VIEW_MODE_GRID',
        'ACTIONS.DATAVIEW.FILTER',
        'ACTIONS.DATAVIEW.FILTER_OF',
        'ACTIONS.DATAVIEW.SORT_BY',
        'ACTIONS.DATAVIEW.SORT_DIRECTION_ASC',
        'ACTIONS.DATAVIEW.SORT_DIRECTION_DESC'
      ])
      .pipe(
        map((data) => {
          return {
            sortDropdownPlaceholder: data['ACTIONS.DATAVIEW.SORT_BY'],
            filterInputPlaceholder: data['ACTIONS.DATAVIEW.FILTER'],
            filterInputTooltip:
              data['ACTIONS.DATAVIEW.FILTER_OF'] +
              data['SLOT.PRODUCT_NAME'] +
              ', ' +
              data['SLOT.APP_ID'] +
              ', ' +
              data['SLOT.NAME'],
            viewModeToggleTooltips: { grid: data['ACTIONS.DATAVIEW.VIEW_MODE_GRID'] },
            sortOrderTooltips: {
              ascending: data['ACTIONS.DATAVIEW.SORT_DIRECTION_ASC'],
              descending: data['ACTIONS.DATAVIEW.SORT_DIRECTION_DESC']
            },
            sortDropdownTooltip: data['ACTIONS.DATAVIEW.SORT_BY']
          } as DataViewControlTranslations
        })
      )
  }

  private prepareActionButtons(): void {
    this.actions$ = this.translate
      .get([
        'DIALOG.SEARCH.PRODUCTS.LABEL',
        'DIALOG.SEARCH.PRODUCTS.TOOLTIP',
        'DIALOG.SEARCH.ENDPOINTS.LABEL',
        'DIALOG.SEARCH.ENDPOINTS.TOOLTIP',
        'DIALOG.SEARCH.APPS.LABEL',
        'DIALOG.SEARCH.APPS.TOOLTIP'
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
              icon: 'pi pi-th-large',
              show: 'always'
            },
            {
              label: data['DIALOG.SEARCH.APPS.LABEL'],
              title: data['DIALOG.SEARCH.APPS.TOOLTIP'],
              actionCallback: () => this.router.navigate(['../apps'], { relativeTo: this.route }),
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
  public onFilterChange(event: any): void {
    this.dataTable?.filterGlobal(event, 'contains')
  }
  public onSearch() {
    this.declareDataSources()
    this.loadData()
  }
  public onSearchReset() {
    this.searchCriteria.reset()
  }
  public onBack() {
    this.router.navigate(['../'], { relativeTo: this.route })
  }
  public onGotoProduct(ev: any, data: SlotData) {
    ev.stopPropagation()
    this.router.navigate(['../', data.productName], { fragment: 'apps', relativeTo: this.route })
  }
}
