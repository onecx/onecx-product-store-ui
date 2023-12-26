import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { TranslateModule, MissingTranslationHandler, TranslateLoader } from '@ngx-translate/core'
import {
  MyMissingTranslationHandler,
  PortalMessageService,
  PortalDialogService,
  MFE_INFO,
  createTranslateLoader,
  PortalCoreModule
} from '@onecx/portal-integration-angular'
import { MessageService } from 'primeng/api'
import { DialogService } from 'primeng/dynamicdialog'
import { BASE_PATH } from './generated'
import { CanActivateGuard } from './shared/can-active-guard.service'
import { LabelResolver } from './shared/label.resolver'
import { basePathProvider, SharedModule } from './shared/shared.module'
//import { ProductDetailComponent } from './product-store/product-detail/product-detail.component'
import { ProductSearchComponent } from './product-store/product-search/product-search.component'
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
