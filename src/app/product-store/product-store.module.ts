import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterModule, Routes } from '@angular/router'
import { FieldsetModule } from 'primeng/fieldset'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { ConfirmationService } from 'primeng/api'

import { PortalCoreModule } from '@onecx/portal-integration-angular'
import { addInitializeModuleGuard, InitializeModuleGuard } from '@onecx/angular-integration-interface'

import { LabelResolver } from 'src/app/shared/label.resolver'
import { SharedModule } from 'src/app/shared/shared.module'

import { AppSearchComponent } from './app-search/app-search.component'
import { AppDeleteComponent } from './app-delete/app-delete.component'
import { AppDetailComponent } from './app-detail/app-detail.component'
import { AppInternComponent } from './app-detail/app-intern/app-intern.component'
import { ProductSearchComponent } from './product-search/product-search.component'
import { ProductDetailComponent } from './product-detail/product-detail.component'
import { ProductPropertyComponent } from './product-detail/product-props/product-props.component'
import { ProductInternComponent } from './product-detail/product-intern/product-intern.component'
import { ProductAppsComponent } from './product-detail/product-apps/product-apps.component'
import { SlotSearchComponent } from './slot-search/slot-search.component'
import { SlotDeleteComponent } from './slot-delete/slot-delete.component'
import { ProductUseComponent } from './product-detail/product-use/product-use.component'

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
    path: 'slots',
    component: SlotSearchComponent,
    data: { breadcrumb: 'BREADCRUMBS.SLOTS', breadcrumbFn: (data: any) => `${data.labeli18n}` },
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
    AppInternComponent,
    ProductSearchComponent,
    ProductDetailComponent,
    ProductPropertyComponent,
    ProductInternComponent,
    ProductUseComponent,
    ProductAppsComponent,
    SlotSearchComponent,
    SlotDeleteComponent
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
    console.info('Product Store module constructor')
  }
}
