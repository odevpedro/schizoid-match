import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(AdminGuard)
  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @UseGuards(AdminGuard)
  @Get('reports')
  async getReports() {
    return this.adminService.getReports();
  }

  @UseGuards(AdminGuard)
  @Get('reports/:id')
  async getReport(@Param('id') id: string) {
    return this.adminService.getReport(id);
  }

  @UseGuards(AdminGuard)
  @Post('reports/:id/resolve')
  async resolveReport(
    @Param('id') id: string,
    @Body() body: { action: 'warn' | 'ban' | 'dismiss' },
    @Request() req: any,
  ) {
    return this.adminService.resolveReport(id, body.action, req.user.id);
  }

  @UseGuards(AdminGuard, RolesGuard)
  @Roles('admin')
  @Get('audit')
  async getAuditLog(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAuditLog(page || 1, limit || 20);
  }
}
