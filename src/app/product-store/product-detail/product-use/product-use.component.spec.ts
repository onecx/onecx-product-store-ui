import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of } from 'rxjs'

import { WorkspaceService } from '@onecx/angular-integration-interface'

import { ProductUseComponent, Workspace } from './product-use.component'

describe('ProductUseComponent', () => {
  let component: ProductUseComponent
  let fixture: ComponentFixture<ProductUseComponent>

  const workspaceServiceSpy = jasmine.createSpyObj<WorkspaceService>('WorkspaceService', ['doesUrlExistFor', 'getUrl'])
  const workspaces = [{ name: 'ws1', displayName: 'Workspace 1' } as Workspace]

  function initTestComponent(): void {
    fixture = TestBed.createComponent(ProductUseComponent)
    component = fixture.componentInstance
    fixture.componentRef.setInput('useLoadingState', 'initial')
    fixture.detectChanges()
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProductUseComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: WorkspaceService, useValue: workspaceServiceSpy }
      ]
    }).compileComponents()
  })

  beforeEach(() => {
    spyOn(console, 'error')
    workspaceServiceSpy.doesUrlExistFor.calls.reset()
    workspaceServiceSpy.getUrl.calls.reset()
    workspaceServiceSpy.doesUrlExistFor.and.returnValue(of(false))
    workspaceServiceSpy.getUrl.and.returnValue(of(''))
  })

  it('should create', () => {
    initTestComponent()

    expect(component).toBeTruthy()
  })

  describe('workspaceEndpointExist', () => {
    it('should be false when the endpoint does not exist', () => {
      initTestComponent()

      expect(component.workspaceEndpointExist()).toBeFalse()
    })

    it('should be true when the endpoint exists', () => {
      workspaceServiceSpy.doesUrlExistFor.and.returnValue(of(true))
      initTestComponent()

      expect(component.workspaceEndpointExist()).toBeTrue()
    })
  })

  describe('workspaceUrls', () => {
    it('should resolve an empty map when the endpoint does not exist', () => {
      initTestComponent()
      fixture.componentRef.setInput('workspaces', workspaces)
      fixture.detectChanges()

      expect(component.workspaceUrls().size).toBe(0)
      expect(workspaceServiceSpy.getUrl).not.toHaveBeenCalled()
    })

    it('should resolve an empty map when there are no workspaces', () => {
      workspaceServiceSpy.doesUrlExistFor.and.returnValue(of(true))
      initTestComponent()
      fixture.componentRef.setInput('workspaces', [])
      fixture.detectChanges()

      expect(component.workspaceUrls().size).toBe(0)
    })

    it('should resolve a url per workspace when the endpoint exists', () => {
      workspaceServiceSpy.doesUrlExistFor.and.returnValue(of(true))
      workspaceServiceSpy.getUrl.and.returnValue(of('/workspace/ws1'))
      initTestComponent()
      fixture.componentRef.setInput('workspaces', workspaces)
      fixture.detectChanges()

      expect(component.workspaceUrls().get('ws1')).toBe('/workspace/ws1')
    })
  })

  describe('template', () => {
    function render(state: string, ws?: Workspace[], defined = true): HTMLElement {
      initTestComponent()
      fixture.componentRef.setInput('isComponentDefined', defined)
      fixture.componentRef.setInput('useLoadingState', state)
      fixture.componentRef.setInput('workspaces', ws)
      fixture.detectChanges()
      return fixture.nativeElement
    }

    it('should show missing component message when no component is defined for the slot', () => {
      const el = render('ready', workspaces, false)

      expect(el.querySelector('#ps_product_detail_use_missing_component_message')).toBeTruthy()
    })

    it('should show loading message when loading', () => {
      const el = render('loading')

      expect(el.querySelector('#ps_product_detail_use_loading_message')).toBeTruthy()
    })

    it('should show loading message when timeout', () => {
      const el = render('timeout')

      expect(el.querySelector('#ps_product_detail_use_loading_message')).toBeTruthy()
    })

    it('should show nothing when state is initial', () => {
      const el = render('initial')

      expect(el.querySelector('p-message')).toBeNull()
    })

    it('should show unused message when ready without workspaces', () => {
      const el = render('ready', [])

      expect(el.querySelector('#ps_product_detail_use_unused_message')).toBeTruthy()
    })

    it('should show workspace names when ready and endpoint does not exist', () => {
      const el = render('ready', workspaces)

      expect(el.querySelector('li')?.textContent).toContain('Workspace 1')
      expect(el.querySelector('a')).toBeNull()
    })

    it('should show workspace links when ready and endpoint exists', () => {
      workspaceServiceSpy.doesUrlExistFor.and.returnValue(of(true))
      workspaceServiceSpy.getUrl.and.returnValue(of('/workspace/ws1'))
      const el = render('ready', workspaces)

      expect(el.querySelector('#ps_product_detail_use_item_workspace_link')).toBeTruthy()
    })
  })
})
