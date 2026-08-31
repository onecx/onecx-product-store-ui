import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core'
import { AsyncPipe } from '@angular/common'
import { Observable, map } from 'rxjs'

import { AppStateService } from '@onecx/angular-integration-interface'
import { AngularAcceleratorModule } from '@onecx/angular-accelerator'
import { TranslateModule } from '@ngx-translate/core'
import { TooltipModule } from 'primeng/tooltip'

import { environment } from 'src/environments/environment'
import { Utils } from 'src/app/shared/utils'

/**
 * This component displays the image with given imageURL.
 * A default image is displayed (stored in assets/images), if
 *   - the image URL was not provided
 *   - the image was not found (http status: 404)
 */
@Component({
  selector: 'app-image-container',
  standalone: true,
  imports: [AngularAcceleratorModule, AsyncPipe, TooltipModule, TranslateModule],
  styleUrls: ['./image-container.component.scss'],
  templateUrl: './image-container.component.html',
  host: { hostId: 'this-avoids-component-id-collision' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageContainerComponent {
  private readonly appState = inject(AppStateService)

  public readonly id = input('ps_image_container_logo')
  public readonly title = input<string>()
  public readonly imageUrl = input<string>()
  public readonly styleClass = input<string>()

  public displayImageUrl: string | undefined
  public defaultImageUrl$: Observable<string>
  public displayDefaultLogo = false

  constructor() {
    this.defaultImageUrl$ = this.appState.currentMfe$.pipe(
      map((mfe) => {
        return Utils.prepareUrlPath(mfe.remoteBaseUrl, environment.DEFAULT_LOGO_PATH)
      })
    )

    // replaces ngOnChanges: signal inputs don't trigger it
    effect(() => {
      this.displayDefaultLogo = false
      if (this.imageUrl()) this.displayImageUrl = this.imageUrl()
      else this.displayDefaultLogo = true
    })
  }

  public onImageError(): void {
    this.displayDefaultLogo = true
    this.displayImageUrl = undefined
  }
}
