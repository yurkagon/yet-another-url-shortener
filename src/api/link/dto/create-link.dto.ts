import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateLinkDto {
  @ApiProperty({ example: 'https://example.com', description: 'The original URL' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  originalUrl: string;
}
