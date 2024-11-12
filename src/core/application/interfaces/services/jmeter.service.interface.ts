export interface IJmeterService {
  deployJmeterMasterIfNotExists(): Promise<string>;
  deployJmeterSlavesIfNotExists(): Promise<string>;
}
