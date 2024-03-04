import { Component, Input, OnChanges, SimpleChanges } from '@angular/core'
import { prepareUrl } from 'src/app/shared/utils'
import { environment } from 'src/environments/environment'

@Component({
  selector: 'app-image-container',
  styleUrls: ['./image-container.component.scss'],
  templateUrl: './image-container.component.html'
})
export class ImageContainerComponent implements OnChanges {
  @Input() public id = ''
  @Input() public imageUrl: string | undefined
  @Input() public small = false

  public defaultImageUrl = environment.DEFAULT_LOGO_URL
  public displayPlaceHolder = false

  public onImageError() {
    this.displayPlaceHolder = true
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl']) {
      this.displayPlaceHolder = false
      this.imageUrl = prepareUrl(this.imageUrl)
    }
  }
}
