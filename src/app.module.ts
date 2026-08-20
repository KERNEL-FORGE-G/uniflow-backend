import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { UeModule } from './ue/ue.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { SyncModule } from './sync/sync.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { CoursesModule } from './courses/courses.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AttendanceModule } from './attendance/attendance.module';
import { VideoconferenceModule } from './videoconference/videoconference.module';
<<<<<<< Updated upstream
=======
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { StatsModule } from './stats/stats.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { MessagesModule } from './messages/messages.module';
import { ForumModule } from './forum/forum.module';
>>>>>>> Stashed changes

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    PrismaModule,
    StudentsModule,
    TeachersModule,
    UeModule,
    EnrollmentsModule,
    SyncModule,
    NotificationsModule,
    ClassroomsModule,
    CoursesModule,
    SchedulesModule,
    AttendanceModule,
    VideoconferenceModule,
<<<<<<< Updated upstream
=======
    StatsModule,
    AuditLogsModule,
    AdminToolModule,
    MessagesModule,
    ForumModule
>>>>>>> Stashed changes
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
