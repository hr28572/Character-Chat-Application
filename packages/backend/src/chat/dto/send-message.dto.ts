import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  characterId: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}