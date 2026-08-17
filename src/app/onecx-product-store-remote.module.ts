import { DoBootstrap, Injector, NgModule, provideAppInitializer, inject } from '@angular/core'
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { RouterModule, Routes, Router } from '@angular/router'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { TranslateLoader, TranslateModule, MissingTranslationHandler } from '@ngx-translate/core'

import { AngularAuthModule } from '@onecx/angular-auth'
import { AngularAcceleratorModule, AngularAcceleratorMissingTranslationHandler } from '@onecx/angular-accelerator'
import {
  createTranslateLoader,
  PortalApiConfiguration,
  provideAngularUtils,
  providePermissionService,
  provideThemeConfig,
  provideTranslationConnectionService,
  provideTranslationPathFromMeta
} from '@onecx/angular-utils'
import { createAppEntrypoint, initializeRouter, startsWith } from '@onecx/angular-webcomponents'
import { AppStateService } from '@onecx/angular-integration-interface'

import { Configuration } from './shared/generated'
import { environment } from 'src/environments/environment'
import { AppEntrypointComponent } from './app-entrypoint.component'

function apiConfigProvider(appStateService: AppStateService) {
  const portalApiConfiguration = new PortalApiConfiguration(Configuration, environment.apiPrefix)
  portalApiConfiguration.appStateService = appStateService
  return portalApiConfiguration
}

const routes: Routes = [
  {
    matcher: startsWith(''),
    loadChildren: () => import('./product-store/product-store.module').then((m) => m.ProductStoreModule)
  }
]

@NgModule({
  declarations: [AppEntrypointComponent],
  imports: [
    AngularAuthModule,
    BrowserModule,
    BrowserAnimationsModule,
    AngularAcceleratorModule,
    RouterModule.forRoot(routes),
    TranslateModule.forRoot({
      isolate: true,
      loader: { provide: TranslateLoader, useFactory: createTranslateLoader, deps: [HttpClient] },
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: AngularAcceleratorMissingTranslationHandler
      }
    })
  ],
  providers: [
    { provide: Configuration, useFactory: apiConfigProvider, deps: [AppStateService] },
    providePermissionService(),
    provideAppInitializer(() => initializeRouter(inject(Router), inject(AppStateService))()),
    ...provideAngularUtils(),
    ...provideTranslationConnectionService(),
    provideThemeConfig(),
    provideTranslationPathFromMeta(import.meta.url, 'assets/i18n/'),
    provideHttpClient(withInterceptorsFromDi())
  ]
})
export class OneCXProductStoreModule implements DoBootstrap {
  constructor(private readonly injector: Injector) {
    console.info('OneCX Product Store Module constructor')
  }

  ngDoBootstrap(): void {
    createAppEntrypoint(AppEntrypointComponent, 'ocx-product-store-component', this.injector)
  }
}
