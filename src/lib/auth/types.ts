export type LoginPayload = {
  identity: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
};

export type BackendSuccessEnvelope<TData> = {
  success: true;
  data: TData;
  status: number;
};

export type BackendErrorEnvelope = {
  success: false;
  code?: string;
  error: string;
  status: number;
};

export type BackendEnvelope<TData> = BackendSuccessEnvelope<TData> | BackendErrorEnvelope;

export type AuthSessionData = {
  accessToken?: string;
  token?: string;
  expiresAt?: string | number;
  expiresIn?: number;
  expiresInSeconds?: number;
  requiredAction?: 'change_password' | string;
};

export type AuthActionState = {
  error?: string;
};
