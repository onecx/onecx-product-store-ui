import { Component, OnInit, ViewChild } from '@angular/core'
import { Location } from '@angular/common'
//import { DatePipe } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { Observable, finalize, map } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'

import { Action, PortalMessageService, UserService } from '@onecx/portal-integration-angular'
import { Product, ProductsAPIService } from 'src/app/shared/generated'
import { prepareUrl } from 'src/app/shared/utils'
import { ProductPropertyComponent } from './product-props/product-props.component'

export type ChangeMode = 'VIEW' | 'CREATE' | 'EDIT' | 'COPY'

@Component({
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  @ViewChild(ProductPropertyComponent, { static: false }) productPropsComponent!: ProductPropertyComponent

  public actions$: Observable<Action[]> | undefined
  public productName: string
  public product: Product | undefined
  //  usedInWorkspace: Workspace[] | undefined
  public changeMode: ChangeMode = 'CREATE'
  public loading = false
  public dateFormat = 'medium'
  public actions: Action[] = []
  public headerImageUrl?: string
  public productDeleteVisible = false
  public productDeleteMessage = ''

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private user: UserService,
    private location: Location,
    private productApi: ProductsAPIService,
    private msgService: PortalMessageService,
    private translate: TranslateService
  ) {
    this.dateFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'medium'
    this.productName = this.route.snapshot.paramMap.get('name') || ''
  }

  ngOnInit(): void {
    if (this.productName !== '') {
      this.changeMode = 'VIEW'
      this.getProduct()
    } else {
      this.product = undefined
      this.prepareActionButtons()
    }
  }

  public getProduct() {
    this.loading = true
    this.productApi
      .getProductByName({ name: this.productName })
      .pipe(
        finalize(() => {
          this.loading = false
        })
      )
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.product = data
            this.prepareActionButtons()
            this.headerImageUrl = prepareUrl(this.product?.imageUrl)
            //this.usedInWorkspace = data.workspaces
          }
        }
      })
  }

  private prepareActionButtons(): void {
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
              showCondition: this.changeMode === 'VIEW'
            },
            {
              label: data['ACTIONS.EDIT.LABEL'],
              title: data['ACTIONS.EDIT.PRODUCT.TOOLTIP'],
              actionCallback: () => this.onEdit(),
              icon: 'pi pi-pencil',
              show: 'always',
              conditional: true,
              showCondition: this.changeMode === 'VIEW' && this.product !== undefined,
              permission: 'PRODUCT#EDIT'
            },
            {
              label: data['ACTIONS.COPY.LABEL'],
              title: data['ACTIONS.COPY.PRODUCT.HEADER'],
              actionCallback: () => this.onCopy(),
              icon: 'pi pi-copy',
              show: 'always',
              conditional: true,
              showCondition: this.changeMode === 'VIEW' && this.product !== undefined,
              permission: 'PRODUCT#CREATE'
            },
            {
              label: data['ACTIONS.CANCEL'],
              title: data['ACTIONS.TOOLTIPS.CANCEL'],
              actionCallback: () => this.onCancel(),
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
              label: data['ACTIONS.DELETE.LABEL'],
              title: data['ACTIONS.DELETE.PRODUCT.TOOLTIP'],
              actionCallback: () => {
                this.productDeleteMessage = data['ACTIONS.DELETE.MESSAGE'].replace('{{ITEM}}', this.product?.name)
                this.productDeleteVisible = true
              },
              icon: 'pi pi-trash',
              show: 'asOverflow',
              conditional: true,
              showCondition: this.changeMode === 'VIEW' && this.product !== undefined,
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

  public onCopy(): void {
    this.changeMode = 'COPY'
    this.prepareActionButtons()
  }
  public onEdit() {
    this.changeMode = 'EDIT'
    this.getProduct()
  }
  public onCancel() {
    if (this.changeMode === 'EDIT') {
      this.changeMode = 'VIEW'
      this.getProduct()
    }
    if (this.changeMode === 'COPY') this.close()
    if (this.changeMode === 'CREATE') this.close()
  }
  public onSave() {
    this.productPropsComponent.onSubmit()
  }

  public onCreate(data: any) {
    this.product = data
    this.changeMode = 'VIEW'
    this.router.navigate(['./../', this.product?.name], { relativeTo: this.route })
  }

  public onChange(nameChanged: boolean) {
    if (nameChanged) {
      this.close()
    } else {
      this.changeMode = 'VIEW'
      this.getProduct()
    }
  }

  public onDelete(ev: MouseEvent, item: Product): void {
    ev.stopPropagation()
    this.product = item
    this.productDeleteVisible = true
  }
  public onDeleteConfirmation(): void {
    if (this.product?.id) {
      this.productApi.deleteProduct({ id: this.product?.id }).subscribe({
        next: () => {
          this.productDeleteVisible = false
          this.product = undefined
          this.msgService.success({ summaryKey: 'ACTIONS.DELETE.PRODUCT.OK' })
          this.close()
        },
        error: () => this.msgService.error({ summaryKey: 'ACTIONS.DELETE.PRODUCT.NOK' })
      })
    }
  }
}
