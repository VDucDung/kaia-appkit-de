export interface UserProfile {
  userLineId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LineTokenResponse {
  access_token: string;
  expires_in: number;
  id_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export interface LineLoginState {
  isLineLoggedIn: boolean;
  lineProfile: UserProfile | null;
}

export interface VerifyResponse {
  success: boolean;
  message: string;
  user?: UserProfile;
}
