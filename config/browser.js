/**
 * Run browser command to execute if the server is run
 * in production environment.
 */
exports.cmd = 'chromium-browser' +
              ' --kiosk http://localhost/'+
              ' --user-data-dir /home/walkner/.config/chromium';
