import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core'
import { HttpErrorResponse } from '@angular/common/http'
import { FormControl, FormGroup } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { DataView } from 'primeng/dataview'
import { combineLatest, finalize, map, Observable, Subject, takeUntil } from 'rxjs'

import { Action, DataViewControlTranslations, UserService } from '@onecx/portal-integration-angular'
import {
  MicrofrontendAbstract,
  MicrofrontendPageResult,
  MicrofrontendsAPIService,
  Microservice,
  MicroservicePageResult,
  MicroservicesAPIService
} from 'src/app/shared/generated'
import { limitText } from 'src/app/shared/utils'
import { ChangeMode } from '../app-detail/app-detail.component'

export interface AppSearchCriteria {
  appId: FormControl<string | null>
  appName: FormControl<string | null>
  productName: FormControl<string | null>
}
export type AppType = 'MS' | 'MFE'
export type AppAbstract = MicrofrontendAbstract & Microservice & { appType: AppType }

@Component({
  templateUrl: './app-search.component.html',
  styleUrls: ['./app-search.component.scss']
})
export class AppSearchComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject()
  private readonly debug = true // to be removed after finalization
  public dataAccessIssue = false
  public exceptionKey = ''
  public loading = true
  public actions$: Observable<Action[]> | undefined

  public apps$!: Observable<AppAbstract[]>
  public mfes$!: Observable<MicrofrontendPageResult>
  public mss$!: Observable<MicroservicePageResult>
  public apps: AppAbstract[] = []
  public app: AppAbstract | undefined
  public appSearchCriteriaGroup!: FormGroup<AppSearchCriteria>
  public viewMode = 'grid'
  public changeMode: ChangeMode = 'VIEW'
  public filter: string | undefined
  public sortField = 'appName'
  public sortOrder = 1
  public searchInProgress = false
  public displayDetailDialog = false
  public displayDeleteDialog = false
  public hasCreatePermission = false
  public hasDeletePermission = false
  public limitText = limitText

  public dataViewControlsTranslations: DataViewControlTranslations = {}
  @ViewChild(DataView) dv: DataView | undefined

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private user: UserService,
    private mfeApi: MicrofrontendsAPIService,
    private msApi: MicroservicesAPIService,
    private translate: TranslateService
  ) {
    this.hasCreatePermission = this.user.hasPermission('APP#CREATE')
    this.hasDeletePermission = this.user.hasPermission('APP#DELETE')
    this.appSearchCriteriaGroup = new FormGroup<AppSearchCriteria>({
      appId: new FormControl<string | null>(null),
      appName: new FormControl<string | null>(null),
      productName: new FormControl<string | null>(null)
    })
  }

  ngOnInit(): void {
    this.prepareActionButtons()
    this.apps = [{ id: 'id', appId: '123', appType: 'MS', productName: 'test', description: 'bla' } as AppAbstract]
    this.searchApps()
  }
  public ngOnDestroy(): void {
    this.destroy$.next(undefined)
    this.destroy$.complete()
  }
  private log(text: string, obj?: object): void {
    if (this.debug) {
      if (obj) console.log('app search: ' + text, obj)
      else console.log('app search: ' + text)
    }
  }

  public searchApps(): void {
    this.searchInProgress = true
    this.mfes$ = this.mfeApi
      .searchMicrofrontends({
        mfeAndMsSearchCriteria: {
          appId: this.appSearchCriteriaGroup.controls['appId'].value,
          appName: this.appSearchCriteriaGroup.controls['appName'].value,
          productName: this.appSearchCriteriaGroup.controls['productName'].value,
          pageSize: 100
        }
      })
      .pipe(finalize(() => (this.searchInProgress = false)))

    this.mss$ = this.msApi
      .searchMicroservice({
        mfeAndMsSearchCriteria: {
          appId: this.appSearchCriteriaGroup.controls['appId'].value,
          appName: this.appSearchCriteriaGroup.controls['appName'].value,
          productName: this.appSearchCriteriaGroup.controls['productName'].value,
          pageSize: 100
        }
      })
      .pipe(finalize(() => (this.searchInProgress = false)))

    this.apps = []
    combineLatest(this.mfes$, this.mss$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(([microfrontends, microservices]) => {
        // mfe
        if (microfrontends instanceof HttpErrorResponse) {
          this.dataAccessIssue = true
          this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + microfrontends.status + '.WORKSPACES'
          console.error('searchMicrofrontends():', microfrontends)
        } else if (microfrontends instanceof Object) {
          if (microfrontends?.stream)
            for (let app of microfrontends.stream) this.apps?.push({ ...app, appType: 'MFE' } as AppAbstract)
          this.log('searchMicrofrontends():', microfrontends.stream)
        } else console.error('searchMicrofrontends() => unknown response:', microfrontends)
        // ms
        if (!this.dataAccessIssue) {
          if (microservices instanceof HttpErrorResponse) {
            this.dataAccessIssue = true
            this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + microservices.status + '.WORKSPACES'
            console.error('searchMicroservice():', microservices)
          } else if (microservices instanceof Object) {
            if (microservices?.stream)
              for (let app of microservices.stream) this.apps?.push({ ...app, appType: 'MS' } as AppAbstract)
            this.log('searchMicroservice():', microservices?.stream)
          } else console.error('searchMicroservice() => unknown response:', microservices)
        }
        this.log('searchApps():', this.apps)
        this.loading = false
      })
  }

  private prepareActionButtons(): void {
    this.actions$ = this.translate
      .get([
        'ACTIONS.CREATE.MFE.LABEL',
        'ACTIONS.CREATE.MS.LABEL',
        'ACTIONS.CREATE.APP.TOOLTIP',
        'ACTIONS.NAVIGATION.BACK',
        'ACTIONS.NAVIGATION.BACK.TOOLTIP'
      ])
      .pipe(
        map((data) => {
          return [
            {
              label: data['ACTIONS.NAVIGATION.BACK'],
              title: data['ACTIONS.NAVIGATION.BACK.TOOLTIP'],
              actionCallback: () => this.onBack(),
              icon: 'pi pi-arrow-left',
              show: 'always'
            },
            {
              label: data['ACTIONS.CREATE.MFE.LABEL'],
              title: data['ACTIONS.CREATE.APP.TOOLTIP'],
              actionCallback: () => this.onCreate('MFE'),
              permission: 'APP#CREATE',
              icon: 'pi pi-plus',
              show: 'always'
            },
            {
              label: data['ACTIONS.CREATE.MS.LABEL'],
              title: data['ACTIONS.CREATE.APP.TOOLTIP'],
              actionCallback: () => this.onCreate('MS'),
              permission: 'APP#CREATE',
              icon: 'pi pi-plus',
              show: 'always'
            }
          ]
        })
      )
  }

  public onLayoutChange(viewMode: string): void {
    this.viewMode = viewMode
  }
  public onFilterChange(filter: string): void {
    this.filter = filter
    this.dv?.filter(filter, 'contains')
  }
  public onSortChange(field: string): void {
    this.sortField = field
  }
  public onSortDirChange(asc: boolean): void {
    this.sortOrder = asc ? -1 : 1
  }
  public onSearch() {
    this.searchApps()
  }
  public onSearchReset() {
    this.appSearchCriteriaGroup.reset()
  }
  public onBack() {
    this.router.navigate(['../'], { relativeTo: this.route })
  }
  public onGotoProduct(ev: any, product: string) {
    ev.stopPropagation()
    this.router.navigate(['../', product], { relativeTo: this.route })
  }

  public onDetail(ev: any, app: AppAbstract) {
    ev.stopPropagation()
    this.app = app
    this.changeMode = 'EDIT'
    this.displayDetailDialog = true
  }
  public onCopy(ev: any, app: AppAbstract) {
    ev.stopPropagation()
    this.app = app
    this.changeMode = 'COPY'
    this.displayDetailDialog = true
  }
  public onCreate(type: AppType) {
    this.changeMode = 'CREATE'
    this.app = { appType: type } as AppAbstract
    this.displayDetailDialog = true
  }
  public onDelete(ev: any, app: AppAbstract) {
    ev.stopPropagation()
    this.app = app
    this.displayDeleteDialog = true
  }

  public appChanged(changed: any) {
    this.displayDetailDialog = false
    if (changed) this.searchApps()
  }
  public appDeleted(deleted: any) {
    this.displayDeleteDialog = false
    if (deleted && this.app?.id) {
      this.apps = this.apps.filter((app) => app.id !== this.app?.id)
    }
  }
}
