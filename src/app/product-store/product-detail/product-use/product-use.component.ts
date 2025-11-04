import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { BehaviorSubject, Observable, of } from 'rxjs'

import { SlotService } from '@onecx/angular-remote-components'
import { WorkspaceService } from '@onecx/angular-integration-interface'

import { Utils } from 'src/app/shared/utils'

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
export class ProductUseComponent implements OnChanges {
  @Input() productName: string | undefined
  @Output() used = new EventEmitter<boolean>()

  // receive the slot output
  public slotName = 'onecx-workspace-data'
  public slotEmitter = new EventEmitter<Workspace[]>()
  public workspaceData$ = new BehaviorSubject<Workspace[] | undefined>(undefined)
  public isComponentDefined$: Observable<boolean> | undefined
  public workspaceEndpointExist = false

  constructor(
    private readonly slotService: SlotService,
    private readonly workspaceService: WorkspaceService
  ) {
    this.isComponentDefined$ = this.slotService.isSomeComponentDefinedForSlot(this.slotName)
  }

  public ngOnChanges(): void {
    if (this.productName) {
      this.slotEmitter.subscribe((res) => {
        this.workspaceData$.next(res)
        if (res.length > 0) this.used.emit(true)
      })
      // check endpoint exists
      this.workspaceEndpointExist = Utils.doesEndpointExist(
        this.workspaceService,
        'onecx-workspace',
        'onecx-workspace-ui',
        'workspace-detail'
      )
    }
  }

  public getWorkspaceEndpointUrl$(name?: string): Observable<string | undefined> {
    if (this.workspaceEndpointExist && name)
      return this.workspaceService.getUrl('onecx-workspace', 'onecx-workspace-ui', 'workspace-detail', {
        'workspace-name': name
      })
    return of(undefined)
  }
}
