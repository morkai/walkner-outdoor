/**
 * Run browser command to execute if the server is run
 * in production environment.
 */
exports.cmd = 'google-chrome' +
              ' --incognito' +
              ' --kiosk=http://localhost/' +
              ' --user-data-dir=/root/chrome';
