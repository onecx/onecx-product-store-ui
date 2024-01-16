import { Component, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Observable, finalize } from 'rxjs'
import { DataView } from 'primeng/dataview'
import { TranslateService } from '@ngx-translate/core'
import { Action, DataViewControlTranslations } from '@onecx/portal-integration-angular'
import { ProductPageResult, ProductsAPIService } from '../../generated'
import { limitText } from '../../shared/utils'
import { FormControl, FormGroup } from '@angular/forms'

export interface ProductSearchCriteria {
  productName: FormControl<string | null>
}

@Component({
  templateUrl: './product-search.component.html',
  styleUrls: ['./product-search.component.scss']
})
export class ProductSearchComponent implements OnInit {
  public product$!: Observable<ProductPageResult>
  public productSearchCriteriaGroup!: FormGroup<ProductSearchCriteria>
  public actions: Action[] = []
  public viewMode = 'grid'
  public filter: string | undefined
  public sortField = 'name'
  public sortOrder = 1
  public searchInProgress = false
  public limitText = limitText

  public dataViewControlsTranslations: DataViewControlTranslations = {}
  @ViewChild(DataView) dv: DataView | undefined

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productApi: ProductsAPIService,
    private translate: TranslateService
  ) {
    this.productSearchCriteriaGroup = new FormGroup<ProductSearchCriteria>({
      productName: new FormControl<string | null>(null)
    })
  }

  ngOnInit(): void {
    this.prepareTranslations()
    this.loadProducts()
  }

  public loadProducts(): void {
    this.searchInProgress = true
    this.product$ = this.productApi
      .searchProducts({
        productSearchCriteria: { name: this.productSearchCriteriaGroup.controls['productName'].value, pageSize: 1000 }
      })
      .pipe(finalize(() => (this.searchInProgress = false)))
  }

  private prepareTranslations(): void {
    this.translate
      .get([
        'PRODUCT.NAME',
        'PRODUCT.DISPLAY_NAME',
        'ACTIONS.CREATE.PRODUCT',
        'ACTIONS.CREATE.PRODUCT.TOOLTIP',
        'ACTIONS.DATAVIEW.VIEW_MODE_GRID',
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
            data['ACTIONS.DATAVIEW.FILTER_OF'] + data['PRODUCT.NAME'] + ', ' + data['PRODUCT.DISPLAY_NAME'],
          viewModeToggleTooltips: {
            grid: data['ACTIONS.DATAVIEW.VIEW_MODE_GRID'],
            list: data['ACTIONS.DATAVIEW.VIEW_MODE_LIST']
            // table: data['ACTIONS.DATAVIEW.VIEW_MODE_TABLE'],
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
    this.actions.push({
      label: data['ACTIONS.CREATE.PRODUCT'],
      title: data['ACTIONS.CREATE.PRODUCT.TOOLTIP'],
      actionCallback: () => this.onNewProduct(),
      permission: 'PRODUCT#EDIT',
      icon: 'pi pi-plus',
      show: 'always'
    })
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
    this.loadProducts()
  }
  public onSearchReset() {
    this.productSearchCriteriaGroup.reset()
  }
  public onNewProduct() {
    this.router.navigate(['./new'], { relativeTo: this.route })
  }
}
