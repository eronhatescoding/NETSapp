import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiKeysService {

  readonly HERE_API_KEY = 'wvVFbhHMLMwh041GX7W324xL0VM587fZUDE_ITYebVY';


  // Check if keys are configured
  get hasHere(): boolean {
    return !this.HERE_API_KEY.includes('YOUR_');
  }
}
