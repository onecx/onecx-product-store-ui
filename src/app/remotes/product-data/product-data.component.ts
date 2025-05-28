import { Component, EventEmitter, Inject, Input, OnChanges } from '@angular/core'
import { CommonModule, Location } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { UntilDestroy } from '@ngneat/until-destroy'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { BehaviorSubject, catchError, map, Observable, of, ReplaySubject } from 'rxjs'

import {
  AngularRemoteComponentsModule,
  BASE_URL,
  RemoteComponentConfig,
  ocxRemoteComponent,
  ocxRemoteWebcomponent,
  provideTranslateServiceForRoot
} from '@onecx/angular-remote-components'
import { PortalCoreModule, createRemoteComponentTranslateLoader } from '@onecx/portal-integration-angular'

import {
  Configuration,
  RefType,
  ProductAbstract,
  ProductsAPIService,
  ProductSearchCriteria
} from 'src/app/shared/generated'
import { SharedModule } from 'src/app/shared/shared.module'
import { bffImageUrl, prepareUrlPath, sortByDisplayName } from 'src/app/shared/utils'
import { environment } from 'src/environments/environment'

type DataType = 'logo' | 'products' | 'product'

@Component({
  selector: 'app-product-data',
  templateUrl: './product-data.component.html',
  standalone: true,
  imports: [AngularRemoteComponentsModule, CommonModule, PortalCoreModule, TranslateModule, SharedModule],
  providers: [
    {
      provide: BASE_URL,
      useValue: new ReplaySubject<string>(1)
    },
    provideTranslateServiceForRoot({
      isolate: true,
      loader: {
        provide: TranslateLoader,
        useFactory: createRemoteComponentTranslateLoader,
        deps: [HttpClient, BASE_URL]
      }
    })
  ]
})
@UntilDestroy()
export class OneCXProductDataComponent implements ocxRemoteComponent, ocxRemoteWebcomponent, OnChanges {
  // input
  @Input() refresh: boolean | undefined = false // on any change here a reload is triggered
  @Input() dataType: DataType | undefined = undefined // which response data is expected
  // search parameter
  @Input() productName: string | undefined = undefined // search parameter
  @Input() productNames: string[] | undefined = undefined // search parameter
  // logo
  @Input() imageId: string | undefined = undefined
  @Input() imageUrl: string | undefined = undefined
  @Input() imageStyleClass: string | undefined = undefined
  @Input() useDefaultLogo = false // used if logo loading failed
  // log
  @Input() logPrefix: string | undefined = undefined
  @Input() logEnabled = false
  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }
  // output
  @Input() products = new EventEmitter<ProductAbstract[]>()
  @Input() product = new EventEmitter<ProductAbstract>()
  @Input() imageLoadingFailed = new EventEmitter<boolean>()

  public products$: Observable<ProductAbstract[]> | undefined
  public product$: Observable<ProductAbstract> | undefined
  public imageUrl$ = new BehaviorSubject<string | undefined>(undefined)
  public defaultImageUrl: string | undefined = undefined

  constructor(
    @Inject(BASE_URL) private readonly baseUrl: ReplaySubject<string>,
    private readonly productApi: ProductsAPIService
  ) {}

  ocxInitRemoteComponent(remoteComponentConfig: RemoteComponentConfig) {
    this.baseUrl.next(remoteComponentConfig.baseUrl)
    this.productApi.configuration = new Configuration({
      basePath: Location.joinWithSlash(remoteComponentConfig.baseUrl, environment.apiPrefix)
    })
    if (environment.DEFAULT_LOGO_PATH)
      this.defaultImageUrl = prepareUrlPath(remoteComponentConfig.baseUrl, environment.DEFAULT_LOGO_PATH)
  }

  /**
   * Prepare searches on each change
   */
  public ngOnChanges(): void {
    this.log('ngOnChanges')
    if (this.dataType === 'products') this.getProducts()
    if (this.dataType === 'product') this.getProduct()
    if (this.dataType === 'logo') {
      // start image existence life cycle here: url => image => default (opt)
      this.imageUrl$.next(this.getImageUrl(this.productName, 'url'))
    }
  }

  /**
   * PRODUCTS
   */
  private getProducts(): void {
    const criteria: ProductSearchCriteria = {
      names: this.productNames ? this.productNames : this.productName ? [this.productName] : undefined,
      pageSize: 1000
    }
    this.log(criteria)
    this.products$ = this.productApi.searchProducts({ productSearchCriteria: criteria }).pipe(
      map((response) => {
        const products: ProductAbstract[] = []
        response.stream?.forEach((p) => {
          products.push({
            ...p,
            imageUrl: p.imageUrl ?? bffImageUrl(this.productApi.configuration.basePath, p.name, RefType.Logo)
          })
        })
        return products.sort(sortByDisplayName)
      }),
      catchError((err) => {
        console.error('onecx-product-data.searchProducts', err)
        return of([])
      })
    )
    this.products$.subscribe(this.products)
  }

  /**
   * PRODUCT
   */
  private getProduct() {
    if (!this.productName) return
    const criteria: ProductSearchCriteria = {
      names: this.productName ? [this.productName] : undefined,
      pageSize: 1
    }
    this.log(criteria)
    this.product$ = this.productApi.searchProducts({ productSearchCriteria: criteria }).pipe(
      map((response) => {
        const p = response.stream?.[0]
        this.log(p)
        if (p !== undefined) {
          return {
            ...p,
            imageUrl: p.imageUrl ?? bffImageUrl(this.productApi.configuration.basePath, p.name, RefType.Logo)
          }
        }
        return {} as ProductAbstract
      }),
      catchError((err) => {
        console.error('onecx-product-data.searchProducts', err)
        return of({} as ProductAbstract)
      })
    )
    this.product$.subscribe(this.product)
  }

  /**
   * Image
   */
  public onImageLoad() {
    this.log('onImageLoad => ok')
    this.imageLoadingFailed.emit(false)
  }

  // try next prio level depending on previous used URL
  public onImageLoadError(usedUrl: string): void {
    this.log('onImageLoadError using => ' + usedUrl)
    if (usedUrl === this.imageUrl) {
      this.imageUrl$.next(this.getImageUrl(this.productName, 'image'))
    } else if (usedUrl === this.getImageUrl(this.productName, 'image')) {
      this.imageUrl$.next(this.getImageUrl(this.productName, 'default'))
    }
  }

  public getImageUrl(productName: string | undefined, prioType: string): string | undefined {
    if (!prioType || !['logo', 'favicon'].includes(this.dataType ?? 'unknown')) return undefined
    this.log('getImageUrl on prioType => ' + prioType)

    // if URL exist
    if (['url'].includes(prioType) && this.imageUrl && this.imageUrl !== '') {
      this.log('getImageUrl => ' + this.imageUrl)
      return this.imageUrl
    } else if (['url', 'image'].includes(prioType)) {
      this.log('getImageUrl => ' + bffImageUrl(this.productApi.configuration.basePath, productName, RefType.Logo))
      return bffImageUrl(this.productApi.configuration.basePath, productName, RefType.Logo)
    } else if (['url', 'image', 'default'].includes(prioType) && this.useDefaultLogo && this.defaultImageUrl !== '') {
      // if user wants to have the default (as asset)
      return this.defaultImageUrl
    }
    this.log('getImageUrl => stop')
    this.imageLoadingFailed.emit(true) // finally inform caller about impossibility
    return undefined
  }

  private log(info: any) {
    if (this.logEnabled === true) console.info('onecx-product-data: ' + (this.logPrefix ?? '') + ' => ', info)
  }
}
