import { EventEmitter } from '@angular/core'
import { Observable, of } from 'rxjs'

export class TranslateServiceMock {
  public onLangChange: EventEmitter<any> = new EventEmitter()
  public onTranslationChange: EventEmitter<any> = new EventEmitter()
  public onDefaultLangChange: EventEmitter<any> = new EventEmitter()

  public get(value: any): Observable<any> {
    return of(value)
  }
}
