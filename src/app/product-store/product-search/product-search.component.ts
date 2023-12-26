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

  public themeImportDialogVisible = false
  public dataViewControlsTranslations: DataViewControlTranslations = {}
  @ViewChild(DataView) dv: DataView | undefined

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productApi: ProductsAPIService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadThemes()
    this.translate
      .get(['ACTIONS.CREATE.THEME', 'ACTIONS.CREATE.THEME.TOOLTIP', 'ACTIONS.IMPORT.LABEL', 'ACTIONS.IMPORT.PORTAL'])
      .subscribe((data) => {
        this.prepareActionButtons(data)
      })
    this.translate
      .get([
        'SEARCH.SORT_BY',
        'SEARCH.FILTER',
        'SEARCH.FILTER_OF',
        'THEME.NAME',
        'THEME.DESCRIPTION',
        'GENERAL.TOOLTIP.VIEW_MODE_GRID',
        'GENERAL.TOOLTIP.VIEW_MODE_LIST',
        'GENERAL.TOOLTIP.VIEW_MODE_TABLE',
        'SEARCH.SORT_DIRECTION_ASC',
        'SEARCH.SORT_DIRECTION_DESC'
      ])
      .subscribe((data) => {
        this.prepareTranslations(data)
      })
  }

  public loadThemes(): void {
    this.product$ = this.productApi.searchProducts({ productSearchCriteria: { pageSize: 10 } as ProductSearchCriteria })
  }

  prepareActionButtons(data: any): void {
    this.actions = [] // provoke change event
    this.actions.push(
      {
        label: data['ACTIONS.CREATE.THEME'],
        title: data['ACTIONS.CREATE.THEME.TOOLTIP'],
        actionCallback: () => this.onNewTheme(),
        permission: 'THEME#CREATE',
        icon: 'pi pi-plus',
        show: 'always'
      },
      {
        label: data['ACTIONS.IMPORT.LABEL'],
        title: data['ACTIONS.IMPORT.PORTAL'],
        actionCallback: () => this.onImportThemeClick(),
        permission: 'THEME#IMPORT',
        icon: 'pi pi-upload',
        show: 'always'
      }
    )
  }

  prepareTranslations(data: any): void {
    this.dataViewControlsTranslations = {
      sortDropdownPlaceholder: data['SEARCH.SORT_BY'],
      filterInputPlaceholder: data['SEARCH.FILTER'],
      filterInputTooltip: data['SEARCH.FILTER_OF'] + data['THEME.NAME'] + ', ' + data['THEME.DESCRIPTION'],
      viewModeToggleTooltips: {
        grid: data['GENERAL.TOOLTIP.VIEW_MODE_GRID'],
        list: data['GENERAL.TOOLTIP.VIEW_MODE_LIST']
        // table: data['GENERAL.TOOLTIP.VIEW_MODE_TABLE'],
      },
      sortOrderTooltips: {
        ascending: data['SEARCH.SORT_DIRECTION_ASC'],
        descending: data['SEARCH.SORT_DIRECTION_DESC']
      },
      sortDropdownTooltip: data['SEARCH.SORT_BY']
    }
  }

  private onNewTheme(): void {
    this.router.navigate(['./new'], { relativeTo: this.route })
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
  public onImportThemeClick(): void {
    this.themeImportDialogVisible = true
  }
}
