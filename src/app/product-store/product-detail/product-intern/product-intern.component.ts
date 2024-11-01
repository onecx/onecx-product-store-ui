import { Component, Input, OnChanges } from '@angular/core'

import { Product } from 'src/app/shared/generated'

@Component({
  selector: 'app-product-intern',
  templateUrl: './product-intern.component.html'
})
export class ProductInternComponent implements OnChanges {
  @Input() product: Product | undefined
  @Input() dateFormat = 'medium'

  public operator = false
  public undeployed = false

  public ngOnChanges(): void {
    if (this.product) {
      this.operator = this.product.operator ?? false
      this.undeployed = this.product.undeployed ?? false
    }
  }
}
