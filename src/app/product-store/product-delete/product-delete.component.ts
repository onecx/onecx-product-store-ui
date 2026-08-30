import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'

import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { TooltipModule } from 'primeng/tooltip'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Product, ProductsAPIService } from 'src/app/shared/generated'

@Component({
  selector: 'app-product-delete',
  standalone: true,
  imports: [ButtonModule, DialogModule, TooltipModule, TranslateModule],
  templateUrl: './product-delete.component.html',
  styleUrls: ['./product-delete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDeleteComponent {
  private readonly productApi = inject(ProductsAPIService)
  private readonly msgService = inject(PortalMessageService)

  public readonly product = input<Product>()
  public readonly displayDialog = input(false)
  public readonly productDeleted = output<boolean>()

  public onDialogHide(): void {
    this.productDeleted.emit(false)
  }

  public onConfirmDeletion(): void {
    const id = this.product()?.id
    if (id) {
      this.productApi.deleteProduct({ id }).subscribe({
        next: () => {
          this.msgService.success({ summaryKey: 'ACTIONS.DELETE.PRODUCT.OK' })
          this.productDeleted.emit(true)
        },
        error: () => this.msgService.error({ summaryKey: 'ACTIONS.DELETE.PRODUCT.NOK' })
      })
    }
  }
}
