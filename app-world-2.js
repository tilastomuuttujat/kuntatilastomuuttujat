(function() {
  var paper = Raphael('container', 1400, 760);

  // Currently selected country
  var current = { country : null, elements : [] };

  // Origin elements
  var origins = [];

  var amountScale = 0.0000006;
  var threshold = 10000;
  var template = $('#migration-row').html();
  var mode = 'out';
  var maxCurves = 15;

  var data = {
"Cayman Islands":{"totalIn":1538,"totalOut":17,"out":[],"in":[]},
"S\u00e3o Tom\u00e9 and Principe":{"totalIn":166,"totalOut":19,"out":[],"in":[]},

"Gambia, The":{"totalIn":708,"totalOut":26,"out":[],"in":[]},
"Bermuda":{"totalIn":1055,"totalOut":29,"out":[],"in":[]},
"Samoa":{"totalIn":368,"totalOut":29,"out":[],"in":[]},
"St. Vincent and the Grenadines":{"totalIn":372,"totalOut":35,"out":[],"in":[]},
"Comoros":{"totalIn":443,"totalOut":35,"out":[],"in":[]},
"Grenada":{"totalIn":447,"totalOut":35,"out":[],"in":[]},
"Aruba":{"totalIn":1170,"totalOut":88,"out":[],"in":[]},
"Burundi":{"totalIn":981,"totalOut":113,"out":[],"in":[]},
"Maldives":{"totalIn":2574,"totalOut":151,"out":[],"in":[]},
"Belize":{"totalIn":1060,"totalOut":264,"out":[],"in":[]},
"Barbados":{"totalIn":1673,"totalOut":350,"out":[],"in":[]},
"Montenegro":{"totalIn":2946,"totalOut":516,"out":[],"in":[]},
"Fiji":{"totalIn":2116,"totalOut":815,"out":[],"in":[]},
"Benin":{"totalIn":3186,"totalOut":1024,"out":[],"in":[]},
"Togo":{"totalIn":2863,"totalOut":1080,"out":[],"in":[]},
"Macao, China":{"totalIn":19347,"totalOut":1392,"out":[],"in":[]},
"Tajikistan":{"totalIn":4216,"totalOut":1477,"out":[],"in":[]},
"Suriname":{"totalIn":1381,"totalOut":1513,"out":[],"in":[]},

"Rwanda":{"totalIn":3734,"totalOut":1562,"out":[],"in":[]},
"Nepal":{"totalIn":15830,"totalOut":1666,"out":[],"in":[]},
"Mauritius":{"totalIn":5147,"totalOut":1672,"out":[],"in":[]},
"Kyrgyz Republic":{"totalIn":5448,"totalOut":1688,"out":[],"in":[]},
"Swaziland":{"totalIn":2123,"totalOut":2068,"out":[],"in":[]},
"Congo, Rep.":{"totalIn":2352,"totalOut":2362,"out":[],"in":[]},
"Madagascar":{"totalIn":4364,"totalOut":2705,"out":[],"in":[]},
"Armenia":{"totalIn":5324,"totalOut":2965,"out":[],"in":[]},
"Ethiopia":{"totalIn":15285,"totalOut":3058,"out":[],"in":[]},
"Moldova":{"totalIn":7177,"totalOut":3145,"out":[],"in":[]},
"Malta":{"totalIn":7075,"totalOut":3200,"out":[],"in":[]},
"Mauritania":{"totalIn":3860,"totalOut":3267,"out":[],"in":[]},
"Panama":{"totalIn":13313,"totalOut":3782,"out":[],"in":[]},
"Cyprus":{"totalIn":10231,"totalOut":3990,"out":[],"in":[]},
"Lebanon":{"totalIn":13857,"totalOut":4230,"out":[],"in":[]},

"Georgia":{"totalIn":10100,"totalOut":4243,"out":[],"in":[]},
"Guyana":{"totalIn":4160,"totalOut":4257,"out":[],"in":[]},
"Honduras":{"totalIn":11631,"totalOut":4976,"out":[],"in":[]},
"Burkina Faso":{"totalIn":4710,"totalOut":5060,"out":[],"in":[]},
"Mozambique":{"totalIn":8623,"totalOut":5112,"out":[],"in":[]},
"Senegal":{"totalIn":9699,"totalOut":5202,"out":[],"in":[]},
"Iceland":{"totalIn":7838,"totalOut":5974,"out":[],"in":[]},
"Zimbabwe":{"totalIn":7578,"totalOut":6036,"out":[],"in":[]},
"Tanzania":{"totalIn":10873,"totalOut":6391,"out":[],"in":[]},
"Nicaragua":{"totalIn":9826,"totalOut":6495,"out":[],"in":[]},

"El Salvador":{"totalIn":15076,"totalOut":6629,"out":[],"in":[]},
"Kenya":{"totalIn":19594,"totalOut":6751,"out":[],"in":[]},
"Lao PDR":{"totalIn":5871,"totalOut":7165,"out":[],"in":[]},
"Botswana":{"totalIn":8459,"totalOut":7473,"out":[],"in":[]},

"Macedonia, FYR":{"totalIn":11390,"totalOut":8186,"out":[],"in":[]},
"Bosnia and Herzegovina":{"totalIn":13029,"totalOut":8614,"out":[],"in":[]},
"Trinidad and Tobago":{"totalIn":5761,"totalOut":8620,"out":[],"in":[]},
"Mongolia":{"totalIn":6844,"totalOut":9241,"out":[],"in":[]},
"Jordan":{"totalIn":21542,"totalOut":9357,"out":[],"in":[]},

"Uruguay":{"totalIn":10320,"totalOut":9507,"out":[],"in":[]},
"Paraguay":{"totalIn":13560,"totalOut":10571,"out":[],"in":[]},
"Brunei Darussalam":{"totalIn":8575,"totalOut":11058,"out":[],"in":[]},
"Bolivia":{"totalIn":9618,"totalOut":11080,"out":[],"in":[]},
"Zambia":{"totalIn":7095,"totalOut":11141,"out":[],"in":[]},
"Dominican Republic":{"totalIn":24482,"totalOut":11725,"out":[],"in":[]},
"Sri Lanka":{"totalIn":21502,"totalOut":13331,"out":[],"in":[]},
"Guatemala":{"totalIn":26594,"totalOut":13736,"out":[],"in":[]},
"Uzbekistan":{"totalIn":23886,"totalOut":14092,"out":[],"in":[]},
"Costa Rica":{"totalIn":18428,"totalOut":14345,"out":[],"in":[]},
"Myanmar":{"totalIn":14322,"totalOut":15145,"out":[],"in":[]},
"Luxembourg":{"totalIn":25537,"totalOut":16247,"out":[],"in":[]},
"Tunisia":{"totalIn":22496,"totalOut":16695,"out":[],"in":[]},

"Cambodia":{"totalIn":28703,"totalOut":17572,"out":[],"in":[]},
"Latvia":{"totalIn":23086,"totalOut":19459,"out":[],"in":[]},
"Croatia":{"totalIn":33735,"totalOut":21828,"out":[],"in":[]},
"Azerbaijan":{"totalIn":11698,"totalOut":22207,"out":[],"in":[]},
"Estonia":{"totalIn":24152,"totalOut":22282,"out":[],"in":[]},

"Serbia":{"totalIn":33793,"totalOut":25566,"out":[],"in":[]},
"Ecuador":{"totalIn":25687,"totalOut":26699,"out":[],"in":[]},
"Pakistan":{"totalIn":72892,"totalOut":28795,"out":[],"in":[]},
"Angola":{"totalIn":11360,"totalOut":33744,"out":[],"in":[]},
"Morocco":{"totalIn":58678,"totalOut":36585,"out":[],"in":[]},
"Belarus":{"totalIn":41811,"totalOut":39889,"out":[],"in":[]},
"Egypt, Arab Rep.":{"totalIn":73781,"totalOut":40702,"out":[],"in":[]},

"Lithuania":{"totalIn":44571,"totalOut":40818,"out":[],"in":[]},
"Bulgaria":{"totalIn":46396,"totalOut":41371,"out":[],"in":[]},
"Colombia":{"totalIn":61099,"totalOut":41390,"out":[],"in":[]},
"Oman":{"totalIn":30995,"totalOut":44591,"out":[],"in":[]},
"Slovenia":{"totalIn":49067,"totalOut":46692,"out":[],"in":[]},
"Nigeria":{"totalIn":52068,"totalOut":47232,"out":[],"in":[]},
"Peru":{"totalIn":51178,"totalOut":56260,"out":[],"in":[]},
"Israel":{"totalIn":92159,"totalOut":60160,"out":[],"in":[]},

"Ukraine":{"totalIn":69963,"totalOut":65870,"out":[],"in":[]},
"New Zealand":{"totalIn":49882,"totalOut":73366,"out":[],"in":[]},
"Philippines":{"totalIn":124390,"totalOut":74620,"out":[],"in":[]},
"Portugal":{"totalIn":98337,"totalOut":75243,"out":[],"in":[]},
"Argentina":{"totalIn":63184,"totalOut":77934,"out":[],"in":[]},
"Finland":{"totalIn":86264,"totalOut":81500,"out":[],"in":[]},
"Qatar":{"totalIn":27985,"totalOut":87203,"out":[],"in":[]},
"Romania":{"totalIn":116402,"totalOut":88390,"out":[],"in":[]},

"Greece":{"totalIn":154570,"totalOut":94489,"out":[],"in":[]},
"Chile":{"totalIn":92191,"totalOut":94677,"out":[],"in":[]},
"Slovak Republic":{"totalIn":105142,"totalOut":104733,"out":[],"in":[]},
"South Africa":{"totalIn":93440,"totalOut":121321,"out":[],"in":[]},

"Denmark":{"totalIn":121784,"totalOut":125015,"out":[],"in":[]},
"Hungary":{"totalIn":139132,"totalOut":141157,"out":[],"in":[]},
"Norway":{"totalIn":99193,"totalOut":161687,"out":[],"in":[]},
"Sweden":{"totalIn":187116,"totalOut":189845,"out":[],"in":[]},
"Ireland":{"totalIn":122755,"totalOut":195998,"out":[],"in":[]},
"Austria":{"totalIn":218972,"totalOut":201647,"out":[],"in":[]},
"Turkey":{"totalIn":271426,"totalOut":225214,"out":[],"in":[]},

"Czech Republic":{"totalIn":211839,"totalOut":227161,"out":[],"in":[]},
"Indonesia":{"totalIn":196190,"totalOut":231522,"out":[],"in":[]},
"Thailand":{"totalIn":268205,"totalOut":266675,"out":[],"in":[]},
"Brazil":{"totalIn":234690,"totalOut":280815,"out":[],"in":[]},
"Saudi Arabia":{"totalIn":152695,"totalOut":286467,"out":[],"in":[]},
"Malaysia":{"totalIn":238250,"totalOut":299230,"out":[],"in":[]},
"Poland":{"totalIn":335451,"totalOut":317832,"out":[],"in":[]},
"Vietnam":{"totalIn":330752,"totalOut":335793,"out":[],"in":[]},
"Australia":{"totalIn":261586,"totalOut":342036,"out":[],"in":[]},
"Switzerland":{"totalIn":323356,"totalOut":379771,"out":[],"in":[]},
"Belgium":{"totalIn":393655,"totalOut":386354,"out":[],"in":[]},
"Spain":{"totalIn":426060,"totalOut":391559,"out":[],"in":[]},
"India":{"totalIn":570402,"totalOut":394814,"out":[],"in":[]},

"United Arab Emirates":{"totalIn":347529,"totalOut":425160,"out":[],"in":[]},
"Singapore":{"totalIn":406622,"totalOut":457474,"out":[],"in":[]},
"United Kingdom":{"totalIn":688237,"totalOut":470548,"out":[],"in":[]},
"Russian Federation":{"totalIn":293497,"totalOut":492314,"out":[],"in":[]},
"Mexico":{"totalIn":506565,"totalOut":494596,"out":[],"in":[]},
"Canada":{"totalIn":489391,"totalOut":501463,"out":[],"in":[]},
"France":{"totalIn":714842,"totalOut":585148,"out":[],"in":[]},
"Italy":{"totalIn":568202,"totalOut":615910,"out":[],"in":[]},
"Korea, Rep.":{"totalIn":615014,"totalOut":644411,"out":[],"in":[]},
"Hong Kong, China":{"totalIn":713173,"totalOut":670926,"out":[],"in":[]},
"Netherlands":{"totalIn":622870,"totalOut":696130,"out":[],"in":[]},
"Japan":{"totalIn":772276,"totalOut":757066,"out":[],"in":[]},
"Germany":{"totalIn":1424675,"totalOut":1635600,"out":[],"in":[]},
"United States":{"totalIn":2932976,"totalOut":1753137,"out":[],"in":[]},
"China":{"totalIn":2684363,"totalOut":3362302,"out":[],"in":[]}
};
  
  
  var places = {"Korea, Rep.": {"lat": 36.5, "lon": 127.6}, "Korea, Dem. Rep.": {"lat": 40.2, "lon": 127.3}, "Macedonia, FYR": {"lat": 41.5, "lon": 21.5}, "Micronesia, Fed. Sts.": {"lat": 6.9, "lon": 158.2}, "Canada": {"lat": 56.130366, "lon": -106.346771}, "Turkmenistan": {"lat": 38.969719, "lon": 59.556278}, "Lao PDR": {"lat": 17.9454864, "lon": 102.620515}, "Lithuania": {"lat": 55.169438, "lon": 23.881275}, "Cambodia": {"lat": 12.565679, "lon": 104.990963}, "Ethiopia": {"lat": 9.145000000000001, "lon": 40.489673}, "Aruba": {"lat": 12.52111, "lon": -69.968338}, "Swaziland": {"lat": -26.522503, "lon": 31.465866}, "Argentina": {"lat": -38.416097, "lon": -63.61667199999999}, "Bolivia": {"lat": -16.290154, "lon": -63.58865299999999}, "Bahamas, The": {"lat": 25.03428, "lon": -77.39627999999999}, "Burkina Faso": {"lat": 12.238333, "lon": -1.561593}, "Ghana": {"lat": 7.946527, "lon": -1.023194}, "Saudi Arabia": {"lat": 23.885942, "lon": 45.079162}, "Japan": {"lat": 36.204824, "lon": 138.252924}, "Channel Islands": {"lat": 33.9986014, "lon": -119.8583772}, "American Samoa": {"lat": -14.305941, "lon": -170.6962002}, "Northern Mariana Islands": {"lat": 15.0979, "lon": 145.6739}, "Slovenia": {"lat": 46.151241, "lon": 14.995463}, "Guatemala": {"lat": 15.783471, "lon": -90.23075899999999}, "Bosnia and Herzegovina": {"lat": 43.915886, "lon": 17.679076}, "Kuwait": {"lat": 29.31166, "lon": 47.481766}, "Russian Federation": {"lat": 61.52401, "lon": 105.318756}, "Jordan": {"lat": 30.585164, "lon": 36.238414}, "St. Lucia": {"lat": 13.909444, "lon": -60.978893}, "Congo, Rep.": {"lat": 19.4315957, "lon": -70.6945063}, "Dominica": {"lat": 15.414999, "lon": -61.37097600000001}, "Liberia": {"lat": 6.428055, "lon": -9.429499000000002}, "Maldives": {"lat": 1.9772469, "lon": 73.5361035}, "Pakistan": {"lat": 30.375321, "lon": 69.34511599999999}, "Oman": {"lat": 21.512583, "lon": 55.923255}, "Tanzania": {"lat": -6.369028, "lon": 34.888822}, "Albania": {"lat": 41.153332, "lon": 20.168331}, "Gabon": {"lat": -0.803689, "lon": 11.609444}, "Monaco": {"lat": 43.73841760000001, "lon": 7.424615799999999}, "New Zealand": {"lat": -40.900557, "lon": 174.885971}, "Jamaica": {"lat": 18.109581, "lon": -77.297508}, "Greenland": {"lat": 71.706936, "lon": -42.604303}, "Samoa": {"lat": -13.759029, "lon": -172.104629}, "Slovak Republic": {"lat": 48.669026, "lon": 19.699024}, "United Arab Emirates": {"lat": 23.424076, "lon": 53.847818}, "C\u00f4te d'Ivoire": {"lat": 7.539988999999999, "lon": -5.547079999999999}, "Uruguay": {"lat": -32.522779, "lon": -55.765835}, "India": {"lat": 20.593684, "lon": 78.96288}, "Azerbaijan": {"lat": 40.143105, "lon": 47.576927}, "Lesotho": {"lat": -29.609988, "lon": 28.233608}, "Kenya": {"lat": -0.023559, "lon": 37.906193}, "Tajikistan": {"lat": 38.861034, "lon": 71.276093}, "Guam": {"lat": 13.444304, "lon": 144.793731}, "Turkey": {"lat": 38.963745, "lon": 35.243322}, "Afghanistan": {"lat": 33.93911, "lon": 67.709953}, "Venezuela, RB": {"lat": 10.1840932, "lon": -64.684618}, "Bangladesh": {"lat": 23.684994, "lon": 90.356331}, "Mauritania": {"lat": 21.00789, "lon": -10.940835}, "Solomon Islands": {"lat": -9.64571, "lon": 160.156194}, "Turks and Caicos Islands": {"lat": 21.694025, "lon": -71.797928}, "San Marino": {"lat": 43.94236, "lon": 12.457777}, "French Polynesia": {"lat": -17.679742, "lon": -149.406843}, "France": {"lat": 46.227638, "lon": 2.213749}, "Syrian Arab Republic": {"lat": 34.80207499999999, "lon": 38.996815}, "Bermuda": {"lat": 32.3078, "lon": -64.7505}, "Somalia": {"lat": 5.152149, "lon": 46.199616}, "Peru": {"lat": -9.189967, "lon": -75.015152}, "Vanuatu": {"lat": -15.376706, "lon": 166.959158}, "Nigeria": {"lat": 9.081999, "lon": 8.675277}, "Seychelles": {"lat": -4.679574, "lon": 55.491977}, "Norway": {"lat": 60.47202399999999, "lon": 8.468945999999999}, "Malawi": {"lat": -13.254308, "lon": 34.301525}, "West Bank and Gaza": {"lat": 31.0354252, "lon": 31.3791056}, "Benin": {"lat": 9.30769, "lon": 2.315834}, "Macao, China": {"lat": 22.198745, "lon": 113.543873}, "Cuba": {"lat": 21.521757, "lon": -77.781167}, "Cameroon": {"lat": 7.369721999999999, "lon": 12.354722}, "Montenegro": {"lat": 42.708678, "lon": 19.37439}, "Togo": {"lat": 8.619543, "lon": 0.824782}, "China": {"lat": 35.86166, "lon": 104.195397}, "Armenia": {"lat": 40.069099, "lon": 45.038189}, "Timor-Leste": {"lat": -8.874217, "lon": 125.727539}, "Dominican Republic": {"lat": 18.735693, "lon": -70.162651}, "Ukraine": {"lat": 48.379433, "lon": 31.16558}, "Bahrain": {"lat": 26.0667, "lon": 50.5577}, "Tonga": {"lat": -21.178986, "lon": -175.198242}, "Finland": {"lat": 61.92410999999999, "lon": 25.748151}, "Libya": {"lat": 26.3351, "lon": 17.228331}, "Cayman Islands": {"lat": 19.3133, "lon": -81.2546}, "Central African Republic": {"lat": 6.611110999999999, "lon": 20.939444}, "Mauritius": {"lat": -20.348404, "lon": 57.55215200000001}, "Liechtenstein": {"lat": 47.166, "lon": 9.555373}, "Belarus": {"lat": 53.709807, "lon": 27.953389}, "Mali": {"lat": 17.570692, "lon": -3.996166}, "Sweden": {"lat": 60.12816100000001, "lon": 18.643501}, "Bulgaria": {"lat": 42.733883, "lon": 25.48583}, "United States": {"lat": 37.09024, "lon": -95.712891}, "Romania": {"lat": 45.943161, "lon": 24.96676}, "Angola": {"lat": -11.202692, "lon": 17.873887}, "Egypt, Arab Rep.": {"lat": 30.0390502, "lon": 31.2330754}, "South Africa": {"lat": -30.559482, "lon": 22.937506}, "St. Vincent and the Grenadines": {"lat": 13.2533835, "lon": -61.196251}, "Cyprus": {"lat": 35.126413, "lon": 33.429859}, "Brunei Darussalam": {"lat": 4.535277, "lon": 114.727669}, "Qatar": {"lat": 25.354826, "lon": 51.183884}, "Malaysia": {"lat": 4.210484, "lon": 101.975766}, "Austria": {"lat": 47.516231, "lon": 14.550072}, "Vietnam": {"lat": 14.058324, "lon": 108.277199}, "Mozambique": {"lat": -18.665695, "lon": 35.529562}, "Uganda": {"lat": 1.373333, "lon": 32.290275}, "Kyrgyz Republic": {"lat": 41.20438, "lon": 74.766098}, "Hungary": {"lat": 47.162494, "lon": 19.503304}, "Niger": {"lat": 17.607789, "lon": 8.081666}, "Isle of Man": {"lat": 54.236107, "lon": -4.548056}, "Brazil": {"lat": -14.235004, "lon": -51.92528}, "Virgin Islands (U.S.)": {"lat": 18.335765, "lon": -64.896335}, "Guinea": {"lat": 9.945587, "lon": -9.696645}, "Panama": {"lat": 8.537981, "lon": -80.782127}, "Costa Rica": {"lat": 9.748916999999999, "lon": -83.753428}, "Luxembourg": {"lat": 49.815273, "lon": 6.129582999999999}, "Cape Verde": {"lat": 15.1217288, "lon": -23.6050817}, "Andorra": {"lat": 42.506285, "lon": 1.521801}, "Gibraltar": {"lat": 36.140751, "lon": -5.353585}, "Ireland": {"lat": 53.41291, "lon": -8.24389}, "Palau": {"lat": 7.514979999999999, "lon": 134.58252}, "Faeroe Islands": {"lat": 61.89263500000001, "lon": -6.911805999999999}, "Ecuador": {"lat": -1.831239, "lon": -78.18340599999999}, "Czech Republic": {"lat": 49.81749199999999, "lon": 15.472962}, "Australia": {"lat": -25.274398, "lon": 133.775136}, "Algeria": {"lat": 28.033886, "lon": 1.659626}, "El Salvador": {"lat": 13.794185, "lon": -88.89653}, "Tuvalu": {"lat": -10.7280717, "lon": 179.4726562}, "St. Kitts and Nevis": {"lat": 17.357822, "lon": -62.782998}, "Marshall Islands": {"lat": 7.131474, "lon": 171.184478}, "Chile": {"lat": -35.675147, "lon": -71.542969}, "Puerto Rico": {"lat": 18.220833, "lon": -66.590149}, "Belgium": {"lat": 50.503887, "lon": 4.469936}, "Kiribati": {"lat": 1.8668577, "lon": -157.3599202}, "Haiti": {"lat": 18.971187, "lon": -72.285215}, "Belize": {"lat": 17.189877, "lon": -88.49765}, "Sierra Leone": {"lat": 8.460555, "lon": -11.779889}, "Georgia": {"lat": 42.2, "lon": 43.3}, "Denmark": {"lat": 56.26392, "lon": 9.501785}, "Philippines": {"lat": 12.879721, "lon": 121.774017}, "Moldova": {"lat": 47.411631, "lon": 28.369885}, "Portugal": {"lat": 39.39987199999999, "lon": -8.224454}, "Morocco": {"lat": 31.791702, "lon": -7.092619999999999}, "Croatia": {"lat": 45.1, "lon": 15.2}, "Mongolia": {"lat": 46.862496, "lon": 103.846656}, "Guinea-Bissau": {"lat": 11.803749, "lon": -15.180413}, "Thailand": {"lat": 15.870032, "lon": 100.992541}, "Switzerland": {"lat": 46.818188, "lon": 8.227511999999999}, "Grenada": {"lat": 12.1165, "lon": -61.67899999999999}, "Yemen, Rep.": {"lat": 22.5919842, "lon": 46.5100962}, "Iraq": {"lat": 33.223191, "lon": 43.679291}, "Chad": {"lat": 15.454166, "lon": 18.732207}, "Estonia": {"lat": 58.595272, "lon": 25.013607}, "Kosovo": {"lat": 42.6026359, "lon": 20.902977}, "Mexico": {"lat": 23.634501, "lon": -102.552784}, "Lebanon": {"lat": 33.854721, "lon": 35.862285}, "Uzbekistan": {"lat": 41.377491, "lon": 64.585262}, "Djibouti": {"lat": 11.825138, "lon": 42.590275}, "Rwanda": {"lat": -1.940278, "lon": 29.873888}, "Antigua and Barbuda": {"lat": 17.060816, "lon": -61.796428}, "Spain": {"lat": 40.46366700000001, "lon": -3.74922}, "Colombia": {"lat": 4.570868, "lon": -74.297333}, "Burundi": {"lat": -3.373056, "lon": 29.918886}, "Fiji": {"lat": -17.713371, "lon": 178.065032}, "Barbados": {"lat": 13.193887, "lon": -59.543198}, "Madagascar": {"lat": -18.766947, "lon": 46.869107}, "Italy": {"lat": 41.87194, "lon": 12.56738}, "Bhutan": {"lat": 27.514162, "lon": 90.433601}, "Sudan": {"lat": 12.862807, "lon": 30.217636}, "Nepal": {"lat": 28.394857, "lon": 84.12400799999999}, "Singapore": {"lat": 1.352083, "lon": 103.819836}, "Malta": {"lat": 35.937496, "lon": 14.375416}, "Netherlands": {"lat": 52.132633, "lon": 5.291265999999999}, "Suriname": {"lat": 3.919305, "lon": -56.027783}, "S\u00e3o Tom\u00e9 and Principe": {"lat": 0.18636, "lon": 6.613080999999999}, "Netherlands Antilles": {"lat": 12.2248767, "lon": -68.81088489999999}, "Iran, Islamic Rep.": {"lat": 38.4739835, "lon": 47.0605507}, "Israel": {"lat": 31.046051, "lon": 34.851612}, "Indonesia": {"lat": -0.789275, "lon": 113.921327}, "Iceland": {"lat": 64.963051, "lon": -19.020835}, "Zambia": {"lat": -13.133897, "lon": 27.849332}, "Senegal": {"lat": 14.497401, "lon": -14.452362}, "Papua New Guinea": {"lat": -6.314992999999999, "lon": 143.95555}, "Trinidad and Tobago": {"lat": 10.691803, "lon": -61.222503}, "Zimbabwe": {"lat": -19.015438, "lon": 29.154857}, "Germany": {"lat": 51.165691, "lon": 10.451526}, "Kazakhstan": {"lat": 48.019573, "lon": 66.923684}, "Poland": {"lat": 51.919438, "lon": 19.145136}, "Eritrea": {"lat": 15.179384, "lon": 39.782334}, "Mayotte": {"lat": -12.8275, "lon": 45.166244}, "New Caledonia": {"lat": -20.904305, "lon": 165.618042}, "Sri Lanka": {"lat": 7.873053999999999, "lon": 80.77179699999999}, "Latvia": {"lat": 56.879635, "lon": 24.603189}, "Guyana": {"lat": 4.860416, "lon": -58.93018}, "Hong Kong, China": {"lat": 22.396428, "lon": 114.109497}, "Honduras": {"lat": 15.199999, "lon": -86.241905}, "Myanmar": {"lat": 21.913965, "lon": 95.956223}, "Equatorial Guinea": {"lat": 1.650801, "lon": 10.267895}, "Tunisia": {"lat": 33.886917, "lon": 9.537499}, "Nicaragua": {"lat": 12.865416, "lon": -85.207229}, "Congo, Dem. Rep.": {"lat": 9.007017, "lon": 38.7697892}, "Serbia": {"lat": 44.016521, "lon": 21.005859}, "Botswana": {"lat": -22.328474, "lon": 24.684866}, "United Kingdom": {"lat": 55.378051, "lon": -3.435973}, "Gambia, The": {"lat": 13.443182, "lon": -15.310139}, "Greece": {"lat": 39.074208, "lon": 21.824312}, "Paraguay": {"lat": -23.442503, "lon": -58.443832}, "Namibia": {"lat": -22.95764, "lon": 18.49041}, "Comoros": {"lat": -11.6455, "lon": 43.3333}};

  // HELPERS
  function getXY(p) {
    return {
      x: p.lon * 2.6938 + 465.4,
      y: p.lat * -2.6938 + 227.066
    };
  };

  function length(p0, p1) {
    return Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.x - p0.x, 2));
  }

  function midpoint(p0, p1) {
    return {x: p0.x + (p1.x - p0.x) / 2, y: p0.y + (p1.y - p0.y) / 2};
  }

  function dir(p0, p1) {
    var l = length(p0, p1);
    return {x: (p1.x - p0.x) / l, y: (p1.y - p0.y) / l};
  }

  function orthogonal(dir) {
    return {x: -dir.y, y: dir.x};
  }

  function quadraticMidpointFromConnection(p0, p1, k) {
    var l = length(p0, p1);
    var d = dir(p0, p1); 
    var orth = orthogonal(d);
    var mid = midpoint(p0, p1);
    var kl = l * k;
    return {x: mid.x + kl * orth.x, y: mid.y + kl * orth.y};
  }

  // Custom attribute function that returns segment of curve
  paper.ca.arc = function(x) {
    var length = this.attr('length');
    var path = this.attr('original');
    var subPath = Raphael.getSubpath(path, 0, x*length);
    return {path: subPath};
  }

  // Empty functions to allow us to add static custom attributes
  paper.ca.length = function() {}
  paper.ca.original = function() {}

  function qPath(start, mid, end) {
    var path = "M"+start.x+" "+start.y;
    path += " Q"+mid.x+" "+mid.y;
    path += " "+end.x+" "+end.y;
    return path;
  }

  // From http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // RENDERING
  function createOrigins() {
    for(c in data) {
      var total = mode === 'in' ? data[c].totalIn : data[c].totalOut;
      var oXY = getXY(places[c]);

      var rad = 0;
      if(total >= threshold) {
        rad = 0.004 * Math.sqrt( total/ Math.PI );
        rad = rad > 1 ? rad : 1;      
      }

      var o = paper.
        circle(oXY.x, oXY.y, rad).
        attr({'fill':'steelblue', 'stroke':'none'}).
        data('country', c);
      o.hover(function() {showCurves(this.data('country'));});

      // console.log(o);

      origins.push({country: c, element: o});
    }
    // console.log(origins);
  }

  function updateOrigins() {
    for(var i = 0; i < origins.length; i++) {
      var c = origins[i].country;
      var total = mode === 'in' ? data[c].totalIn : data[c].totalOut;

      var rad = 0;
      if(total >= threshold) {
        rad = 0.004 * Math.sqrt( total/ Math.PI );
        rad = rad > 1 ? rad : 1;      
      }

      var currentRad = origins[i].element.attr('r');

      if(Math.abs(rad - currentRad) > 0.01) {
        var anim = Raphael.animation({r: rad}, 200, '>');
        origins[i].element.animate(anim);
      }
    }
  }
  

  function updateLegend(country) {
    if(mode === 'in') {
      $('#legend h2').html(country + "'s immigrants are originally from:");
    } else {
      $('#legend h2').html('Migrants from ' + country + ' have settled in:');
    }

    var migrations = data[country][mode];
    var subtotal = 0;

    var $table = $('#legend .content');
    $table.html('');
    for(var i=0; i<migrations.length; i++) {
      subtotal += migrations[i].amount;
      migrations[i].amount = numberWithCommas(migrations[i].amount)
      $table.append(tim(template, migrations[i]));

      if(i === maxCurves)
        break;
    }
    var total = mode === 'in' ? data[country].totalIn : data[country].totalOut;
    var other = total - subtotal;

    $table.append(tim(template, {country: 'Other', amount: numberWithCommas(other)}));

    var totalTitle = mode === 'in' ? 'Total immigrants' : 'Total emigrants';
    $table.append(tim(template, {country: totalTitle, amount: numberWithCommas(total)}));
  }

  function showCurves(country) {
    if(country === current.country)
      return;

    // console.log(country);

    removeCurrent();
    current.country = country;

    var connections = data[country][mode];
    // console.log(connections);

    for(var i=0; i<connections.length; i++) {
      // console.log('connections is '+connections[i].country, places[connections[i].country], p0, p1);
      var p0, p1, path;

      if(mode === 'out') {
        p0 = getXY(places[country]);
        p1 = getXY(places[connections[i].country]);
      } else {
        p1 = getXY(places[country]);
        p0 = getXY(places[connections[i].country]);
      }
      path = qPath(p0, quadraticMidpointFromConnection(p0, p1, -.5), p1);

      var curvePath = paper.path(path);
      var length = Raphael.getTotalLength(path);

      var width = connections[i].amount * amountScale * 4.5;
      // console.log(connections[i].amount, width);

      // Big hack for Mexico? - fat line has trouble fitting in!
      // if(country === 'Mexico')
      //   width = 0.3 * width;

      curvePath.attr( { opacity: 0,
                        original: path, 
                        length: length, 
                        'arrow-end':'short',

                        'stroke':'steelblue', 
                        'stroke-width': width} );

      curvePath.attr( {arc: 0.1} );

      current.elements.push(curvePath);

      // Animate
      var anim = Raphael.animation({arc: 1.1, opacity: 0.7}, 1000, '>');
      curvePath.animate(anim.delay(i*300));

      // Limit no. curves (for performance)
      if( i === maxCurves )
        break;
    }
    updateLegend(country);
  }

  function removeCurrent() {
    for(var i=0; i<current.elements.length; i++)
      current.elements[i].remove();

    $('#legend .content').html('');
    $('#legend h2').html('');

    current = { country : null, elements : [] };
  }


  // INITIALISATION
  function init() {
    paper.setViewBox(170, 0, 770, 300);

    // Draw worldmap. Data taken from http://raphaeljs.com/world/
    for (var country in worldmap.shapes) {
      paper.path(worldmap.shapes[country]).attr({stroke: "#666", "stroke-width": 0.5, fill: "#f0efeb", "stroke-opacity": 0.25});
    }

    initData();
    createOrigins();

    // To get us started, highlight Britain
    showCurves('United Kingdom');

    jQuery('#immigrants').on('click', function(e) {
      mode = 'in';
      removeCurrent();
      updateOrigins();
      jQuery(this).attr('disabled', 'disabled');
      jQuery('#emigrants').removeAttr('disabled');
    });
    jQuery('#emigrants').on('click', function() {
      mode = 'out';
      removeCurrent();
      updateOrigins();
      jQuery(this).attr('disabled', 'disabled');
      jQuery('#immigrants').removeAttr('disabled');
    });
  }

  function initData() {
    // sort countries
    for(var c in data) {
      data[c].out = data[c].out.sort(function(a, b) {return parseInt(a.amount) < parseInt(b.amount) ? 1 : -1;});
    }
    for(var c in data) {
      data[c].in = data[c].in.sort(function(a, b) {return parseInt(a.amount) < parseInt(b.amount) ? 1 : -1;});
    }
  }

  init();
})();
