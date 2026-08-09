/** Manual-location presets for onboarding + "enter location manually" (section 3). */
export const LOCATION_PRESETS = [
  { label: "Turtle Rock, Irvine", latitude: 33.6428, longitude: -117.7975 },
  { label: "University Town Center, Irvine", latitude: 33.6455, longitude: -117.8395 },
  { label: "Irvine Spectrum, Irvine", latitude: 33.6595, longitude: -117.7455 },
  { label: "Diamond Jamboree, Irvine", latitude: 33.6839, longitude: -117.8078 },
  { label: "South Coast Metro, Costa Mesa", latitude: 33.6906, longitude: -117.8862 },
  { label: "17th Street, Costa Mesa", latitude: 33.6633, longitude: -117.9143 },
  { label: "Fashion Island, Newport Beach", latitude: 33.6178, longitude: -117.8722 },
  { label: "Little Tokyo, Los Angeles", latitude: 34.0492, longitude: -118.2396 },
  { label: "Koreatown, Los Angeles", latitude: 34.0605, longitude: -118.3009 },
  { label: "Arts District, Los Angeles", latitude: 34.0403, longitude: -118.2352 },
  { label: "Sawtelle Japantown, Los Angeles", latitude: 34.0367, longitude: -118.4436 },
  { label: "Little Saigon, Westminster", latitude: 33.7412, longitude: -117.9989 },
] as const;

export const DEFAULT_LOCATION = LOCATION_PRESETS[0];
