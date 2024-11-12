import { TeamSelectType } from '../../../domain/models/team';
import { CreateTeamDto } from '../../../presentation/dto/team.dto';

export interface ITeamRepository {
  createTeam(
    createTeamDto: CreateTeamDto,
    userId: string,
  ): Promise<TeamSelectType>;

  deleteTeam(teamName: string): Promise<void>;

  getTeams(userId: string): Promise<void>;

  getTeamByAuth0OrgId(auth0OrgId: string): Promise<TeamSelectType | null>;
}
