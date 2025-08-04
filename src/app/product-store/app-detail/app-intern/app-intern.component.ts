import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { TranslateService } from '@ngx-translate/core'

import { Microfrontend, Microservice } from 'src/app/shared/generated'
import { ChangeMode } from '../../app-search/app-search.component'

@Component({
  selector: 'app-app-intern',
  templateUrl: './app-intern.component.html'
})
export class AppInternComponent implements OnChanges {
  @Input() app: (Microfrontend | Microservice) | undefined
  @Input() appType: 'MFE' | 'MS' = 'MFE'
  @Input() dateFormat = 'medium'
  @Input() changeMode: ChangeMode = 'VIEW'
  @Output() undeployed = new EventEmitter<boolean>()

  public appForm: FormGroup

  constructor(private readonly translate: TranslateService) {
    this.appForm = new FormGroup({
      operator: new FormControl<boolean | null>(null),
      deprecated: new FormControl<boolean | null>(null),
      undeployed: new FormControl<boolean | null>(null)
    })
  }

  public ngOnChanges(): void {
    this.appForm.reset()
    this.appForm.disable()
    if (this.app) {
      this.setFormData()
      this.changeMode === 'EDIT' ? this.appForm.get('undeployed')?.enable() : this.appForm.get('undeployed')?.disable()
    }
  }

  private setFormData(): void {
    Object.keys(this.appForm.controls).forEach((key) => {
      if ((this.app as any)[key] !== null) this.appForm.controls[key].setValue((this.app as any)[key])
    })
  }

  public onChangeUndeployed(ev: any) {
    this.undeployed.emit(ev.checked)
  }
}
