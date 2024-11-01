import { Component, Input } from '@angular/core'

import { SlotService } from '@onecx/angular-remote-components'
import { Observable } from 'rxjs'
import { Product } from 'src/app/shared/generated'

@Component({
  selector: 'app-product-use',
  templateUrl: './product-use.component.html'
})
export class ProductUseComponent {
  @Input() product: Product | undefined
  public isListWorkspacesUsingProductComponentDefined$: Observable<boolean> | undefined
  public listWorkspacesUsingProductSlotName = 'onecx-product-list-workspaces-using-product'

  constructor(private readonly slotService: SlotService) {
    this.isListWorkspacesUsingProductComponentDefined$ = this.slotService.isSomeComponentDefinedForSlot(
      this.listWorkspacesUsingProductSlotName
    )
  }
}
