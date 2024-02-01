import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { Router, ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { DataViewModule } from 'primeng/dataview'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import { ProductsAPIService } from 'src/app/shared/generated'
import { ProductSearchComponent } from './product-search.component'

describe('ProductSearchComponent', () => {
  let component: ProductSearchComponent
  let fixture: ComponentFixture<ProductSearchComponent>
  let router: Router
  let routeSpy: jasmine.SpyObj<ActivatedRoute>

  const productApiSpy = jasmine.createSpyObj<ProductsAPIService>('ProductsAPIService', ['searchProducts'])
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['get'])

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProductSearchComponent],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        DataViewModule,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [{ provide: ProductsAPIService, useValue: productApiSpy }],
      schemas: [NO_ERRORS_SCHEMA]
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
    spyOn(component, 'searchData')

    component.onSearch()

    expect(component.searchData).toHaveBeenCalled()
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
