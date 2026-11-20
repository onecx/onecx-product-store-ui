import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { combineLatest, map, Observable, of, switchMap } from 'rxjs'

import { MessageModule } from 'primeng/message'
import { TooltipModule } from 'primeng/tooltip'

import { WorkspaceService } from '@onecx/angular-integration-interface'

import { Utils } from 'src/app/shared/utils'
import { LoadingState } from '../product-detail.component'

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

export const WORKSPACE_DETAIL_ENDPOINT = {
  productName: 'onecx-workspace',
  appId: 'onecx-workspace-ui',
  endpointName: 'workspace-detail'
}

@Component({
  selector: 'app-product-use',
  standalone: true,
  imports: [MessageModule, RouterModule, TooltipModule, TranslateModule],
  templateUrl: './product-use.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductUseComponent {
  private readonly workspaceService = inject(WorkspaceService)
  // signals
  public readonly workspaces = input<Workspace[]>()
  public readonly isComponentDefined = input<boolean>(false)
  public readonly useLoadingState = input.required<LoadingState>()

  public readonly workspaceEndpointExist = toSignal(
    Utils.doesEndpointExist(
      this.workspaceService,
      WORKSPACE_DETAIL_ENDPOINT.productName,
      WORKSPACE_DETAIL_ENDPOINT.appId,
      WORKSPACE_DETAIL_ENDPOINT.endpointName
    ),
    { initialValue: false }
  )
  // resolved once per workspaces/endpoint change instead of per row in the template
  private readonly workspaceUrls$: Observable<Map<string, string | undefined>> = combineLatest([
    toObservable(this.workspaces),
    toObservable(this.workspaceEndpointExist)
  ]).pipe(
    switchMap(([workspaces, exists]) => {
      if (!exists || !workspaces?.length) return of(new Map<string, string | undefined>())
      return combineLatest(
        workspaces.map((workspace) =>
          this.workspaceService
            .getUrl(
              WORKSPACE_DETAIL_ENDPOINT.productName,
              WORKSPACE_DETAIL_ENDPOINT.appId,
              WORKSPACE_DETAIL_ENDPOINT.endpointName,
              { 'workspace-name': workspace.name }
            )
            .pipe(map((url) => [workspace.name, url] as const))
        )
      ).pipe(map((entries) => new Map(entries)))
    })
  )
  public readonly workspaceUrls = toSignal(this.workspaceUrls$, {
    initialValue: new Map<string, string | undefined>()
  })
}
