import { Component, Input } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

import { Product } from 'src/app/shared/generated'

@Component({
  selector: 'app-product-intern',
  templateUrl: './product-intern.component.html'
})
export class ProductInternComponent {
  @Input() product: Product | undefined
  @Input() dateFormat = 'medium'

  constructor(private translate: TranslateService) {}
}
