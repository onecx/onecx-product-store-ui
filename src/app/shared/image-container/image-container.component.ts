import { ChangeDetectionStrategy, Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core'
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
export class ImageContainerComponent implements OnChanges {
  private readonly appState = inject(AppStateService)

  @Input() public id = 'ps_image_container_logo'
  @Input() public title: string | undefined
  @Input() public imageUrl: string | undefined
  @Input() public styleClass: string | undefined

  public displayImageUrl: string | undefined
  public defaultImageUrl$: Observable<string>
  public displayDefaultLogo = false

  constructor() {
    this.defaultImageUrl$ = this.appState.currentMfe$.pipe(
      map((mfe) => {
        return Utils.prepareUrlPath(mfe.remoteBaseUrl, environment.DEFAULT_LOGO_PATH)
      })
    )
  }

  public onImageError(): void {
    this.displayDefaultLogo = true
    this.displayImageUrl = undefined
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl']) {
      this.displayDefaultLogo = false
      if (this.imageUrl) this.displayImageUrl = this.imageUrl
      else this.displayDefaultLogo = true
    }
  }
}
