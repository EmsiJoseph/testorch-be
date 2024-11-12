import { IsString, Length, IsOptional } from "class-validator";

export class CreateProjectDto {
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
