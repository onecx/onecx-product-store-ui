import { Component, Input, OnChanges } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

import { ProductAndWorkspaces } from 'src/app/shared/generated'

@Component({
  selector: 'app-product-intern',
  templateUrl: './product-intern.component.html'
})
export class ProductInternComponent implements OnChanges {
  @Input() product: ProductAndWorkspaces | undefined
  @Input() dateFormat = 'medium'
  public undeployed = false

  constructor(private translate: TranslateService) {}

  public ngOnChanges(): void {
    this.undeployed = this.product?.undeployed ? this.product?.undeployed : false
  }
}
