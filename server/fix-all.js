const fs = require('fs');


{
    let c = fs.readFileSync('src/main.ts', 'utf8');


    c = c.replace(/process\.env\.port/g, 'process.env.PORT');


    c = c.replace(
        /app\.enableCors\(\{\s*\n\s*origin: true,\s*\n\s*credentials: true,\s*\n\s*\}\)/s,
        `app.enableCors({
        origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
        credentials: true,
    })`
    );


    c = c.replace(/setTitle\('Галерея'\)/g, "setTitle('GalleryTema')");
    c = c.replace(/setDescription\("Документация REST API"\)/g, "setDescription('REST API Documentation')");


    c = c.replace(
        /console\.log\("Server start", \{ PORT \}\)/,
        "console.log(`Server started on port ${PORT}`)"
    );

    fs.writeFileSync('src/main.ts', c);
    console.log('✓ main.ts fixed');
}


{
    let c = fs.readFileSync('src/app.module.ts', 'utf8');


    c = c.replace(/synchronize: true/g, "synchronize: process.env.NODE_ENV === 'development'");


    c = c.replace(/logging: console\.log/g, "logging: process.env.NODE_ENV === 'development' ? console.log : false");


    c = c.replace(/autoLoadModels: true/g, '');

    fs.writeFileSync('src/app.module.ts', c);
    console.log('✓ app.module.ts fixed');
}


{
    let c = fs.readFileSync('src/auth/auth.service.ts', 'utf8');


    c = c.replace(/signRefershToken/g, 'signRefreshToken');


    c = c.replace(
        /secure: false\s*\n/s,
        "secure: process.env.NODE_ENV === 'production'\n"
    );


    c = c.replace(
        /this\.config\.get\("JWT_ACCESS_SECRET"\)/g,
        "this.config.getOrThrow<string>('JWT_ACCESS_SECRET')"
    );
    c = c.replace(
        /this\.config\.get\("JWT_REFRESH_SECRET"\)/g,
        "this.config.getOrThrow<string>('JWT_REFRESH_SECRET')"
    );

    fs.writeFileSync('src/auth/auth.service.ts', c);
    console.log('✓ auth.service.ts fixed');
}


{
    let c = fs.readFileSync('src/authors/authors.service.ts', 'utf8');


    c = c.replace(/fileSerivce/g, 'fileService');


    c = c.replace(
        /await bcrypt\.hash\(dto\.password, 5\)/g,
        'await this.passwordService.hashPassword(dto.password)'
    );

    fs.writeFileSync('src/authors/authors.service.ts', c);
    console.log('✓ authors.service.ts fixed');
}


{
    let c = fs.readFileSync('src/users/users.service.ts', 'utf8');


    const oldLine = "const adminPassword = process.env.ADMIN_PASSWORD || 'admin';";
    const newCode = `if (!process.env.ADMIN_PASSWORD) {
            throw new Error('ADMIN_PASSWORD must be set in production');
        }
        const adminPassword = process.env.ADMIN_PASSWORD;`;

    c = c.replace(oldLine, newCode);

    fs.writeFileSync('src/users/users.service.ts', c);
    console.log('✓ users.service.ts fixed');
}


{
    let c = fs.readFileSync('src/files/files.service.ts', 'utf8');


    const importEnd = c.indexOf('@Injectable()');
    const securityConstants = `const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

`;
    c = c.substring(0, importEnd) + securityConstants + c.substring(importEnd);


    const createStart = c.indexOf('async createFile(file: any): Promise<string>');
    const createEnd = c.indexOf('\n    async removeFile', createStart);

    const newCreateMethod = `async createFile(file: any): Promise<string> {
        // Валидация файла
        if (!file || !file.buffer) {
            throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
        }
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new HttpException('Unsupported file type', HttpStatus.BAD_REQUEST);
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new HttpException('File too large (max 10MB)', HttpStatus.BAD_REQUEST);
        }

        const fileExtension = file.originalname?.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = \`\${uuid.v4()}.\${fileExtension}\`;
        const staticDir = path.resolve(process.cwd(), 'src', 'static');
        const resolvedPath = path.resolve(staticDir, fileName);

        // Защита от path traversal
        if (!resolvedPath.startsWith(path.resolve(staticDir))) {
            throw new HttpException('Invalid file path', HttpStatus.FORBIDDEN);
        }

        if (!fs.existsSync(staticDir)) {
            fs.mkdirSync(staticDir, { recursive: true });
        }

        fs.writeFileSync(resolvedPath, file.buffer);

        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        return \`\${baseUrl}/static/\${fileName}\`;
    }`;

    c = c.substring(0, createStart) + newCreateMethod + c.substring(createEnd);


    const removeStart = c.indexOf('async removeFile(fileURL: string)');
    const removeEnd = c.indexOf('\n}', removeStart) + 2;

    const newRemoveMethod = `async removeFile(fileURL: string) {
        const cleanUrl = fileURL.replace(/^https?:\\/\\//, '').replace(/^\\/static\\//, '');
        const fileName = cleanUrl.split('/').filter(Boolean).pop();
        if (!fileName) {
            throw new HttpException('Invalid file URL', HttpStatus.BAD_REQUEST);
        }

        const staticDir = path.resolve(process.cwd(), 'src', 'static');
        const resolvedPath = path.resolve(staticDir, fileName);

        // Защита от path traversal
        if (!resolvedPath.startsWith(path.resolve(staticDir))) {
            throw new HttpException('Invalid file path', HttpStatus.FORBIDDEN);
        }

        if (fs.existsSync(resolvedPath)) {
            fs.unlinkSync(resolvedPath);
        }
    }`;

    c = c.substring(0, removeStart) + newRemoveMethod + c.substring(removeEnd);

    fs.writeFileSync('src/files/files.service.ts', c);
    console.log('✓ files.service.ts fixed');
}

// === 7. Удаление // комментариев (кроме TODO и JSDoc /** */) ===
{
    const path = require('path');

    function walk(dir) {
        let result = [];
        for (const f of fs.readdirSync(dir)) {
            const p = path.join(dir, f);
            if (fs.statSync(p).isDirectory()) {
                result = result.concat(walk(p));
            } else {
                result.push(p);
            }
        }
        return result;
    }

    let count = 0;
    for (const f of walk('src').filter(f => f.endsWith('.ts'))) {
        let c = fs.readFileSync(f, 'utf8');
        const lines = c.split('\n');
        const newLines = [];
        let inJSDoc = false;

        for (const line of lines) {
            const trimmed = line.trim();


            if (trimmed.startsWith('/**')) {
                inJSDoc = true;
                newLines.push(line);
                if (trimmed.includes('*/')) {
                    inJSDoc = false;
                }
                continue;
            }
            if (inJSDoc) {
                newLines.push(line);
                continue;
            }

            // Удаляем обычные комментарии, кроме TODO
            if (trimmed.startsWith('//') && !trimmed.includes('TODO')) {
                continue;
            }

            newLines.push(line);
        }

        const newC = newLines.join('\n');
        if (newC !== c) {
            fs.writeFileSync(f, newC);
            count++;
        }
    }
    console.log('✓ Removed comments from ' + count + ' files');
}

console.log('\nAll fixes applied!');
