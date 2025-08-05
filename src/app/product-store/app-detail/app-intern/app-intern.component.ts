import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { TranslateService } from '@ngx-translate/core'

import { Microfrontend, Microservice } from 'src/app/shared/generated'
import { ChangeMode } from '../../product-detail/product-detail.component'

@Component({
  selector: 'app-app-intern',
  templateUrl: './app-intern.component.html'
})
export class AppInternComponent implements OnChanges {
  @Input() mfe: Microfrontend | undefined
  @Input() ms: Microservice | undefined
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
    if (this.mfe || this.ms) {
      this.setFormData()
      console.log('ngOnChanges', this.mfe, this.ms, this.changeMode)
      this.changeMode === 'EDIT' ? this.appForm.get('undeployed')?.enable() : this.appForm.get('undeployed')?.disable()
    }
  }

  private setFormData(): void {
    Object.keys(this.appForm.controls).forEach((key) => {
      if (this.mfe && (this.mfe as any)[key] !== null) this.appForm.controls[key].setValue((this.mfe as any)[key])
      if (this.ms && (this.ms as any)[key] !== null) this.appForm.controls[key].setValue((this.ms as any)[key])
    })
  }

  public onChangeUndeployed(ev: any) {
    this.undeployed.emit(ev.checked)
  }
}
