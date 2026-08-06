import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { StatsService } from './stats.service'

@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'DIRECTION', 'ENSEIGNANT', 'DELEGUE', 'ETUDIANT')
  async getOverview() {
    return this.statsService.getOverview()
  }
}
