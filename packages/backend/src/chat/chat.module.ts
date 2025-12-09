import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AIModule } from '../openai/openai.module';
import { CharacterModule } from '../characters/characters.module';

@Module({
  imports: [AIModule, CharacterModule],
  controllers: [ChatController],
  providers: [ChatService, PrismaService],
})
export class ChatModule {}