import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClient } from '@angular/common/http'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { Router, ActivatedRoute } from '@angular/router'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { of } from 'rxjs'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import { HttpLoaderFactory } from 'src/app/shared/shared.module'
import { ProductSearchComponent } from './product-search.component'

describe('ProductSearchComponent', () => {
  let component: ProductSearchComponent
  let fixture: ComponentFixture<ProductSearchComponent>
  let router: Router
  let routeSpy: jasmine.SpyObj<ActivatedRoute>

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
      providers: [
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: ActivatedRoute, useValue: routeSpy }
      ]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductSearchComponent)
    component = fixture.componentInstance
    router = TestBed.inject(Router)
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
    translateServiceSpy.get.and.returnValue(of({ 'ACTIONS.CREATE.LABEL': 'Create' }))
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

  it('should set correct values onFilterChange', () => {
    const filter = 'filter'

    component.onFilterChange(filter)

    expect(component.filter).toEqual(filter)
  })

  it('should set correct value onSortChange', () => {
    const sortField = 'field'

    component.onSortChange(sortField)

    expect(component.sortField).toEqual(sortField)
  })

  it('should set correct value onSortDirChange', () => {
    const asc = true

    component.onSortDirChange(asc)

    expect(component.sortOrder).toEqual(-1)
  })

  it('should call loadProducts onSearch', () => {
    translateServiceSpy.get.and.returnValue(of({ 'ACTIONS.CREATE.LABEL': 'Create' }))
    spyOn(component, 'loadProducts')

    component.onSearch()

    expect(component.loadProducts).toHaveBeenCalled()
  })

  it('should reset productSearchCriteriaGroup onSearchReset', () => {
    spyOn(component.productSearchCriteriaGroup, 'reset')

    component.onSearchReset()

    expect(component.productSearchCriteriaGroup.reset).toHaveBeenCalled()
  })

  it('should navigate to new product on onNewProduct', () => {
    const routerSpy = spyOn(router, 'navigate')

    component.onNewProduct()

    expect(routerSpy).toHaveBeenCalledWith(['./new'], { relativeTo: routeSpy })
  })
})
