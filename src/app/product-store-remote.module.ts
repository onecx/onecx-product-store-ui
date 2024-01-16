import { Inject, NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { MFE_INFO, MfeInfo, PortalCoreModule } from '@onecx/portal-integration-angular'

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./product-store/product-store.module').then((m) => m.ProductStoreModule)
  }
]
@NgModule({
  imports: [PortalCoreModule.forMicroFrontend(), RouterModule.forChild(routes)],
  exports: [],
  providers: [],
  schemas: []
})
export class ProductStoreMgmtModule {
  constructor(@Inject(MFE_INFO) mfeInfo?: MfeInfo) {
    console.info('Product Store Mgmt Module constructor', mfeInfo)
  }
}
