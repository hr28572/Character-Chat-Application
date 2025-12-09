import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CharacterService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.character.findMany({
      orderBy: { createdAt: 'asc' }
    });
  }

  async findOne(id: number) {
    return this.prisma.character.findUnique({
      where: { id }
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.character.findUnique({
      where: { slug }
    });
  }
}