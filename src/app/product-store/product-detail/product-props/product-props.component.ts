import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { TranslateService } from '@ngx-translate/core'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import { CreateProductRequest, Product, ProductsAPIService, UpdateProductRequest } from '../../../generated'

interface ProductDetailForm {
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

@Component({
  selector: 'ps-product-props',
  templateUrl: './product-props.component.html'
})
export class ProductPropertyComponent implements OnChanges {
  @Input() product: Product | undefined
  @Input() dateFormat = 'medium'
  @Input() changeMode = 'VIEW'
  @Output() productCreated = new EventEmitter<Product>()
  @Output() productNameChanged = new EventEmitter<boolean>()
  public formGroup: FormGroup<ProductDetailForm>
  public productId: string | undefined
  public productName: string | null | undefined

  constructor(
    private productApi: ProductsAPIService,
    private translate: TranslateService,
    private msgService: PortalMessageService
  ) {
    this.formGroup = new FormGroup<ProductDetailForm>({
      id: new FormControl(null),
      name: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      displayName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      operator: new FormControl(null, [Validators.maxLength(255)]),
      version: new FormControl(null, [Validators.maxLength(255)]),
      description: new FormControl(null, [Validators.maxLength(255)]),
      imageUrl: new FormControl(null, [Validators.maxLength(255)]),
      basePath: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      iconName: new FormControl(null, [Validators.maxLength(255)]),
      classifications: new FormControl(null, [Validators.maxLength(255)])
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.product) {
      this.formGroup.patchValue({
        ...this.product
      })
      this.productId = this.product.id
      this.productName = this.product.name
    } else this.formGroup.reset()
    this.changeMode !== 'VIEW' ? this.formGroup.enable() : this.formGroup.disable()
  }

  public onSubmit() {
    if (this.formGroup.valid) {
      this.changeMode === 'NEW' ? this.createProduct() : this.updateProduct()
    } else {
      this.msgService.error({ summaryKey: 'VALIDATION.FORM_INVALID' })
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
          classifications: []
        } as CreateProductRequest
      })
      .subscribe({
        next: (data) => {
          this.msgService.success({ summaryKey: 'ACTIONS.CREATE.MESSAGE.PRODUCT_OK' })
          this.productCreated.emit(data)
        },
        error: (err) => {
          err.error.key && err.error.key === 'PERSIST_ENTITY_FAILED'
            ? this.msgService.error({
                summaryKey: 'ACTIONS.CREATE.MESSAGE.PRODUCT_NOK',
                detailKey: 'VALIDATION.PRODUCT.UNIQUE_CONSTRAINT'
              })
            : this.msgService.error({ summaryKey: 'ACTIONS.CREATE.MESSAGE.PRODUCT_NOK' })
        }
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
          classifications: []
        } as UpdateProductRequest
      })
      .subscribe({
        next: (data) => {
          this.msgService.success({ summaryKey: 'ACTIONS.EDIT.MESSAGE.PRODUCT_OK' })
          console.log('data', data)
          this.productNameChanged.emit(this.productName !== this.formGroup.value['name'])
        },
        error: (err) => {
          err.error.key && err.error.key === 'PERSIST_ENTITY_FAILED'
            ? this.msgService.error({
                summaryKey: 'ACTIONS.EDIT.MESSAGE.PRODUCT_NOK',
                detailKey: 'VALIDATION.PRODUCT.UNIQUE_CONSTRAINT'
              })
            : this.msgService.error({ summaryKey: 'ACTIONS.EDIT.MESSAGE.PRODUCT_NOK' })
        }
      })
  }
}
