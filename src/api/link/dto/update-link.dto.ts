import { IsBoolean, IsOptional, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateLinkDto {
  @IsOptional()
  @IsUrl({}, { message: 'originalUrl must be a valid URL' })
  originalUrl?: string;

  @IsOptional()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Slug may only contain letters, digits, hyphens and underscores',
  })
  code?: string;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
