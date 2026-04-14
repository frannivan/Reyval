import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { PermissionService } from '../services/permission';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private permissionService = inject(PermissionService);

  @Input() set appHasPermission(permissionKey: string) {
    if (this.permissionService.hasPermission(permissionKey)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
