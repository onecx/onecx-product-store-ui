import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { RouterModule, Routes } from '@angular/router'
import { TranslateModule, MissingTranslationHandler, TranslateLoader } from '@ngx-translate/core'
import { MessageService } from 'primeng/api'
import { DialogService } from 'primeng/dynamicdialog'

import {
  createTranslateLoader,
  MFE_INFO,
  MyMissingTranslationHandler,
  PortalCoreModule,
  PortalDialogService,
  PortalMessageService
} from '@onecx/portal-integration-angular'
import { BASE_PATH } from './generated'
import { LabelResolver } from './shared/label.resolver'
import { CanActivateGuard } from './shared/can-active-guard.service'
import { basePathProvider, SharedModule } from './shared/shared.module'
import { ProductSearchComponent } from './product-store/product-search/product-search.component'
//import { ProductDetailComponent } from './product-store/product-detail/product-detail.component'

const routes: Routes = [
  {
    path: '',
    component: ProductSearchComponent,
    canActivate: [CanActivateGuard],
    pathMatch: 'full'
  }
  /*  {
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
  }, */
]

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    PortalCoreModule.forMicroFrontend(),
    RouterModule.forChild(routes),
    TranslateModule.forChild({
      isolate: true,
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: MyMissingTranslationHandler
      },
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient, MFE_INFO]
      }
    })
  ],
  exports: [],
  //this is not elegant, for some reason the injection token from primeng does not work across federated module
  providers: [
    LabelResolver,
    { provide: MessageService, useExisting: PortalMessageService },
    { provide: DialogService, useClass: PortalDialogService },

    CanActivateGuard,
    {
      provide: BASE_PATH,
      useFactory: basePathProvider,
      deps: [MFE_INFO]
    }
  ],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class ProductStoreModule {}
