const COUNTRY_TO_KEY = {
  // Jolpica short codes
  'UK': 'great-britain',
  'USA': 'united-states',
  'UAE': 'abu-dhabi',
  // Full names
  'Great Britain': 'great-britain',
  'United Kingdom': 'great-britain',
  'United Arab Emirates': 'abu-dhabi',
  'United States': 'united-states',
  'Saudi Arabia': 'saudi-arabia',
  'South Korea': 'south-korea',
  'New Zealand': 'new-zealand',
};

export const getFlagUrl = (country) => {
  const key = COUNTRY_TO_KEY[country] ?? country?.toLowerCase().replace(/\s+/g, '-') ?? 'unknown';
  return `https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/${key}-flag.png`;
};

// Driver nationalities as Jolpica reports them, mapped to ISO 3166-1 alpha-2.
// The F1 CDN only ships flags for GP-hosting countries, so driver nationalities
// (Thai, Danish, Finnish…) need a source with full country coverage.
const NATIONALITY_TO_ISO = {
  American: 'us', Argentine: 'ar', Australian: 'au', Austrian: 'at',
  Belgian: 'be', Brazilian: 'br', British: 'gb', Canadian: 'ca',
  Chinese: 'cn', Colombian: 'co', Czech: 'cz', Danish: 'dk',
  Dutch: 'nl', Estonian: 'ee', Finnish: 'fi', French: 'fr',
  German: 'de', Hungarian: 'hu', Indian: 'in', Indonesian: 'id',
  Irish: 'ie', Italian: 'it', Japanese: 'jp', Malaysian: 'my',
  Mexican: 'mx', Monegasque: 'mc', 'New Zealander': 'nz', Polish: 'pl',
  Portuguese: 'pt', Russian: 'ru', 'South African': 'za', Spanish: 'es',
  Swedish: 'se', Swiss: 'ch', Thai: 'th', Venezuelan: 've',
};

/** Flag for a driver nationality, or null when the nationality is unknown. */
export const getFlagUrlByNationality = (nationality) => {
  const iso = NATIONALITY_TO_ISO[nationality];
  return iso ? `https://flagcdn.com/w40/${iso}.png` : null;
};
