/**
 * Super secret super user data.
 */
exports.superUser = {
  loggedIn: true,
  _id: 'admin1234567890123456789',
  name: 'Superadministator',
  login: 'root',
  password: 'r00t',
  privileges: {
    "startStop": "1",
    "pickProgram": "1",
    "viewHistory": "1",
    "purgeHistory": "1",
    "viewPrograms": "1",
    "managePrograms": "1",
    "viewZones": "1",
    "assignPrograms": "1",
    "manageZones": "1",
    "viewControllers": "1",
    "manageControllers": "1",
    "viewUsers": "1",
    "manageUsers": "1",
    "diag": "1",
    "stats": "1"
  }
};

/**
 * Guest (not logged in) user data.
 */
exports.guestUser = {
  loggedIn: false,
  _id: 'guest1234567890123456789',
  name: 'Niezalogowany',
  login: 'guest',
  password: Math.random().toString(),
  privileges: {
    "startStop": "1",
    "viewHistory": "1",
    "viewPrograms": "1"
  }
};
