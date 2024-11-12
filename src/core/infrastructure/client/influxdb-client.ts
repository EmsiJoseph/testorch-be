import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class InfluxdbClient {
  private readonly logger = new Logger(InfluxdbClient.name);
  private influxdbApi: AxiosInstance;
  private influxdbToken: string;
  private influxdbUrl: string;

  constructor() {
    this.influxdbApi = axios.create();
  }

  setConfig(url: string, token: string) {
    this.influxdbUrl = url;
    this.influxdbToken = token;

    // Reconfigure the Axios instance with the provided URL and token
    this.influxdbApi = axios.create({
      baseURL: `${this.influxdbUrl}/api/v2`,
      headers: { Authorization: `Token ${this.influxdbToken}` },
    });
    this.logger.log(
      `InfluxDBClient configured with base URL: ${this.influxdbUrl} and token: ${this.influxdbToken}`,
    );
  }

  /**
   * Check if an InfluxDB organization exists by its name.
   * @param orgName The name of the organization.
   * @returns True if the organization exists, false otherwise.
   */
  async orgExists(orgName: string): Promise<boolean> {
    try {
      const response: AxiosResponse = await this.influxdbApi.get(`/orgs`);
      const orgs = response.data.orgs || [];
      const orgExists = orgs.some((org: any) => org.name === orgName);
      this.logger.log(`Organization '${orgName}' exists: ${orgExists}`);
      return orgExists;
    } catch (error) {
      this.handleAxiosError('Error checking if organization exists', error);
    }
  }

  /**
   * Create an InfluxDB organization.
   * @param orgName The name of the organization.
   * @returns The created organization data.
   */
  async createOrg(orgName: string): Promise<any> {
    try {
      const response: AxiosResponse = await this.influxdbApi.post('/orgs', {
        name: orgName,
      });
      this.logger.log(
        `Organization '${orgName}' created successfully with ID: ${response.data.id}`,
      );
      return response.data;
    } catch (error) {
      this.handleAxiosError('Error creating organization', error);
    }
  }

  /**
   * Get an InfluxDB organization ID by its name.
   * @param orgName The name of the organization.
   * @returns The organization ID.
   */
  async getOrgIdByName(orgName: string): Promise<string> {
    try {
      const response: AxiosResponse = await this.influxdbApi.get(
        `/orgs?org=${orgName}`,
      );
      if (response.data.orgs && response.data.orgs.length > 0) {
        const org = response.data.orgs[0];
        this.logger.log(`Organization '${orgName}' found with ID: ${org.id}`);
        return org.id;
      } else {
        throw new HttpException(
          `Organization '${orgName}' not found`,
          HttpStatus.NOT_FOUND,
        );
      }
    } catch (error) {
      this.handleAxiosError('Error retrieving organization by name', error);
    }
  }

  /**
   * Create an InfluxDB bucket.
   * @param projectName The name of the project for which the bucket is being created.
   * @param orgId The organization ID where the bucket will be created.
   * @returns The created bucket data.
   */
  async createBucket(projectName: string, orgId: string): Promise<any> {
    try {
      const response: AxiosResponse = await this.influxdbApi.post('/buckets', {
        name: projectName,
        orgID: orgId,
        retentionRules: [],
      });
      this.logger.log(
        `Bucket '${projectName}' created successfully with ID: ${response.data.id}`,
      );
      return response.data;
    } catch (error) {
      console.log(error)
      this.handleAxiosError('Error creating bucket', error);
    }
  }

  /**
   * Handle errors by logging and formatting the error message.
   * @param message The custom error message.
   * @param error The error object caught in the try-catch.
   */
  private handleAxiosError(message: string, error: any): never {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      const errorData = error.response?.data;
      let errorMessage = `${message}: ${statusText || 'Unknown Error'}`;
      if (errorData) {
        errorMessage += ` - ${JSON.stringify(errorData)}`;
      }

      switch (status) {
        case 400:
          errorMessage = `${message}: Bad Request - ${statusText}`;
          throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
        case 401:
          errorMessage = `${message}: Unauthorized - ${statusText}`;
          throw new HttpException(errorMessage, HttpStatus.UNAUTHORIZED);
        case 403:
          errorMessage = `${message}: Forbidden - ${statusText}`;
          throw new HttpException(errorMessage, HttpStatus.FORBIDDEN);
        case 404:
          errorMessage = `${message}: Not Found - ${statusText}`;
          throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
        case 409:
          errorMessage = `${message}: Conflict - ${statusText}`;
          throw new HttpException(errorMessage, HttpStatus.CONFLICT);
        case 500:
          errorMessage = `${message}: Internal Server Error - ${statusText}`;
          throw new HttpException(
            errorMessage,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        default:
          errorMessage = `${message}: ${statusText || 'Unknown Error'}`;
          throw new HttpException(
            errorMessage,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
    } else {
      this.logger.error(`${message}: ${error.message}`);
      throw new HttpException(
        `${message}: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
