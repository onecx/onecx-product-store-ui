/**
 * onecx-product-store-bff
 * Backend-For-Frontend (BFF) service for onecx product store. With this API you can manage applications (technical microfrontend(s)) and product(s) as logical abstraction. A Product is a versioned cover for a collection of applications (versioned) to be used within workspaces. Microfrontends (applications) which have reference to exposed/registered modules
 *
 * The version of the OpenAPI document: 1.0.0
 * Contact: tkit_dev@1000kit.org
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { MicrofrontendType } from './microfrontendType';
import { UIEndpoint } from './uIEndpoint';


export interface MicrofrontendAbstract { 
    /**
     * Business ID (BID) representing a microfrontend
     */
    id: string;
    /**
     * BID of an app
     */
    appId: string;
    tagName?: string;
    /**
     * Readable name of the app
     */
    appName: string;
    /**
     * App version
     */
    appVersion?: string;
    exposedModule?: string;
    /**
     * textual description of MFE
     */
    description?: string;
    /**
     * uri used as base url for a remote component
     */
    remoteBaseUrl: string;
    /**
     * reference to the product entity as a weak reference
     */
    productName: string;
    iconName?: string;
    operator?: boolean;
    deprecated?: boolean;
    undeployed?: boolean;
    type?: MicrofrontendType;
    classifications?: Array<string>;
    /**
     * available endpoints which are exposed by MFE
     */
    endpoints?: Array<UIEndpoint>;
}



