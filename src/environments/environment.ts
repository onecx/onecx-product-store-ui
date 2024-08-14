// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  KEYCLOAK_URL: 'http://keycloak-app/',
  KEYCLOAK_REALM: 'OneCX',
  KEYCLOAK_CLIENT_ID: 'portal-mf-shell',
  skipRemoteConfigLoad: true,
  apiPrefix: 'bff',
  DEFAULT_LOGO_PATH: 'assets/images/logo.png'
}
