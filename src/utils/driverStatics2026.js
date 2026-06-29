const B = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers';
const url = (path) => `${B}${path}.transform/2col/image.png`;

// Static 2026 driver data keyed by name_acronym (OpenF1 format)
// headshot_url: verified F1 media CDN URLs
// team_colour: hex without '#' (OpenF1 format)
export const DRIVER_STATICS_2026 = new Map([
  ['ANT', { headshot_url: url('/K/ANDANT01_Kimi_Antonelli/andant01.png'), team_colour: '27F4D2', full_name: 'Kimi ANTONELLI' }],
  ['HAM', { headshot_url: url('/L/LEWHAM01_Lewis_Hamilton/lewham01.png'), team_colour: 'E8002D', full_name: 'Lewis HAMILTON' }],
  ['RUS', { headshot_url: url('/G/GEORUS01_George_Russell/georus01.png'), team_colour: '27F4D2', full_name: 'George RUSSELL' }],
  ['LEC', { headshot_url: url('/C/CHALEC01_Charles_Leclerc/chalec01.png'), team_colour: 'E8002D', full_name: 'Charles LECLERC' }],
  ['SAI', { headshot_url: url('/C/CARSAI01_Carlos_Sainz/carsai01.png'), team_colour: '64C4FF', full_name: 'Carlos SAINZ' }],
  ['NOR', { headshot_url: url('/L/LANNOR01_Lando_Norris/lannor01.png'), team_colour: 'FF8000', full_name: 'Lando NORRIS' }],
  ['PIA', { headshot_url: url('/O/OSCPIA01_Oscar_Piastri/oscpia01.png'), team_colour: 'FF8000', full_name: 'Oscar PIASTRI' }],
  ['VER', { headshot_url: url('/M/MAXVER01_Max_Verstappen/maxver01.png'), team_colour: '3671C6', full_name: 'Max VERSTAPPEN' }],
  ['HAD', { headshot_url: url('/I/ISAHAD01_Isack_Hadjar/isahad01.png'), team_colour: '3671C6', full_name: 'Isack HADJAR' }],
  ['LAW', { headshot_url: url('/L/LIALAW01_Liam_Lawson/lialaw01.png'), team_colour: '6692FF', full_name: 'Liam LAWSON' }],
  ['LIN', { headshot_url: url('/A/ARVLIN01_Arvid_Lindblad/arvlin01.png'), team_colour: '6692FF', full_name: 'Arvid LINDBLAD' }],
  ['GAS', { headshot_url: url('/P/PIEGAS01_Pierre_Gasly/piegas01.png'), team_colour: 'FF87BC', full_name: 'Pierre GASLY' }],
  ['COL', { headshot_url: url('/F/FRACOL01_Franco_Colapinto/fracol01.png'), team_colour: 'FF87BC', full_name: 'Franco COLAPINTO' }],
  ['ALB', { headshot_url: url('/A/ALEALB01_Alexander_Albon/alealb01.png'), team_colour: '64C4FF', full_name: 'Alexander ALBON' }],
  ['BEA', { headshot_url: url('/O/OLIBEA01_Oliver_Bearman/olibea01.png'), team_colour: 'B6BABD', full_name: 'Oliver BEARMAN' }],
  ['OCO', { headshot_url: url('/E/ESTOCO01_Esteban_Ocon/estoco01.png'), team_colour: 'B6BABD', full_name: 'Esteban OCON' }],
  ['BOR', { headshot_url: url('/G/GABBOR01_Gabriel_Bortoleto/gabbor01.png'), team_colour: '52E252', full_name: 'Gabriel BORTOLETO' }],
  ['HUL', { headshot_url: url('/N/NICHUL01_Nico_Hulkenberg/nichul01.png'), team_colour: '52E252', full_name: 'Nico HULKENBERG' }],
  ['ALO', { headshot_url: url('/F/FERALO01_Fernando_Alonso/feralo01.png'), team_colour: '229971', full_name: 'Fernando ALONSO' }],
  ['STR', { headshot_url: url('/L/LANSTR01_Lance_Stroll/lanstr01.png'), team_colour: '229971', full_name: 'Lance STROLL' }],
  ['BOT', { headshot_url: url('/V/VALBOT01_Valtteri_Bottas/valbot01.png'), team_colour: 'FFFFFF', full_name: 'Valtteri BOTTAS' }],
  ['PER', { headshot_url: url('/S/SERPER01_Sergio_Perez/serper01.png'), team_colour: 'FFFFFF', full_name: 'Sergio PEREZ' }],
]);
