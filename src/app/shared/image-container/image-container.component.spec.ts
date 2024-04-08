import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { ImageContainerComponent } from './image-container.component'
import { prepareUrl } from 'src/app/shared/utils'

import { AppStateService } from '@onecx/portal-integration-angular'
import { of } from 'rxjs'

class MockAppStateService {
  currentMfe$ = of({
    remoteBaseUrl: '/base/'
  })
}

describe('ImageContainerComponent', () => {
  let component: ImageContainerComponent
  let fixture: ComponentFixture<ImageContainerComponent>
  let mockAppStateService: MockAppStateService

  beforeEach(waitForAsync(() => {
    mockAppStateService = new MockAppStateService()

    TestBed.configureTestingModule({
      declarations: [ImageContainerComponent],
      providers: [{ provide: AppStateService, useValue: mockAppStateService }]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageContainerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(component.defaultImageUrl).toEqual('/base/./assets/images/product.jpg')
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
