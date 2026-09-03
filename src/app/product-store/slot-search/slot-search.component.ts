import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, OnInit, viewChild } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AsyncPipe, NgClass, NgStyle, NgTemplateOutlet } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { BehaviorSubject, catchError, finalize, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs'

import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputGroupAddonModule } from 'primeng/inputgroupaddon'
import { InputGroupModule } from 'primeng/inputgroup'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { MultiSelectModule } from 'primeng/multiselect'
import { TooltipModule } from 'primeng/tooltip'
import { Table } from 'primeng/table'

import { PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import {
  Action,
  AngularAcceleratorModule,
  ColumnType,
  DataAction,
  DataSortDirection,
  DataTableColumn,
  Filter,
  RowListGridData,
  Sort
} from '@onecx/angular-accelerator'
import { PortalPageComponent } from '@onecx/angular-utils'

import {
  ProductsAPIService,
  ProductAbstract,
  ProductSearchCriteria,
  Slot,
  SlotsAPIService,
  SlotSearchCriteria
} from 'src/app/shared/generated'
import { Utils } from 'src/app/shared/utils'

import { ChangeMode } from '../product-detail/product-detail.component'
import { SlotDetailComponent } from '../slot-detail/slot-detail.component'
import { SlotDeleteComponent } from '../slot-delete/slot-delete.component'

export interface SlotSearchCriteriaForm {
  slotName: FormControl<string | null>
  productName: FormControl<string | null>
}
export type SlotData = Slot & { productDisplayName: string; state: string }
export type SlotState = { label: string; value: string; icon: string }
export interface Column {
  field: string
  header: string
  active: boolean
  translationPrefix?: string
  sort?: boolean
  css?: string
  limit?: number
  hasFilter?: boolean
}
export type ExtendedColumn = Column
export type CombinedSearchCriteria = {
  productFilters: ProductSearchCriteria
  slotFilters: SlotSearchCriteria
}
export type FilteredData = SlotData & RowListGridData
@Component({
  standalone: true,
  imports: [
    AngularAcceleratorModule,
    AsyncPipe,
    NgClass,
    NgStyle,
    NgTemplateOutlet,
    ButtonModule,
    DialogModule,
    FloatLabelModule,
    FormsModule,
    InputTextModule,
    InputGroupAddonModule,
    InputGroupModule,
    MessageModule,
    MultiSelectModule,
    ReactiveFormsModule,
    TooltipModule,
    TranslateModule,
    // components
    PortalPageComponent,
    SlotDetailComponent,
    SlotDeleteComponent
  ],
  templateUrl: './slot-search.component.html',
  styleUrls: ['./slot-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SlotSearchComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly user = inject(UserService)
  private readonly productApi = inject(ProductsAPIService)
  private readonly slotApi = inject(SlotsAPIService)
  private readonly translate = inject(TranslateService)
  private readonly msgService = inject(PortalMessageService)
  // dialog
  public loading = false
  public exceptionKey: string | undefined = undefined
  public actions$: Observable<Action[]> | undefined
  public dateFormat = 'medium'
  public displaySlotDetailDialog = false
  public displaySlotDeleteDialog = false
  public changeMode: ChangeMode = 'VIEW'
  public interactiveFilters: Filter[] = []
  public interactiveSortField = 'productDisplayName'
  public interactiveSortDirection: DataSortDirection = DataSortDirection.ASCENDING
  public interactiveColumns: DataTableColumn[] = [
    { id: 'name', nameKey: 'SLOT.NAME', columnType: ColumnType.STRING, sortable: true, filterable: true },
    {
      id: 'state',
      nameKey: 'SLOT.STATE',
      tooltipKey: 'SLOT.TOOLTIPS.STATE',
      columnType: ColumnType.STRING,
      sortable: true,
      filterable: true
    },
    { id: 'appId', nameKey: 'SLOT.APP_ID', columnType: ColumnType.STRING, sortable: true, filterable: true },
    {
      id: 'productDisplayName',
      nameKey: 'SLOT.PRODUCT_NAME',
      columnType: ColumnType.STRING,
      sortable: true,
      filterable: true
    }
  ]
  public interactiveDisplayedColumnKeys: string[] = this.interactiveColumns.map((column) => column.id)
  public interactiveAdditionalActions: DataAction[] = [
    {
      id: 'copy-slot',
      icon: 'pi pi-copy',
      labelKey: 'ACTIONS.COPY.LABEL',
      permission: 'SLOT#CREATE',
      classes: ['copyTableRowButton'],
      callback: (data: unknown) => this.onSlotCreate(data)
    }
  ]
  // data
  private readonly searchCriteria$ = new BehaviorSubject<CombinedSearchCriteria>({
    productFilters: {},
    slotFilters: {}
  }) // Observable for search criteria changes
  public searchCriteriaForm: FormGroup<SlotSearchCriteriaForm>
  public products$: Observable<ProductAbstract[]> = of([])
  public slots$: Observable<Slot[]> = of([])
  public slotData$: Observable<SlotData[]> = of([])
  public filteredData$ = new BehaviorSubject<FilteredData[]>([])
  public readonly resultData$ = new BehaviorSubject<SlotData[]>([])
  private lastProductFilters = ''
  private cachedProducts: ProductAbstract[] = []

  public item4Detail: Slot | undefined
  public item4Delete: SlotData | undefined

  public filter = ''
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

  // filter icons
  public readonly headerFilterIconSlotName = viewChild<ElementRef>('headerFilterIconSlotName')
  public readonly headerFilterIconSlotState = viewChild<ElementRef>('headerFilterIconSlotState')
  public readonly headerFilterIconProduct = viewChild<ElementRef>('headerFilterIconProduct')

  public readonly dataTable = viewChild<Table>('dataTable')

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
      css: 'flex flex-row flex-nowrap justify-content-center border-left-1',
      translationPrefix: 'SLOT'
    },
    {
      field: 'description',
      header: 'DESCRIPTION',
      active: false,
      limit: 100,
      css: 'min-w-20rem',
      translationPrefix: 'SLOT'
    }
  ]
  public hasViewPermission = false
  public hasEditPermission = false

  constructor() {
    this.dateFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'M/d/yy, hh:mm:ss a'
    this.filteredColumns = this.columns.filter((a) => a.active === true)
    this.searchCriteriaForm = new FormGroup<SlotSearchCriteriaForm>({
      slotName: new FormControl<string | null>(null),
      productName: new FormControl<string | null>(null)
    })
  }

  ngOnInit(): void {
    this.initPermissions()
    this.initGlobalFilter()
    this.prepareActionButtons()
    this.prepareStateValues()
    this.prepareSearchCriteria()
    this.getData()
  }

  private async initPermissions(): Promise<void> {
    this.hasViewPermission = await this.user.hasPermission('SLOT#VIEW')
    this.hasEditPermission = await this.user.hasPermission('SLOT#EDIT')
  }

  /****************************************************************************
   *  SEARCHING
   */
  // Combine search criteria for slots and products (get the product display name)
  private prepareSearchCriteria(): void {
    const productName = this.searchCriteriaForm.controls['productName'].value ?? undefined
    const slotName = this.searchCriteriaForm.controls['slotName'].value ?? undefined

    this.searchCriteria$.next({
      productFilters: {
        ...(productName ? { names: [productName] } : {}),
        pageSize: 100
      },
      slotFilters: {
        ...(slotName ? { name: slotName } : {}),
        ...(productName ? { productName: productName } : {}),
        pageSize: 1000
      }
    })
  }

  // complete refresh: getting meta data and trigger search
  private getData(): void {
    this.slotData$ = this.searchCriteria$.pipe(
      switchMap((criteria) => {
        this.loading = true
        this.exceptionKey = undefined

        // Optimization: any change in product search criteria?
        const currentProdFiltersStr = JSON.stringify(criteria.productFilters)
        let productsRequest$: Observable<ProductAbstract[]>

        if (currentProdFiltersStr === this.lastProductFilters && this.cachedProducts.length > 0) {
          productsRequest$ = of(this.cachedProducts) // reuse cached products
        } else {
          this.lastProductFilters = currentProdFiltersStr
          productsRequest$ = this.productApi.searchProducts({ productSearchCriteria: criteria.productFilters }).pipe(
            tap((data) => {
              this.cachedProducts = data.stream ?? []
              if (data?.totalElements === 0) this.msgService.info({ summaryKey: 'ACTIONS.SEARCH.NOT_FOUND' })
            }),
            map((r) => (r.stream ?? []) as ProductAbstract[]),
            catchError((err) => {
              this.exceptionKey = this.getHttpExceptionKey(err, 'PRODUCTS')
              console.error('searchProducts', err)
              return of([])
            })
          )
        }
        // forkJoin triggers both requests and waits for both to complete before proceeding
        return forkJoin({
          products: productsRequest$,
          slots: this.slotApi.searchSlots({ slotSearchCriteria: criteria.slotFilters }).pipe(
            map((r) => {
              return r.stream as Slot[]
            }),
            catchError((err) => {
              this.exceptionKey = this.getHttpExceptionKey(err, 'SLOTS')
              console.error('searchSlots', err)
              return of([] as Slot[])
            })
          )
        }).pipe(
          map((data) => this.combineData(data)),
          finalize(() => (this.loading = false))
        )
      }),
      takeUntilDestroyed(this.destroyRef)
    )
    this.slotData$.subscribe({
      next: (sd) => {
        this.resultData$.next(sd)
        this.filteredData$.next(sd as FilteredData[])
      }
    })
  }

  private combineData(data: { slots: Slot[]; products: ProductAbstract[] }): SlotData[] {
    if (!data.slots || data.slots.length === 0) return []
    const sd: SlotData[] = []
    this.filterProductItems = []
    let slot: SlotData
    for (const s of data.slots) {
      slot = {
        ...s,
        productDisplayName: this.getProductDisplayName(s.productName, data.products),
        state: this.getSlotState(s)
      }
      sd.push(slot)
    }
    sd.sort((a, b) => this.sortSlots(a, b))
    return sd
  }
  private sortSlots(a: SlotData, b: SlotData): number {
    return (
      this.upperValue(a.productName).localeCompare(this.upperValue(b.productName)) ||
      this.upperValue(a.appId).localeCompare(this.upperValue(b.appId)) ||
      this.upperValue(a.name).localeCompare(this.upperValue(b.name))
    )
  }

  private upperValue(value: string | null | undefined): string {
    return (value ?? '').toUpperCase()
  }

  private getHttpExceptionKey(err: unknown, domain: 'PRODUCTS' | 'SLOTS'): string {
    const maybeStatus = (err as { status?: number })?.status
    const status = typeof maybeStatus === 'number' ? maybeStatus : 0
    return `EXCEPTIONS.HTTP_STATUS_${status}.${domain}`
  }

  private getProductDisplayName(name: string, pas: ProductAbstract[]): string {
    const pf = pas.find((p) => p.name === name)
    return pf?.displayName ?? name
  }

  private getSlotState(slot: Slot): string {
    if (slot.operator) return 'operator'
    if (slot.undeployed) return 'undeployed'
    if (slot.deprecated) return 'deprecated'
    return ''
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

  public resetFilters() {
    this.filterData = ''
    this.filter = ''
    this.interactiveFilters = []
    this.filterPanelSlotNameVisible = false
    this.filterPanelSlotStateVisible = false
    this.filterPanelProductVisible = false
    this.onResetFilterIcons('not empty', ['slotName', 'slotState', 'product'])
    this.dataTable()?.clear()
  }

  /**
   * UI EVENTS
   */
  public onInteractiveFiltersChange(filters: Filter[]): void {
    this.interactiveFilters = filters
    const globalFilter = filters.find((f) => f.columnId === 'global')
    if (typeof globalFilter?.value === 'string') this.filter = globalFilter.value
  }
  public onInteractiveSorted(sort: Sort): void {
    this.interactiveSortField = sort.sortColumn
    this.interactiveSortDirection = sort.sortDirection
  }
  public onLayoutChange(viewMode: 'grid' | 'list' | 'table'): void {
    // Layout change handler for interactive data view - table-only component
  }

  public onSearch() {
    this.resetFilters()
    this.prepareSearchCriteria()
  }
  public onSearchReset() {
    this.searchCriteriaForm.reset()
    this.onFilterChange('')
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
    this.openSlotDetail(mode, data)
  }
  public onEditFromInteractive(data: RowListGridData) {
    this.openSlotDetail('EDIT', data as unknown as Slot)
  }
  public onViewFromInteractive(data: RowListGridData) {
    this.openSlotDetail('VIEW', data as unknown as Slot)
  }
  public onSlotCreate(data: unknown) {
    this.openSlotDetail('CREATE', data as Slot)
  }
  private openSlotDetail(mode: ChangeMode, data: Slot) {
    this.item4Detail = { ...data }
    this.changeMode = mode
    this.displaySlotDetailDialog = true
  }
  public slotChanged(changed: any) {
    this.displaySlotDetailDialog = false
    if (changed) this.onSearch()
  }

  public onSlotDelete(ev: any, slot: SlotData) {
    ev.stopPropagation()
    this.openSlotDelete(slot)
  }
  public onDeleteFromInteractive(slot: RowListGridData) {
    this.openSlotDelete(slot as unknown as SlotData)
  }
  private openSlotDelete(slot: SlotData) {
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
    if (ss)
      for (const s of ss)
        if (s.name && !this.filterSlotNameItems.includes(s.name)) this.filterSlotNameItems.push(s.name)
    this.filterSlotNameItems.sort(Utils.sortByLocale)
  }
  private prepareFilterProductNames(ss: SlotData[] | undefined) {
    this.filterProductItems = []
    if (ss)
      for (const s of ss)
        if (s.productDisplayName && !this.filterProductItems.includes(s.productDisplayName))
          this.filterProductItems.push(s.productDisplayName)
    this.filterProductItems.sort(Utils.sortByLocale)
  }

  // triggered by the use of global table filter => switching filter icons
  // on simple string filter: if filter is active then icon switched to filter-slash
  public onFilterChange(val: any, icon?: HTMLElement, showClear?: boolean): void {
    if (typeof val === 'string') {
      this.filter = val
    }
    this.filterData = val
    this.resultData$.next(this.resultData$.value)
    this.updateFilterIcon(val, icon, showClear)
    // on reset of the global filter: clear all column filter icons
    if (typeof val === 'string' && !icon) this.onResetFilterIcons('not empty', ['slotName', 'slotState', 'product'])
  }

  private updateFilterIcon(val: any, icon?: HTMLElement, showClear?: boolean): void {
    if (!icon?.className) return
    if (typeof val === 'string') {
      const iconSuffix = showClear ? 'slash' : 'fill'
      icon.className = val === '' ? 'pi pi-filter' : 'pi pi-filter-' + iconSuffix
      return
    }
    if (typeof val === 'object') {
      icon.className = val.length === 0 ? 'pi pi-filter' : 'pi pi-filter-fill'
    }
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
          this.filteredData$.next(filteredData as FilteredData[])
        }
      })
  }
  // this is the normal text filter
  private stringFilter(filter: string, slots: SlotData[]): SlotData[] {
    const lowerCaseFilter = filter.toLowerCase()
    return slots.filter((slot: SlotData) => {
      return ['name', 'state', 'appId', 'productDisplayName'].some((key: string) => {
        const value = Utils.toSearchableText(slot[key as keyof SlotData])
        return value?.toLowerCase().includes(lowerCaseFilter)
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
    if (icon?.className && icon.className === 'pi pi-filter-slash') this.onFilterChange('', icon)
    this.filterPanelSlotNameVisible ? filterOptions.hide() : filterOptions.show()
  }
  public onToggleFilterProduct(ev: MouseEvent, filterOptions: any, icon?: HTMLElement) {
    ev.stopPropagation()
    if (icon?.className && icon.className === 'pi pi-filter-slash') this.onFilterChange('', icon)
    this.filterPanelProductVisible ? filterOptions.hide() : filterOptions.show()
  }
  public onResetFilterIcons(val: string, fields: string[]) {
    if (val) {
      if (fields?.includes('slotState') && this.headerFilterIconSlotState()) {
        this.headerFilterIconSlotState()!.nativeElement.className = 'pi pi-filter'
        this.filterStateValue = []
      }
      if (fields?.includes('slotName') && this.headerFilterIconSlotName())
        this.headerFilterIconSlotName()!.nativeElement.className = 'pi pi-filter'
      if (fields?.includes('product') && this.headerFilterIconProduct())
        this.headerFilterIconProduct()!.nativeElement.className = 'pi pi-filter'
    }
  }

  /**
   * SORT
   */
  public onSortColumn(ev: MouseEvent, field: string, icon: HTMLElement) {
    ev.stopPropagation()
    const className = { up: 'pi pi-sort-amount-up-alt', down: 'pi pi-sort-amount-down' }
    this.dataTable()?.clear()
    switch (icon.className) {
      case className.down:
        icon.className = className.up
        this.dataTable()?._value.sort((a, b) => this.compareValues(field, a, b))
        break
      case className.up:
        icon.className = className.down
        this.dataTable()?._value.sort((c, d) => this.compareValues(field, d, c))
        break
    }
  }

  private compareValues(field: string, a: SlotData, b: SlotData): number {
    let ret = 0
    switch (field) {
      case 'slotState':
        ret = this.compareSlotStates(a, b)
        break
      case 'slotName':
        ret = this.compareSlotNames(a, b)
        break
      case 'product':
        ret = this.compareProducts(a, b)
        break
    }
    return ret
  }

  private compareSlotStates(a: SlotData, b: SlotData): number {
    const op = (a.operator === true ? 1 : 0) - (b.operator === true ? 1 : 0)
    if (op !== 0) return op
    const ud = (a.undeployed === true ? 1 : 0) - (b.undeployed === true ? 1 : 0)
    if (ud !== 0) return ud
    return (a.deprecated === true ? 1 : 0) - (b.deprecated === true ? 1 : 0)
  }
  private compareSlotNames(a: SlotData, b: SlotData): number {
    return (
      this.upperValue(a.name).localeCompare(this.upperValue(b.name)) || (a.appId ?? '').localeCompare(b.appId ?? '')
    )
  }
  private compareProducts(a: SlotData, b: SlotData): number {
    return (
      this.upperValue(a.productDisplayName).localeCompare(this.upperValue(b.productDisplayName)) ||
      (a.appId ?? '').localeCompare(b.appId ?? '')
    )
  }
}
