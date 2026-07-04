// Format from the wireframe: [CompanyInitials][First2OfFirstName+First2OfLastName][JoinYear][4-digit serial]
// Example: OIJODO20220001  ->  OI (Oodo India) + JODO (John Doe) + 2022 + 0001

function companyInitials(companyName) {
  return companyName
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function namePart(firstName, lastName) {
  const first = firstName.trim().slice(0, 2).toUpperCase();
  const last = lastName.trim().slice(0, 2).toUpperCase();
  return `${first}${last}`;
}

function generateEmployeeCode({ companyName, firstName, lastName, joinYear, serial }) {
  const initials = companyInitials(companyName);
  const name = namePart(firstName, lastName);
  const paddedSerial = String(serial).padStart(4, '0');
  return `${initials}${name}${joinYear}${paddedSerial}`;
}

module.exports = { generateEmployeeCode, companyInitials, namePart };
