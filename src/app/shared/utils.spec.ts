import { SelectItem } from 'primeng/api'

import {
  limitText,
  dropDownSortItemsByLabel,
  dropDownGetLabelByValue,
  sortByLocale,
  convertToUniqueStringArray
} from './utils'

describe('utils', () => {
  describe('limitText', () => {
    it('should limit text if text too long', () => {
      const result = limitText('textData', 4)
      expect(result).toBe('text...')
    })

    it('should limit text if text too long', () => {
      const result = limitText('textData', 10)
      expect(result).toBe('textData')
    })

    it('return empty string if no text', () => {
      const result = limitText('', 4)
      expect(result).toBe('')
    })
  })

  describe('dropDownSortItemsByLabel', () => {
    it('should correctly sort items by label', () => {
      const items: SelectItem[] = [
        { label: 'label2', value: 2 },
        { label: 'label1', value: 1 }
      ]

      const sortedItems = items.sort(dropDownSortItemsByLabel)

      expect(sortedItems[0].label).toEqual('label1')
    })
    it("should treat falsy values for SelectItem.label as ''", () => {
      const items: SelectItem[] = [
        { label: undefined, value: 1 },
        { label: undefined, value: 2 },
        { label: 'label1', value: 2 }
      ]

      const sortedItems = items.sort(dropDownSortItemsByLabel)

      expect(sortedItems[0].label).toEqual(undefined)
    })
  })

  describe('dropDownGetLabelByValue', () => {
    it('should return the label corresponding to the value', () => {
      const items: SelectItem[] = [
        { label: 'label2', value: 2 },
        { label: 'label1', value: 1 }
      ]

      const result = dropDownGetLabelByValue(items, '1')

      expect(result).toEqual('label1')
    })
  })

  describe('sortByLocale', () => {
    it('should sort strings based on locale', () => {
      const strings: string[] = ['str2', 'str1']

      const sortedStrings = strings.sort(sortByLocale)

      expect(sortedStrings[0]).toEqual('str1')
    })
  })

  describe('convertToUniqueStringArray', () => {
    it('should convert a comma-separated string to array with unique items', () => {
      const s = 'c, b, a'

      const sortedArray = convertToUniqueStringArray(s) ?? []

      expect(sortedArray[0]).toEqual('a')
    })
  })
})
