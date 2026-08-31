import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of } from 'rxjs'

import { AppStateService } from '@onecx/angular-integration-interface'
import { ImageContainerComponent } from './image-container.component'

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
      imports: [
        ImageContainerComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [provideHttpClient(), { provide: AppStateService, useValue: mockAppStateService }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(async () => {
    fixture = TestBed.createComponent(ImageContainerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should get a default image url with info from app state service on creation', (done) => {
    component.defaultImageUrl$.subscribe({
      next: (url) => {
        if (url) {
          expect(url).toBe('/base/assets/images/logo.png')
        }
        done()
      },
      error: done.fail
    })
  })

  describe('imageUrl effect', () => {
    it('should not modify imageUrl if it starts with http/https', () => {
      const testUrl = 'http://path/to/image.jpg'
      fixture.componentRef.setInput('imageUrl', testUrl)
      fixture.detectChanges()

      expect(component.imageUrl()).toBe(testUrl)
    })

    it('should set defaultLogoUrl if component imageUrl is undefined', () => {
      fixture.componentRef.setInput('imageUrl', '')
      fixture.detectChanges()

      expect(component.displayDefaultLogo).toBeTrue()
    })
  })

  it('onImageError should set displayDefaultLogo to true', () => {
    component.onImageError()

    expect(component.displayDefaultLogo).toBeTrue()
  })
})
