export * from './microfrontends.service';
import { MicrofrontendsAPIService } from './microfrontends.service';
export * from './microservices.service';
import { MicroservicesAPIService } from './microservices.service';
export * from './products.service';
import { ProductsAPIService } from './products.service';
export const APIS = [MicrofrontendsAPIService, MicroservicesAPIService, ProductsAPIService];
