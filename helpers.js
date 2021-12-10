const getUserByEmail = function(email, users) {
  if (users == null) {
    return null;
  }
  for (let user of Object.values(users)) {
    if (user.email === email) {
      return user;
    }
  }
};

module.exports = {getUserByEmail};