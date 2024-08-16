import { Component, Input, OnChanges } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

import { Microfrontend, Microservice } from 'src/app/shared/generated'

@Component({
  selector: 'app-app-intern',
  templateUrl: './app-intern.component.html',
  styleUrls: ['./app-intern.component.scss']
})
export class AppInternComponent implements OnChanges {
  @Input() app: (Microfrontend | Microservice) | undefined
  @Input() dateFormat = 'medium'

  public undeployed = false
  public operator = false
  public deprecated = false

  constructor(private translate: TranslateService) {}

  public ngOnChanges(): void {
    this.undeployed = this.app?.undeployed ?? false
    this.operator = this.app?.operator ?? false
    if (this.isMicrofrontend(this.app)) {
      this.deprecated = this.app.deprecated ?? false
    } else {
      this.deprecated = false
    }
  }

  private isMicrofrontend(app: Microfrontend | Microservice | undefined): app is Microfrontend {
    return (app as Microfrontend)?.deprecated !== undefined
  }
}
