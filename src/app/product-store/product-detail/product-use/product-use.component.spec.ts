import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { WorkspaceService } from '@onecx/angular-integration-interface'

import { ProductUseComponent, Workspace } from './product-use.component'

describe('ProductUseComponent', () => {
  let component: ProductUseComponent
  let fixture: ComponentFixture<ProductUseComponent>

  const workspaceServiceSpy = jasmine.createSpyObj<WorkspaceService>('WorkspaceService', ['doesUrlExistFor', 'getUrl'])

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProductUseComponent],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        { provide: WorkspaceService, useValue: workspaceServiceSpy }
      ]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductUseComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    component.slotEmitter.emit([{ name: 'name' } as Workspace])
    workspaceServiceSpy.doesUrlExistFor.and.returnValue(of(true))
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('getWorkspaceEndpointUrl', () => {
    beforeEach(() => {
      component.productName = 'product'
    })

    it('should workspaceEndpointExist - exist', (done) => {
      component.workspaceEndpointExist = true
      workspaceServiceSpy.getUrl.and.returnValue(of('/url'))

      const eu$ = component.getWorkspaceEndpointUrl$('name')

      eu$.subscribe({
        next: (data) => {
          if (data) {
            expect(data).toBe('/url')
          }
          done()
        },
        error: done.fail
      })
    })

    it('should workspaceEndpointExist - not exist', (done) => {
      component.workspaceEndpointExist = false
      const errorResponse = { status: 400, statusText: 'Error on check endpoint' }
      workspaceServiceSpy.getUrl.and.returnValue(throwError(() => errorResponse))

      const eu$ = component.getWorkspaceEndpointUrl$('name')

      eu$.subscribe({
        next: (data) => {
          if (data) {
            expect(data).toBeFalse()
          }
          done()
        },
        error: done.fail
      })
    })
  })
})
