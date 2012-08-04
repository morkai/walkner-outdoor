/**
 * Run browser command to execute if the server is run
 * in production environment.
 */
exports.cmd = 'google-chrome' +
              ' --incognito' +
              ' --user-data-dir=/root/chrome' +
              ' --kiosk http://localhost/';
