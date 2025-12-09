import { Module } from '@nestjs/common';
import { CharacterService } from './characters.service';
import { CharacterController } from './characters.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CharacterController],
  providers: [CharacterService, PrismaService],
  exports: [CharacterService],
})
export class CharacterModule {}