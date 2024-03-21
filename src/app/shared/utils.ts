import { SelectItem } from 'primeng/api'
import { Location } from '@angular/common'
import { environment } from 'src/environments/environment'

export function limitText(text: string, limit: number): string {
  if (text) {
    return text.length < limit ? text : text.substring(0, limit) + '...'
  } else {
    return ''
  }
}

export function prepareUrl(url: string | undefined): string | undefined {
  if (url && !url.match(/^(http|https)/g)) {
    return Location.joinWithSlash(environment.apiPrefix, url)
  } else {
    return url
  }
}
export function prepareUrlPath(url?: string, path?: string): string {
  if (url && path) return Location.joinWithSlash(url, path)
  else if (url) return url
  else return ''
}

export function dropDownSortItemsByLabel(a: SelectItem, b: SelectItem): number {
  return (a.label ? (a.label as string).toUpperCase() : '').localeCompare(
    b.label ? (b.label as string).toUpperCase() : ''
  )
}
export function dropDownGetLabelByValue(ddArray: SelectItem[], val: string): string | undefined {
  const a: any = ddArray.find((item: SelectItem) => {
    return item?.value == val
  })
  return a.label
}
export function sortByLocale(a: any, b: any): number {
  return a.toUpperCase().localeCompare(b.toUpperCase())
}

export function convertToUniqueStringArray(unsorted: string | undefined | null): string[] | undefined {
  if (!unsorted || unsorted?.length === 0) return undefined
  let ar: Array<string> = []
  unsorted
    .toString()
    .split(',')
    .map((a) => ar?.push(a.trim()))
  return ar.sort(sortByLocale)
}
