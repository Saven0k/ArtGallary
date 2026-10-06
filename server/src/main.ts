import "./load-env";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { NestExpressApplication } from "@nestjs/platform-express";
import { STATIC_DIR } from "./shared/helpers/static-dir.helper";

async function start() {
    const PORT = process.env.PORT || 5000;
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // За reverse proxy (Caddy / nginx / docker) — чтобы req.ip и secure-cookie работали корректно
    if (process.env.TRUST_PROXY === 'true') {
        app.set('trust proxy', 1);
    }

    const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean)
        ?? ['http://localhost:5173', 'http://localhost:3000'];
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    });

    app.use(cookieParser());
    const config = new DocumentBuilder()
        .setTitle('GalleryTema')
        .setDescription('REST API Documentation')
        .setVersion('1.0.0')
        .addTag('Gallery')
        .build();

    app.useStaticAssets(STATIC_DIR, {
        prefix: '/static/',
    });

    // Swagger: в production выключен, если явно не включён SWAGGER_ENABLED=true
    const swaggerEnabled = process.env.SWAGGER_ENABLED
        ? process.env.SWAGGER_ENABLED === 'true'
        : process.env.NODE_ENV !== 'production';
    if (swaggerEnabled) {
        const document = SwaggerModule.createDocument(app, config, {
            deepScanRoutes: true,
        });
        SwaggerModule.setup('/api/docs', app, document);
    }

    await app.listen(PORT, '0.0.0.0',() => console.log(`Server started on port ${PORT}`));
}

start();
