import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { ConfirmationService } from 'primeng/api'

import { providePermissionService } from '@onecx/angular-utils'

import { LabelResolver } from 'src/app/shared/label.resolver'

import { AppSearchComponent } from './app-search/app-search.component'
import { EndpointSearchComponent } from './endpoint-search/endpoint-search.component'
import { ProductSearchComponent } from './product-search/product-search.component'
import { ProductDetailComponent } from './product-detail/product-detail.component'
import { SlotSearchComponent } from './slot-search/slot-search.component'

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
    path: 'endpoints',
    component: EndpointSearchComponent,
    data: { breadcrumb: 'BREADCRUMBS.ENDPOINTS', breadcrumbFn: (data: any) => `${data.labeli18n}` },
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
  declarations: [],
  imports: [
    AppSearchComponent,
    EndpointSearchComponent,
    ProductSearchComponent,
    SlotSearchComponent,
    ProductDetailComponent,
    RouterModule.forChild(routes)
  ],
  providers: [ConfirmationService, ...providePermissionService()]
})
export class ProductStoreModule {}
