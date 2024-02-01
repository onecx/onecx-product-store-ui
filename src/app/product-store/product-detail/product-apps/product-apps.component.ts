import { Component, Input, OnChanges, ViewChild } from '@angular/core'
import { SelectItem } from 'primeng/api'
import { Observable, finalize } from 'rxjs'

import { DataViewControlTranslations, PortalMessageService } from '@onecx/portal-integration-angular'
import { Product, MicrofrontendsAPIService, MicrofrontendPageResult } from '../../../generated'
import { dropDownSortItemsByLabel, limitText } from 'src/app/shared/utils'
import { IconService } from '../../../shared/iconservice'

@Component({
  selector: 'app-product-apps',
  templateUrl: './product-apps.component.html',
  styleUrls: ['./product-apps.component.scss']
})
export class ProductAppsComponent implements OnChanges {
  @Input() product: Product | undefined
  @Input() dateFormat = 'medium'
  @Input() changeMode = 'VIEW'
  public apps$!: Observable<MicrofrontendPageResult>
  public iconItems: SelectItem[] = [{ label: '', value: null }]
  public viewMode = 'list'
  public filter: string | undefined
  public sortField = 'name'
  public sortOrder = 1
  public searchInProgress = false
  public limitText = limitText
  public dataViewControlsTranslations: DataViewControlTranslations = {}
  @ViewChild(DataView) dv: DataView | undefined

  constructor(
    private icon: IconService,
    private appApi: MicrofrontendsAPIService,
    private msgService: PortalMessageService
  ) {
    this.iconItems.push(...this.icon.icons.map((i) => ({ label: i, value: i })))
    this.iconItems.sort(dropDownSortItemsByLabel)
  }

  ngOnChanges(): void {
    console.log('apps ngOnChanges')
    this.loadApps()
  }

  public loadApps(): void {
    console.log('loadApps() ' + this.product?.name)
    this.searchInProgress = true
    this.apps$ = this.appApi
      .searchMicrofrontends({
        microfrontendSearchCriteria: { productName: this.product?.name, pageSize: 1000 }
      })
      .pipe(finalize(() => (this.searchInProgress = false)))
  }

  public onLayoutChange(viewMode: string): void {
    this.viewMode = viewMode
  }
  public onFilterChange(filter: string): void {
    this.filter = filter
    //this.dv?.filter(filter, 'contains')
  }
  public onSortChange(field: string): void {
    this.sortField = field
  }
  public onSortDirChange(asc: boolean): void {
    this.sortOrder = asc ? -1 : 1
  }
}
