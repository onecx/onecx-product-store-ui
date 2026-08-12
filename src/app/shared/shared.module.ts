import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { provideErrorTailorConfig } from '@ngneat/error-tailor'

import { AngularRemoteComponentsModule } from '@onecx/angular-remote-components'
import { AutoCompleteModule } from 'primeng/autocomplete'
import { ConfirmDialogModule } from 'primeng/confirmdialog'
import { ConfirmPopupModule } from 'primeng/confirmpopup'
import { ConfirmationService } from 'primeng/api'
import { DataViewModule } from 'primeng/dataview'
import { DialogModule } from 'primeng/dialog'
import { DialogService } from 'primeng/dynamicdialog'
import { DropdownModule } from 'primeng/dropdown'
import { FloatLabelModule } from 'primeng/floatlabel'
import { ButtonModule } from 'primeng/button'
import { InputGroupAddonModule } from 'primeng/inputgroupaddon'
import { InputGroupModule } from 'primeng/inputgroup'
import { InputTextModule } from 'primeng/inputtext'
import { KeyFilterModule } from 'primeng/keyfilter'
import { ListboxModule } from 'primeng/listbox'
import { MultiSelectModule } from 'primeng/multiselect'
import { SelectButtonModule } from 'primeng/selectbutton'
import { TableModule } from 'primeng/table'
import { TooltipModule } from 'primeng/tooltip'
import { TabsModule } from 'primeng/tabs'
import { ToastModule } from 'primeng/toast'

import { AngularAcceleratorModule, PortalDialogService } from '@onecx/angular-accelerator'

import { LabelResolver } from './label.resolver'
import { OcxChipComponent } from './ocx-chip/ocx-chip.component'
import { ImageContainerComponent } from './image-container/image-container.component'

@NgModule({
  imports: [
    AngularAcceleratorModule,
    AngularRemoteComponentsModule,
    AutoCompleteModule,
    ButtonModule,
    CommonModule,
    ConfirmDialogModule,
    ConfirmPopupModule,
    DataViewModule,
    DialogModule,
    DropdownModule,
    FloatLabelModule,
    FormsModule,
    InputGroupAddonModule,
    InputGroupModule,
    InputTextModule,
    KeyFilterModule,
    ListboxModule,
    MultiSelectModule,
    ReactiveFormsModule,
    SelectButtonModule,
    TableModule,
    OcxChipComponent,
    ImageContainerComponent,
    TooltipModule,
    TabsModule,
    ToastModule,
    TranslateModule
  ],
  exports: [
    AngularRemoteComponentsModule,
    AutoCompleteModule,
    ButtonModule,
    CommonModule,
    ConfirmDialogModule,
    ConfirmPopupModule,
    DataViewModule,
    DialogModule,
    DropdownModule,
    FloatLabelModule,
    FormsModule,
    InputGroupAddonModule,
    InputGroupModule,
    InputTextModule,
    KeyFilterModule,
    ListboxModule,
    MultiSelectModule,
    ReactiveFormsModule,
    SelectButtonModule,
    TableModule,
    OcxChipComponent,
    ImageContainerComponent,
    TooltipModule,
    TabsModule,
    ToastModule,
    TranslateModule
  ],
  providers: [
    ConfirmationService,
    LabelResolver,
    { provide: DialogService, useClass: PortalDialogService },
    provideErrorTailorConfig({
      controlErrorsOn: { async: true, blur: true, change: true },
      errors: {
        useFactory: (i18n: TranslateService) => {
          return {
            required: () => i18n.instant('VALIDATION.ERRORS.EMPTY_REQUIRED_FIELD'),
            maxlength: ({ requiredLength }) =>
              i18n.instant('VALIDATION.ERRORS.MAXIMUM_LENGTH').replace('{{chars}}', requiredLength),
            minlength: ({ requiredLength }) =>
              i18n.instant('VALIDATION.ERRORS.MINIMUM_LENGTH').replace('{{chars}}', requiredLength),
            pattern: () => i18n.instant('VALIDATION.ERRORS.PATTERN_ERROR')
          }
        },
        deps: [TranslateService]
      },
      blurPredicate: (element: Element) => {
        return ['INPUT', 'TEXTAREA', 'SELECT', 'CUSTOM-DATE', 'P-CALENDAR', 'P-DROPDOWN'].includes(element.tagName)
      }
    })
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class SharedModule {}
