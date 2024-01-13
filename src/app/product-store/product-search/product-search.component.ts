import { Component, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Observable } from 'rxjs'
import { DataView } from 'primeng/dataview'
import { TranslateService } from '@ngx-translate/core'
import { Action, DataViewControlTranslations } from '@onecx/portal-integration-angular'
import { ProductPageResult, ProductsAPIService, ProductSearchCriteria } from '../../generated'
import { limitText } from '../../shared/utils'

@Component({
  templateUrl: './product-search.component.html',
  styleUrls: ['./product-search.component.scss']
})
export class ProductSearchComponent implements OnInit {
  product$!: Observable<ProductPageResult>
  public actions: Action[] = []
  public viewMode = 'grid'
  public filter: string | undefined
  public sortField = 'name'
  public sortOrder = 1
  public limitText = limitText

  public dataViewControlsTranslations: DataViewControlTranslations = {}
  @ViewChild(DataView) dv: DataView | undefined

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productApi: ProductsAPIService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadProducts()
    this.translate
      .get([
        'PRODUCT.NAME',
        'PRODUCT.DESCRIPTION',
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
        this.prepareTranslations(data)
      })
  }

  public loadProducts(): void {
    this.product$ = this.productApi.searchProducts({
      productSearchCriteria: { pageSize: 1000 } as ProductSearchCriteria
    })
  }

  prepareTranslations(data: any): void {
    this.dataViewControlsTranslations = {
      sortDropdownPlaceholder: data['ACTIONS.DATAVIEW.SORT_BY'],
      filterInputPlaceholder: data['ACTIONS.DATAVIEW.FILTER'],
      filterInputTooltip:
        data['ACTIONS.DATAVIEW.FILTER_OF'] + data['PRODUCT.NAME'] + ', ' + data['PRODUCT.DESCRIPTION'],
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
}
