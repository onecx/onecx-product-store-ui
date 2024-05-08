import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { Router, ActivatedRoute } from '@angular/router'
import { of, throwError } from 'rxjs'
import { DataViewModule } from 'primeng/dataview'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { SlotsAPIService, SlotPageResult, Slot } from 'src/app/shared/generated'

import { SlotSearchComponent } from './slot-search.component'

const slots: Slot[] = [
  {
    name: 'slot2',
    id: 'id2',
    appId: 'appId2',
    productName: 'productName2'
  },
  {
    name: 'slot',
    id: 'id',
    appId: 'appId',
    productName: 'productName'
  }
]

describe('SlotSearchComponent', () => {
  let component: SlotSearchComponent
  let fixture: ComponentFixture<SlotSearchComponent>
  let routerSpy = jasmine.createSpyObj('Router', ['navigate'])
  let routeMock = { snapshot: { paramMap: new Map() } }

  const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['get'])
  const apiSlotsServiceSpy = {
    searchSlots: jasmine.createSpy('searchSlots').and.returnValue(of({ stream: [] }))
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SlotSearchComponent],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        DataViewModule,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        { provide: SlotsAPIService, useValue: apiSlotsServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: routeMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(async () => {
    fixture = TestBed.createComponent(SlotSearchComponent)
    component = fixture.componentInstance
    fixture.componentInstance.ngOnInit() // solved ExpressionChangedAfterItHasBeenCheckedError
  })

  afterEach(() => {
    apiSlotsServiceSpy.searchSlots.calls.reset(), translateServiceSpy.get.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should call onBack when actionCallback is executed', () => {
    spyOn(component, 'onBack')

    component.ngOnInit()

    if (component.actions$) {
      component.actions$.subscribe((actions) => {
        const firstAction = actions[0]
        firstAction.actionCallback()
        expect(component.onBack).toHaveBeenCalled()
      })
    }
  })

  it('should set correct values onFilterChange', () => {
    const filter = 'filter'

    component.onFilterChange(filter)

    expect(component.filter).toEqual(filter)
  })

  it('should search slots - successful found', (done) => {
    apiSlotsServiceSpy.searchSlots.and.returnValue(of({ stream: slots } as SlotPageResult))

    component.onSearch()

    component.slots$.subscribe({
      next: (result) => {
        if (result.stream) {
          expect(result.stream.length).toBe(2)
          result.stream.forEach((slot) => {
            expect(slot.id).toContain('id')
          })
        }
        done()
      },
      error: done.fail
    })
  })

  it('should search slots - successful not found', (done) => {
    apiSlotsServiceSpy.searchSlots.and.returnValue(of({ stream: [] } as SlotPageResult))

    component.onSearch()

    component.slots$.subscribe({
      next: (result) => {
        if (result.stream) {
          expect(result.stream.length).toBe(0)
        }
        done()
      },
      error: done.fail
    })
  })

  it('should search slots - failed', (done) => {
    const err = { status: 403 }
    apiSlotsServiceSpy.searchSlots.and.returnValue(throwError(() => err))

    component.onSearch()

    component.slots$.subscribe({
      next: (result) => {
        if (result.stream) {
          expect(result.stream.length).toBe(0)
          expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_403.SLOTS')
        }
        done()
      },
      error: done.fail
    })
  })

  it('should sortSlotsByName', () => {
    slots.sort(component.sortSlotsByName)

    const sortedSlots: Slot[] = [
      {
        name: 'slot',
        id: 'id',
        appId: 'appId',
        productName: 'productName'
      },
      {
        name: 'slot2',
        id: 'id2',
        appId: 'appId2',
        productName: 'productName2'
      }
    ]

    expect(slots).toEqual(sortedSlots)
  })

  it('should reset slotSearchCriteriaGroup onSearchReset', () => {
    spyOn(component.slotSearchCriteriaGroup, 'reset')

    component.onSearchReset()

    expect(component.slotSearchCriteriaGroup.reset).toHaveBeenCalled()
  })

  it('should navigate back onBack', () => {
    component.onBack()

    expect(routerSpy.navigate).toHaveBeenCalledWith(['../'], { relativeTo: routeMock })
  })
})
