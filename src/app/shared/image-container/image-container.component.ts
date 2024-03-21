import { Component, Input, OnChanges, SimpleChanges } from '@angular/core'
import { map } from 'rxjs'

import { prepareUrl, prepareUrlPath } from 'src/app/shared/utils'
import { environment } from 'src/environments/environment'
import { AppStateService } from '@onecx/portal-integration-angular'

@Component({
  selector: 'app-image-container',
  styleUrls: ['./image-container.component.scss'],
  templateUrl: './image-container.component.html'
})
export class ImageContainerComponent implements OnChanges {
  @Input() public id = ''
  @Input() public imageUrl: string | undefined
  @Input() public small = false

  public defaultImageUrl = ''
  public displayPlaceHolder = false

  prepareUrl = prepareUrl
  prepareUrlPath = prepareUrlPath

  constructor(private appState: AppStateService) {
    appState.currentMfe$
      .pipe(
        map((mfe) => {
          this.defaultImageUrl = this.prepareUrlPath(mfe.remoteBaseUrl, environment.DEFAULT_LOGO_URL)
        })
      )
      .subscribe()
  }

  public onImageError(): void {
    this.displayPlaceHolder = true
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl']) {
      this.displayPlaceHolder = false
      this.imageUrl = prepareUrl(this.imageUrl)
    }
  }
}
