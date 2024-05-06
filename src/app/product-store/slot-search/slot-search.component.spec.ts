import { ComponentFixture, TestBed } from '@angular/core/testing'
import { SlotSearchComponent } from './slot-search.component'

describe('SlotSearchComponent', () => {
  let component: SlotSearchComponent
  let fixture: ComponentFixture<SlotSearchComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SlotSearchComponent]
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(SlotSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
