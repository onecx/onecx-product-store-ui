import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { FormsModule } from '@angular/forms'
import { RouterModule, Routes } from '@angular/router'
import { MissingTranslationHandler, TranslateLoader, TranslateModule } from '@ngx-translate/core'

import { FieldsetModule } from 'primeng/fieldset'

import { MFE_INFO, PortalCoreModule, MyMissingTranslationHandler } from '@onecx/portal-integration-angular'

import { CanActivateGuard } from '../shared/can-active-guard.service'
import { LabelResolver } from '../shared/label.resolver'
import { HttpLoaderFactory, SharedModule } from '../shared/shared.module'
import { ProductSearchComponent } from './product-search/product-search.component'
import { ProductDetailComponent } from './product-detail/product-detail.component'
import { ProductPropertyComponent } from './product-detail/product-props/product-props.component'
import { ProductInternComponent } from './product-detail/product-intern/product-intern.component'

const routes: Routes = [
  {
    path: '',
    component: ProductSearchComponent,
    canActivate: [CanActivateGuard],
    pathMatch: 'full'
  },
  {
    path: 'new',
    canActivate: [CanActivateGuard],
    component: ProductDetailComponent,
    data: {
      breadcrumb: 'BREADCRUMBS.CREATE',
      breadcrumbFn: (data: any) => `${data.labeli18n}`
    },
    resolve: {
      labeli18n: LabelResolver
    }
  },
  {
    path: ':name',
    canActivate: [CanActivateGuard],
    component: ProductDetailComponent,
    data: {
      breadcrumb: 'BREADCRUMBS.DETAIL',
      breadcrumbFn: (data: any) => `${data.labeli18n}`
    },
    resolve: {
      labeli18n: LabelResolver
    }
  }
]
@NgModule({
  declarations: [ProductSearchComponent, ProductDetailComponent, ProductPropertyComponent, ProductInternComponent],
  imports: [
    FormsModule,
    FieldsetModule,
    PortalCoreModule.forMicroFrontend(),
    [RouterModule.forChild(routes)],
    SharedModule,
    TranslateModule.forChild({
      isolate: true,
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: MyMissingTranslationHandler
      },
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient, MFE_INFO]
      }
    })
  ],
  providers: [],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class ProductStoreModule {
  constructor() {
    console.info('Product Store Module constructor')
  }
}
