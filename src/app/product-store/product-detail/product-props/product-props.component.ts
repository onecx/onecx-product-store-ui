import { Component, ElementRef, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'
import { SelectItem } from 'primeng/api'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import { CreateProductRequest, Product, ProductsAPIService, UpdateProductRequest } from '../../../generated'
import { IconService } from '../../../shared/iconservice'
import { dropDownSortItemsByLabel } from 'src/app/shared/utils'

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
export class ProductPropertyComponent implements OnChanges {
  @Input() product: Product | undefined
  @Input() dateFormat = 'medium'
  @Input() changeMode = 'VIEW'
  @Output() productCreated = new EventEmitter<Product>()
  @Output() productChanged = new EventEmitter<boolean>()
  public formGroup: FormGroup<ProductDetailForm>
  public productId: string | undefined
  public productName: string | null | undefined
  public fetchingLogoUrl: string | undefined
  public iconItems: SelectItem[] = [{ label: '', value: null }]
  //private productNamePattern = '^(?!new$)(.*)$' // matching for valid product names

  constructor(
    private icon: IconService,
    private elements: ElementRef,
    private productApi: ProductsAPIService,
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

  ngOnChanges(): void {
    if (this.product) {
      this.formGroup.patchValue({
        ...this.product
      })
      this.productId = this.product.id
      this.productName = this.product.name // business key => manage the change!
    } else {
      this.formGroup.reset()
    }
    this.changeMode !== 'VIEW' ? this.formGroup.enable() : this.formGroup.disable()
  }

  /** CREATE/UPDATE product
   */
  public onSubmit() {
    if (this.formGroup.valid) {
      this.changeMode === 'CREATE' ? this.createProduct() : this.updateProduct()
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
          imageUrl: this.formGroup.value['imageUrl'],
          basePath: this.formGroup.value['basePath'],
          displayName: this.formGroup.value['displayName'],
          iconName: this.formGroup.value['iconName'],
          classifications: this.formGroup.value['classifications']?.toString().split(',')
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
          imageUrl: this.formGroup.value['imageUrl'],
          basePath: this.formGroup.value['basePath'],
          displayName: this.formGroup.value['displayName'],
          iconName: this.formGroup.value['iconName'],
          classifications: this.formGroup.value['classifications']?.toString().split(',')
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
    if (err.error?.errorCode === 'MERGE_ENTITY_FAILED') {
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
    if (ev.target && (ev.target as HTMLInputElement).files) {
      const files = (ev.target as HTMLInputElement).files
      if (files) {
        Array.from(files).forEach((file) => {
          /*
          this.imageApi.uploadImage({ image: file }).subscribe((data) => {
            this.formGroup.controls[fieldType + 'Url'].setValue(data.imageUrl)
            this.fetchingLogoUrl = setFetchUrls(this.apiPrefix, this.formGroup.controls[fieldType + 'Url'].value)
            this.msgService.info({ summaryKey: 'LOGO.UPLOADED', detailKey: 'LOGO.LOGO_URL' })
          })
          */
        })
      }
    }
  }
}
