import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { TooltipModule } from 'primeng/tooltip'

/**
 * This component displays the label text as chip.
 */
@Component({
  selector: 'app-ocx-chip',
  standalone: true,
  imports: [TooltipModule],
  templateUrl: './ocx-chip.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OcxChipComponent {
  public readonly id = input('ocx-chip')
  public readonly label = input<string>()
  public readonly title = input<string>()
  public readonly styleClass = input<string>()
  public readonly filled = input(false)
}
