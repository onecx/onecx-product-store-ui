import { Component, ElementRef, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { FormControl, FormGroup } from '@angular/forms'
import { BehaviorSubject, catchError, combineLatest, finalize, map, of, Observable, tap } from 'rxjs'
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
import { limitText, sortByLocale } from 'src/app/shared/utils'
import { ChangeMode } from '../product-detail/product-detail.component'

export interface SlotSearchCriteria {
  slotName: FormControl<string | null>
  productName: FormControl<string | null>
}
export type SlotData = Slot & { productDisplayName: string }
export type SlotState = { label: string; value: string; icon: string }
export type ExtendedColumn = Column & { sort?: boolean; css?: string; limit?: number; hasFilter?: boolean }

@Component({
  templateUrl: './slot-search.component.html',
  styleUrls: ['./slot-search.component.scss']
})
export class SlotSearchComponent implements OnInit {
  // dialog
  public loading = false
  public exceptionKey: string | undefined = undefined
  public actions$: Observable<Action[]> | undefined
  public dateFormat = 'medium'
  public displaySlotDetailDialog = false
  public displaySlotDeleteDialog = false
  public changeMode: ChangeMode = 'VIEW'
  // data
  public searchCriteria: FormGroup<SlotSearchCriteria>
  public products$: Observable<ProductAbstract[]> = of([])
  public slots$: Observable<Slot[]> = of([])
  public slotData$: Observable<SlotData[]> = of([])
  public item4Detail: Slot | undefined
  public item4Delete: Slot | undefined
  public filteredData$ = new BehaviorSubject<SlotData[]>([])
  public resultData$ = new BehaviorSubject<SlotData[]>([])

  private filterData: any = ''
  public filteredColumns: ExtendedColumn[] = []
  public filterProductItems: string[] = []
  public filterProductValue: string | undefined = undefined
  public filterSlotNameItems: string[] = []
  public filterSlotNameValue: string | undefined = undefined
  public filterStateItems: SlotState[] = []
  public filterStateValue: SlotState[] = []
  public filterStateValues$: Observable<SlotState[]> | undefined
  public filterPanelSlotStateVisible = false
  public filterPanelSlotNameVisible = false
  public filterPanelProductVisible = false
  public limitText = limitText

  // filter icons
  @ViewChild('headerFilterIconSlotName', { static: false }) headerFilterIconSlotName: ElementRef | undefined
  @ViewChild('headerFilterIconSlotState', { static: false }) headerFilterIconSlotState: ElementRef | undefined
  @ViewChild('headerFilterIconProduct', { static: false }) headerFilterIconProduct: ElementRef | undefined

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
    this.filteredColumns = this.columns.filter((a) => a.active === true)
    this.searchCriteria = new FormGroup<SlotSearchCriteria>({
      slotName: new FormControl<string | null>(null),
      productName: new FormControl<string | null>(null)
    })
  }

  ngOnInit(): void {
    this.initGlobalFilter()
    this.prepareDialogTranslations()
    this.prepareActionButtons()
    this.prepareStateValues()
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
  public resetFilters() {
    this.filterData = ''
    this.filterPanelSlotNameVisible = false
    this.filterPanelSlotStateVisible = false
    this.filterPanelProductVisible = false
    this.dataTable?.clear()
  }

  // complete refresh: getting meta data and trigger search
  private loadData(): void {
    this.loading = true
    this.exceptionKey = undefined
    this.slotData$ = combineLatest([this.products$, this.slots$]).pipe(
      map(([ps, slots]) => {
        const sd: SlotData[] = []
        this.filterProductItems = []
        let slot: SlotData
        slots.forEach((s) => {
          slot = {
            ...s,
            productDisplayName: this.getProductDisplayName(s.productName, ps)
          }
          sd.push(slot)
        })
        sd.sort(this.sortSlots)
        this.resultData$.next(sd)
        this.filteredData$.next(sd)
        return sd
      }),
      finalize(() => (this.loading = false))
    )
  }
  private sortSlots(a: SlotData, b: SlotData): number {
    return (
      a.productName.toUpperCase().localeCompare(b.productName.toUpperCase()) ||
      a.appId.toUpperCase().localeCompare(b.appId.toUpperCase()) ||
      a.name.toUpperCase().localeCompare(b.name.toUpperCase())
    )
  }

  private getProductDisplayName(name: string, pas: ProductAbstract[]): string {
    const pf = pas.find((p) => p.name === name)
    return pf?.displayName ?? name
  }

  /**
   * DIALOG
   */
  private prepareStateValues(): void {
    this.filterStateValues$ = this.translate
      .get(['INTERNAL.OPERATOR', 'INTERNAL.UNDEPLOYED', 'INTERNAL.DEPRECATED'])
      .pipe(
        map((data) => {
          return [
            { label: data['INTERNAL.OPERATOR'], value: 'operator', icon: 'pi-cog' },
            { label: data['INTERNAL.UNDEPLOYED'], value: 'undeployed', icon: 'pi-ban' },
            { label: data['INTERNAL.DEPRECATED'], value: 'deprecated', icon: 'pi-exclamation-circle' }
          ] as SlotState[]
        })
      )
  }
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
  public onSearch() {
    this.declareDataSources()
    this.resetFilters()
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
  private prepareFilterSlotNames(ss: SlotData[] | undefined) {
    this.filterSlotNameItems = []
    ss?.forEach((s) => {
      if (s.name && !this.filterSlotNameItems.includes(s.name)) this.filterSlotNameItems.push(s.name)
    })
    this.filterSlotNameItems.sort(sortByLocale)
  }
  private prepareFilterProductNames(ss: SlotData[] | undefined) {
    this.filterProductItems = []
    ss?.forEach((s) => {
      if (s.productDisplayName && !this.filterProductItems.includes(s.productDisplayName))
        this.filterProductItems.push(s.productDisplayName)
    })
    this.filterProductItems.sort(sortByLocale)
  }

  // trigger the use of global table filter and switch icon
  public onFilterChange(filter: any, icon?: HTMLElement, showClear?: boolean): void {
    this.filterData = filter
    this.resultData$.next(this.resultData$.value)
    if (typeof filter === 'string' && icon?.className)
      icon.className = !filter ? 'pi pi-filter' : 'pi pi-filter-' + (showClear ? 'slash' : 'fill')
    if (typeof filter === 'object' && icon?.className)
      icon.className = filter.length === 0 ? 'pi pi-filter' : 'pi pi-filter-fill'
  }
  private initGlobalFilter() {
    this.resultData$
      .pipe(
        map((slots) => {
          if (typeof this.filterData === 'string' && this.filterData.trim()) {
            return this.stringFilter(this.filterData, slots)
          } else if (typeof this.filterData === 'object' && this.filterData.length > 0) {
            return this.objectFilter(this.filterData, slots)
          } else {
            return slots
          }
        })
      )
      .subscribe({
        next: (filteredData) => {
          this.prepareFilterSlotNames(filteredData)
          this.prepareFilterProductNames(filteredData)
          this.filteredData$.next(filteredData)
        }
      })
  }
  // this is the normal text filter
  private stringFilter(filter: string, slots: SlotData[]): SlotData[] {
    const lowerCaseFilter = filter.toLowerCase()
    return slots.filter((slot: SlotData) => {
      return ['name', 'appId', 'productDisplayName'].some((key: string) => {
        const value = slot[key as keyof SlotData]
        return value?.toString().toLowerCase().includes(lowerCaseFilter)
      })
    })
  }
  // used here for filtereing different slot states (displayed in one column)
  private objectFilter(filter: string[], slots: SlotData[]): SlotData[] {
    return slots.filter(
      (slot: SlotData) =>
        (slot.operator === true && filter.includes('operator')) ||
        (slot.undeployed === true && filter.includes('undeployed')) ||
        (slot.deprecated === true && filter.includes('deprecated'))
    )
  }

  /**
   * FILTER UI Actions
   */
  public onClick(ev: MouseEvent) {
    ev.stopPropagation()
  }
  public onToggleFilterSlotState(ev: MouseEvent, filterOptions: any) {
    ev.stopPropagation()
    this.filterPanelSlotStateVisible ? filterOptions.hide() : filterOptions.show()
  }
  public onToggleFilterSlotName(ev: MouseEvent, filterOptions: any, icon?: HTMLElement) {
    ev.stopPropagation()
    // reset filtering?
    if (icon?.className && icon.className === 'pi pi-filter-slash') this.onFilterChange('', icon)
    this.filterPanelSlotNameVisible ? filterOptions.hide() : filterOptions.show()
  }
  public onToggleFilterProduct(ev: MouseEvent, filterOptions: any, icon?: HTMLElement) {
    ev.stopPropagation()
    // reset filtering?
    if (icon?.className && icon.className === 'pi pi-filter-slash') this.onFilterChange('', icon)
    this.filterPanelProductVisible ? filterOptions.hide() : filterOptions.show()
  }
  public onResetFilterIcons(val: string, icons: string[]) {
    if (val) {
      this.resetFilters()
      if (icons?.includes('slotName') && this.headerFilterIconSlotName)
        this.headerFilterIconSlotName.nativeElement.className = 'pi pi-filter'
      if (icons?.includes('slotState') && this.headerFilterIconSlotState)
        this.headerFilterIconSlotState.nativeElement.className = 'pi pi-filter'
      if (icons?.includes('product') && this.headerFilterIconProduct)
        this.headerFilterIconProduct.nativeElement.className = 'pi pi-filter'
    }
  }

  /**
   * SORT
   */
  public onSortStates(ev: MouseEvent, icon: HTMLElement) {
    ev.stopPropagation()
    this.dataTable?.clear()
    switch (icon.className) {
      case 'pi pi-sort-amount-down':
        icon.className = 'pi pi-sort-amount-up-alt'
        this.dataTable?._value.sort((a, b) => this.compareStates(a, b))
        break
      case 'pi pi-sort-amount-up-alt':
        icon.className = 'pi pi-sort-amount-down'
        this.dataTable?._value.sort((a, b) => this.compareStates(b, a))
        break
    }
  }
  private compareStates(a: SlotData, b: SlotData): number {
    const op = (a.operator === true ? 1 : 0) - (b.operator === true ? 1 : 0)
    const du = (a.undeployed === true ? 1 : 0) - (b.undeployed === true ? 1 : 0)
    const de = (a.deprecated === true ? 1 : 0) - (b.deprecated === true ? 1 : 0)
    return op !== 0 ? op : du !== 0 ? du : de !== 0 ? de : 0
  }

  public onSortSlotNames(ev: MouseEvent, icon: HTMLSpanElement) {
    ev.stopPropagation()
    this.dataTable?.clear()
    switch (icon.className) {
      case 'pi pi-sort-amount-down':
        icon.className = 'pi pi-sort-amount-up-alt'
        this.dataTable?._value.sort((a, b) => this.compareslotNames(a, b))
        break
      case 'pi pi-sort-amount-up-alt':
        icon.className = 'pi pi-sort-amount-down'
        this.dataTable?._value.sort((a, b) => this.compareslotNames(b, a))
        break
    }
  }
  private compareslotNames(a: SlotData, b: SlotData): number {
    return a.name.toUpperCase().localeCompare(b.name.toUpperCase()) || a.appId?.localeCompare(b.appId)
  }

  public onSortProducts(ev: MouseEvent, icon: HTMLSpanElement) {
    ev.stopPropagation()
    this.dataTable?.clear()
    switch (icon.className) {
      case 'pi pi-sort-amount-down':
        icon.className = 'pi pi-sort-amount-up-alt'
        this.dataTable?._value.sort((a, b) => this.compareProducts(a, b))
        break
      case 'pi pi-sort-amount-up-alt':
        icon.className = 'pi pi-sort-amount-down'
        this.dataTable?._value.sort((a, b) => this.compareProducts(b, a))
        break
    }
  }
  private compareProducts(a: SlotData, b: SlotData): number {
    return (
      a.productDisplayName.toUpperCase().localeCompare(b.productDisplayName.toUpperCase()) ||
      a.appId?.localeCompare(b.appId)
    )
  }
}
