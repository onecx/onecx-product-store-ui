import { Component, Input, OnChanges } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

import { Microfrontend, Microservice } from 'src/app/shared/generated'

@Component({
  selector: 'app-app-intern',
  templateUrl: './app-intern.component.html'
})
export class AppInternComponent implements OnChanges {
  @Input() app: (Microfrontend | Microservice) | undefined
  @Input() appType: 'MFE' | 'MS' = 'MFE'
  @Input() dateFormat = 'medium'

  public undeployed = false
  public operator = false
  public deprecated = false

  constructor(private readonly translate: TranslateService) {}

  public ngOnChanges(): void {
    this.undeployed = this.app?.undeployed ?? false
    this.operator = this.app?.operator ?? false
    if (this.appType === 'MFE') {
      this.deprecated = (this.app as Microfrontend)?.deprecated ?? false
    } else {
      this.deprecated = false
    }
  }
}
