import { IsEmail, IsString, MaxLength } from 'class-validator';

export class SignUpDto {
    @IsString()
    email: string;
}

export class SignInDto {
    @IsString()
    @IsEmail({}, {message: 'Invalid email address'})
    @MaxLength(255)
    email: string;

    @IsString()
    password_hash: string;
}
