import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { ImageContainerComponent } from './image-container.component'
import { prepareUrl } from 'src/app/shared/utils'

describe('ImageContainerComponent', () => {
  let component: ImageContainerComponent
  let fixture: ComponentFixture<ImageContainerComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ImageContainerComponent]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageContainerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnChanges', () => {
    it('should prepend apiPrefix to imageUrl if not starting with http/https and not already prefixed', () => {
      const testUrl = 'path/to/image.jpg'
      const expectedUrl = prepareUrl(testUrl)

      component.imageUrl = testUrl
      component.ngOnChanges({
        imageUrl: {
          currentValue: testUrl,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      })

      expect(component.imageUrl).toBe(expectedUrl ?? '')
    })

    it('should not modify imageUrl if it starts with http/https', () => {
      const testUrl = 'http://path/to/image.jpg'
      component.imageUrl = testUrl
      component.ngOnChanges({
        imageUrl: {
          currentValue: testUrl,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      })

      expect(component.imageUrl).toBe(testUrl)
    })
  })

  it('onImageError should set displayPlaceHolder to true', () => {
    component.onImageError()

    expect(component.displayPlaceHolder).toBeTrue()
  })
})
