import { Component, OnInit } from '@angular/core'
//import { DatePipe } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { finalize } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'

import { Action, ConfigurationService, ObjectDetailItem, PortalMessageService } from '@onecx/portal-integration-angular'
//import { limitText } from '../../shared/utils'
import { Product, ProductsAPIService, MicrofrontendsAPIService, GetProductRequestParams } from '../../generated'
import { environment } from '../../../environments/environment'

@Component({
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  providers: [ConfigurationService]
})
export class ProductDetailComponent implements OnInit {
  product: Product | undefined
  //  usedInWorkspace: Workspace[] | undefined
  productName!: string
  loading = true
  private apiPrefix = environment.apiPrefix
  public dateFormat = 'medium'
  // page header
  public actions: Action[] = []
  public objectDetails: ObjectDetailItem[] = []
  public headerImageUrl?: string

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private productApi: ProductsAPIService,
    private mfeApi: MicrofrontendsAPIService,
    private config: ConfigurationService,
    private msgService: PortalMessageService,
    private translate: TranslateService
  ) {
    this.productName = this.route.snapshot.paramMap.get('name') || ''
    this.dateFormat = this.config.lang === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'medium'
  }

  ngOnInit(): void {
    this.loadProduct()
  }

  private loadProduct() {
    this.productApi
      .searchProducts({ productSearchCriteria: { name: this.productName } })
      .pipe(
        finalize(() => {
          this.loading = false
        })
      )
      .subscribe({
        next: (data: any) => {
          if (data.stream && data.stream.length > 0) {
            this.product = data.stream[0]
            console.info('search: ', data.stream[0])
            this.getProduct()
          }
        },
        error: (err: any) => {
          this.msgService.error({
            summaryKey: 'DIALOG.LOAD_ERROR',
            detailKey: err.error.indexOf('was not found') > 1 ? 'DIALOG.NOT_FOUND' : err.error
          })
          this.close()
        }
      })
  }
  private getProduct() {
    this.productApi
      .getProduct({ id: this.product?.id } as GetProductRequestParams)
      .pipe(
        finalize(() => {
          this.loading = false
        })
      )
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.product = data
            console.info('get: ', data)
          }
          //this.usedInWorkspace = data.workspaces
          this.preparePage()
        },
        error: (err: any) => {
          this.msgService.error({
            summaryKey: 'DIALOG.LOAD_ERROR',
            detailKey: err.error.indexOf('was not found') > 1 ? 'DIALOG.NOT_FOUND' : err.error
          })
          this.close()
        }
      })
  }
  private close(): void {
    this.router.navigate(['./..'], { relativeTo: this.route })
  }

  private preparePage() {
    this.setHeaderImageUrl()
    this.translate.get(['ACTIONS.NAVIGATION.CLOSE', 'ACTIONS.NAVIGATION.CLOSE.TOOLTIP']).subscribe((data) => {
      this.prepareActionButtons(data)
    })
  }

  private prepareActionButtons(data: any): void {
    this.actions = [] // provoke change event
    this.actions.push({
      label: data['ACTIONS.NAVIGATION.CLOSE'],
      title: data['ACTIONS.NAVIGATION.CLOSE.TOOLTIP'],
      actionCallback: () => this.close(),
      icon: 'pi pi-times',
      show: 'always',
      permission: 'PRODUCT#SEARCH'
    })
  }

  private setHeaderImageUrl(): void {
    // img format is from BE or from Internet
    if (this.product?.imageUrl && !this.product.imageUrl.match(/^(http|https)/g)) {
      this.headerImageUrl = this.apiPrefix + this.product.imageUrl
    } else {
      this.headerImageUrl = this.product?.imageUrl
    }
  }
}
