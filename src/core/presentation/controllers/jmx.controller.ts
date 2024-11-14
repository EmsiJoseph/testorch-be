import { Body, Controller, Post } from '@nestjs/common';
import { JmxService } from 'src/core/infrastructure/services/jmeter/jmx.service';
import { Logger } from '@nestjs/common';
import { ExtractThreadGroupDto } from 'src/core/presentation/dto/test-plan.dto';

@Controller('jmx-management')
export class JmxController {
  private readonly logger = new Logger(JmxController.name);

  constructor(private readonly jmxService: JmxService) {}

  @Post('extract-thread-group')
  async extractThreadGroup(@Body() body: ExtractThreadGroupDto) {
    const { email, projectName, name, fileName } = body;

    try {
      if (!email || !projectName || !name || !fileName) {
        throw new Error('Missing required parameters in the request body.');
      }

      this.logger.log(`Received request to extract thread group for test plan: ${name}`);
      const result = await this.jmxService.extractThreadGroupsFromGitHub(email, projectName, name, fileName);
      return result;
    } catch (error) {
      this.logger.error('Error extracting thread group:', error.message);
      throw error;
    }
  }
}
