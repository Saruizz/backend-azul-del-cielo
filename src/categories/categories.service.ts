import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async create(createCategoryDto: CreateCategoryDto, userId?: number) {
    const category = await this.prisma.category.create({
      data: createCategoryDto,
    });
    if (userId) {
      await this.auditService.logAction('CREATE', 'Category', category.id, `Created category ${category.name}`, userId);
    }
    return category;
  }

  findAll() {
    return this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto, userId?: number) {
    await this.findOne(id);
    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
    if (userId) {
      await this.auditService.logAction('UPDATE', 'Category', updatedCategory.id, `Updated category ${updatedCategory.name}`, userId);
    }
    return updatedCategory;
  }

  async remove(id: number, userId?: number) {
    const category = await this.findOne(id);
    await this.prisma.category.delete({
      where: { id },
    });
    if (userId) {
      await this.auditService.logAction('DELETE', 'Category', category.id, `Deleted category ${category.name}`, userId);
    }
    return { success: true };
  }
}
