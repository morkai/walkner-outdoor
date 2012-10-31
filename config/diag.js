var normalize = require('path').normalize;

/**
 * Value of the `key` query parameter used to bypass the session authorization
 * during download of a backup file.
 *
 * @type {String}
 */
exports.backupSecretKey = 'bakap!plx';

/**
 * Number of seconds between database backups.
 *
 * @type {Number}
 */
exports.backupInterval = 3600 * 24;

/**
 * Path to the database backups directory.
 *
 * @type {String}
 */
exports.backupsPath = normalize(__dirname + '/../var/backups');

/**
 * Path to the `mongodump` executable.
 *
 * @type {String}
 */
exports.mongodump = 'mongodump';

/**
 * IP address of a COAP controller with devscan support
 * Must exist in the database.
 *
 * @type {String}
 */
exports.coordinatorIp = '1111::215:8dff:fe0f:33b8';
