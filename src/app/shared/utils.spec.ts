import { limitText } from './utils'

describe('utils', () => {
  it('should limit text if text too long', () => {
    const result = limitText('textData', 4)
    expect(result).toBe('text...')
  })
})
