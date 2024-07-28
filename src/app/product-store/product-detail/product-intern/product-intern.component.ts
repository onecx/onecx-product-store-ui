import { Component, Input, OnChanges, ElementRef, ViewChild } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

import { ProductAndWorkspaces } from 'src/app/shared/generated'

@Component({
  selector: 'app-product-intern',
  templateUrl: './product-intern.component.html'
})
export class ProductInternComponent implements OnChanges {
  @Input() product: ProductAndWorkspaces | undefined
  @Input() dateFormat = 'medium'

  @ViewChild('usedInWorkspaces') usedInWorkspaces: ElementRef = {} as ElementRef
  public operator = false
  public undeployed = false

  constructor(private translate: TranslateService) {}

  public ngOnChanges(): void {
    if (this.product) {
      this.operator = this.product.operator ? this.product.operator : false
      this.undeployed = this.product.undeployed ? this.product.undeployed : false
    }
    setTimeout(() => {
      if (this.usedInWorkspaces?.nativeElement)
        this.usedInWorkspaces.nativeElement.innerHTML = this.product?.workspaces?.join(', ')
    }, 2)
  }
}
