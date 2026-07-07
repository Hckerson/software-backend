import { Module } from '@nestjs/common';
import { RepoModule } from '@common/repos/repo.module';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';

@Module({
    imports: [RepoModule],
    providers: [InvoicesService],
    controllers: [InvoicesController],
    exports: [InvoicesService],
})
export class InvoicesModule {}
