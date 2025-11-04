import { SelectItem } from 'primeng/api'
import { of, throwError } from 'rxjs'

import { Utils } from './utils'

describe('utils', () => {
  describe('limitText', () => {
    it('should limit text if text too long', () => {
      const result = Utils.limitText('textData', 4)
      expect(result).toBe('text...')
    })

    it('should limit text if text too long', () => {
      const result = Utils.limitText('textData', 10)
      expect(result).toBe('textData')
    })

    it('return empty string if no text', () => {
      const result = Utils.limitText('', 4)
      expect(result).toBe('')
    })
  })

  describe('dropDownSortItemsByLabel', () => {
    it('should correctly sort items by label', () => {
      const items: SelectItem[] = [
        { label: 'label2', value: 2 },
        { label: 'label1', value: 1 }
      ]

      const sortedItems = items.sort(Utils.dropDownSortItemsByLabel)

      expect(sortedItems[0].label).toEqual('label1')
    })
    it("should treat falsy values for SelectItem.label as ''", () => {
      const items: SelectItem[] = [
        { label: undefined, value: 1 },
        { label: undefined, value: 2 },
        { label: 'label1', value: 2 }
      ]

      const sortedItems = items.sort(Utils.dropDownSortItemsByLabel)

      expect(sortedItems[0].label).toEqual(undefined)
    })
  })

  describe('dropDownGetLabelByValue', () => {
    it('should return the label corresponding to the value', () => {
      const items: SelectItem[] = [
        { label: 'label2', value: 2 },
        { label: 'label1', value: 1 }
      ]

      const result = Utils.dropDownGetLabelByValue(items, '1')

      expect(result).toEqual('label1')
    })
  })

  describe('sortByLocale', () => {
    it('should sort strings based on locale', () => {
      const strings: string[] = ['str2', 'str1']

      const sortedStrings = strings.sort(Utils.sortByLocale)

      expect(sortedStrings[0]).toEqual('str1')
    })
  })

  describe('sortByDisplayName', () => {
    it('should return negative value when first product name comes before second alphabetically', () => {
      const itemA = { id: 'a', name: 'name', displayName: 'Admin' }
      const itemB = { id: 'b', name: 'name', displayName: 'User' }
      expect(Utils.sortByDisplayName(itemA, itemB)).toBeLessThan(0)
    })

    it('should return positive value when first product name comes after second alphabetically', () => {
      const itemA = { id: 'a', name: 'name', displayName: 'User' }
      const itemB = { id: 'b', name: 'name', displayName: 'Admin' }
      expect(Utils.sortByDisplayName(itemA, itemB)).toBeGreaterThan(0)
    })

    it('should return zero when product names are the same', () => {
      const itemA = { id: 'a', name: 'name', displayName: 'Admin' }
      const itemB = { id: 'b', name: 'name', displayName: 'Admin' }
      expect(Utils.sortByDisplayName(itemA, itemB)).toBe(0)
    })

    it('should be case-insensitive', () => {
      const itemA = { id: 'a', name: 'name', displayName: 'admin' }
      const itemB = { id: 'b', name: 'name', displayName: 'Admin' }
      expect(Utils.sortByDisplayName(itemA, itemB)).toBe(0)
    })

    it('should handle undefined names', () => {
      const itemA = { id: 'a', name: 'name', displayName: undefined }
      const itemB = { id: 'b', name: 'name', displayName: 'Admin' }
      expect(Utils.sortByDisplayName(itemA, itemB)).toBeLessThan(0)
    })

    it('should handle empty string names', () => {
      const itemA = { id: 'a', name: 'name', displayName: '' }
      const itemB = { id: 'b', name: 'name', displayName: 'Admin' }
      expect(Utils.sortByDisplayName(itemA, itemB)).toBeLessThan(0)
    })

    it('should handle both names being undefined', () => {
      const itemA = { id: 'a', name: 'name', displayName: undefined }
      const itemB = { id: 'b', name: 'name', displayName: undefined }
      expect(Utils.sortByDisplayName(itemA, itemB)).toBe(0)
    })
  })

  describe('convertToUniqueStringArray', () => {
    it('should convert a comma-separated string to array with unique items', () => {
      const s = ['c', 'b', 'a']

      const sortedArray = Utils.convertToUniqueStringArray(s) ?? []

      expect(sortedArray[0]).toEqual('a')
    })
  })

  describe('prepareUrl', () => {
    it('should prepare internal url', () => {
      const url = 'url'

      const preparedUrl = Utils.prepareUrl(url) ?? ''

      expect(preparedUrl).toEqual('bff/url')
    })
  })

  describe('prepareUrl', () => {
    it('should prepare external url', () => {
      const url = 'http://url'

      const preparedUrl = Utils.prepareUrl(url) ?? ''

      expect(preparedUrl).toEqual(url)
    })
  })

  describe('prepareUrlPath', () => {
    it('should prepare urls', () => {
      const url = 'http://url'
      const path = 'path'

      let urlPath = Utils.prepareUrlPath(url, path)

      expect(urlPath).toEqual(url + '/' + path)

      urlPath = Utils.prepareUrlPath(url)

      expect(urlPath).toEqual(urlPath)

      urlPath = Utils.prepareUrlPath()

      expect(urlPath).toEqual('')
    })
  })

  describe('doesEndpointExist', () => {
    let workspaceServiceMock: any
    const productName = 'testProduct'
    const appId = 'testApp'
    const endpointName = 'testEndpoint'

    beforeEach(() => {
      workspaceServiceMock = {
        doesUrlExistFor: jasmine.createSpy('doesUrlExistFor')
      }
      spyOn(console, 'error')
    })

    it('should endpoint exist', () => {
      workspaceServiceMock.doesUrlExistFor.and.returnValue(of(true))

      const exist = Utils.doesEndpointExist(workspaceServiceMock, productName, appId, endpointName)

      expect(exist).toBeTrue()
    })

    it('should endpoint NOT exist', () => {
      workspaceServiceMock.doesUrlExistFor.and.returnValue(of(false))

      const exist = Utils.doesEndpointExist(workspaceServiceMock, productName, appId, endpointName)

      expect(exist).toBeFalse()
      expect(console.error).toHaveBeenCalled()
    })

    it('should get endpoint failed', () => {
      const errorResponse = { status: 403, statusText: 'No permissions' }
      workspaceServiceMock.doesUrlExistFor.and.returnValue(throwError(() => errorResponse))

      const exist = Utils.doesEndpointExist(workspaceServiceMock, productName, appId, endpointName)

      expect(exist).toBeFalse()
      expect(console.error).toHaveBeenCalledWith('doesUrlExistFor', errorResponse)
    })
  })
})
