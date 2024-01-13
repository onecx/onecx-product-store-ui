import { Component, Input } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

import { Product } from '../../../generated'

@Component({
  selector: 'ps-product-props',
  templateUrl: './product-props.component.html'
})
export class ProductPropertyComponent {
  @Input() product: Product | undefined
  @Input() dateFormat = 'medium'

  constructor(private translate: TranslateService) {}
}
