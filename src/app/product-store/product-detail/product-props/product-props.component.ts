import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core'
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'
import { SelectItem } from 'primeng/api'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import {
  CreateProductRequest,
  GetImageRequestParams,
  ImagesInternalAPIService,
  Product,
  ProductsAPIService,
  RefType,
  UpdateProductRequest,
  UploadImageRequestParams
} from 'src/app/shared/generated'
import { IconService } from 'src/app/shared/iconservice'
import { dropDownSortItemsByLabel, convertToUniqueStringArray } from 'src/app/shared/utils'
import { ChangeMode } from '../product-detail.component'

export interface ProductDetailForm {
  id: FormControl<string | null>
  name: FormControl<string | null>
  operator: FormControl<boolean | null>
  version: FormControl<string | null>
  description: FormControl<string | null>
  imageUrl: FormControl<string | null>
  basePath: FormControl<string | null>
  displayName: FormControl<string | null>
  iconName: FormControl<string | null>
  classifications: FormControl<string[] | null>
}

export function productNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value
    if (!value) return null
    return ['new', 'apps'].includes(value) ? { invalidProductName: true } : null
  }
}

@Component({
  selector: 'app-product-props',
  templateUrl: './product-props.component.html',
  styleUrls: ['./product-props.component.scss']
})
export class ProductPropertyComponent implements OnChanges, OnInit {
  @Input() product: Product | undefined
  @Input() dateFormat = 'medium'
  @Input() changeMode: ChangeMode = 'VIEW'
  @Output() productCreated = new EventEmitter<Product>()
  @Output() productChanged = new EventEmitter<boolean>()
  @Output() changeModeChange = new EventEmitter<ChangeMode>()
  public formGroup: FormGroup<ProductDetailForm>
  public productId: string | undefined
  public productName: string | null | undefined
  public fetchingLogoUrl: string | undefined
  public iconItems: SelectItem[] = [{ label: '', value: null }]
  public logoImageWasUploaded: boolean | undefined
  public convertToUniqueStringArray = convertToUniqueStringArray

