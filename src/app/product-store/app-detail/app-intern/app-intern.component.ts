import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core'
import { DatePipe } from '@angular/common'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

import { CheckboxModule } from 'primeng/checkbox'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { TooltipModule } from 'primeng/tooltip'

import { Microfrontend, Microservice } from 'src/app/shared/generated'
import { Utils } from 'src/app/shared/utils'
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
export class AppInternComponent {
  public readonly mfe = input<Microfrontend>()
  public readonly ms = input<Microservice>()
  public readonly dateFormat = input('medium')
  public readonly changeMode = input<ChangeMode>('VIEW')
  public readonly undeployed = output<boolean>()

  private readonly translate = inject(TranslateService)

  public appForm: FormGroup

  constructor() {
    this.appForm = new FormGroup({
      operator: new FormControl<boolean | null>(null),
      deprecated: new FormControl<boolean | null>(null),
      undeployed: new FormControl<boolean | null>(null)
    })

    // replaces ngOnChanges: signal inputs don't trigger it
    effect(() => {
      this.appForm.reset()
      this.appForm.disable()
      if (this.mfe() || this.ms()) {
        this.setFormData()
        this.changeMode() === 'EDIT'
          ? this.appForm.get('undeployed')?.enable()
          : this.appForm.get('undeployed')?.disable()
      }
    })
  }

  private setFormData(): void {
    Utils.setFormControlsValues(this.appForm.controls, this.mfe())
    Utils.setFormControlsValues(this.appForm.controls, this.ms())
  }

  public onChangeUndeployed(ev: any) {
    this.undeployed.emit(ev.checked)
  }
}
