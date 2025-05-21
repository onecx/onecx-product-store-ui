import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'

import { SlotService } from '@onecx/angular-remote-components'

export type Workspace = {
  name: string
  displayName: string
  description?: string
  theme?: string
  homePage?: string
  baseUrl?: string
  companyName?: string
  phoneNumber?: string
  rssFeedUrl?: string
  footerLabel?: string
  logoUrl?: string
  mandatory?: boolean
  operator?: boolean
  disabled?: boolean
}

@Component({
  selector: 'app-product-use',
  templateUrl: './product-use.component.html'
})
export class ProductUseComponent implements OnInit {
  @Input() productName: string | undefined
  @Output() used = new EventEmitter<boolean>()

  // receive the slot output
  public slotName = 'onecx-workspace-data'
  public slotEmitter = new EventEmitter<Workspace[]>()
  public workspaceData$ = new BehaviorSubject<Workspace[] | undefined>(undefined)
  public isComponentDefined$: Observable<boolean> | undefined

  constructor(private readonly slotService: SlotService) {
    this.isComponentDefined$ = this.slotService.isSomeComponentDefinedForSlot(this.slotName)
  }

  public ngOnInit(): void {
    this.slotEmitter.subscribe((res) => {
      this.workspaceData$.next(res)
      if (res.length > 0) this.used.emit(true)
    })
  }
}
