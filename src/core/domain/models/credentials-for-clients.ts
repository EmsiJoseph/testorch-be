export interface InfluxdbCredentials {
  token: string;
  url: string;
}

export interface GrafanaCredentials {
  username: string;
  password: string | undefined;
}
