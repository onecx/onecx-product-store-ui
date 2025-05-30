import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core'
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'
import { SelectItem } from 'primeng/api'
import { map, of, Observable, catchError } from 'rxjs'

import { PortalMessageService } from '@onecx/portal-integration-angular'
import {
  CreateProductRequest,
  ImagesInternalAPIService,
  Product,
  ProductCriteria,
  ProductsAPIService,
  RefType,
  UpdateProductRequest
} from 'src/app/shared/generated'
import { IconService } from 'src/app/shared/iconservice'
import { bffImageUrl, dropDownSortItemsByLabel, convertToUniqueStringArray, sortByLocale } from 'src/app/shared/utils'
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
  templateUrl: './product-props.component.html'
})
export class ProductPropertyComponent implements OnChanges, OnInit {
  @Input() product: Product | undefined
  @Input() dateFormat = 'medium'
  @Input() changeMode: ChangeMode = 'VIEW'
  @Output() productCreated = new EventEmitter<Product>()
  @Output() productChanged = new EventEmitter<Product>()
  @Output() changeModeChange = new EventEmitter<ChangeMode>()
  @Output() currentLogoUrl = new EventEmitter<string>()

  public criteria$!: Observable<ProductCriteria>
  public formGroup: FormGroup<ProductDetailForm>
  public productId: string | undefined
  public productName: string | null | undefined
  public fetchingImageUrl: string | undefined
  public onImageLoadError = false
  public iconItems: SelectItem[] = []
  public externUrlPattern = 'http(s)://path-to-image'
  public providerFiltered: string[] = []
  public classesFiltered: string[] = []

  constructor(
    private readonly icon: IconService,
    private readonly elements: ElementRef,
    private readonly productApi: ProductsAPIService,
    private readonly imageApi: ImagesInternalAPIService,
    private readonly msgService: PortalMessageService
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

  public ngOnInit(): void {
    if (this.changeMode === 'EDIT') {
      this.formGroup.controls['name'].disable()
    }
  }

  public ngOnChanges(): void {
    this.getCriteria()
    if (this.product) {
      this.formGroup.patchValue({ ...this.product })
      this.productId = this.changeMode !== 'COPY' ? this.product.id : undefined
      this.productName = this.product.name // business key => manage the change!
      this.fetchingImageUrl = this.product.imageUrl
      if (!this.fetchingImageUrl || this.fetchingImageUrl === '') this.prepareImageUrl(this.product.name)
    } else {
      this.formGroup.reset()
      this.fetchingImageUrl = undefined
    }
    this.currentLogoUrl.emit(this.fetchingImageUrl)
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
          displayName: this.formGroup.value['displayName'],
          provider: this.formGroup.value['provider'],
          basePath: this.formGroup.value['basePath'],
          iconName: this.formGroup.value['iconName'],
          imageUrl: this.formGroup.controls['imageUrl'].value,
          classifications: convertToUniqueStringArray(this.formGroup.value['classifications'])
        } as CreateProductRequest
      })
      .subscribe({
        next: (data) => {
          this.msgService.success({ summaryKey: 'ACTIONS.CREATE.PRODUCT.OK' })
          this.productCreated.emit({ ...data, classifications: data.classifications?.sort(sortByLocale) })
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
          modificationCount: this.product?.modificationCount,
          version: this.formGroup.value['version'],
          description: this.formGroup.value['description'],
          provider: this.formGroup.value['provider'],
          imageUrl: this.formGroup.controls['imageUrl'].value,
          basePath: this.formGroup.value['basePath'],
          displayName: this.formGroup.value['displayName'],
          iconName: this.formGroup.value['iconName'],
          classifications: convertToUniqueStringArray(this.formGroup.value['classifications'])
        } as UpdateProductRequest
      })
      .subscribe({
        next: (data) => {
          this.msgService.success({ summaryKey: 'ACTIONS.EDIT.PRODUCT.OK' })
          this.productChanged.emit({ ...data, classifications: data.classifications?.sort(sortByLocale) })
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
        if (files[0].size > 200000) {
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

  /**
   * IMAGE
   */
  private saveImage(name: string, files: FileList) {
    const blob = new Blob([files[0]], { type: files[0].type })
    this.prepareImageUrl() // reset - important to trigger the change in UI
    this.currentLogoUrl.emit(this.fetchingImageUrl)
    const saveRequestParameter = {
      contentLength: files.length,
      refId: name,
      refType: RefType.Logo,
      body: blob
    }
    this.imageApi.uploadImage(saveRequestParameter).subscribe(() => {
      this.prepareImageUrl(name)
      this.msgService.success({ summaryKey: 'IMAGE.UPLOAD_SUCCESS' })
      this.currentLogoUrl.emit(this.fetchingImageUrl)
    })
  }

  public onRemoveLogo() {
    const productName = this.formGroup.controls['name'].value
    if (productName) {
      if (this.formGroup.get('imageUrl')?.value) {
        this.formGroup.get('imageUrl')?.setValue(null)
        this.prepareImageUrl(productName)
      } else {
        this.imageApi.deleteImage({ refId: productName, refType: RefType.Logo }).subscribe({
          next: () => {
            this.prepareImageUrl() // reset - important to trigger the change in UI
            this.currentLogoUrl.emit(this.fetchingImageUrl)
            this.msgService.success({ summaryKey: 'IMAGE.REMOVE_SUCCESS' })
            if (!this.formGroup.get('imageUrl')?.value) this.onImageLoadError = true
          },
          error: (err) => {
            console.error('deleteImage', err)
          }
        })
      }
    }
  }
  private prepareImageUrl(name?: string): void {
    this.onImageLoadError = false // reset!
    this.fetchingImageUrl = name ? bffImageUrl(this.imageApi.configuration.basePath, name, RefType.Logo) : undefined
  }

  // changes on external log URL field: user enters text (change) or paste something
  public onInputChange(product: Product | undefined, event: Event): void {
    this.onImageLoadError = false // reset!
    this.fetchingImageUrl = (event.target as HTMLInputElement).value
    if (!this.fetchingImageUrl || this.fetchingImageUrl === '') {
      this.prepareImageUrl(product?.name)
    }
    this.currentLogoUrl.emit(this.fetchingImageUrl)
  }

  /**
   * CRITERIA
   */
  private getCriteria(): void {
    this.criteria$ = this.productApi.getProductSearchCriteria().pipe(
      map((data: ProductCriteria) => ({
        providers: data.providers?.sort(sortByLocale),
        classifications: data.classifications?.sort(sortByLocale)
      })),
      catchError((err) => {
        console.error('getProductSearchCriteria', err)
        return of({ providers: [], classifications: [] })
      })
    )
  }

  /**
   * FILTER for Autocomplete fields: providers, classifications
   */
  public filterProviders(event: { query: string }, providers?: string[]) {
    if (!providers) {
      this.providerFiltered = []
      return
    }
    const query = event.query.toLowerCase()
    this.providerFiltered = providers.filter((p) => p.toLowerCase().includes(query))
    this.providerFiltered.sort(sortByLocale)
  }
  public filterClasses(event: { query: string }, classifications?: string[]) {
    if (!classifications) {
      this.classesFiltered = []
      return
    }
    const query = event.query.toLowerCase()
    const filtered = classifications.filter((p) => p.toLowerCase().includes(query))
    // in case not found then add this to the list (to be a new item)
    this.classesFiltered = filtered.length > 0 ? filtered : [event.query]
    this.classesFiltered.sort(sortByLocale)
  }
}
