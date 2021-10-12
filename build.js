var shell = require('shelljs');

shell.cd("vue")
shell.exec('npm run build')
shell.cd("..")