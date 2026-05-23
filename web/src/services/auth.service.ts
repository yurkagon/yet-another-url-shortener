import { ApiService } from './api.service';

export class AuthService extends ApiService {
  public register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public login(data: { email: string; password: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public logout(): Promise<void> {
    return this.request<void>('/auth/logout', { method: 'POST' });
  }

  public me(): Promise<User> {
    return this.request<User>('/auth/me');
  }
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
