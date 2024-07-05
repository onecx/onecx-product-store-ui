import { environment } from 'src/environments/environment'
import { OneCXProductStoreModule } from './app/onecx-product-store-remote.module'
import { bootstrapModule } from '@onecx/angular-webcomponents'

bootstrapModule(OneCXProductStoreModule, 'microfrontend', environment.production)
