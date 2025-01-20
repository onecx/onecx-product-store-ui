import { Component, OnInit, ViewChild } from '@angular/core'
import { Location } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { catchError, Observable, of, finalize, map } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'

import { Action, PortalMessageService, UserService } from '@onecx/portal-integration-angular'
import { ImagesInternalAPIService, Product, ProductsAPIService, RefType } from 'src/app/shared/generated'
import { bffImageUrl } from 'src/app/shared/utils'
import { ProductPropertyComponent } from './product-props/product-props.component'

export type ChangeMode = 'VIEW' | 'CREATE' | 'EDIT' | 'COPY'

@Component({
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  public exceptionKey: string | undefined
  public loading = false
  public actions$: Observable<Action[]> | undefined
  public productName: string | null = null
  public product$!: Observable<Product>
  public item4Delete: Product | undefined
  public product_for_apps: Product | undefined
  public changeMode: ChangeMode = 'VIEW'
  public dateFormat = 'medium'
  public headerImageUrl?: string
  public productDeleteVisible = false
  public productDeleteMessage = ''
  public selectedTabIndex = 0
  public currentLogoUrl: string | undefined = undefined

  @ViewChild(ProductPropertyComponent, { static: false }) productPropsComponent!: ProductPropertyComponent

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
    this.dateFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'medium'
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
      this.preparePageAction()
    }
  }

  public onTabChange($event: any, product: Product) {
    this.selectedTabIndex = $event.index
    this.preparePageAction(product)
    if (this.selectedTabIndex === 3) this.product_for_apps = product // lazy load
  }

  public getProduct(): void {
    this.loading = true
    this.product$ = this.productApi.getProductByName({ name: this.productName! }).pipe(
      map((data: Product) => {
        this.preparePageAction(data)
        this.currentLogoUrl = this.getLogoUrl(data)
        return data
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
                this.selectedTabIndex === 0 &&
                this.changeMode === 'VIEW' &&
                product !== undefined &&
                !product.undeployed,
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
              actionCallback: () => this.onSave(),
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

  public close(): void {
    this.location.back()
  }
  public onClose() {
    this.close()
  }

  public onCopy(item: any): void {
    this.changeMode = 'COPY'
    this.preparePageAction(item)
  }
  public onEdit() {
    this.changeMode = 'EDIT'
    this.getProduct()
  }
  public onCancel(item: any) {
    if (this.changeMode === 'EDIT') {
      this.changeMode = 'VIEW'
      this.productPropsComponent.ngOnChanges()
      this.preparePageAction(item)
    }
    if (this.changeMode === 'COPY') this.close()
    if (this.changeMode === 'CREATE') this.close()
  }
  public onSave() {
    this.productPropsComponent.onSave()
  }

  public onRouteToCreatedProduct(product: any) {
    this.changeMode = 'VIEW'
    this.router.navigate(['../', product?.name], { relativeTo: this.route })
  }

  public onChange(product?: Product) {
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
          this.productDeleteVisible = false
          this.item4Delete = undefined
          this.msgService.success({ summaryKey: 'ACTIONS.DELETE.PRODUCT.OK' })
          this.close()
        },
        error: () => this.msgService.error({ summaryKey: 'ACTIONS.DELETE.PRODUCT.NOK' })
      })
    }
  }

  // called by props component (this is the master of this url)
  public onUpdateLogoUrl(url: string) {
    this.currentLogoUrl = url
  }

  public getLogoUrl(product: Product): string {
    if (product?.imageUrl) return product?.imageUrl
    else return bffImageUrl(this.imageApi.configuration.basePath, product?.name, RefType.Logo)
  }
}
