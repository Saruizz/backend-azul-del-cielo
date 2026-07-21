import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logAction(action: string, entity: string, entityId: number, details: string, userId: number) {
    return this.prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        details,
        userId,
      },
    });
  }

  async getLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      }
    });
  }
}
