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
import { ApplicationAbstract } from './applicationAbstract';


export interface ProductAbstract { 
    /**
     * technical id for a product (unique). Can be used to fetch further product details.
     */
    id: string;
    /**
     * business key for identifying product
     */
    name: string;
    /**
     * product version
     */
    version?: string;
    /**
     * textual description for a product.
     */
    description?: string;
    /**
     * product image as url.
     */
    imageUrl?: string;
    /**
     * name of the product used for displaying to user.
     */
    displayName?: string;
    /**
     * like tags for grouping and labeling. Used in frontend to enable filtering.
     */
    classifications?: Array<string>;
    undeployed?: boolean;
    provider?: string;
    applications?: Array<ApplicationAbstract>;
}

