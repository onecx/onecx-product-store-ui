import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { Router } from '@angular/router'
import { of } from 'rxjs'
import { DataViewModule } from 'primeng/dataview'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { ProductSearchComponent } from './product-search.component'

describe('ProductSearchComponent', () => {
  let component: ProductSearchComponent
  let fixture: ComponentFixture<ProductSearchComponent>
  let router: Router

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
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductSearchComponent)
    component = fixture.componentInstance
    router = TestBed.inject(Router)
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should prepare action buttons on init', () => {
    spyOn(component, 'onAppSearch')
    spyOn(component, 'onNewProduct')

    component.ngOnInit()

    let actions: any = []
    component.actions$!.subscribe((act) => (actions = act))

    actions[0].actionCallback()
    actions[1].actionCallback()

    expect(component.onAppSearch).toHaveBeenCalled()
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
    let asc = true
    component.onSortDirChange(asc)
    expect(component.sortOrder).toEqual(-1)

    asc = false
    component.onSortDirChange(asc)
    expect(component.sortOrder).toEqual(1)
  })

  it('should call loadProducts onSearch', () => {
    translateServiceSpy.get.and.returnValue(of({ 'ACTIONS.CREATE.LABEL': 'Create' }))
    spyOn(component, 'searchProducts')

    component.onSearch()

    expect(component.searchProducts).toHaveBeenCalled()
  })

  it('should reset productSearchCriteriaGroup onSearchReset', () => {
    spyOn(component.productSearchCriteriaGroup, 'reset')

    component.onSearchReset()

    expect(component.productSearchCriteriaGroup.reset).toHaveBeenCalled()
  })

  it('should navigate to new product onNewProduct', () => {
    const routerSpy = spyOn(router, 'navigate')

    component.onNewProduct()

    expect(routerSpy).toHaveBeenCalledWith(['./new'], jasmine.any(Object))
  })

  it('should navigate to apps onAppSearch', () => {
    const routerSpy = spyOn(router, 'navigate')

    component.onAppSearch()

    expect(routerSpy).toHaveBeenCalledWith(['./apps'], jasmine.any(Object))
  })
})
