import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core'
import { DatePipe } from '@angular/common'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

import { CheckboxModule } from 'primeng/checkbox'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { TooltipModule } from 'primeng/tooltip'

import { Microfrontend, Microservice } from 'src/app/shared/generated'
import { ChangeMode } from '../../product-detail/product-detail.component'

@Component({
  selector: 'app-app-intern',
  standalone: true,
  imports: [
    DatePipe,
    CheckboxModule,
    FloatLabelModule,
    InputTextModule,
    MessageModule,
    ReactiveFormsModule,
    TooltipModule,
    TranslateModule
  ],
  templateUrl: './app-intern.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppInternComponent implements OnChanges {
  @Input() mfe: Microfrontend | undefined
  @Input() ms: Microservice | undefined
  @Input() dateFormat = 'medium'
  @Input() changeMode: ChangeMode = 'VIEW'
  @Output() undeployed = new EventEmitter<boolean>()

  private readonly translate = inject(TranslateService)

  public appForm: FormGroup

  constructor() {
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
      this.changeMode === 'EDIT' ? this.appForm.get('undeployed')?.enable() : this.appForm.get('undeployed')?.disable()
    }
  }

  private setFormData(): void {
    for (const key of Object.keys(this.appForm.controls)) {
      if (this.mfe && (this.mfe as any)[key] !== null) this.appForm.controls[key].setValue((this.mfe as any)[key])
      if (this.ms && (this.ms as any)[key] !== null) this.appForm.controls[key].setValue((this.ms as any)[key])
    }
  }

  public onChangeUndeployed(ev: any) {
    this.undeployed.emit(ev.checked)
  }
}
