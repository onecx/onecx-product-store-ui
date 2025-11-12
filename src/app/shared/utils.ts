import { SelectItem } from 'primeng/api'
import { Location } from '@angular/common'
import { catchError, first, of, tap } from 'rxjs'

import { WorkspaceService } from '@onecx/angular-integration-interface'

import { environment } from 'src/environments/environment'
import { RefType } from 'src/app/shared/generated'

// This object encapsulated function because ...
//  ...Jasmine has problems to spying direct imported functions
const Utils = {
  limitText(text: string | undefined, limit: number): string {
    if (text) {
      return text.length <= limit ? text : text.substring(0, limit) + '...'
    } else {
      return ''
    }
  },

  dropDownSortItemsByLabel(a: SelectItem, b: SelectItem): number {
    return (a.label ? a.label.toUpperCase() : '').localeCompare(b.label ? b.label.toUpperCase() : '')
  },

  dropDownGetLabelByValue(ddArray: SelectItem[], val: string): string | undefined {
    const a: any = ddArray.find((item: SelectItem) => {
      return item?.value == val
    })
    return a.label
  },

  sortByLocale(a: any, b: any): number {
    return a.toUpperCase().localeCompare(b.toUpperCase())
  },

  sortByDisplayName(a: any, b: any): number {
    return (a.displayName ? a.displayName.toUpperCase() : '').localeCompare(
      b.displayName ? b.displayName.toUpperCase() : ''
    )
  },

  convertToUniqueStringArray(unsorted?: string[] | null): string[] | undefined {
    if (!unsorted || unsorted === null || unsorted?.length === 0) return undefined
    const ar: Array<string> = []
    for (const s of unsorted.toString().split(',')) ar?.push(s.trim())
    return ar.sort(this.sortByLocale)
  },

  /**
   * URLs
   */
  prepareUrl(url: string | undefined): string | undefined {
    if (url && !/^(http|https).*/.exec(url)) {
      return Location.joinWithSlash(environment.apiPrefix, url)
    } else {
      return url
    }
  },
  prepareUrlPath(url?: string, path?: string): string {
    if (url && path) return Location.joinWithSlash(url, path)
    else if (url) return url
    else return ''
  },
  bffImageUrl(basePath: string | undefined, name: string | undefined, refType: RefType): string {
    return name ? basePath + '/images/' + name + '/' + refType : ''
  },

  /**
   * Endpoints
   */
  doesEndpointExist(
    workspaceService: WorkspaceService,
    productName: string,
    appId: string,
    endpointName: string
  ): boolean {
    let exist = false
    workspaceService
      .doesUrlExistFor(productName, appId, endpointName)
      .pipe(
        first(),
        tap((exists) => {
          if (!exists) {
            console.error(`Routing not possible to workspace for endpoint: ${productName} ${appId} ${endpointName}`)
          }
        }),
        catchError((err) => {
          console.error('doesUrlExistFor', err)
          return of(false)
        })
      )
      .subscribe((ex) => (exist = ex))
    return exist
  }
}

export { Utils }
