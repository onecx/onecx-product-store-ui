import { Component, EventEmitter, Inject, Input, OnChanges } from '@angular/core'
import { CommonModule, Location } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { UntilDestroy } from '@ngneat/until-destroy'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { catchError, map, Observable, of, ReplaySubject } from 'rxjs'

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
  ProductAbstract,
  ProductsAPIService,
  ProductSearchCriteria,
  ProductPageResult
} from 'src/app/shared/generated'
import { SharedModule } from 'src/app/shared/shared.module'
import { environment } from 'src/environments/environment'

@Component({
  selector: 'app-product-infos',
  templateUrl: './product-infos.component.html',
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
export class OneCXProductInfosComponent implements ocxRemoteComponent, ocxRemoteWebcomponent, OnChanges {
  // input
  @Input() refresh: boolean | undefined = false // on any change here a reload is triggered
  @Input() productName: string | undefined = undefined // search parameter
  @Input() displayName: string | undefined = undefined // search parameter
  // output
  @Input() productsAndApplications = new EventEmitter<ProductAbstract[]>()

  public productsAndApplications$: Observable<ProductAbstract[]> | undefined

  constructor(
    @Inject(BASE_URL) private readonly baseUrl: ReplaySubject<string>,
    private readonly productApi: ProductsAPIService
  ) {}

  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }

  ocxInitRemoteComponent(remoteComponentConfig: RemoteComponentConfig) {
    this.baseUrl.next(remoteComponentConfig.baseUrl)
    this.productApi.configuration = new Configuration({
      basePath: Location.joinWithSlash(remoteComponentConfig.baseUrl, environment.apiPrefix)
    })
  }

  /**
   * Prepare searches on each parameter change
   */
  public ngOnChanges(): void {
    const criteria: ProductSearchCriteria = {
      name: this.productName,
      displayName: this.displayName,
      pageSize: 1000
    }
    this.productsAndApplications$ = this.productApi.searchProducts({ productSearchCriteria: criteria }).pipe(
      map((response: ProductPageResult) => {
        return response.stream?.sort(this.sortByDisplayName) ?? []
      }),
      catchError((err) => {
        console.error('onecx-product-infos.searchProducts', err)
        return of([])
      })
    )
    this.productsAndApplications$.subscribe(this.productsAndApplications)
  }

  private sortByDisplayName(a: ProductAbstract, b: ProductAbstract): number {
    return (a.displayName ? a.displayName.toUpperCase() : '').localeCompare(
      b.displayName ? b.displayName.toUpperCase() : ''
    )
  }
}
