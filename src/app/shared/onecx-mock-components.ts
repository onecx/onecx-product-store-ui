import { Component, Input } from '@angular/core'

@Component({
  selector: 'ocx-portal-page',
  template: '<ng-content></ng-content>',
  standalone: true
})
export class MockPortalPageComponent {
  @Input() pageRoles: any
  @Input() helpArticleId: any
}

@Component({
  selector: 'ocx-page-header',
  template: '<ng-content></ng-content>',
  standalone: true
})
export class MockPageHeaderComponent {
  @Input() header: any
  @Input() subheader: any
  @Input() actions: any
}

@Component({
  selector: 'ocx-search-header',
  template: '<ng-content></ng-content>',
  standalone: true
})
export class MockOcxSearchHeaderComponent {
  @Input() actions: any
  @Input() header: any
  @Input() subheader: any
  @Input() searchConfig: any
  @Input() manualBreadcrumbs: any
}

@Component({
  selector: 'ocx-interactive-data-view',
  template: '<ng-content></ng-content>',
  standalone: true
})
export class MockInteractiveDataViewComponent {
  @Input() data: any
  @Input() supportedViewLayouts: any
  @Input() layout: any
  @Input() columns: any
  @Input() displayedColumnKeys: any
  @Input() editPermission: any
  @Input() deletePermission: any
  @Input() additionalActions: any
  @Input() listGridPaginator: any
  @Input() tablePaginator: any
  @Input() pageSize: any
  @Input() pageSizes: any
  @Input() emptyResultsMessage: any
  @Input() disableFilterView: any
  @Input() clientSideFiltering: any
  @Input() clientSideSorting: any
  @Input() filters: any
  @Input() sortField: any
  @Input() sortDirection: any
  @Input() actionColumnPosition: any
  @Input() filtered: any
  @Input() sorted: any
  @Input() editItem: any
  @Input() deleteItem: any
  @Input() dataViewLayoutChange: any
}

@Component({
  selector: 'ocx-content',
  template: '<ng-content></ng-content>',
  standalone: true
})
export class MockOcxContentComponent {}

// Import this to your TestBed
export const ONECX_MOCK_COMPONENTS = [
  MockPortalPageComponent,
  MockPageHeaderComponent,
  MockOcxContentComponent,
  MockOcxSearchHeaderComponent,
  MockInteractiveDataViewComponent
]