  constructor(
    private icon: IconService,
    private elements: ElementRef,
    private productApi: ProductsAPIService,
    private imageApi: ImagesInternalAPIService,
    private msgService: PortalMessageService
  ) {
    this.formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl(null),
      name: new FormControl(null, [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(255),
        productNameValidator()
      ]),
      displayName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      operator: new FormControl(null),
      version: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      description: new FormControl(null, [Validators.maxLength(255)]),
      imageUrl: new FormControl(null, [Validators.maxLength(255)]),
      basePath: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      iconName: new FormControl(null, [Validators.maxLength(255)]),
      classifications: new FormControl(null, [Validators.maxLength(255)])
    })
    this.iconItems.push(...this.icon.icons.map((i) => ({ label: i, value: i })))
    this.iconItems.sort(dropDownSortItemsByLabel)
  }

  ngOnInit(): void {
    let productName = this.formGroup.controls['name'].value!
    if (!productName) {
      this.logoImageWasUploaded = false
    } else {
      this.imageApi.getImage({ refId: productName, refType: RefType.Logo }).subscribe(() => {
        this.logoImageWasUploaded = true
      })
    }
    this.fetchingLogoUrl = this.prepareImageUrl()
  }

  ngOnChanges(): void {
    if (this.product) {
      this.formGroup.patchValue({ ...this.product })
      this.productId = this.changeMode !== 'COPY' ? this.product.id : undefined
      this.productName = this.product.name // business key => manage the change!
    } else {
      this.formGroup.reset()
    }
    this.changeMode !== 'VIEW' ? this.formGroup.enable() : this.formGroup.disable()
    this.changeMode = this.changeMode === 'COPY' ? 'CREATE' : this.changeMode
    this.changeModeChange.emit(this.changeMode)
  }

  /** CREATE/UPDATE product
   */
  public onSave() {
    if (this.formGroup.valid) {
      this.changeMode === 'EDIT' ? this.updateProduct() : this.createProduct()
    } else {
      this.msgService.error({ summaryKey: 'VALIDATION.FORM_INVALID' })
      // set focus to first invalid field
      const invalidControl = this.elements.nativeElement.querySelector('input.ng-invalid')
      if (invalidControl) invalidControl.focus()
    }
  }

  private createProduct() {
    this.productApi
      .createProduct({
        createProductRequest: {
          name: this.formGroup.value['name'],
          version: this.formGroup.value['version'],
          description: this.formGroup.value['description'],
          imageUrl: this.formGroup.controls['imageUrl'].value,
          basePath: this.formGroup.value['basePath'],
          displayName: this.formGroup.value['displayName'],
          iconName: this.formGroup.value['iconName'],
          classifications: this.convertToUniqueStringArray(this.formGroup.value['classifications']?.toString())
        } as CreateProductRequest
      })
      .subscribe({
        next: (data) => {
          this.msgService.success({ summaryKey: 'ACTIONS.CREATE.PRODUCT.OK' })
          this.productCreated.emit(data)
        },
        error: (err) => this.displaySaveError(err)
      })
  }

  private updateProduct() {
    this.productApi
      .updateProduct({
        id: this.productId!,
        updateProductRequest: {
          name: this.formGroup.value['name'],
          version: this.formGroup.value['version'],
          description: this.formGroup.value['description'],
          imageUrl: this.formGroup.controls['imageUrl'].value,
          basePath: this.formGroup.value['basePath'],
          displayName: this.formGroup.value['displayName'],
          iconName: this.formGroup.value['iconName'],
          classifications: this.convertToUniqueStringArray(this.formGroup.value['classifications']?.toString())
        } as UpdateProductRequest
      })
      .subscribe({
        next: () => {
          this.msgService.success({ summaryKey: 'ACTIONS.EDIT.PRODUCT.OK' })
          this.productChanged.emit(this.productName !== this.formGroup.value['name'])
        },
        error: (err) => this.displaySaveError(err)
      })
  }

  private displaySaveError(err: any) {
    if (err.error?.errorCode === 'PERSIST_ENTITY_FAILED') {
      this.msgService.error({
        summaryKey: 'ACTIONS.' + this.changeMode + '.PRODUCT.NOK',
        detailKey: 'VALIDATION.PRODUCT.UNIQUE_CONSTRAINT'
      })
    } else {
      this.msgService.error({ summaryKey: 'ACTIONS.' + this.changeMode + '.PRODUCT.NOK' })
    }
  }

  /** File Handling
   */
  public onFileUpload(ev: Event, fieldType: 'logo'): void {
    let productName = this.formGroup.controls['name'].value
    if (ev.target && (ev.target as HTMLInputElement).files) {
      const files = (ev.target as HTMLInputElement).files
      if (files) {
        if (productName == undefined || productName == '' || productName == null) {
          this.msgService.error({ summaryKey: 'LOGO.UPLOAD_FAILED_NAME' })
        } else if (files[0].size > 110000) {
          this.msgService.error({ summaryKey: 'LOGO.UPLOAD_FAILED_SIZE' })
        } else {
          let requestParametersGet: GetImageRequestParams
          requestParametersGet = {
            refId: productName,
            refType: RefType.Logo
          }
          let requestParameters: UploadImageRequestParams
          const blob = new Blob([files[0]], { type: files[0].type })
          let imageType: RefType = RefType.Logo

          requestParameters = {
            contentLength: files.length,
            refId: this.formGroup.controls['name'].value!,
            refType: imageType,
            body: blob
          }

          this.fetchingLogoUrl = undefined

          this.imageApi.getImage(requestParametersGet).subscribe(
            (res) => {
              if (RegExp(/^.*.(jpg|jpeg|png)$/).exec(files[0].name)) {
                this.imageApi.updateImage(requestParameters).subscribe(() => {
                  this.fetchingLogoUrl =
                    this.imageApi.configuration.basePath + '/images/' + productName + '/' + fieldType
                  this.msgService.info({ summaryKey: 'LOGO.UPLOADED' })
                  this.formGroup.controls['imageUrl'].setValue('')
                  this.logoImageWasUploaded = true
                })
              }
            },
            (err) => {
              if (RegExp(/^.*.(jpg|jpeg|png)$/).exec(files[0].name)) {
                this.imageApi.uploadImage(requestParameters).subscribe(() => {
                  this.fetchingLogoUrl =
                    this.imageApi.configuration.basePath + '/images/' + productName + '/' + fieldType
                  this.msgService.info({ summaryKey: 'LOGO.UPLOADED' })
                  this.formGroup.controls['imageUrl'].setValue('')
                  this.logoImageWasUploaded = true
                })
              }
            }
          )
        }
      }
    }
  }

  prepareImageUrl(): string {
    let imgUrl = this.formGroup.controls['imageUrl'].value
    if (imgUrl == '' || imgUrl == null) {
      return this.imageApi.configuration.basePath + '/images/' + this.formGroup.controls['name'].value + '/logo'
    } else {
      return imgUrl
    }
  }

  inputChange(event: Event) {
    setTimeout(() => {
      this.fetchingLogoUrl = (event.target as HTMLInputElement).value
      if ((event.target as HTMLInputElement).value == undefined || (event.target as HTMLInputElement).value == '') {
        this.fetchingLogoUrl =
          this.imageApi.configuration.basePath + '/images/' + this.formGroup.controls['name'].value + '/logo'
      }
    }, 1000)
  }
}
