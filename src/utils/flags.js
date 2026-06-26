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
