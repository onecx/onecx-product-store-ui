import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import {
  MissingTranslationHandler,
  MissingTranslationHandlerParams,
  TranslateModule,
  TranslateService
} from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'

import { CheckboxModule } from 'primeng/checkbox'
import { InputTextareaModule } from 'primeng/inputtextarea'
import { AccordionModule } from 'primeng/accordion'
import { MessageService } from 'primeng/api'
import { ConfirmPopupModule } from 'primeng/confirmpopup'
import { DataViewModule } from 'primeng/dataview'
import { DialogModule } from 'primeng/dialog'
import { DropdownModule } from 'primeng/dropdown'
import { InputTextModule } from 'primeng/inputtext'
import { KeyFilterModule } from 'primeng/keyfilter'
import { ListboxModule } from 'primeng/listbox'
import { MultiSelectModule } from 'primeng/multiselect'
import { OverlayPanelModule } from 'primeng/overlaypanel'
import { SelectButtonModule } from 'primeng/selectbutton'
import { PanelModule } from 'primeng/panel'
import { StepsModule } from 'primeng/steps'
import { TableModule } from 'primeng/table'
import { TabViewModule } from 'primeng/tabview'
import { ToastModule } from 'primeng/toast'
import { TreeModule } from 'primeng/tree'
import { BadgeModule } from 'primeng/badge'
import { FileUploadModule } from 'primeng/fileupload'
import { AutoCompleteModule } from 'primeng/autocomplete'
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog'
import { ErrorTailorModule } from '@ngneat/error-tailor'

import { MfeInfo, MFE_INFO, PortalDialogService, PortalMessageService } from '@onecx/portal-integration-angular'
import { BASE_PATH } from '../generated'
import { environment } from '../../environments/environment'
import { CanActivateGuard } from './can-active-guard.service'
import { LabelResolver } from './label.resolver'
import { ImageContainerComponent } from './image-container/image-container.component'

export function createTranslateLoader(http: HttpClient, mfeInfo: MfeInfo) {
  console.log(`configuring translate loader ${mfeInfo?.remoteBaseUrl}`)
  if (mfeInfo && mfeInfo.remoteBaseUrl) {
    return new TranslateHttpLoader(http, `${mfeInfo.remoteBaseUrl}/assets/i18n/`, '.json')
  } else {
    return new TranslateHttpLoader(http, `./assets/i18n/`, '.json')
  }
}

export const basePathProvider = (mfeInfo: MfeInfo) => {
  console.log(`Base path provider ${mfeInfo?.remoteBaseUrl}`)
  return mfeInfo ? mfeInfo.remoteBaseUrl + '/' + environment.apiPrefix : './' + environment.apiPrefix
}

export class MyMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams) {
    console.log(`Missing translation for ${params.key}`)
    return params.key
  }
}

@NgModule({
  declarations: [ImageContainerComponent],
  imports: [
    AccordionModule,
    CommonModule,
    CheckboxModule,
    DataViewModule,
    DialogModule,
    DynamicDialogModule,
    DropdownModule,
    FormsModule,
    KeyFilterModule,
    BadgeModule,
    ListboxModule,
    MultiSelectModule,
    ReactiveFormsModule,
    FileUploadModule,
    AutoCompleteModule,
    TabViewModule,
    TreeModule,
    TranslateModule.forChild({
      isolate: true,
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: MyMissingTranslationHandler
      }
    }),
    ErrorTailorModule.forRoot({
      controlErrorsOn: {
        async: true,
        blur: true,
        change: true
      },
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
      //this is required because primeng calendar wraps things in an ugly way
      blurPredicate: (element: Element) => {
        return ['INPUT', 'TEXTAREA', 'SELECT', 'CUSTOM-DATE', 'P-CALENDAR', 'P-DROPDOWN'].some(
          (selector) => element.tagName === selector
        )
      }
    }),
    StepsModule,
    InputTextModule,
    InputTextareaModule,
    ConfirmPopupModule,
    ToastModule,
    PanelModule,
    OverlayPanelModule,
    SelectButtonModule,
    TableModule
  ],
  exports: [
    AccordionModule,
    CheckboxModule,
    CommonModule,
    DataViewModule,
    DialogModule,
    DropdownModule,
    FormsModule,
    KeyFilterModule,
    ListboxModule,
    TabViewModule,
    BadgeModule,
    MultiSelectModule,
    AutoCompleteModule,
    FileUploadModule,
    ReactiveFormsModule,
    TranslateModule,
    ErrorTailorModule,
    TreeModule,
    StepsModule,
    InputTextModule,
    InputTextareaModule,
    ConfirmPopupModule,
    ToastModule,
    PanelModule,
    OverlayPanelModule,
    SelectButtonModule,
    TableModule,
    DynamicDialogModule,
    ImageContainerComponent
  ],
  //this is not elegant, for some reason the injection token from primeng does not work across federated module
  providers: [
    LabelResolver,
    { provide: MessageService, useExisting: PortalMessageService },
    { provide: DialogService, useClass: PortalDialogService },

    CanActivateGuard,
    {
      provide: BASE_PATH,
      useFactory: basePathProvider,
      deps: [MFE_INFO]
    }
  ],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule {}
