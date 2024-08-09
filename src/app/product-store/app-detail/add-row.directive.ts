import { Directive, Input, HostListener } from '@angular/core'
import { Table } from 'primeng/table'

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[pAddRow]'
})
export class AddRowDirective {
  @Input() table!: Table
  @Input() newRow: any

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    // Insert a new row
    this.table.value.push(this.newRow)

    // Set the new row in edit mode
    this.table.initRowEdit(this.newRow)

    event.preventDefault()
  }
}
