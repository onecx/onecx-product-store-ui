import { Component, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { FormControl, FormGroup } from '@angular/forms'
import { Observable, finalize, map } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'
import { DataView } from 'primeng/dataview'

import { Action, DataViewControlTranslations } from '@onecx/portal-integration-angular'

import { ImagesInternalAPIService, ProductPageResult, ProductsAPIService } from 'src/app/shared/generated'
import { limitText } from 'src/app/shared/utils'

export interface ProductSearchCriteria {
  productName: FormControl<string | null>
}

@Component({
  templateUrl: './product-search.component.html',
  styleUrls: ['./product-search.component.scss']
})
export class ProductSearchComponent implements OnInit {
  public products$!: Observable<ProductPageResult>
  public productSearchCriteriaGroup!: FormGroup<ProductSearchCriteria>
  public actions$: Observable<Action[]> | undefined
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
    private translate: TranslateService,
    private imageApi: ImagesInternalAPIService
  ) {
    this.productSearchCriteriaGroup = new FormGroup<ProductSearchCriteria>({
      productName: new FormControl<string | null>(null)
    })
  }

  ngOnInit(): void {
    this.prepareDialogTranslations()
    this.prepareActionButtons()
    this.searchProducts()
  }

  public searchProducts(): void {
    this.searchInProgress = true
    this.products$ = this.productApi
      .searchProducts({
        productSearchCriteria: { name: this.productSearchCriteriaGroup.controls['productName'].value, pageSize: 1000 }
      })
      .pipe(finalize(() => (this.searchInProgress = false)))
  }

  private prepareDialogTranslations(): void {
    this.translate
      .get([
        'PRODUCT.NAME',
        'PRODUCT.DISPLAY_NAME',
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
          },
          sortOrderTooltips: {
            ascending: data['ACTIONS.DATAVIEW.SORT_DIRECTION_ASC'],
            descending: data['ACTIONS.DATAVIEW.SORT_DIRECTION_DESC']
          },
          sortDropdownTooltip: data['ACTIONS.DATAVIEW.SORT_BY']
        }
      })
  }

  private prepareActionButtons(): void {
    this.actions$ = this.translate
      .get([
        'ACTIONS.CREATE.PRODUCT.LABEL',
        'ACTIONS.CREATE.PRODUCT.TOOLTIP',
        'DIALOG.SEARCH.APPS.LABEL',
        'DIALOG.SEARCH.APPS.TOOLTIP'
      ])
      .pipe(
        map((data) => {
          return [
            {
              label: data['DIALOG.SEARCH.APPS.LABEL'],
              title: data['DIALOG.SEARCH.APPS.TOOLTIP'],
              actionCallback: () => this.onAppSearch(),
              permission: 'APP#SEARCH',
              icon: 'pi pi-cog',
              show: 'always'
            },
            {
              label: data['ACTIONS.CREATE.PRODUCT.LABEL'],
              title: data['ACTIONS.CREATE.PRODUCT.TOOLTIP'],
              actionCallback: () => this.onNewProduct(),
              permission: 'PRODUCT#CREATE',
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
    this.searchProducts()
  }
  public onSearchReset() {
    this.productSearchCriteriaGroup.reset()
  }
  public onAppSearch() {
    this.router.navigate(['./apps'], { relativeTo: this.route })
  }
  public onNewProduct() {
    this.router.navigate(['./new'], { relativeTo: this.route })
  }

  private getImageUrl(product: any): string {
    if (product.imageUrl) {
      return product.imageUrl
    } else {
      return this.imageApi.configuration.basePath + '/images/' + product.name + '/logo'
    }
  }
}
