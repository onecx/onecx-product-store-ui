import { importProvidersFrom } from '@angular/core'
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations'
import { provideRouter } from '@angular/router'
import { MissingTranslationHandler, TranslateLoader } from '@ngx-translate/core'

import { AngularAuthModule } from '@onecx/angular-auth'
import { AngularAcceleratorMissingTranslationHandler } from '@onecx/angular-accelerator'
import {
  createTranslateLoader,
  provideAngularUtils,
  provideThemeConfig,
  provideTranslationConnectionService,
  provideTranslationPathFromMeta
} from '@onecx/angular-utils'
import { provideTranslateServiceForRoot } from '@onecx/angular-remote-components'
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents'

import { environment } from 'src/environments/environment'
import { OneCXProductDataComponent } from './product-data.component'

bootstrapRemoteComponent(OneCXProductDataComponent, 'ocx-product-data-component', environment.production, [
  provideHttpClient(withInterceptorsFromDi()),
  importProvidersFrom(AngularAuthModule),
  importProvidersFrom(BrowserModule),
  importProvidersFrom(BrowserAnimationsModule),
  provideAnimations(),
  ...provideAngularUtils(),
  ...provideTranslationConnectionService(),
  provideThemeConfig(),
  provideTranslationPathFromMeta(import.meta.url, 'assets/i18n/'),
  provideTranslateServiceForRoot({
    isolate: true,
    loader: {
      provide: TranslateLoader,
      useFactory: createTranslateLoader,
      deps: [HttpClient]
    },
    missingTranslationHandler: {
      provide: MissingTranslationHandler,
      useClass: AngularAcceleratorMissingTranslationHandler
    }
  }),
  provideRouter([
    {
      path: '**',
      children: []
    }
  ])
])
