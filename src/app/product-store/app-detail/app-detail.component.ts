import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { Location } from '@angular/common'
//import { Location, DatePipe } from '@angular/common'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { finalize } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'

import { Action, ConfigurationService, MicroFrontend, PortalMessageService } from '@onecx/portal-integration-angular'
//import { limitText } from '../../shared/utils'
import { MicrofrontendsAPIService, GetMicrofrontendRequestParams } from 'src/app/generated'

type ChangeMode = 'VIEW' | 'CREATE' | 'EDIT'
interface AppDetailForm {
  appId: FormControl<string | null>
}

@Component({
  selector: 'app-app-detail',
  templateUrl: './app-detail.component.html',
  styleUrls: ['./app-detail.component.scss'],
  providers: [ConfigurationService]
})
export class AppDetailComponent implements OnInit {
  @Input() appId: string | undefined
  @Input() dateFormat = 'medium'
  @Input() changeMode: ChangeMode = 'VIEW'
  @Input() displayDetailDialog = false
  @Output() public displayDetailDialogChange = new EventEmitter<boolean>()

  public app: MicroFrontend | undefined
  public formGroup: FormGroup
  public loading = false
  public actions: Action[] = []

  constructor(
    private location: Location,
    private appApi: MicrofrontendsAPIService,
    private config: ConfigurationService,
    private msgService: PortalMessageService,
    private translate: TranslateService
  ) {
    this.dateFormat = this.config.lang === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'medium'
    this.formGroup = new FormGroup<AppDetailForm>({
      appId: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)])
    })
  }

  ngOnInit(): void {
    this.prepareTranslations()
  }

  private loadApp() {
    this.loading = true
    this.appApi
      .searchMicrofrontends({ microfrontendSearchCriteria: { appId: this.appId } })
      .pipe(
        finalize(() => {
          this.loading = false
        })
      )
      .subscribe({
        next: (data: any) => {
          if (data.stream && data.stream.length > 0) {
            this.app = data.stream[0]
            console.info('search: ', data.stream[0])
            this.getApp()
          }
          this.prepareTranslations()
        },
        error: (err: any) => {
          console.error('search: ', err)
          this.msgService.error({
            summaryKey: 'ACTIONS.SEARCH.APP.LOAD_ERROR'
            // detailKey: err.error.indexOf('was not found') > 1 ? 'SEARCH.NOT_FOUND' : err.error
          })
          this.close()
        }
      })
  }
  public getApp() {
    this.loading = true
    this.appApi
      .getMicrofrontend({ id: this.appId } as GetMicrofrontendRequestParams)
      .pipe(
        finalize(() => {
          this.loading = false
        })
      )
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.app = data
            console.info('get: ', data)
          }
        }
      })
  }

  public prepareTranslations(): void {
    this.translate
      .get([
        'ACTIONS.EDIT.LABEL',
        'ACTIONS.EDIT.APP.TOOLTIP',
        'ACTIONS.CANCEL',
        'ACTIONS.TOOLTIPS.CANCEL',
        'ACTIONS.SAVE',
        'ACTIONS.TOOLTIPS.SAVE',
        'ACTIONS.NAVIGATION.BACK',
        'ACTIONS.NAVIGATION.BACK.TOOLTIP'
      ])
      .subscribe((data) => {
        this.prepareActionButtons(data)
      })
  }

  private prepareActionButtons(data: any): void {
    this.actions = [] // provoke change event
    this.actions.push(
      {
        label: data['ACTIONS.NAVIGATION.BACK'],
        title: data['ACTIONS.NAVIGATION.BACK.TOOLTIP'],
        actionCallback: () => this.onClose(),
        icon: 'pi pi-arrow-left',
        show: 'always',
        conditional: true,
        showCondition: this.changeMode !== 'CREATE'
      },
      {
        label: data['ACTIONS.CANCEL'],
        title: data['ACTIONS.TOOLTIPS.CANCEL'],
        actionCallback: () => this.onCancel(),
        icon: 'pi pi-times',
        show: 'always',
        conditional: true,
        showCondition: this.changeMode === 'CREATE'
      },
      {
        label: data['ACTIONS.SAVE'],
        title: data['ACTIONS.TOOLTIPS.SAVE'],
        actionCallback: () => this.onSave(),
        icon: 'pi pi-save',
        show: 'always',
        conditional: true,
        showCondition: this.changeMode !== 'VIEW',
        permission: 'MICROFRONTEND#' + this.changeMode
      }
    )
  }

  public close(): void {
    this.location.back()
  }
  public onClose() {
    this.close()
  }

  public onEdit() {
    this.getApp()
    this.changeMode = 'EDIT'
    this.prepareTranslations()
  }
  public onCancel() {
    if (this.changeMode === 'EDIT') {
      this.changeMode = 'VIEW'
      this.getApp()
      this.prepareTranslations()
    }
    if (this.changeMode === 'CREATE') {
      this.close()
    }
  }
  public onDialogHide() {
    this.displayDetailDialogChange.emit(false)
  }
  public onSave() {
    //this.onSubmit()
  }
}
