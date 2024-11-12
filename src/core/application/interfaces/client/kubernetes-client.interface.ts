// Create an interface for KubernetesClient
import * as k8s from "@kubernetes/client-node";

export interface IKubernetesClient {
  createNamespace(namespace: string): Promise<void>;
  createSecret(namespace: string, secretManifest: k8s.V1Secret): Promise<void>;
  createRole(namespace: string, roleManifest: k8s.V1Role): Promise<void>;
  createRoleBinding(
    namespace: string,
    roleBindingManifest: k8s.V1RoleBinding,
  ): Promise<void>;
  namespaceExists(namespace: string): Promise<boolean>;
  deploymentExists(deploymentName: string, namespace: string): Promise<boolean>;
  getServiceUrl(
    serviceName: string,
    namespace: string,
    serviceType: "InfluxDB" | "Grafana" | "JMeterMaster" | "JMeterSlave",
  ): Promise<string>;
  getSecret(namespace: string, secretName: string): Promise<k8s.V1Secret | undefined>;
}
