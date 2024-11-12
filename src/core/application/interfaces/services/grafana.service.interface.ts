export interface IGrafanaService {
  deployGrafanaIfNotExists(): Promise<string>;
  createDatasource(data: any): Promise<any>;
  getDatasource(name: string): Promise<any>;
  deleteDatasource(id: number): Promise<any>;
  listDashboards(): Promise<any>;
  createDashboard(dashboard: any): Promise<any>;
  getDashboard(name: string): Promise<any>;
  deleteDashboard(id: number): Promise<any>;
}
