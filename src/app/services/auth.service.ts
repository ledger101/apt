import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  authState,
  User
} from '@angular/fire/auth';
import { Observable, map } from 'rxjs';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'SM' | 'OM' | 'Admin';
  orgId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User | null>;
  userProfile$: Observable<UserProfile | null>;

  constructor(private auth: Auth) {
    this.user$ = authState(this.auth);
    this.userProfile$ = this.user$.pipe(
      map(user => user ? this.mapToUserProfile(user) : null)
    );
  }

  private mapToUserProfile(user: User): UserProfile {
    // TODO: Fetch role and orgId from Firestore or custom claims
    // For now, mock based on email or custom claims
    const email = user.email || '';
    let role: 'SM' | 'OM' | 'Admin' = 'SM'; // Default
    let orgId = 'default-org'; // Default

    // Mock logic: if email contains 'admin', role Admin, etc.
    if (email.includes('admin')) {
      role = 'Admin';
    } else if (email.includes('office')) {
      role = 'OM';
    }

    return {
      uid: user.uid,
      email,
      displayName: user.displayName || email,
      role,
      orgId
    };
  }

  async login(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      return result.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(email: string, password: string) {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      return result.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  logout() {
    return signOut(this.auth);
  }

  getCurrentUserProfile(): UserProfile | null {
    // Synchronous version, use with care
    const user = this.auth.currentUser;
    return user ? this.mapToUserProfile(user) : null;
  }
}
