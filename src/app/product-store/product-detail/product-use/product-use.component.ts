import { Component, Input } from '@angular/core'
import { Observable } from 'rxjs'

import { SlotService } from '@onecx/angular-remote-components'

import { Product } from 'src/app/shared/generated'

@Component({
  selector: 'app-product-use',
  templateUrl: './product-use.component.html'
})
export class ProductUseComponent {
  @Input() product: Product | undefined

  public isComponentDefined$: Observable<boolean> | undefined
  public slotName = 'onecx-product-list-workspaces-using-product'

  constructor(private readonly slotService: SlotService) {
    this.isComponentDefined$ = this.slotService.isSomeComponentDefinedForSlot(this.slotName)
  }
}
