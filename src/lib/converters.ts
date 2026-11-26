export interface Unit {
  id: string
  name: string
  symbol: string
  /** value -> base unit: base = (value - offset) * factor */
  factor: number
  offset?: number
}

export interface UnitGroup {
  id: string
  label: string
  description: string
  units: Unit[]
}

const u = (id: string, name: string, symbol: string, factor: number, offset = 0): Unit => ({
  id,
  name,
  symbol,
  factor,
  offset,
})

export const UNIT_GROUPS: UnitGroup[] = [
  {
    id: 'length',
    label: 'Length',
    description: 'Metres, feet, miles and more',
    units: [
      u('mm', 'Millimetre', 'mm', 0.001),
      u('cm', 'Centimetre', 'cm', 0.01),
      u('m', 'Metre', 'm', 1),
      u('km', 'Kilometre', 'km', 1000),
      u('in', 'Inch', 'in', 0.0254),
      u('ft', 'Foot', 'ft', 0.3048),
      u('yd', 'Yard', 'yd', 0.9144),
      u('mi', 'Mile', 'mi', 1609.344),
      u('nmi', 'Nautical mile', 'nmi', 1852),
    ],
  },
  {
    id: 'weight',
    label: 'Weight',
    description: 'Metric, imperial and US units',
    units: [
      u('mg', 'Milligram', 'mg', 1e-6),
      u('g', 'Gram', 'g', 0.001),
      u('kg', 'Kilogram', 'kg', 1),
      u('t', 'Metric tonne', 't', 1000),
      u('oz', 'Ounce', 'oz', 0.028349523125),
      u('lb', 'Pound', 'lb', 0.45359237),
      u('st', 'Stone', 'st', 6.35029318),
      u('uston', 'US ton', 'ton', 907.18474),
    ],
  },
  {
    id: 'temperature',
    label: 'Temperature',
    description: 'Celsius, Fahrenheit and Kelvin',
    units: [
      u('c', 'Celsius', '°C', 1),
      u('f', 'Fahrenheit', '°F', 5 / 9, 32),
      u('k', 'Kelvin', 'K', 1, 273.15),
    ],
  },
  {
    id: 'area',
    label: 'Area',
    description: 'From square millimetres to acres',
    units: [
      u('mm2', 'Square millimetre', 'mm²', 1e-6),
      u('cm2', 'Square centimetre', 'cm²', 1e-4),
      u('m2', 'Square metre', 'm²', 1),
      u('km2', 'Square kilometre', 'km²', 1e6),
      u('ha', 'Hectare', 'ha', 1e4),
      u('in2', 'Square inch', 'in²', 0.00064516),
      u('ft2', 'Square foot', 'ft²', 0.09290304),
      u('acre', 'Acre', 'ac', 4046.8564224),
      u('mi2', 'Square mile', 'mi²', 2589988.110336),
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    description: 'Litres, gallons, cups and spoons',
    units: [
      u('ml', 'Millilitre', 'ml', 0.001),
      u('l', 'Litre', 'L', 1),
      u('m3', 'Cubic metre', 'm³', 1000),
      u('tsp', 'Teaspoon', 'tsp', 0.00492892159375),
      u('tbsp', 'Tablespoon', 'tbsp', 0.01478676478125),
      u('cup', 'Cup', 'cup', 0.2365882365),
      u('pint', 'Pint', 'pt', 0.473176473),
      u('quart', 'Quart', 'qt', 0.946352946),
      u('gal', 'US gallon', 'gal', 3.785411784),
      u('floz', 'Fluid ounce', 'fl oz', 0.0295735295625),
    ],
  },
  {
    id: 'speed',
    label: 'Speed',
    description: 'Metric, imperial and nautical',
    units: [
      u('ms', 'Metre per second', 'm/s', 1),
      u('kmh', 'Kilometre per hour', 'km/h', 1 / 3.6),
      u('mph', 'Mile per hour', 'mph', 0.44704),
      u('fts', 'Foot per second', 'ft/s', 0.3048),
      u('knot', 'Knot', 'kn', 1852 / 3600),
    ],
  },
  {
    id: 'time',
    label: 'Time',
    description: 'Milliseconds through to years',
    units: [
      u('ms', 'Millisecond', 'ms', 0.001),
      u('s', 'Second', 's', 1),
      u('min', 'Minute', 'min', 60),
      u('h', 'Hour', 'h', 3600),
      u('day', 'Day', 'd', 86400),
      u('week', 'Week', 'wk', 604800),
      u('month', 'Month (avg)', 'mo', 2629800),
      u('year', 'Year (avg)', 'yr', 31557600),
    ],
  },
  {
    id: 'data',
    label: 'Data storage',
    description: 'SI and binary digital units',
    units: [
      u('bit', 'Bit', 'bit', 0.125),
      u('byte', 'Byte', 'B', 1),
      u('kb', 'Kilobyte', 'KB', 1e3),
      u('kib', 'Kibibyte', 'KiB', 1024),
      u('mb', 'Megabyte', 'MB', 1e6),
      u('mib', 'Mebibyte', 'MiB', 1024 ** 2),
      u('gb', 'Gigabyte', 'GB', 1e9),
      u('gib', 'Gibibyte', 'GiB', 1024 ** 3),
      u('tb', 'Terabyte', 'TB', 1e12),
      u('tib', 'Tebibyte', 'TiB', 1024 ** 4),
    ],
  },
  {
    id: 'frequency',
    label: 'Frequency',
    description: 'Hertz, RPM and multiples',
    units: [
      u('hz', 'Hertz', 'Hz', 1),
      u('khz', 'Kilohertz', 'kHz', 1e3),
      u('mhz', 'Megahertz', 'MHz', 1e6),
      u('ghz', 'Gigahertz', 'GHz', 1e9),
      u('rpm', 'Revolutions per minute', 'rpm', 1 / 60),
    ],
  },
  {
    id: 'power',
    label: 'Power',
    description: 'Watts, horsepower and BTU/hour',
    units: [
      u('w', 'Watt', 'W', 1),
      u('kw', 'Kilowatt', 'kW', 1e3),
      u('mw', 'Megawatt', 'MW', 1e6),
      u('hp', 'Mechanical horsepower', 'hp', 745.6998715822702),
      u('ps', 'Metric horsepower', 'PS', 735.49875),
      u('btuh', 'BTU per hour', 'BTU/h', 0.29307107),
    ],
  },
  {
    id: 'pressure',
    label: 'Pressure',
    description: 'Pascal, bar, atmosphere and PSI',
    units: [
      u('pa', 'Pascal', 'Pa', 1),
      u('kpa', 'Kilopascal', 'kPa', 1e3),
      u('bar', 'Bar', 'bar', 1e5),
      u('atm', 'Atmosphere', 'atm', 101325),
      u('psi', 'Pound per square inch', 'psi', 6894.757293168),
      u('mmhg', 'Millimetre of mercury', 'mmHg', 133.322387415),
    ],
  },
  {
    id: 'energy',
    label: 'Energy',
    description: 'Joules, calories and watt-hours',
    units: [
      u('j', 'Joule', 'J', 1),
      u('kj', 'Kilojoule', 'kJ', 1e3),
      u('cal', 'Calorie', 'cal', 4.184),
      u('kcal', 'Kilocalorie', 'kcal', 4184),
      u('wh', 'Watt-hour', 'Wh', 3600),
      u('kwh', 'Kilowatt-hour', 'kWh', 3.6e6),
      u('ev', 'Electronvolt', 'eV', 1.602176634e-19),
    ],
  },
]

export function getUnitGroup(id: string): UnitGroup | undefined {
  return UNIT_GROUPS.find((group) => group.id === id)
}

export function convertUnit(value: number, from: Unit, to: Unit): number {
  const base = (value - (from.offset ?? 0)) * from.factor
  return base / to.factor + (to.offset ?? 0)
}
