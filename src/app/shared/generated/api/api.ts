export * from './imagesInternal.service';
import { ImagesInternalAPIService } from './imagesInternal.service';
export * from './microfrontends.service';
import { MicrofrontendsAPIService } from './microfrontends.service';
export * from './products.service';
import { ProductsAPIService } from './products.service';
export const APIS = [ImagesInternalAPIService, MicrofrontendsAPIService, ProductsAPIService];
