import { companies } from "../src/data/companies";
import { industries } from "../src/data/industries";
import { issues } from "../src/data/issues";
import { routes } from "../src/data/routes";
import { verifications } from "../src/data/verifications";

import { validateData } from "../src/lib/validate-data";

const {errors, warnings} = validateData({companies, industries, issues, routes, verifications});

for (const warning of warnings) {
  console.warn(`DATA WARNING: ${warning}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`DATA ERROR: ${error}`);
  }
  console.error(
    `Data validation failed with ${errors.length} error(s) and ${warnings.length} warning(s).`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `Data validation passed with ${warnings.length} warning(s): ${companies.length} companies, ${issues.length} issues, ${routes.length} routes, ${verifications.length} verifications.`,
  );
}
