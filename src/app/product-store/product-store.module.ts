import { CommonModule } from '@angular/common'
import { CUSTOM_ELEMENTS_SCHEMA, Inject, NO_ERRORS_SCHEMA, NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule, Routes } from '@angular/router'
import { MfeInfo, MFE_INFO, PortalCoreModule } from '@onecx/portal-integration-angular'
import { ColorSketchModule } from 'ngx-color/sketch'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { ConfirmationService } from 'primeng/api'
import { FieldsetModule } from 'primeng/fieldset'

import { CanActivateGuard } from '../shared/can-active-guard.service'
//import { LabelResolver } from '../shared/label.resolver'
import { SharedModule } from '../shared/shared.module'
import { ProductSearchComponent } from './product-search/product-search.component'
//import { ProductDetailComponent } from './product-detail/product-detail.component'

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
  } */
]
@NgModule({
  declarations: [ProductSearchComponent /* ,ProductDetailComponent */],
  imports: [
    CommonModule,
    SharedModule,
    [RouterModule.forChild(routes)],
    PortalCoreModule.forMicroFrontend(),
    FormsModule,
    ColorSketchModule,
    ConfirmDialogModule,
    FieldsetModule
  ],
  providers: [ConfirmationService],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class ProductStoreModule {
  constructor(@Inject(MFE_INFO) mfeInfo: MfeInfo) {
    console.log(`Product Store Module constructor ${JSON.stringify(mfeInfo)}`)
  }
}
