import { Component, Input, OnChanges, OnDestroy } from '@angular/core'
import { finalize, of, Observable, catchError, Subject, takeUntil } from 'rxjs'
import { SelectItem } from 'primeng/api'

import { UserService } from '@onecx/portal-integration-angular'
import {
  MicrofrontendAbstract,
  Microservice,
  Product,
  ProductDetails,
  ProductsAPIService,
  SlotPageItem
} from 'src/app/shared/generated'
import { dropDownSortItemsByLabel, limitText } from 'src/app/shared/utils'
import { IconService } from 'src/app/shared/iconservice'

import { AppAbstract, ChangeMode } from '../../app-search/app-search.component'

enum AppType {
  MS = 'MS',
  MFE = 'MFE'
}

@Component({
  selector: 'app-product-apps',
  templateUrl: './product-apps.component.html',
  styleUrls: ['./product-apps.component.scss']
})
export class ProductAppsComponent implements OnChanges, OnDestroy {
  @Input() product: Product | undefined
  @Input() dateFormat = 'medium'
  @Input() changeMode: ChangeMode = 'VIEW'

  private readonly destroy$ = new Subject()
  public exceptionKey = ''
  public searchInProgress = false
  public limitText = limitText

  public AppType = AppType
  public productDetails$!: Observable<ProductDetails>
  public app: AppAbstract | undefined
  public iconItems: SelectItem[] = [{ label: '', value: null }]
  public displayDetailDialog = false
  public displayDeleteDialog = false
  public hasCreatePermission = false
  public hasDeletePermission = false

  constructor(private icon: IconService, private user: UserService, private productApi: ProductsAPIService) {
    this.hasCreatePermission = this.user.hasPermission('APP#CREATE')
    this.hasDeletePermission = this.user.hasPermission('APP#DELETE')
    this.iconItems.push(...this.icon.icons.map((i) => ({ label: i, value: i })))
    this.iconItems.sort(dropDownSortItemsByLabel)
  }

  ngOnChanges(): void {
    if (this.product) this.searchProducts()
  }
  public ngOnDestroy(): void {
    this.destroy$.next(undefined)
    this.destroy$.complete()
  }

  /**
   * SEARCH
   */
  public searchProducts(): void {
    this.productDetails$ = this.productApi
      .getProductDetailsByCriteria({ productSearchCriteria: { name: this.product?.name } })
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.APPS'
          console.error('searchMicrofrontends():', err)
          return of({} as ProductDetails)
        }),
        finalize(() => (this.searchInProgress = false))
      )
    this.searchInProgress = true
  }

  public sortMfesByTypeAndExposedModule(a: MicrofrontendAbstract, b: MicrofrontendAbstract): number {
    return (
      (a.type ? a.type.toUpperCase() : '').localeCompare((b.type ? b.type.toUpperCase() : '').toUpperCase()) ||
      (a.exposedModule ? a.exposedModule.toUpperCase() : '').localeCompare(
        (b.exposedModule ? b.exposedModule.toUpperCase() : '').toUpperCase()
      )
    )
  }
  public sortMssByAppId(a: Microservice, b: Microservice): number {
    return (a.appId ? a.appId.toUpperCase() : '').localeCompare((b.appId ? b.appId.toUpperCase() : '').toUpperCase())
  }
  public sortSlotsByName(a: SlotPageItem, b: SlotPageItem): number {
    return (a.name ? a.name.toUpperCase() : '').localeCompare((b.name ? b.name.toUpperCase() : '').toUpperCase())
  }

  /**
   * UI EVENTS
   */
  public onDetail(ev: any, app: any, appType: AppType) {
    ev.stopPropagation()
    this.app = { ...app, appType: appType } as AppAbstract
    this.changeMode = 'EDIT'
    this.displayDetailDialog = true
  }
  public onCopy(ev: any, app: any, appType: AppType) {
    ev.stopPropagation()
    this.app = app
    this.changeMode = 'COPY'
    this.displayDetailDialog = true
  }
  public onCreate() {
    this.changeMode = 'CREATE'
    this.app = undefined
    this.displayDetailDialog = true
  }
  public onDelete(ev: any, app: any) {
    ev.stopPropagation()
    this.app = app
    this.displayDeleteDialog = true
  }

  public appChanged(changed: any) {
    this.displayDetailDialog = false
    if (changed) this.searchProducts()
  }
  public appDeleted(deleted: any) {
    this.displayDeleteDialog = false
    if (deleted) this.searchProducts()
  }
}
