import { IsString, Length, IsOptional } from 'class-validator';

// Define the CreateTeam DTO
export class CreateTeamDto {
  @IsString()
  @Length(3, 50)
  name: string;

  @IsString()
  @Length(3, 100)
  @IsOptional()
  description?: string;

  auth0_org_id: string;

  email: string;
}

// Define the UpdateTeam DTO
export class UpdateTeamDto {
  @IsString()
  @Length(3, 31)
  @IsOptional()
  name?: string;
}
