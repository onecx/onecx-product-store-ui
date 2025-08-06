import { Component, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { FormControl, FormGroup } from '@angular/forms'
import { catchError, combineLatest, finalize, map, of, Observable, tap } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'
import { SelectItem } from 'primeng/api'
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
import { ChangeMode } from '../product-detail/product-detail.component'

export interface SlotSearchCriteria {
  slotName: FormControl<string | null>
  productName: FormControl<string | null>
}
export type SlotData = Slot & { productDisplayName: string; stateValue: number }
export type ExtendedColumn = Column & { sort?: boolean; css?: string; limit?: number; hasFilter?: boolean }

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
  public dateFormat = 'medium'
  public displaySlotDetailDialog = false
  public displaySlotDeleteDialog = false
  public changeMode: ChangeMode = 'VIEW'
  public hasEditPermission = false
  // data
  public searchCriteria: FormGroup<SlotSearchCriteria>
  public products$: Observable<ProductAbstract[]> = of([])
  public slots$: Observable<Slot[]> = of([])
  public slotData$: Observable<SlotData[]> = of([])
  public item4Detail: Slot | undefined
  public item4Delete: Slot | undefined

  public filter: string | undefined
  public filteredColumns: ExtendedColumn[] = []
  public filterProductItems: string[] = []
  public filterProductValue: string | undefined = undefined
  public filterStateItems: SelectItem[] = []
  public filterStateValue: number = 0
  public sortField = 'name'
  public sortOrder = 1
  public limitText = limitText

  @ViewChild('dataTable', { static: false }) dataTable: Table | undefined
  public dataViewControlsTranslations$: Observable<DataViewControlTranslations> | undefined

  public columns: ExtendedColumn[] = [
    {
      field: 'name',
      header: 'NAME',
      active: true,
      limit: 20,
      hasFilter: true,
      css: 'min-w-16rem',
      translationPrefix: 'SLOT'
    },
    {
      field: 'state',
      header: 'STATE',
      active: true,
      css: 'text-center',
      translationPrefix: 'SLOT'
    },
    {
      field: 'description',
      header: 'DESCRIPTION',
      active: true,
      limit: 100,
      css: 'min-w-20rem',
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
    this.dateFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'M/d/yy, hh:mm:ss a'
    this.hasEditPermission = this.user.hasPermission('APP#EDIT')
    this.filteredColumns = this.columns.filter((a) => a.active === true)
    this.searchCriteria = new FormGroup<SlotSearchCriteria>({
      slotName: new FormControl<string | null>(null),
      productName: new FormControl<string | null>(null)
    })
    this.filterStateItems = [
      { label: 'operator', value: 100 },
      { label: 'undeployed', value: 10 },
      { label: 'deprecated', value: 1 }
    ]
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
      map((data) => {
        this.prepareFilterProducts(data.stream)
        return data.stream ?? []
      }),
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
          sd.push({
            ...s,
            productDisplayName: this.getProductDisplayName(s.productName, ps),
            stateValue: this.calculateFeatureValue(s)
          })
        })
        sd.sort(this.sortSlots)
        return sd
      }),
      finalize(() => (this.loading = false))
    )
  }
  private calculateFeatureValue(slot: Slot): number {
    return (slot.operator ? 100 : 0) + (slot.undeployed ? 10 : 0) + (slot.deprecated ? 1 : 0)
  }
  private prepareFilterProducts(pas: ProductAbstract[] | undefined) {
    this.filterProductItems = []
    pas?.forEach((p) => {
      if (p.displayName) this.filterProductItems.push(p.displayName)
    })
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
        'DIALOG.DATAVIEW.VIEW_MODE_GRID',
        'DIALOG.DATAVIEW.FILTER',
        'DIALOG.DATAVIEW.FILTER_OF',
        'DIALOG.DATAVIEW.SORT_BY',
        'DIALOG.DATAVIEW.SORT_DIRECTION_ASC',
        'DIALOG.DATAVIEW.SORT_DIRECTION_DESC'
      ])
      .pipe(
        map((data) => {
          return {
            sortDropdownPlaceholder: data['DIALOG.DATAVIEW.SORT_BY'],
            filterInputPlaceholder: data['DIALOG.DATAVIEW.FILTER'],
            filterInputTooltip:
              data['DIALOG.DATAVIEW.FILTER_OF'] +
              data['SLOT.PRODUCT_NAME'] +
              ', ' +
              data['SLOT.APP_ID'] +
              ', ' +
              data['SLOT.NAME'],
            viewModeToggleTooltips: { grid: data['DIALOG.DATAVIEW.VIEW_MODE_GRID'] },
            sortOrderTooltips: {
              ascending: data['DIALOG.DATAVIEW.SORT_DIRECTION_ASC'],
              descending: data['DIALOG.DATAVIEW.SORT_DIRECTION_DESC']
            },
            sortDropdownTooltip: data['DIALOG.DATAVIEW.SORT_BY']
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

  public onSlotDetail(mode: ChangeMode, ev: MouseEvent, data: SlotData) {
    ev.stopPropagation()
    this.item4Detail = { ...data } as Slot
    this.changeMode = mode
    this.displaySlotDetailDialog = true
  }
  public slotChanged(changed: any) {
    this.displaySlotDetailDialog = false
    if (changed) this.onSearch()
  }

  public onSlotDelete(ev: any, slot: Slot) {
    ev.stopPropagation()
    this.item4Delete = { ...slot }
    this.displaySlotDeleteDialog = true
  }
  public slotDeleted(deleted: boolean) {
    this.displaySlotDeleteDialog = false
    if (deleted) this.onSearch()
  }

  /**
   * FILTER
   */
  public onClick(ev: MouseEvent) {
    ev.stopPropagation()
  }
  public onFilterItemChangeProduct(ev: any) {
    this.filterProductValue = ev.value
    this.dataTable?.filter(this.filterProductValue, 'productDisplayName', 'equals')
  }
  public onFilterItemChangeState(ev: any) {
    this.filterStateValue = ev.value
    this.dataTable?.filter(this.filterStateValue, 'state', 'equals')
  }

  /**
   * SORT
   */
  public onSortProducts(ev: MouseEvent, icon: HTMLSpanElement) {
    ev.stopPropagation()
    this.dataTable?.clear()
    switch (icon.className) {
      case 'pi pi-fw pi-sort-amount-down':
        icon.className = 'pi pi-fw pi-sort-amount-up-alt'
        this.dataTable?._value.sort(this.sortRowByProductAsc)
        break
      case 'pi pi-fw pi-sort-amount-up-alt':
        icon.className = 'pi pi-fw pi-sort-amount-down'
        this.dataTable?._value.sort(this.sortByProductDesc)
        break
    }
  }
  private sortRowByProductAsc(a: SlotData, b: SlotData): number {
    return (
      a.productDisplayName.toUpperCase().localeCompare(b.productDisplayName.toUpperCase()) ||
      a.appId?.localeCompare(b.appId)
    )
  }
  private sortByProductDesc(a: SlotData, b: SlotData): number {
    return (
      b.productDisplayName.toUpperCase().localeCompare(a.productDisplayName.toUpperCase()) ||
      b.appId?.localeCompare(a.appId)
    )
  }
}
