import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { AppDeleteComponent } from './app-delete.component'

describe('AppDeleteComponent', () => {
  let component: AppDeleteComponent
  let fixture: ComponentFixture<AppDeleteComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AppDeleteComponent],
      imports: [
        HttpClientTestingModule,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppDeleteComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should behave correctly onDialogHide', () => {
    spyOn(component.appDeleted, 'emit')

    component.onDialogHide()

    expect(component.appDeleted.emit).toHaveBeenCalledWith(false)
  })

  it('should confirmDeletion', () => {
    spyOn(console, 'log')

    component.onConfirmDeletion()

    expect(console.log).toHaveBeenCalledWith('confirmDeletion')
  })
})
