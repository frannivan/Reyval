import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { StorageService } from './storage';

export interface RolePermission {
  id?: number;
  roleName: string;
  permissionKey: string;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);
  private apiUrl = `${environment.apiUrl}/permissions`;
  
  private permissionsSubject = new BehaviorSubject<RolePermission[]>([]);
  public permissions$ = this.permissionsSubject.asObservable();

  private lastFetchTime = 0;
  private readonly CACHE_TTL = 30000;

  constructor() {}

  /**
   * Fetches all permissions from the backend and updates the subject
   */
  loadUserPermissions(): Observable<RolePermission[]> {
    const user = this.storageService.getUser();
    if (!user || !user.role) return of([]);

    return this.http.get<RolePermission[]>(this.apiUrl).pipe(
      tap((perms: RolePermission[]) => {
        this.permissionsSubject.next(perms);
        this.lastFetchTime = Date.now();
      })
    );
  }

  getAllPermissions(): Observable<RolePermission[]> {
    return this.http.get<RolePermission[]>(this.apiUrl);
  }

  updatePermission(permission: RolePermission): Observable<any> {
    return this.http.post(this.apiUrl, permission).pipe(
      tap(() => this.resetCache())
    );
  }

  resetToDefaults(): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset`, {}).pipe(
      tap((perms: any) => {
        if (Array.isArray(perms)) {
          this.permissionsSubject.next(perms);
        }
        this.resetCache();
      })
    );
  }

  resetByRole(roleName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset/${roleName}`, {}).pipe(
      tap((newPerms: any) => {
        if (Array.isArray(newPerms)) {
          // Merge or replace role permissions in local cache
          const current = this.permissionsSubject.value.filter(p => p.roleName !== roleName);
          this.permissionsSubject.next([...current, ...newPerms]);
        }
        this.resetCache();
      })
    );
  }

  private resetCache(): void {
    this.lastFetchTime = 0;
  }

  updatePermissionsBatch(permissions: RolePermission[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/batch`, permissions).pipe(
      tap(() => this.loadUserPermissions().subscribe())
    );
  }

  /**
   * Checks if the user's role has the given permission enabled.
   */
  hasPermission(key: string): boolean {
    const user = this.storageService.getUser();
    if (!user || !user.role) return false;
    
    // Removing hardcoded Admin/Directivo bypass to force database-driven visibility
    // if (user.roles.includes('ROLE_ADMIN') || user.roles.includes('ROLE_DIRECTIVO')) return true;

    // Essential permissions that are always whitelisted (e.g. login, profile)
    const whitelist: string[] = ['menu:home', 'menu:profile', 'menu:payments_history'];
    if (whitelist.includes(key)) return true;

    const userRole = user.role;
    const permissions = this.permissionsSubject.value;
    
    // Check if the user's role has this permission enabled
    const relevantPerm = permissions.find(p => 
      p.roleName === userRole && p.permissionKey === key
    );

    if (!relevantPerm) return false; // Strict default: denied

    return relevantPerm.enabled;
  }

  canAccessMenu(menuKey: string): boolean {
    return this.hasPermission(`menu:${menuKey}`);
  }

  canPerformAction(actionKey: string): boolean {
    return this.hasPermission(`action:${actionKey}`);
  }
}
