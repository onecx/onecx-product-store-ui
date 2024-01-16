import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClient } from '@angular/common/http'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { of /* , throwError */ } from 'rxjs'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import { HttpLoaderFactory } from 'src/app/shared/shared.module'
import { ProductSearchComponent } from './product-search.component'

describe('ProductSearchComponent', () => {
  let component: ProductSearchComponent
  let fixture: ComponentFixture<ProductSearchComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['get'])

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProductSearchComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
          }
        })
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: PortalMessageService, useValue: msgServiceSpy }]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should prepare action buttons on init', () => {
    translateServiceSpy.get.and.returnValue(of({ 'ACTIONS.CREATE.PRODUCT': 'Create' }))
    spyOn(component, 'onNewProduct')
    component.ngOnInit()

    const action = component.actions[0]
    action.actionCallback()

    expect(component.onNewProduct).toHaveBeenCalled()
  })

  it('should set correct value onLayoutChange', () => {
    const viewMode = 'EDIT'
    component.onLayoutChange(viewMode)

    expect(component.viewMode).toEqual('EDIT')
  })

  /* fit('should set correct values onFilterChange', () => {
    const filter = 'filter'
    component.onFilterChange(filter)

    expect(component.filter).toEqual(filter)
    expect(component.search).toHaveBeenCalled()
  }) */
})

