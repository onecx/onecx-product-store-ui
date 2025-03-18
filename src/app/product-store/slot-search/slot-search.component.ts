import { Component, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { FormControl, FormGroup } from '@angular/forms'
import { finalize, map, of, Observable, catchError } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'
import { DataView } from 'primeng/dataview'

import { Action, DataViewControlTranslations, UserService } from '@onecx/portal-integration-angular'

import { Slot, SlotPageResult, SlotsAPIService } from 'src/app/shared/generated'
import { limitText } from 'src/app/shared/utils'

export interface SlotSearchCriteria {
  slotName: FormControl<string | null>
  productName: FormControl<string | null>
}

@Component({
  templateUrl: './slot-search.component.html',
  styleUrls: ['./slot-search.component.scss']
})
export class SlotSearchComponent implements OnInit {
  public exceptionKey: string | undefined
  public searchInProgress = false
  public slots$!: Observable<SlotPageResult>
  public slotSearchCriteriaGroup!: FormGroup<SlotSearchCriteria>
  public slot!: Slot | undefined
  public actions$: Observable<Action[]> | undefined
  public viewMode: 'grid' | 'list' = 'grid'
  public filter: string | undefined
  public sortField = 'name'
  public sortOrder = 1
  public limitText = limitText
  public displayDeleteDialog = false
  public hasDeletePermission = false

  @ViewChild(DataView) dv: DataView | undefined
  public dataViewControlsTranslations$: Observable<DataViewControlTranslations> | undefined

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly user: UserService,
    private readonly slotApi: SlotsAPIService,
    private readonly translate: TranslateService
  ) {
    this.hasDeletePermission = this.user.hasPermission('SLOT#DELETE')
    this.slotSearchCriteriaGroup = new FormGroup<SlotSearchCriteria>({
      slotName: new FormControl<string | null>(null),
      productName: new FormControl<string | null>(null)
    })
  }

  ngOnInit(): void {
    this.prepareDialogTranslations()
    this.prepareActionButtons()
    this.searchSlots()
  }

  public searchSlots(): void {
    this.searchInProgress = true
    this.slots$ = this.slotApi
      .searchSlots({
        slotSearchCriteria: {
          name: this.slotSearchCriteriaGroup.controls['slotName'].value!,
          productName: this.slotSearchCriteriaGroup.controls['productName'].value!,
          pageSize: 1000
        }
      })
      .pipe(
        catchError((err) => {
          this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.SLOTS'
          console.error('searchSlots', err)
          return of({ stream: [] } as SlotPageResult)
        }),
        finalize(() => (this.searchInProgress = false))
      )
  }
  public sortSlotsByName(a: Slot, b: Slot): number {
    return a.name.toUpperCase().localeCompare(b.name.toUpperCase())
  }

  /**
   * DIALOG
   */
  private prepareDialogTranslations(): void {
    this.dataViewControlsTranslations$ = this.translate
      .get([
        'SLOT.NAME',
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
            filterInputTooltip: data['ACTIONS.DATAVIEW.FILTER_OF'] + data['SLOT.NAME'],
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
    this.searchSlots()
  }
  public onSearchReset() {
    this.slotSearchCriteriaGroup.reset()
  }
  public onBack() {
    this.router.navigate(['../'], { relativeTo: this.route })
  }

  public onDelete(ev: any, slot: Slot) {
    ev.stopPropagation()
    this.slot = slot
    this.displayDeleteDialog = true
  }
  public slotDeleted(deleted: boolean) {
    this.displayDeleteDialog = false
    if (deleted) this.searchSlots()
  }
}
