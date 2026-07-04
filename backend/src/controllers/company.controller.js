const companyModel = require('../models/company.model');

// Every screen in the wireframes shows the signed-in company's own logo in
// the top-left corner (Company Logo placeholder), so the navbar needs a way
// to read it regardless of the caller's role.
async function getCurrentCompany(req, res) {
  const company = await companyModel.findById(req.user.companyId);
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }
  res.json({ id: company.id, name: company.name, logoUrl: company.logo_url });
}

module.exports = { getCurrentCompany };
