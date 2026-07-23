const fs = require('fs');
const files = [
    'src/main.ts',
    'src/app.module.ts',
    'src/auth/auth.service.ts',
    'src/artists/artists.service.ts',
    'src/users/users.service.ts',
    'src/files/files.service.ts'
];

for (const f of files) {
    let c = fs.readFileSync(f, 'utf8');
    const fileSerivce = (c.match(/fileSerivce/g) || []).length;
    const bcryptHash = (c.match(/bcrypt\.hash/g) || []).length;
    const secureFalse = (c.match(/secure: false/g) || []).length;
    const corsOriginTrue = (c.match(/origin: true/g) || []).length;
    const adminDefault = (c.match(/\|\| 'admin'/g) || []).length;
    console.log(f + ':');
    console.log('  fileSerivce=' + fileSerivce);
    console.log('  bcrypt.hash=' + bcryptHash);
    console.log('  secure:false=' + secureFalse);
    console.log('  origin:true=' + corsOriginTrue);
    console.log('  default admin=' + adminDefault);
}
