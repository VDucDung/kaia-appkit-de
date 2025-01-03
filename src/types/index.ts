export interface UserProfile {
  userLineId: string;
  displayName: string;
  pictureUrl?: string;
  email?: string;
}

export interface VerifyResponse {
  success: boolean;
  message: string;
  user?: UserProfile;
}
