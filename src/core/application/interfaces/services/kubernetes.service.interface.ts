export interface IKubernetesService {
  /**
   * Port-forwards a Kubernetes service to a specified port in a given namespace.
   * @param serviceName - The name of the Kubernetes service to port-forward.
   * @param port - The port to forward.
   * @param namespace - The Kubernetes namespace where the service is located.
   * @returns A Promise that resolves with the stdout from the port-forward command.
   * @throws An error if port-forwarding fails.
   */
  portForwardResource(serviceName: string, port: string, namespace: string): Promise<void>;


  /**
   * Create a Kubernetes Secret and configure Role and RoleBinding to manage access to it.
   * @param secretName The name of the secret.
   * @param namespace The namespace where the secret should be created.
   * @param secretData The secret data to store.
   * @param serviceAccountName The service account that should have access to this secret.
   */
  createSecret(
    secretName: string,
    namespace: string,
    secretData: Record<string, string>,
    serviceAccountName: string,
  ): Promise<void>;

  /**
   * Retrieve and decode a Kubernetes Secret from the specified namespace.
   * @param secretName The name of the secret.
   * @param namespace The namespace where the secret is located.
   * @returns A record of secret data with key-value pairs.
   */
  getSecret(
    secretName: string,
    namespace: string,
  ): Promise<Record<string, string>>;

  /**
   * Retrieve the URL of a service deployment in the specified namespace.
   * @param serviceName The name of the service.
   * @param namespace The namespace where the service is deployed.
   * @param serviceType The type of service (e.g., 'InfluxDB', 'Grafana').
   * @returns The URL of the service.
   */
  getDeploymentUrl(
    serviceName: string,
    namespace: string,
    serviceType: "InfluxDB" | "Grafana" | "JMeterMaster" | "JMeterSlave",
  ): Promise<string>;

  /**
   * Check if a deployment exists in the specified namespace.
   * @param deploymentName The name of the deployment.
   * @param namespace The namespace where the deployment is located.
   * @returns `true` if the deployment exists, `false` otherwise.
   */
  deploymentExists(deploymentName: string, namespace: string): Promise<boolean>;

  /**
   * Deploy a Kubernetes resource from a YAML file.
   * @param yamlFilePath The file path to the YAML definition.
   * @param namespace The namespace to deploy the resource.
   * @returns The deployment status or output.
   */
  deployResourceFromYaml(
    yamlFilePath: string,
    namespace: string,
  ): Promise<string>;
}
