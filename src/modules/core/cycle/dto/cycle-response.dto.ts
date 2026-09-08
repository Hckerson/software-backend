import { ApiProperty } from '@nestjs/swagger';

export class CycleRunSummaryDto {
    @ApiProperty({ example: 3 })
    examined: number;

    @ApiProperty({ example: 2 })
    changed: number;

    @ApiProperty({ example: 1 })
    skipped: number;

    @ApiProperty({ type: [String] })
    details: string[];
}

export class CycleRunAllDto {
    @ApiProperty({ type: CycleRunSummaryDto })
    renewal: CycleRunSummaryDto;

    @ApiProperty({ type: CycleRunSummaryDto })
    overdue: CycleRunSummaryDto;
}
