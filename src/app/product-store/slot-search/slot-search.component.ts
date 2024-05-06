import { Component, OnInit, ViewChild } from '@angular/core'
// import { FormGroup, FormControl } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Action, DataViewControlTranslations } from '@onecx/portal-integration-angular'
import { Observable, map } from 'rxjs'
import { ProductPageResult, ProductsAPIService, ImagesInternalAPIService } from 'src/app/shared/generated'
import { limitText } from 'src/app/shared/utils'
import { DataView } from 'primeng/dataview'

@Component({
  templateUrl: './slot-search.component.html',
  styleUrls: ['./slot-search.component.scss']
})
export class SlotSearchComponent implements OnInit {
  public exceptionKey: string | undefined
  public searchInProgress = false
  public slots$!: Observable<ProductPageResult>
  public actions$: Observable<Action[]> | undefined

  // public appSearchCriteriaGroup!: FormGroup<AppSearchCriteria>
  public viewMode = 'grid'
  public filterValue: string | undefined
  public filterValueDefault = 'appId,appType,productName,classifications'
  public filterBy = this.filterValueDefault
  public filter: string | undefined
  public sortField = 'appId'
  public sortOrder = 1
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
    // this.productSearchCriteriaGroup = new FormGroup<ProductSearchCriteria>({
    //   productName: new FormControl<string | null>(null)
    // })
  }

  ngOnInit(): void {
    // this.prepareDialogTranslations()
    this.prepareActionButtons()
    // this.searchSlots()
  }

  private prepareActionButtons(): void {
    this.actions$ = this.translate.get(['ACTIONS.NAVIGATION.BACK', 'ACTIONS.NAVIGATION.BACK.TOOLTIP']).pipe(
      map((data) => {
        return [
          {
            label: data['ACTIONS.NAVIGATION.BACK'],
            title: data['ACTIONS.NAVIGATION.BACK.TOOLTIP'],
            actionCallback: () => this.onBack(),
            icon: 'pi pi-arrow-left',
            show: 'always'
          }
        ]
      })
    )
  }

  /**
   * UI EVENTS
   */
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
    this.searchInProgress = true
  }
  // public onSearchReset() {
  //   this.appSearchCriteriaGroup.reset({ appType: 'ALL' })
  // }
  public onBack() {
    this.router.navigate(['../'], { relativeTo: this.route })
  }
}
