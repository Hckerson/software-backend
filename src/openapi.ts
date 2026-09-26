import { writeFileSync } from 'node:fs';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './common/database/prisma.service';

const OUTPUT = 'openapi.json';
const GLOBAL_PREFIX = 'api';

async function generate() {
    const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
    })
        .overrideProvider(PrismaService)
        .useValue({})
        .compile();

    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix(GLOBAL_PREFIX);

    const config = new DocumentBuilder()
        .setTitle('API')
        .setDescription('Backend REST API documentation')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);

    writeFileSync(OUTPUT, JSON.stringify(document, null, 2));

    const pathCount = Object.keys(document.paths).length;
    const schemaCount = Object.keys(document.components?.schemas ?? {}).length;

    console.log(`${OUTPUT}: ${pathCount} paths, ${schemaCount} schemas`);

    await app.close();
}

void generate();
