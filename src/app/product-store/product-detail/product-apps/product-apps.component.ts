import { Component, Input, OnChanges, OnDestroy } from '@angular/core'
import { finalize, of, Observable, catchError, Subject, takeUntil, tap } from 'rxjs'
import { SelectItem } from 'primeng/api'

import { UserService } from '@onecx/portal-integration-angular'
import {
  MicrofrontendAbstract,
  Microservice,
  Product,
  ProductDetails,
  ProductDetailsCriteria,
  ProductsAPIService,
  Slot,
  SlotPageItem
} from 'src/app/shared/generated'
import { dropDownSortItemsByLabel } from 'src/app/shared/utils'
import { IconService } from 'src/app/shared/iconservice'

import { AppAbstract, ChangeMode } from '../../app-search/app-search.component'

export enum AppType {
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

  public AppType = AppType
  public productDetails$!: Observable<ProductDetails>
  public app: AppAbstract | undefined
  public slot: Slot | undefined
  public iconItems: SelectItem[] = [{ label: '', value: null }]
  public displayDetailDialog = false
  public displayDeleteDialog = false
  public displaySlotDeleteDialog = false
  public hasCreatePermission = false
  public hasDeletePermission = false
  public hasComponents = false

  constructor(
    private readonly icon: IconService,
    private readonly user: UserService,
    private readonly productApi: ProductsAPIService
  ) {
    this.hasCreatePermission = this.user.hasPermission('APP#CREATE')
    this.hasDeletePermission = this.user.hasPermission('APP#DELETE')
    this.iconItems.push(...this.icon.icons.map((i) => ({ label: i, value: i })))
    this.iconItems.sort(dropDownSortItemsByLabel)
  }

  public ngOnChanges(): void {
    if (this.product) this.getProductDetails()
  }

  public ngOnDestroy(): void {
    this.destroy$.next(undefined)
    this.destroy$.complete()
  }

  /**
   * GET product
   */
  private getProductDetails(): void {
    const criteria: ProductDetailsCriteria = {
      name: this.product?.name,
      pageSize: 1000 // page size of the children
    }
    this.productDetails$ = this.productApi.getProductDetailsByCriteria({ productDetailsCriteria: criteria }).pipe(
      takeUntil(this.destroy$),
      tap((details) => {
        if (details) {
          if (
            (details.microfrontends && details.microfrontends?.length > 0) ||
            (details.microservices && details.microservices?.length > 0) ||
            (details.slots && details.slots?.length > 0)
          )
            this.hasComponents = true
        }
      }),
      catchError((err) => {
        this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.APPS'
        console.error('getProductDetailsByCriteria', err)
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
    this.app = { ...app, appType: appType, mfeType: app.mfeType ?? app.type } as AppAbstract
    this.changeMode = 'EDIT'
    this.displayDetailDialog = true
  }
  public onCopy(ev: any, app: any, appType: AppType) {
    ev.stopPropagation()
    this.app = { ...app, appType: appType } as AppAbstract
    this.changeMode = 'COPY'
    this.displayDetailDialog = true
  }
  public onCreate() {
    this.changeMode = 'CREATE'
    this.app = undefined
    this.displayDetailDialog = true
  }
  public onDelete(ev: any, app: any, appType: AppType) {
    ev.stopPropagation()
    this.app = { ...app, appType: appType } as AppAbstract
    this.displayDeleteDialog = true
  }

  public appChanged(changed: any) {
    this.displayDetailDialog = false
    if (changed) this.getProductDetails()
  }
  public appDeleted(deleted: any) {
    this.displayDeleteDialog = false
    if (deleted) this.getProductDetails()
  }

  public onSlotDelete(ev: any, slot: Slot) {
    ev.stopPropagation()
    this.slot = slot
    this.displaySlotDeleteDialog = true
  }
  public slotDeleted(deleted: boolean) {
    this.displaySlotDeleteDialog = false
    if (deleted) this.getProductDetails()
  }
}
