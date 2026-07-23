import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";

async function start() {
    const PORT = process.env.PORT || 5000;
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:5173', 'http://localhost:3000'];
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

    app.useStaticAssets(join(process.cwd(), 'src', 'static'), {
        prefix: '/static/',
    });
    const document = SwaggerModule.createDocument(app, config, {
        deepScanRoutes: true,
    });
    SwaggerModule.setup('/api/docs', app, document);

    await app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

start();
