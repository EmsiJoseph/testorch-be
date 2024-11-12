import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { CreateTeamDto } from 'src/core/presentation/dto/team.dto';
import { v4 as uuidv4 } from 'uuid';
import { DRIZZLE_ORM } from '../../../../constants/db.constant';
import { ITeamRepository } from '../../../application/interfaces/repositories/team.repository.interface';
import { DatabaseOperationError } from '../../../domain/errors/common';
import { TeamSelectType } from '../../../domain/models/team';
import * as schema from '../../database/schema';
import { teamMembers, teams } from '../../database/schema';

@Injectable()
export class TeamRepository implements ITeamRepository {
  private readonly logger = new Logger(TeamRepository.name);

  constructor(
    @Inject(DRIZZLE_ORM) private conn: PostgresJsDatabase<typeof schema>,
  ) {}

  async createTeam(
    createTeamDto: CreateTeamDto,
    userId: string,
  ): Promise<TeamSelectType> {
    try {
      const id = uuidv4();
      // Insert team and get the newly created team ID
      const query = this.conn
        .insert(teams)
        .values({
          id: id,
          name: createTeamDto.name,
          description: createTeamDto.description,
          auth0_org_id: createTeamDto.auth0_org_id,
        })
        .returning(); // Get the created team back

      const [createdTeam] = await query.execute();

      if (!createdTeam) {
        throw new Error('Failed to create team');
      }

      // Insert the admin in teamMembers
      const teamMemberQuery = this.conn
        .insert(teamMembers)
        .values({
          user_id: userId,
          team_id: createdTeam.id,
          role: 'admin', // Role assigned as 'admin' for the user who created the team
        })
        .returning();

      const [createdTeamMember] = await teamMemberQuery.execute();

      if (!createdTeamMember) {
        throw new Error('Failed to assign user as admin to the team');
      }

      return createdTeam;
    } catch (error) {
      this.logger.error('Error creating team with admin:', error);
      throw new DatabaseOperationError('Failed to create team', error);
    }
  }


  async getTeamByAuth0OrgId(
    auth0OrgId: string,
  ): Promise<TeamSelectType | null> {
    try {
      const query = this.conn
        .select()
        .from(teams)
        .where(eq(teams.auth0_org_id, auth0OrgId))
        .limit(1);

      const [team] = await query.execute();

      return team || null;
    } catch (error) {
      this.logger.error('Error fetching team by Auth0 Org ID:', error);
      throw new DatabaseOperationError('Failed to fetch team', error);
    }
  }

  async deleteTeam(teamName: string): Promise<void> {
    console.log(`Deleting team ${teamName}`);
  }

  async getTeams(userId: string): Promise<void> {
    console.log(`Getting teams for user ${userId}`);
  }
}
