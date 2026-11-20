import { TestBed } from '@angular/core/testing'

import { SlotService } from '@onecx/angular-remote-components'

import { injectInitializedSlotService } from './slot.initializer'

describe('injectInitializedSlotService', () => {
  let slotServiceSpy: jasmine.SpyObj<SlotService>

  beforeEach(() => {
    const spy = jasmine.createSpyObj('SlotService', ['init'])
    spy.init.and.returnValue(Promise.resolve())

    TestBed.configureTestingModule({
      providers: [{ provide: SlotService, useValue: spy }]
    })

    slotServiceSpy = TestBed.inject(SlotService) as jasmine.SpyObj<SlotService>
  })

  it('should inject SlotService and immediately call the init() method', () => {
    let resultService: SlotService | undefined

    TestBed.runInInjectionContext(() => {
      resultService = injectInitializedSlotService()
    })

    expect(resultService).toBe(slotServiceSpy)
    expect(slotServiceSpy.init).toHaveBeenCalledTimes(1)
  })

  it('should log SlotService init errors', async () => {
    const error = new Error('slot init failed')
    slotServiceSpy.init.and.returnValue(Promise.reject(error))
    spyOn(console, 'error')

    TestBed.runInInjectionContext(() => {
      injectInitializedSlotService()
    })

    await Promise.resolve()

    expect(console.error).toHaveBeenCalledWith(error)
  })
})
