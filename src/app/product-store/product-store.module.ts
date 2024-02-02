import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterModule, Routes } from '@angular/router'
import { FieldsetModule } from 'primeng/fieldset'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { ConfirmationService } from 'primeng/api'

import { addInitializeModuleGuard, InitializeModuleGuard, PortalCoreModule } from '@onecx/portal-integration-angular'

import { LabelResolver } from 'src/app/shared/label.resolver'
import { SharedModule } from 'src/app/shared/shared.module'

import { AppSearchComponent } from './app-search/app-search.component'
import { AppDetailComponent } from './app-detail/app-detail.component'
import { AppDeleteComponent } from './app-delete/app-delete.component'
import { ProductSearchComponent } from './product-search/product-search.component'
import { ProductDetailComponent } from './product-detail/product-detail.component'
import { ProductPropertyComponent } from './product-detail/product-props/product-props.component'
import { ProductInternComponent } from './product-detail/product-intern/product-intern.component'
import { ProductAppsComponent } from './product-detail/product-apps/product-apps.component'

const routes: Routes = [
  {
    path: '',
    component: ProductSearchComponent,
    pathMatch: 'full'
  },
  {
    path: 'apps',
    component: AppSearchComponent,
    data: { breadcrumb: 'BREADCRUMBS.APPS', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver }
  },
  {
    path: 'new',
    component: ProductDetailComponent,
    data: { breadcrumb: 'BREADCRUMBS.CREATE', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver }
  },
  {
    path: ':name',
    component: ProductDetailComponent,
    data: { breadcrumb: 'BREADCRUMBS.DETAIL', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver }
  }
]
@NgModule({
  declarations: [
    AppSearchComponent,
    AppDeleteComponent,
    AppDetailComponent,
    ProductSearchComponent,
    ProductDetailComponent,
    ProductPropertyComponent,
    ProductInternComponent,
    ProductAppsComponent
  ],
  imports: [
    CommonModule,
    ConfirmDialogModule,
    FieldsetModule,
    FormsModule,
    PortalCoreModule.forMicroFrontend(),
    [RouterModule.forChild(addInitializeModuleGuard(routes))],
    SharedModule
  ],
  providers: [ConfirmationService, InitializeModuleGuard],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class ProductStoreModule {
  constructor() {
    console.info('Theme Module constructor')
  }
}
