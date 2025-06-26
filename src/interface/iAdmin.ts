export interface Admin {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminWithToken extends Admin {
  token: string;
}
