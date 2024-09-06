import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core'
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'
import { SelectItem } from 'primeng/api'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import {
  CreateProductRequest,
  ImagesInternalAPIService,
  Product,
  ProductsAPIService,
  RefType,
  UpdateProductRequest
} from 'src/app/shared/generated'
import { IconService } from 'src/app/shared/iconservice'
import { bffImageUrl, dropDownSortItemsByLabel, convertToUniqueStringArray } from 'src/app/shared/utils'
import { ChangeMode } from '../product-detail.component'

export interface ProductDetailForm {
  id: FormControl<string | null>
  name: FormControl<string | null>
  version: FormControl<string | null>
  description: FormControl<string | null>
  provider: FormControl<string | null>
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
  @Output() productChanged = new EventEmitter()
  @Output() changeModeChange = new EventEmitter<ChangeMode>()
  @Output() currentLogoUrl = new EventEmitter<string>()

  public formGroup: FormGroup<ProductDetailForm>
  public productId: string | undefined
  public productName: string | null | undefined
  public fetchingLogoUrl: string | undefined
  public iconItems: SelectItem[] = []
  public externUrlPattern = 'http(s)://path-to-image'
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
      version: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      description: new FormControl(null, [Validators.maxLength(255)]),
      provider: new FormControl(null, [Validators.maxLength(255)]),
      imageUrl: new FormControl(null, [Validators.maxLength(255)]),
      basePath: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      iconName: new FormControl(null, [Validators.maxLength(255)]),
      classifications: new FormControl(null, [Validators.maxLength(255)])
    })
    this.iconItems.push(...this.icon.icons.map((i) => ({ label: i, value: i })))
    this.iconItems.sort(dropDownSortItemsByLabel)
  }

  ngOnInit(): void {
    if (this.changeMode === 'EDIT') {
      this.formGroup.controls['name'].disable()
    }
  }

  ngOnChanges(): void {
    if (this.product) {
      this.formGroup.patchValue({ ...this.product })
      this.productId = this.changeMode !== 'COPY' ? this.product.id : undefined
      this.productName = this.product.name // business key => manage the change!
      this.fetchingLogoUrl = this.getLogoUrl(this.product)
    } else {
      this.formGroup.reset()
      this.fetchingLogoUrl = undefined
    }
    this.currentLogoUrl.emit(this.fetchingLogoUrl)
    // mode
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
          provider: this.formGroup.value['provider'],
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
          name: this.productName,
          version: this.formGroup.value['version'],
          description: this.formGroup.value['description'],
          provider: this.formGroup.value['provider'],
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
          this.productChanged.emit()
        },
        error: (err) => this.displaySaveError(err)
      })
  }

  private displaySaveError(err: any) {
    if (err.error?.errorCode === 'PERSIST_ENTITY_FAILED') {
      this.msgService.error({
        summaryKey: 'ACTIONS.' + this.changeMode + '.PRODUCT.NOK',
        detailKey:
          'VALIDATION.PRODUCT.UNIQUE_CONSTRAINT.' +
          (err.error?.detail.indexOf('ui_product_base_path') > 0 ? 'BASEPATH' : 'NAME')
      })
    } else {
      this.msgService.error({ summaryKey: 'ACTIONS.' + this.changeMode + '.PRODUCT.NOK' })
    }
  }

  /** File Handling
   */
  public onFileUpload(ev: Event): void {
    const workspaceName = this.formGroup.controls['name'].value
    if (!workspaceName || workspaceName === '') {
      this.msgService.error({
        summaryKey: 'IMAGE.CONSTRAINT_FAILED',
        detailKey: 'IMAGE.CONSTRAINT_NAME'
      })
      return
    }
    if (ev.target && (ev.target as HTMLInputElement).files) {
      const files = (ev.target as HTMLInputElement).files
      if (files) {
        if (files[0].size > 100000) {
          this.msgService.error({
            summaryKey: 'IMAGE.CONSTRAINT_FAILED',
            detailKey: 'IMAGE.CONSTRAINT_SIZE'
          })
        } else if (!/^.*.(jpg|jpeg|png)$/.exec(files[0].name)) {
          this.msgService.error({
            summaryKey: 'IMAGE.CONSTRAINT_FAILED',
            detailKey: 'IMAGE.CONSTRAINT_FILE_TYPE'
          })
        } else {
          this.saveImage(workspaceName, files) // store image
        }
      }
    } else {
      this.msgService.error({
        summaryKey: 'IMAGE.CONSTRAINT_FAILED',
        detailKey: 'IMAGE.CONSTRAINT_FILE_MISSING'
      })
    }
  }

  private saveImage(name: string, files: FileList) {
    const blob = new Blob([files[0]], { type: files[0].type })
    this.fetchingLogoUrl = undefined // reset - important to trigger the change in UI
    this.currentLogoUrl.emit(this.fetchingLogoUrl)
    const saveRequestParameter = {
      contentLength: files.length,
      refId: name,
      refType: RefType.Logo,
      body: blob
    }
    this.imageApi.getImage({ refId: name, refType: RefType.Logo }).subscribe(
      () => {
        this.imageApi.updateImage(saveRequestParameter).subscribe(() => {
          this.prepareImageResponse(name)
        })
      },
      (err) => {
        this.imageApi.uploadImage(saveRequestParameter).subscribe(() => {
          this.prepareImageResponse(name)
        })
      }
    )
  }
  private prepareImageResponse(name: string): void {
    this.fetchingLogoUrl = bffImageUrl(this.imageApi.configuration.basePath, name, RefType.Logo)
    this.currentLogoUrl.emit(this.fetchingLogoUrl)
    this.msgService.info({ summaryKey: 'IMAGE.UPLOAD_SUCCESS' })
    this.formGroup.controls['imageUrl'].setValue('')
  }

  public getLogoUrl(product: Product | undefined): string | undefined {
    if (!product) {
      return undefined
    }
    if (product.imageUrl && product.imageUrl != '') {
      return product.imageUrl
    }
    return bffImageUrl(this.imageApi.configuration.basePath, product.name, RefType.Logo)
  }

  // changes on external log URL field: user enters text (change) or paste something
  public onInputChange(product: Product | undefined, event: Event): void {
    this.fetchingLogoUrl = (event.target as HTMLInputElement).value
    if (!this.fetchingLogoUrl || this.fetchingLogoUrl === '') {
      this.fetchingLogoUrl = bffImageUrl(this.imageApi.configuration.basePath, product?.name, RefType.Logo)
    }
    this.currentLogoUrl.emit(this.fetchingLogoUrl)
  }
}
