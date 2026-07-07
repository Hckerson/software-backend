import { Module } from '@nestjs/common';
import { RepoModule } from '@common/repos/repo.module';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';

@Module({
    imports: [RepoModule],
    providers: [PlansService],
    controllers: [PlansController],
    exports: [PlansService],
})
export class PlansModule {}
