function calculateExpirationDate(option) {
  const date = new Date();
  switch (option) {
    case '1 day':
      date.setDate(date.getDate() + 1);
      break;
    case '1 week':
      date.setDate(date.getDate() + 7);
      break;
    case '1 month':
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      return null;
  }
  return date;
}

module.exports = { calculateExpirationDate };