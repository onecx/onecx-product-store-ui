export * from './microfrontends.service';
import { MicrofrontendsAPIService } from './microfrontends.service';
export * from './products.service';
import { ProductsAPIService } from './products.service';
export const APIS = [MicrofrontendsAPIService, ProductsAPIService];
