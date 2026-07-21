import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async create(createProductDto: CreateProductDto, userId?: number) {
    const product = await this.prisma.product.create({
      data: createProductDto,
    });
    if (userId) {
      await this.auditService.logAction('CREATE', 'Product', product.id, `Created product ${product.name}`, userId);
    }
    return product;
  }

  findAll() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto, userId?: number) {
    await this.findOne(id);
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
    if (userId) {
      await this.auditService.logAction('UPDATE', 'Product', updatedProduct.id, `Updated product ${updatedProduct.name}`, userId);
    }
    return updatedProduct;
  }

  async remove(id: number, userId?: number) {
    const product = await this.findOne(id);
    await this.prisma.product.delete({
      where: { id },
    });
    if (userId) {
      await this.auditService.logAction('DELETE', 'Product', product.id, `Deleted product ${product.name}`, userId);
    }
    return { success: true };
  }
}
