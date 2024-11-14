import { Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { GitHubService } from '../github/github.service';
import * as dotenv from 'dotenv';
import { TestPlanRepositoryV2 } from '../../repositories/test-plan/test-plan.repository-v2';

dotenv.config(); // Load environment variables

@Injectable()
export class JmxService {
  private readonly logger = new Logger(JmxService.name);

  constructor(
    private readonly githubService: GitHubService,
    private readonly testPlanRepo: TestPlanRepositoryV2,
  ) {}

  // Function to fetch the JMX file from GitHub and parse it
  async extractThreadGroupsFromGitHub(
    projectName: string,
    testPlanName: string,
  ) {
    try {
      // Step 1: Retrieve Test Plan by name and project name
      const testPlan = await this.testPlanRepo.getTestPlanByNameAndProjectName(
        testPlanName,
        projectName,
      );
      if (!testPlan) {
        throw new Error('Test plan not found');
      }

      // Step 2: Use GitHubService to get the uploaded test plan content
      const pathInRepo = testPlan.location;
      this.logger.log(
        `Attempting to fetch file from GitHub at path: ${pathInRepo}`,
      );

      const fileContentResponse =
        await this.githubService.getUploadedTestPlan(pathInRepo);
      if (!fileContentResponse.content) {
        throw new Error('File content not found in GitHub response');
      }

      const fileContents = Buffer.from(
        fileContentResponse.content,
        'base64',
      ).toString('utf-8');

      // Step 3: Parse the JMX file content
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
      });
      const jmxData = parser.parse(fileContents);

      // Step 4: Validate JMX Structure
      if (!jmxData.jmeterTestPlan) {
        throw new Error(
          'Invalid JMX file: Missing jmeterTestPlan root element',
        );
      }

      // Step 5: Extract Thread Groups
      const threadGroups = this.getThreadGroups(jmxData);
      if (threadGroups.length === 0) {
        throw new Error('No Thread Groups found in JMX file');
      }

      // Step 6: Extract Backend Listener
      const hasBackendListener = this.hasBackendListener(jmxData);

      // Step 7: Extract Host Information
      const hostInfo = this.getHostInformation(jmxData);

      // Step 8: Create Response
      const threadGroupDetails = threadGroups.map((tg: any) => {
        let virtualUsers: number | null = null;
        let rampUpTime: number | null = null;
        let holdLoadTime: number | null = null;
        let shutdownTime: number | null = null;
        const threadGroupName = tg['@_testname'] || 'Unnamed Thread Group';

        if (
          tg['@_testclass'] === 'kg.apc.jmeter.threads.UltimateThreadGroup'
        ) {
          // Handle Ultimate Thread Group
          if (
            tg['collectionProp'] &&
            tg['collectionProp']['collectionProp']
          ) {
            const ultimateThreadData = tg['collectionProp']['collectionProp'];

            if (ultimateThreadData && Array.isArray(ultimateThreadData['stringProp'])) {
              ultimateThreadData['stringProp'].forEach((param: any) => {
                const paramName = param['@_name'];
                const paramValue = param['#text'];

                // Ensure the param value is a string before trimming and parsing
                if (typeof paramValue === 'string') {
                  const parsedValue = parseInt(paramValue.trim(), 10);
                  this.logger.log(
                    `Examining param with name: ${paramName}, extracted value: ${parsedValue}`
                  );

                  switch (paramName) {
                    case '472454735': // Thread Count
                      virtualUsers = parsedValue;
                      break;
                    case '-502180566': // Ramp Up Time
                      rampUpTime = parsedValue;
                      break;
                    case '1786598548': // Hold Load Time
                      holdLoadTime = parsedValue;
                      break;
                    case '2015913763': // Shutdown Time
                      shutdownTime = parsedValue;
                      break;
                    default:
                      this.logger.warn(
                        `Unknown parameter name: ${paramName}`
                      );
                  }
                } else {
                  this.logger.warn(
                    `Parameter '#text' is not a string or is undefined for name: ${paramName}`
                  );
                }
              });
            } else {
              this.logger.warn(
                'Failed to locate stringProp elements in Ultimate Thread Group.',
              );
            }
          } else {
            this.logger.warn(
              'Ultimate Thread Group does not have expected nested collectionProp.',
            );
          }
        }

        return {
          name: threadGroupName,
          virtualUsers: virtualUsers,
          rampUpTime: rampUpTime,
          holdLoadTime: holdLoadTime,
          shutdownTime: shutdownTime,
          host: hostInfo,
        };
      });

      return {
        message: 'Thread group extracted successfully',
        testPlanName: testPlanName,
        backendListenerExists: hasBackendListener,
        threadGroups: threadGroupDetails,
      };
    } catch (error) {
      this.logger.error('Error extracting data from JMX file:', error.message);
      throw error;
    }
  }

  // Helper function to extract thread groups
  private getThreadGroups(jmxData: any): any[] {
    if (!jmxData?.jmeterTestPlan?.hashTree) {
      return [];
    }

    const hashTree = jmxData.jmeterTestPlan.hashTree;
    const threadGroups: any[] = [];

    const findThreadGroups = (tree: any) => {
      if (tree['ThreadGroup']) {
        threadGroups.push(tree['ThreadGroup']);
      }
      if (tree['kg.apc.jmeter.threads.UltimateThreadGroup']) {
        threadGroups.push(tree['kg.apc.jmeter.threads.UltimateThreadGroup']);
      }
      if (tree['hashTree']) {
        if (Array.isArray(tree['hashTree'])) {
          tree['hashTree'].forEach((subTree: any) => findThreadGroups(subTree));
        } else {
          findThreadGroups(tree['hashTree']);
        }
      }
    };

    if (Array.isArray(hashTree)) {
      hashTree.forEach((tree) => findThreadGroups(tree));
    } else {
      findThreadGroups(hashTree);
    }

    return threadGroups;
  }

  // Helper function to check if a backend listener exists
  private hasBackendListener(jmxData: any): boolean {
    if (!jmxData?.jmeterTestPlan?.hashTree) {
      return false;
    }

    const hashTree = jmxData.jmeterTestPlan.hashTree;

    const findBackendListener = (tree: any): boolean => {
      if (tree['BackendListener']) {
        return true;
      }
      if (tree['hashTree']) {
        if (Array.isArray(tree['hashTree'])) {
          return tree['hashTree'].some((subTree: any) =>
            findBackendListener(subTree),
          );
        } else {
          return findBackendListener(tree['hashTree']);
        }
      }
      return false;
    };

    return findBackendListener(hashTree);
  }

  // Helper function to get host information
  private getHostInformation(jmxData: any): string | undefined {
    if (!jmxData?.jmeterTestPlan?.hashTree) {
      return undefined;
    }

    const hashTree = jmxData.jmeterTestPlan.hashTree;
    let hostInfo: string | undefined;

    const findHostInfo = (tree: any) => {
      if (tree['HTTPSamplerProxy']) {
        const host = tree['HTTPSamplerProxy']['stringProp'].find(
          (prop: any) => prop['@_name'] === 'HTTPSampler.domain',
        );
        if (host) {
          hostInfo = host['#text'];
        }
      }
      if (tree['hashTree']) {
        if (Array.isArray(tree['hashTree'])) {
          tree['hashTree'].forEach((subTree: any) => findHostInfo(subTree));
        } else {
          findHostInfo(tree['hashTree']);
        }
      }
    };

    if (Array.isArray(hashTree)) {
      hashTree.forEach((tree) => findHostInfo(tree));
    } else {
      findHostInfo(hashTree);
    }

    return hostInfo;
  }
}
