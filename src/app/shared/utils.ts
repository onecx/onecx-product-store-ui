import { SelectItem } from 'primeng/api'
import { Location } from '@angular/common'
import { AbstractControl, FormGroup } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { catchError, first, of, tap } from 'rxjs'

import { WorkspaceService } from '@onecx/angular-integration-interface'

import { environment } from 'src/environments/environment'
import { RefType } from 'src/app/shared/generated'

// This object encapsulated function because ...
//  ...Jasmine has problems to spying direct imported functions
const Utils = {
  mapping_error_status(status: number): number {
    return [400, 401, 403, 404, 500].includes(status) ? status : 0
  },

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

  asArray(value: string | string[] | null | undefined): string[] | undefined {
    if (value == null || value === '') {
      return undefined
    }

    return Array.isArray(value) ? value : [value]
  },

  /**
   * Forms
   */
  // fills form controls with values from a source object, matching control keys to source properties
  setFormControlsValues(controls: object, source: object | undefined, skipNullValues = true): void {
    if (!source) return
    const controlsRecord = controls as Record<string, AbstractControl>
    const sourceRecord = source as Record<string, unknown>
    for (const key of Object.keys(controlsRecord)) {
      const value = sourceRecord[key]
      if (!skipNullValues || value !== null) {
        controlsRecord[key].setValue(value)
      }
    }
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

  syncFormValuesWithRoute(
    route: ActivatedRoute,
    router: Router,
    form: FormGroup,
    fields: Array<{ key: string; array?: boolean; clearOn?: unknown[] }>
  ): void {
    const queryParams: Record<string, unknown> = {}

    for (const field of fields) {
      const control = form.get(field.key)
      const value = control?.value

      if (field.array) {
        if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
          queryParams[field.key] = null
          continue
        }

        const normalizedValue = Array.isArray(value) ? value : [value]
        queryParams[field.key] = field.clearOn?.includes(normalizedValue[0]) ? null : normalizedValue
        continue
      }

      const shouldClear = value == null || value === '' || field.clearOn?.includes(value)
      queryParams[field.key] = shouldClear ? null : value
    }

    const navigation = router.navigate([], {
      relativeTo: route,
      queryParams,
      replaceUrl: true,
      queryParamsHandling: 'merge'
    })

    navigation?.catch((err) => console.error(err))
  },

  restoreFormValuesFromRoute(
    route: ActivatedRoute,
    form: FormGroup,
    fields: Array<{ key: string; array?: boolean }>
  ): boolean {
    const queryParams = route.snapshot?.queryParams ?? {}
    if (Object.keys(queryParams).length === 0) return false

    let restored = false

    for (const field of fields) {
      const rawValue = queryParams[field.key]
      if (rawValue === undefined) continue

      const control = form.get(field.key)
      if (!control) continue

      control.setValue(field.array ? Utils.asArray(rawValue as string | string[] | null | undefined) : rawValue)
      restored = true
    }

    return restored
  },

  /**
   * Filter
   */
  toSearchableText(value: unknown): string | undefined {
    if (value == null) return undefined
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return value.toString()
    }
    if (value instanceof Date) return value.toISOString()
    if (Array.isArray(value)) {
      const normalizedValues = value
        .map((entry) => Utils.toSearchableText(entry))
        .filter((entry): entry is string => entry != null && entry !== '')
      return normalizedValues.length ? normalizedValues.join(' ') : undefined
    }
    return undefined
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
