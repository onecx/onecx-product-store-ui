import { Component, Input, OnChanges, ElementRef, ViewChild } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

import { ProductAndWorkspaces } from 'src/app/shared/generated'
import { sortByLocale } from 'src/app/shared/utils'

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

  constructor(private readonly translate: TranslateService) {}

  public ngOnChanges(): void {
    if (this.product) {
      this.operator = this.product.operator ?? false
      this.undeployed = this.product.undeployed ?? false
    }
    setTimeout(() => {
      if (this.usedInWorkspaces?.nativeElement) {
        const wList = this.product?.workspaces?.sort(sortByLocale)
        this.usedInWorkspaces.nativeElement.innerHTML = wList?.join(', ')
      }
    }, 2)
  }
}
