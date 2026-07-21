import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true }
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const { password, ...result } = user;
    return result;
  }

  async create(data: any, currentUserId: number, currentUserRole: string) {
    if (data.role === 'SUPERADMIN' && currentUserRole !== 'SUPERADMIN') {
      throw new ForbiddenException('Solo los super administradores pueden crear otros super administradores');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('El correo ya está en uso');
    }
    
    const hashedPassword = await bcrypt.hash(data.password || '123456', 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role || 'OPERATOR',
      },
    });

    await this.auditService.logAction('CREATE', 'User', user.id, `Created user ${user.email}`, currentUserId);

    const { password, ...result } = user;
    return result;
  }

  async update(id: number, data: any, currentUserId: number, currentUserRole: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === 'SUPERADMIN' && currentUserRole !== 'SUPERADMIN') {
      throw new ForbiddenException('Los administradores no pueden modificar a los super administradores');
    }

    if (user.role === 'ADMIN' && currentUserRole !== 'SUPERADMIN' && user.id !== currentUserId) {
      throw new ForbiddenException('Un administrador no puede modificar a otro administrador');
    }

    if (data.email && data.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existing) {
        throw new ConflictException('El correo ya está en uso');
      }
    }

    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    } else {
      delete updateData.password;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.logAction('UPDATE', 'User', id, `Updated user ${updatedUser.email}`, currentUserId);

    const { password, ...result } = updatedUser;
    return result;
  }

  async remove(id: number, currentUserId: number, currentUserRole: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === 'SUPERADMIN' && currentUserRole !== 'SUPERADMIN') {
      throw new ForbiddenException('Los administradores no pueden eliminar a los super administradores');
    }

    if (user.role === 'ADMIN' && currentUserRole !== 'SUPERADMIN' && user.id !== currentUserId) {
      throw new ForbiddenException('Un administrador no puede eliminar a otro administrador');
    }

    await this.prisma.user.delete({ where: { id } });
    
    await this.auditService.logAction('DELETE', 'User', id, `Deleted user ${user.email}`, currentUserId);
    
    return { success: true };
  }
}
