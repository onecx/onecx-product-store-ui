import { ChangeDetectionStrategy, Component, effect, inject, input, OnInit, signal } from '@angular/core'
import { AsyncPipe, NgClass } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { finalize, of, Observable, catchError, Subject, takeUntil, tap, map } from 'rxjs'

import { CardModule } from 'primeng/card'
import { FieldsetModule } from 'primeng/fieldset'
import { MessageModule } from 'primeng/message'
import { TooltipModule } from 'primeng/tooltip'
import { SelectItem } from 'primeng/api'

import { UserService } from '@onecx/angular-integration-interface'

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
import { Utils } from 'src/app/shared/utils'
import { IconService } from 'src/app/shared/iconservice'
import { OcxChipComponent } from 'src/app/shared/ocx-chip/ocx-chip.component'

import { ChangeMode } from '../../product-detail/product-detail.component'
import { AppAbstract } from '../../app-search/app-search.component'
import { SlotData } from '../../slot-search/slot-search.component'
import { AppDetailComponent } from '../../app-detail/app-detail.component'
import { AppDeleteComponent } from '../../app-delete/app-delete.component'
import { SlotDetailComponent } from '../../slot-detail/slot-detail.component'
import { SlotDeleteComponent } from '../../slot-delete/slot-delete.component'

export enum AppType {
  MS = 'MS',
  MFE = 'MFE'
}

@Component({
  selector: 'app-product-apps',
  standalone: true,
  imports: [
    AsyncPipe,
    NgClass,
    CardModule,
    FieldsetModule,
    MessageModule,
    TooltipModule,
    TranslateModule,
    // components
    OcxChipComponent,
    AppDetailComponent,
    AppDeleteComponent,
    SlotDetailComponent,
    SlotDeleteComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-apps.component.html',
  styleUrls: ['./product-apps.component.scss']
})
export class ProductAppsComponent implements OnInit {
  private readonly icon = inject(IconService)
  private readonly user = inject(UserService)
  private readonly productApi = inject(ProductsAPIService)
  // input
  public readonly product = input<Product>()
  public readonly changeModeInput = input<ChangeMode>('VIEW', { alias: 'changeMode' })
  // local state derived from changeModeInput, owned by the component to drive the child app/slot dialogs
  public readonly changeMode = signal<ChangeMode>('VIEW')

  public exceptionKey: string | undefined = undefined
  public searchInProgress = false
  // computed internally: never actually bound by callers, so it stays a plain property
  public dateFormat = 'medium'

  public AppType = AppType
  public productDetails$!: Observable<ProductDetails>
  public app: AppAbstract | undefined
  public slot: Slot | undefined
  public slotForDetail: SlotData | undefined
  public slotForDeletion: SlotData | undefined
  public iconItems: SelectItem[] = [{ label: '', value: null }]
  public displayDetailDialog = false
  public displayDeleteDialog = false
  public displaySlotDeleteDialog = false
  public displaySlotDetailDialog = false
  public hasAppCreatePermission = false
  public hasAppDeletePermission = false
  public hasAppViewPermission = false
  public hasAppEditPermission = false
  public hasSlotDeletePermission = false
  public hasSlotEditPermission = false
  public hasSlotViewPermission = false
  public hasComponents = false

  constructor() {
    this.dateFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'M/d/yy, hh:mm:ss a'
    this.iconItems.push(...this.icon.icons.map((i) => ({ label: i, value: i })))
    this.iconItems.sort(Utils.dropDownSortItemsByLabel)
    this.changeMode.set(this.changeModeInput())

    // replaces ngOnChanges: signal inputs don't trigger it
    effect(() => {
      if (this.product()) this.getProductDetails()
    })
  }

  public ngOnInit(): void {
    void this.initPermissions()
  }

  private async initPermissions(): Promise<void> {
    this.hasAppViewPermission = await this.user.hasPermission('APP#VIEW')
    this.hasAppCreatePermission = await this.user.hasPermission('APP#CREATE')
    this.hasAppDeletePermission = await this.user.hasPermission('APP#DELETE')
    this.hasAppEditPermission = await this.user.hasPermission('APP#EDIT')
    this.hasSlotDeletePermission = await this.user.hasPermission('SLOT#DELETE')
    this.hasSlotEditPermission = await this.user.hasPermission('SLOT#EDIT')
    this.hasSlotViewPermission = await this.user.hasPermission('SLOT#VIEW')
  }

  /**
   * GET product
   */
  private getProductDetails(): void {
    this.app = undefined
    this.slot = undefined
    const criteria: ProductDetailsCriteria = {
      name: this.product()?.name,
      pageSize: 1000 // page size of the children
    }
    this.productDetails$ = this.productApi.getProductDetailsByCriteria({ productDetailsCriteria: criteria }).pipe(
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
        return of({})
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
  public onAppDetail(ev: any, app: any, appType: AppType) {
    ev.stopPropagation()
    this.app = { ...app, appType: appType, mfeType: app.mfeType ?? app.type } as AppAbstract
    this.changeMode.set('EDIT')
    this.displayDetailDialog = true
  }
  public onCopy(ev: any, app: any, appType: AppType) {
    ev.stopPropagation()
    this.app = { ...app, appType: appType } as AppAbstract
    this.changeMode.set('CREATE')
    this.displayDetailDialog = true
  }
  public onCreate() {
    this.changeMode.set('CREATE')
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
    this.displaySlotDetailDialog = false
    if (changed) this.getProductDetails()
  }
  public appDeleted(deleted: any) {
    this.displayDeleteDialog = false
    if (deleted) this.getProductDetails()
  }

  public onSlotDelete(ev: any, slot: Slot) {
    ev.stopPropagation()
    this.slotForDeletion = { ...slot } as SlotData
    this.displaySlotDeleteDialog = true
  }
  public slotDeleted(deleted: boolean) {
    this.displaySlotDeleteDialog = false
    if (deleted) this.getProductDetails()
  }
  public onSlotDetail(ev: any, slot: Slot) {
    ev.stopPropagation()
    this.slotForDetail = { ...slot } as SlotData
    this.displaySlotDetailDialog = true
  }
}
