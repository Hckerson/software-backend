import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiOkResponse,
    ApiCreatedResponse,
} from '@nestjs/swagger';
import { PaymentMethodsService } from './payment-methods.service';
import { JwtAuthGuard } from '@core/auth/guards';
import { CurrentUser } from '@core/auth/decorators';
import { CreatePaymentMethodDto, PaymentMethodDto } from './dto';

@ApiTags('Billing - Payment Methods')
@Controller('payment-methods')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentMethodsController {
    constructor(private paymentMethodsService: PaymentMethodsService) {}

    @ApiOperation({ summary: 'List your payment methods' })
    @ApiOkResponse({ type: PaymentMethodDto, isArray: true })
    @Get()
    list(@CurrentUser('id') userId: string) {
        return this.paymentMethodsService.list(userId);
    }

    @ApiOperation({ summary: 'Add a payment method' })
    @ApiCreatedResponse({ type: PaymentMethodDto })
    @Post()
    add(
        @CurrentUser('id') userId: string,
        @Body() dto: CreatePaymentMethodDto,
    ) {
        return this.paymentMethodsService.add(userId, dto);
    }

    @ApiOperation({ summary: 'Make a payment method the default' })
    @ApiOkResponse({ type: PaymentMethodDto })
    @Patch(':id/default')
    @HttpCode(HttpStatus.OK)
    setDefault(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.paymentMethodsService.setDefault(userId, id);
    }

    @ApiOperation({ summary: 'Remove a payment method' })
    @ApiOkResponse({ type: PaymentMethodDto })
    @Delete(':id')
    remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.paymentMethodsService.remove(userId, id);
    }
}
