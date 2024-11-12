import { InfluxdbCredentials } from "src/core/domain/models/credentials-for-clients";

export interface IInfluxdbService {
  deployInfluxdbIfNotExists(): Promise<string>;

  createInfluxdbOrg(orgName: string, credentials: InfluxdbCredentials): Promise<any>;

  createInfluxdbBucket(projectName: string, orgId: string, credentials: InfluxdbCredentials): Promise<any>;

  getInfluxdbUrl(): Promise<any>;

  getInfluxdbOrg(): Promise<any>;

  deleteInfluxdbOrg(): Promise<any>;

  listInfluxdbOrgs(): Promise<any>;

  getInfluxdbToken(): Promise<any>;
}
