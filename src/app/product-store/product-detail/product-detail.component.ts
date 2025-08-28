import { Component, OnInit, ViewChild } from '@angular/core'
import { Location } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { catchError, Observable, of, finalize, map } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'

import { PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import { Action } from '@onecx/angular-accelerator'

import {
  CreateProductRequest,
  ImagesInternalAPIService,
  Product,
  ProductsAPIService,
  RefType,
  UpdateProductRequest
} from 'src/app/shared/generated'
import { bffImageUrl, sortByLocale } from 'src/app/shared/utils'
import { ProductPropertyComponent } from './product-props/product-props.component'
import { ProductInternComponent } from './product-intern/product-intern.component'

export type ChangeMode = 'VIEW' | 'CREATE' | 'EDIT' | 'COPY'

@Component({
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  // dialog
  public exceptionKey: string | undefined
  public loading = false
  public actions$: Observable<Action[]> | undefined
  public changeMode: ChangeMode = 'VIEW'
  public dateFormat = 'medium'
  public uriFragment = this.route.snapshot.fragment // #fragment to address a certain TAB
  public productName: string | null = null
  public productId: string | undefined
  public headerImageUrl?: string
  public productDeleteVisible = false
  public productDeleteMessage = ''
  public selectedTabIndex = 0
  public currentLogoUrl: string | undefined = undefined
  // data
  public product$: Observable<Product | undefined> = of(undefined)
  public item4Delete: Product | undefined
  public product_for_apps: Product | undefined

  @ViewChild(ProductPropertyComponent, { static: false }) productPropsComponent!: ProductPropertyComponent
  @ViewChild(ProductInternComponent, { static: false }) productInternComponent!: ProductInternComponent

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly user: UserService,
    private readonly location: Location,
    private readonly productApi: ProductsAPIService,
    private readonly imageApi: ImagesInternalAPIService,
    private readonly msgService: PortalMessageService,
    private readonly translate: TranslateService
  ) {
    this.dateFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'M/d/yy, hh:mm:ss a'
    this.productName = this.route.snapshot.paramMap.get('name')
  }

  ngOnInit(): void {
    this.item4Delete = undefined
    if (this.productName) {
      this.changeMode = 'VIEW'
      this.getProduct()
    } else {
      this.changeMode = 'CREATE'
      this.product$ = of({} as Product)
      this.preparePageAction() // neutral
    }
  }

  // triggered by URI
  private goToTab(product: Product | undefined) {
    if (product && this.uriFragment) {
      const tabMap = new Map([
        ['props', 0],
        ['apps', 1],
        ['use', 2]
      ])
      this.onTabChange({ index: tabMap.get(this.uriFragment) }, product)
    }
  }
  public onTabChange($event: any, product: Product) {
    this.selectedTabIndex = $event.index
    this.preparePageAction(product)
    if (this.selectedTabIndex === 1) this.product_for_apps = product // lazy load
  }

  /** READ */
  private getProduct(): void {
    this.loading = true
    this.product$ = this.productApi.getProductByName({ name: this.productName! }).pipe(
      map((data: Product) => {
        this.preparePageAction(data)
        this.productId = data.id
        this.currentLogoUrl = this.getLogoUrl(data)
        this.goToTab(data)
        return { ...data, classifications: data.classifications?.sort(sortByLocale) }
      }),
      catchError((err) => {
        this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.PRODUCT'
        console.error('getProductByName', err)
        return of({} as Product)
      }),
      finalize(() => (this.loading = false))
    )
  }

  public preparePageAction(product?: Product): void {
    this.actions$ = this.translate
      .get([
        'ACTIONS.COPY.LABEL',
        'ACTIONS.COPY.PRODUCT.HEADER',
        'ACTIONS.DELETE.LABEL',
        'ACTIONS.DELETE.PRODUCT.TOOLTIP',
        'ACTIONS.DELETE.MESSAGE',
        'ACTIONS.EDIT.LABEL',
        'ACTIONS.EDIT.PRODUCT.TOOLTIP',
        'ACTIONS.CANCEL',
        'ACTIONS.TOOLTIPS.CANCEL',
        'ACTIONS.SAVE',
        'ACTIONS.TOOLTIPS.SAVE',
        'ACTIONS.NAVIGATION.BACK',
        'ACTIONS.NAVIGATION.BACK.TOOLTIP'
      ])
      .pipe(
        map((data) => {
          return [
            {
              label: data['ACTIONS.NAVIGATION.BACK'],
              title: data['ACTIONS.NAVIGATION.BACK.TOOLTIP'],
              actionCallback: () => this.onClose(),
              icon: 'pi pi-arrow-left',
              show: 'always',
              conditional: true,
              showCondition: product && this.changeMode === 'VIEW'
            },
            {
              label: data['ACTIONS.EDIT.LABEL'],
              title: data['ACTIONS.EDIT.PRODUCT.TOOLTIP'],
              actionCallback: () => this.onEdit(),
              icon: 'pi pi-pencil',
              show: 'always',
              conditional: true,
              showCondition:
                [0, 3].includes(this.selectedTabIndex) && this.changeMode === 'VIEW' && product !== undefined,
              permission: 'PRODUCT#EDIT'
            },
            {
              label: data['ACTIONS.CANCEL'],
              title: data['ACTIONS.TOOLTIPS.CANCEL'],
              actionCallback: () => this.onCancel(product),
              icon: 'pi pi-times',
              show: 'always',
              conditional: true,
              showCondition: this.changeMode !== 'VIEW'
            },
            {
              label: data['ACTIONS.SAVE'],
              title: data['ACTIONS.TOOLTIPS.SAVE'],
              actionCallback: () => this.onSaveProduct(),
              icon: 'pi pi-save',
              show: 'always',
              conditional: true,
              showCondition: this.changeMode !== 'VIEW',
              permission: 'PRODUCT#EDIT'
            },
            {
              label: data['ACTIONS.COPY.LABEL'],
              title: data['ACTIONS.COPY.PRODUCT.HEADER'],
              actionCallback: () => this.onCopy(product),
              icon: 'pi pi-copy',
              show: 'asOverflow',
              conditional: true,
              showCondition: this.selectedTabIndex === 0 && this.changeMode === 'VIEW' && product !== undefined,
              permission: 'PRODUCT#CREATE'
            },
            {
              label: data['ACTIONS.DELETE.LABEL'],
              title: data['ACTIONS.DELETE.PRODUCT.TOOLTIP'],
              actionCallback: () => this.onDelete(product),
              icon: 'pi pi-trash',
              show: 'asOverflow',
              conditional: true,
              showCondition: this.changeMode === 'VIEW' && product !== undefined,
              permission: 'PRODUCT#DELETE'
            }
          ]
        })
      )
  }

  public onClose() {
    this.location.back()
  }

  /** CHANGE entry action */
  public onCopy(product: any): void {
    this.changeMode = 'COPY'
    this.preparePageAction(product)
  }
  public onEdit() {
    this.changeMode = 'EDIT'
    this.getProduct()
  }

  /** CHANGE leave action */
  public onCancel(product?: Product) {
    if (this.changeMode === 'EDIT') {
      this.changeMode = 'VIEW'
      this.preparePageAction(product)
    }
    if (['COPY', 'CREATE'].includes(this.changeMode)) this.onClose()
  }
  public onSaveProduct() {
    const internals = this.productInternComponent.onSave()
    const props = this.productPropsComponent.onSave()
    if (props && internals)
      this.changeMode === 'EDIT' ? this.updateProduct(props, internals) : this.createProduct(props, internals)
  }

  /** CHANGE execute */
  private updateProduct(props: Partial<Product>, internals: Partial<Product>) {
    if (this.productId)
      this.productApi
        .updateProduct({
          id: this.productId,
          // props does not contain the name because it is not changable
          updateProductRequest: { ...props, ...internals, name: this.productName } as UpdateProductRequest
        })
        .subscribe({
          next: (data) => {
            this.msgService.success({ summaryKey: 'ACTIONS.EDIT.PRODUCT.OK' })
            this.cleanupAfterDataChanged(data)
          },
          error: (err) => this.displaySaveError(err)
        })
  }
  private createProduct(props: Partial<Product>, internals: Partial<Product>) {
    this.changeMode = 'CREATE'
    this.productApi
      .createProduct({
        createProductRequest: { ...props, ...internals } as CreateProductRequest
      })
      .subscribe({
        next: (data) => {
          this.msgService.success({ summaryKey: 'ACTIONS.CREATE.PRODUCT.OK' })
          this.router.navigate(['../', data?.name], { relativeTo: this.route })
          this.cleanupAfterDataChanged(data)
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

  private cleanupAfterDataChanged(product: Product) {
    this.changeMode = 'VIEW'
    this.preparePageAction(product)
    // update observable with response data
    this.product$ = new Observable((sub) => sub.next(product as Product))
  }

  public onDelete(product?: Product): void {
    this.item4Delete = product
    this.productDeleteVisible = true
  }
  public onDeleteConfirmation(): void {
    if (this.item4Delete?.id) {
      this.productApi.deleteProduct({ id: this.item4Delete?.id }).subscribe({
        next: () => {
          this.msgService.success({ summaryKey: 'ACTIONS.DELETE.PRODUCT.OK' })
          this.router.navigate(['../'], { relativeTo: this.route })
        },
        error: () => this.msgService.error({ summaryKey: 'ACTIONS.DELETE.PRODUCT.NOK' })
      })
    }
  }

  private getLogoUrl(product: Product): string {
    if (product?.imageUrl) return product?.imageUrl
    else return bffImageUrl(this.imageApi.configuration.basePath, product?.name, RefType.Logo)
  }
}
