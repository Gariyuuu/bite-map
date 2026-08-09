import type { MockDish, MockRestaurantSeed, MockSource } from "./data";
import type { PriceLevel } from "@/types/restaurant";

/**
 * Procedurally-generated restaurants layered on top of the hand-authored set
 * in data.ts, so Discover/Map feel populated at real neighborhood density
 * instead of a handful of pins per city. Uses a seeded PRNG (not
 * Math.random) so the exact same ~260 restaurants — same ids, same
 * coordinates — are produced every time this module loads. That matters:
 * the mock provider path reads this at request time in serverless
 * functions, and non-deterministic ids would make a restaurant clicked from
 * Discover 404 on its own profile page if a different instance regenerated
 * the list. Ratings/reviews are fabricated for demo purposes like the rest
 * of the mock dataset.
 */

// ---------------------------------------------------------------- PRNG

function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260809);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const pickN = <T,>(arr: readonly T[], n: number): T[] => {
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
};
const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const randFloat = (min: number, max: number, decimals = 1) => {
  const v = rng() * (max - min) + min;
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------------------------------------------------------- static data

const HOURS_VARIANTS: Record<string, string>[] = [
  {
    mon: "11:00 AM - 9:00 PM",
    tue: "11:00 AM - 9:00 PM",
    wed: "11:00 AM - 9:00 PM",
    thu: "11:00 AM - 9:00 PM",
    fri: "11:00 AM - 10:00 PM",
    sat: "11:00 AM - 10:00 PM",
    sun: "11:00 AM - 9:00 PM",
  },
  {
    mon: "11:30 AM - 12:00 AM",
    tue: "11:30 AM - 12:00 AM",
    wed: "11:30 AM - 12:00 AM",
    thu: "11:30 AM - 1:00 AM",
    fri: "11:30 AM - 2:00 AM",
    sat: "11:30 AM - 2:00 AM",
    sun: "11:30 AM - 12:00 AM",
  },
  {
    mon: "7:00 AM - 6:00 PM",
    tue: "7:00 AM - 6:00 PM",
    wed: "7:00 AM - 6:00 PM",
    thu: "7:00 AM - 6:00 PM",
    fri: "7:00 AM - 8:00 PM",
    sat: "8:00 AM - 8:00 PM",
    sun: "8:00 AM - 6:00 PM",
  },
];

interface NeighborhoodSeed {
  neighborhood: string;
  city: string;
  zip: string;
  latitude: number;
  longitude: number;
}

// Real OC/LA neighborhood centers — restaurants below are jittered around these.
const NEIGHBORHOODS: NeighborhoodSeed[] = [
  { neighborhood: "Irvine Spectrum", city: "Irvine", zip: "92618", latitude: 33.6595, longitude: -117.7455 },
  { neighborhood: "Diamond Jamboree", city: "Irvine", zip: "92618", latitude: 33.684, longitude: -117.808 },
  { neighborhood: "Great Park", city: "Irvine", zip: "92618", latitude: 33.68, longitude: -117.75 },
  { neighborhood: "Culver Plaza", city: "Irvine", zip: "92604", latitude: 33.671, longitude: -117.809 },
  { neighborhood: "University Park", city: "Irvine", zip: "92612", latitude: 33.65, longitude: -117.71 },
  { neighborhood: "Woodbridge", city: "Irvine", zip: "92604", latitude: 33.6864, longitude: -117.7975 },
  { neighborhood: "South Coast Metro", city: "Costa Mesa", zip: "92626", latitude: 33.69, longitude: -117.886 },
  { neighborhood: "17th Street", city: "Costa Mesa", zip: "92627", latitude: 33.663, longitude: -117.914 },
  { neighborhood: "The Camp", city: "Costa Mesa", zip: "92626", latitude: 33.6417, longitude: -117.9187 },
  { neighborhood: "Fashion Island", city: "Newport Beach", zip: "92660", latitude: 33.6178, longitude: -117.8722 },
  { neighborhood: "Balboa Peninsula", city: "Newport Beach", zip: "92661", latitude: 33.603, longitude: -117.929 },
  { neighborhood: "Mariner's Mile", city: "Newport Beach", zip: "92663", latitude: 33.6178, longitude: -117.9294 },
  { neighborhood: "Little Tokyo", city: "Los Angeles", zip: "90012", latitude: 34.0492, longitude: -118.2396 },
  { neighborhood: "Koreatown", city: "Los Angeles", zip: "90005", latitude: 34.058, longitude: -118.3 },
  { neighborhood: "Arts District", city: "Los Angeles", zip: "90021", latitude: 34.0403, longitude: -118.2352 },
  { neighborhood: "Chinatown", city: "Los Angeles", zip: "90012", latitude: 34.0616, longitude: -118.2384 },
  { neighborhood: "Sawtelle Japantown", city: "Los Angeles", zip: "90025", latitude: 34.0367, longitude: -118.4436 },
  { neighborhood: "Silver Lake", city: "Los Angeles", zip: "90026", latitude: 34.0857, longitude: -118.2851 },
  { neighborhood: "East Hollywood", city: "Los Angeles", zip: "90027", latitude: 34.0836, longitude: -118.2601 },
  { neighborhood: "Los Feliz", city: "Los Angeles", zip: "90027", latitude: 34.0951, longitude: -118.2894 },
  { neighborhood: "West Adams", city: "Los Angeles", zip: "90016", latitude: 34.0261, longitude: -118.3437 },
  { neighborhood: "Hancock Park", city: "Los Angeles", zip: "90036", latitude: 34.0836, longitude: -118.3437 },
  { neighborhood: "Little Saigon", city: "Westminster", zip: "92683", latitude: 33.7412, longitude: -117.9989 },
  { neighborhood: "Downtown", city: "Fullerton", zip: "92832", latitude: 33.8704, longitude: -117.9242 },
  { neighborhood: "Downtown", city: "Santa Ana", zip: "92701", latitude: 33.7455, longitude: -117.8677 },
  { neighborhood: "Old Town", city: "Tustin", zip: "92780", latitude: 33.7458, longitude: -117.826 },
  { neighborhood: "Packing District", city: "Anaheim", zip: "92805", latitude: 33.8353, longitude: -117.9145 },
  { neighborhood: "Downtown", city: "Huntington Beach", zip: "92648", latitude: 33.6595, longitude: -118.0009 },
  { neighborhood: "Downtown", city: "Long Beach", zip: "90802", latitude: 33.7701, longitude: -118.1937 },
  { neighborhood: "Belmont Shore", city: "Long Beach", zip: "90803", latitude: 33.7595, longitude: -118.1417 },
  { neighborhood: "Old Town", city: "Pasadena", zip: "91103", latitude: 34.1458, longitude: -118.1508 },
  { neighborhood: "Downtown", city: "Culver City", zip: "90230", latitude: 34.0211, longitude: -118.3965 },
  { neighborhood: "Third Street", city: "Santa Monica", zip: "90401", latitude: 34.0195, longitude: -118.4912 },
  { neighborhood: "Abbot Kinney", city: "Venice", zip: "90291", latitude: 33.9925, longitude: -118.4695 },
  { neighborhood: "Echo Park", city: "Los Angeles", zip: "90026", latitude: 34.0782, longitude: -118.2606 },
  { neighborhood: "San Gabriel Valley", city: "San Gabriel", zip: "91776", latitude: 34.0961, longitude: -118.1058 },
  { neighborhood: "Downtown", city: "Monterey Park", zip: "91754", latitude: 34.0625, longitude: -118.1228 },
  { neighborhood: "Main Street", city: "Alhambra", zip: "91801", latitude: 34.0953, longitude: -118.135 },
  { neighborhood: "Rowland Heights", city: "Rowland Heights", zip: "91748", latitude: 33.9772, longitude: -117.9051 },
  { neighborhood: "Town Center", city: "Diamond Bar", zip: "91765", latitude: 34.0286, longitude: -117.8103 },
  { neighborhood: "Downtown", city: "Fountain Valley", zip: "92708", latitude: 33.7092, longitude: -117.9537 },
  { neighborhood: "Brookhurst Corridor", city: "Garden Grove", zip: "92843", latitude: 33.7739, longitude: -117.9415 },
  { neighborhood: "Downtown", city: "Buena Park", zip: "90620", latitude: 33.8675, longitude: -117.9981 },
  { neighborhood: "Los Cerritos", city: "Cerritos", zip: "90703", latitude: 33.8583, longitude: -118.0648 },
  { neighborhood: "Old Torrance", city: "Torrance", zip: "90503", latitude: 33.8358, longitude: -118.3406 },
];

const STREET_NAMES = [
  "Main St",
  "Beach Blvd",
  "Harbor Blvd",
  "1st St",
  "Chapman Ave",
  "Katella Ave",
  "Garden Grove Blvd",
  "Western Ave",
  "Vermont Ave",
  "6th St",
  "8th St",
  "Valley Blvd",
  "Atlantic Ave",
  "Colorado Blvd",
  "Wilshire Blvd",
  "Sunset Blvd",
  "Jamboree Rd",
  "Bristol St",
  "MacArthur Blvd",
  "Culver Dr",
];

interface CuisineGroup {
  cuisines: string[];
  nameWords: string[];
  nounWords: string[];
  dishPool: { name: string; description: string; price: [number, number]; spice: 0 | 1 | 2 | 3 }[];
  priceLevels: PriceLevel[];
  hours: 0 | 1 | 2;
}

const GROUPS: CuisineGroup[] = [
  {
    cuisines: ["Japanese", "Ramen"],
    nameWords: ["Sakura", "Umi", "Momo", "Hana", "Kaze", "Ren", "Yama", "Sora", "Tsuki", "Kuro", "Aki", "Nori"],
    nounWords: ["Ramen", "Noodle House", "Kitchen", "Ramen Bar", "Shokudo"],
    dishPool: [
      { name: "Tonkotsu Ramen", description: "Rich pork bone broth, thin noodles, chashu.", price: [13, 17], spice: 0 },
      { name: "Shoyu Ramen", description: "Soy-based clear broth ramen.", price: [12, 16], spice: 0 },
      { name: "Spicy Miso Ramen", description: "Miso broth with chili oil.", price: [13, 17], spice: 2 },
      { name: "Gyoza", description: "Pan-fried pork dumplings.", price: [6, 9], spice: 0 },
      { name: "Chicken Karaage", description: "Japanese fried chicken.", price: [8, 12], spice: 1 },
    ],
    priceLevels: ["$", "$$"],
    hours: 1,
  },
  {
    cuisines: ["Japanese", "Sushi"],
    nameWords: ["Sakura", "Umi", "Kai", "Ginza", "Edo", "Wasabi", "Koi", "Ichi", "Zen"],
    nounWords: ["Sushi", "Sushi Bar", "Sushi & Sake", "Sushi House"],
    dishPool: [
      { name: "Salmon Aburi Nigiri", description: "Torched salmon nigiri.", price: [12, 16], spice: 0 },
      { name: "Spicy Tuna Roll", description: "Spicy tuna and cucumber roll.", price: [9, 13], spice: 1 },
      { name: "Chirashi Bowl", description: "Assorted sashimi over rice.", price: [22, 30], spice: 0 },
      { name: "Uni Nigiri", description: "Sea urchin nigiri.", price: [14, 20], spice: 0 },
    ],
    priceLevels: ["$$", "$$$"],
    hours: 1,
  },
  {
    cuisines: ["Korean", "Korean BBQ"],
    nameWords: ["Seoul", "Han", "Jang", "Bibim", "Gopchang", "Soban", "Gangnam", "Myungdong"],
    nounWords: ["BBQ", "Grill", "Table", "House", "Korean BBQ"],
    dishPool: [
      { name: "Prime Galbi", description: "Marinated beef short rib, grilled tableside.", price: [28, 45], spice: 0 },
      { name: "Spicy Pork Bulgogi", description: "Gochujang-marinated pork.", price: [18, 24], spice: 2 },
      { name: "Kimchi Jjigae", description: "Kimchi stew with pork and tofu.", price: [15, 19], spice: 2 },
      { name: "Japchae", description: "Stir-fried glass noodles.", price: [12, 16], spice: 0 },
    ],
    priceLevels: ["$$", "$$$"],
    hours: 1,
  },
  {
    cuisines: ["Chinese", "Sichuan"],
    nameWords: ["Jade", "Dragon", "Panda", "Ming", "Szechuan", "Golden", "Lucky", "Chengdu"],
    nounWords: ["Kitchen", "Garden", "House", "Wok", "Restaurant"],
    dishPool: [
      { name: "Mapo Tofu", description: "Silken tofu in spicy chili bean sauce.", price: [12, 16], spice: 3 },
      { name: "Dan Dan Noodles", description: "Spicy peanut sesame noodles.", price: [11, 15], spice: 2 },
      { name: "Kung Pao Chicken", description: "Stir-fried chicken with peanuts and chili.", price: [13, 17], spice: 2 },
      { name: "Dry-Fried Green Beans", description: "Wok-charred green beans with garlic.", price: [10, 14], spice: 1 },
    ],
    priceLevels: ["$", "$$"],
    hours: 0,
  },
  {
    cuisines: ["Chinese", "Cantonese", "Dim Sum"],
    nameWords: ["Jasmine", "Fortune", "Empire", "Ocean", "Golden Palace", "Imperial"],
    nounWords: ["Dim Sum", "Seafood Restaurant", "Palace", "Garden"],
    dishPool: [
      { name: "Har Gow", description: "Steamed shrimp dumplings.", price: [6, 9], spice: 0 },
      { name: "Char Siu Bao", description: "BBQ pork steamed buns.", price: [5, 8], spice: 0 },
      { name: "Egg Tarts", description: "Flaky custard tarts.", price: [4, 6], spice: 0 },
      { name: "Salt & Pepper Squid", description: "Crispy fried squid.", price: [14, 18], spice: 1 },
    ],
    priceLevels: ["$$", "$$$"],
    hours: 0,
  },
  {
    cuisines: ["Taiwanese", "Hong Kong"],
    nameWords: ["Formosa", "Taipei", "Kaohsiung", "Mango", "Bubble", "Ding Tai"],
    nounWords: ["Cafe", "Kitchen", "Noodle House", "Diner"],
    dishPool: [
      { name: "Beef Noodle Soup", description: "Braised beef shank noodle soup.", price: [13, 17], spice: 1 },
      { name: "Popcorn Chicken", description: "Taiwanese fried chicken bites.", price: [7, 10], spice: 1 },
      { name: "Brown Sugar Boba Milk", description: "Fresh milk with brown sugar boba.", price: [5, 7], spice: 0 },
    ],
    priceLevels: ["$", "$$"],
    hours: 2,
  },
  {
    cuisines: ["Vietnamese"],
    nameWords: ["Saigon", "Mekong", "Lotus", "Pho", "Little Saigon", "Hanoi"],
    nounWords: ["Pho", "Noodle House", "Kitchen", "Cafe"],
    dishPool: [
      { name: "Pho Dac Biet", description: "Combination beef noodle soup.", price: [11, 15], spice: 0 },
      { name: "Banh Mi Thit", description: "Grilled pork banh mi.", price: [7, 10], spice: 1 },
      { name: "Bun Cha", description: "Grilled pork with rice noodles.", price: [12, 16], spice: 1 },
      { name: "Vietnamese Iced Coffee", description: "Robusta coffee over condensed milk.", price: [4, 6], spice: 0 },
    ],
    priceLevels: ["$", "$$"],
    hours: 0,
  },
  {
    cuisines: ["Thai"],
    nameWords: ["Siam", "Bangkok", "Basil", "Lotus Thai", "Chiang Mai", "Thai Orchid"],
    nounWords: ["Thai Cuisine", "Kitchen", "Thai Bistro", "Garden"],
    dishPool: [
      { name: "Pad Thai", description: "Stir-fried rice noodles with tamarind.", price: [12, 16], spice: 1 },
      { name: "Panang Curry", description: "Rich peanut curry.", price: [13, 17], spice: 2 },
      { name: "Tom Yum Soup", description: "Hot and sour shrimp soup.", price: [10, 14], spice: 2 },
      { name: "Mango Sticky Rice", description: "Sweet sticky rice with mango.", price: [7, 9], spice: 0 },
    ],
    priceLevels: ["$", "$$"],
    hours: 0,
  },
  {
    cuisines: ["Filipino"],
    nameWords: ["Manila", "Jeepney", "Kamayan", "Lola's", "Barrio"],
    nounWords: ["Kitchen", "Grill", "Cafe", "Kamayan House"],
    dishPool: [
      { name: "Chicken Adobo", description: "Braised chicken in soy vinegar sauce.", price: [12, 16], spice: 0 },
      { name: "Pork Sisig", description: "Sizzling chopped pork.", price: [13, 17], spice: 2 },
      { name: "Lumpia", description: "Crispy fried spring rolls.", price: [6, 9], spice: 0 },
    ],
    priceLevels: ["$", "$$"],
    hours: 0,
  },
  {
    cuisines: ["Singaporean", "Malaysian", "Indonesian"],
    nameWords: ["Satay", "Kopi", "Nusantara", "Merlion", "Penang"],
    nounWords: ["Kitchen", "Cafe", "Hawker House", "Kopitiam"],
    dishPool: [
      { name: "Nasi Lemak", description: "Coconut rice with sambal and anchovies.", price: [12, 16], spice: 2 },
      { name: "Beef Rendang", description: "Slow-cooked coconut beef curry.", price: [15, 19], spice: 2 },
      { name: "Satay Skewers", description: "Grilled skewers with peanut sauce.", price: [9, 13], spice: 1 },
    ],
    priceLevels: ["$", "$$"],
    hours: 0,
  },
  {
    cuisines: ["Indian", "Nepalese"],
    nameWords: ["Taj", "Saffron", "Spice Route", "Namaste", "Everest", "Curry Leaf"],
    nounWords: ["Indian Cuisine", "Kitchen", "Grill", "Tandoor"],
    dishPool: [
      { name: "Butter Chicken", description: "Tomato-cream curry with tandoori chicken.", price: [14, 18], spice: 1 },
      { name: "Lamb Momo", description: "Nepalese steamed dumplings.", price: [10, 14], spice: 1 },
      { name: "Garlic Naan", description: "Tandoor-baked garlic flatbread.", price: [4, 6], spice: 0 },
      { name: "Saag Paneer", description: "Spinach curry with paneer cheese.", price: [12, 16], spice: 1 },
    ],
    priceLevels: ["$", "$$"],
    hours: 0,
  },
  {
    cuisines: ["Italian", "Pizza"],
    nameWords: ["Bella", "Nonna", "Trattoria", "Vino", "Roma", "Piccolo", "Via"],
    nounWords: ["Trattoria", "Pizzeria", "Ristorante", "Kitchen", "Cucina"],
    dishPool: [
      { name: "Margherita Pizza", description: "San Marzano tomato, mozzarella, basil.", price: [14, 19], spice: 0 },
      { name: "Truffle Cream Pasta", description: "House-made pasta in truffle cream.", price: [18, 24], spice: 0 },
      { name: "Burrata", description: "Fresh burrata with tomato and basil.", price: [13, 17], spice: 0 },
    ],
    priceLevels: ["$$", "$$$"],
    hours: 1,
  },
  {
    cuisines: ["Mexican"],
    nameWords: ["El", "La Casa", "Fiesta", "Sol", "Taqueria", "Rancho"],
    nounWords: ["Taqueria", "Cocina", "Cantina", "Grill", "Mexican Kitchen"],
    dishPool: [
      { name: "Al Pastor Tacos", description: "Marinated pork tacos with pineapple.", price: [9, 13], spice: 1 },
      { name: "Carne Asada Burrito", description: "Grilled steak burrito.", price: [11, 15], spice: 1 },
      { name: "Tableside Guacamole", description: "Fresh guacamole made to order.", price: [10, 14], spice: 1 },
    ],
    priceLevels: ["$", "$$"],
    hours: 1,
  },
  {
    cuisines: ["American", "Comfort Food"],
    nameWords: ["The Local", "Corner", "Main Street", "Harbor", "Sunset", "Grand Ave"],
    nounWords: ["Diner", "Kitchen", "Tavern", "Grill", "Eatery"],
    dishPool: [
      { name: "Fried Chicken Sandwich", description: "Buttermilk fried chicken, brioche.", price: [14, 18], spice: 1 },
      { name: "Smash Burger", description: "Double smashed patty, American cheese.", price: [12, 16], spice: 0 },
      { name: "Mac & Cheese", description: "Baked three-cheese mac.", price: [9, 13], spice: 0 },
    ],
    priceLevels: ["$$", "$$$"],
    hours: 1,
  },
  {
    cuisines: ["Cafe", "Breakfast", "Brunch"],
    nameWords: ["Sunrise", "Daily", "Morning", "Cornerstone", "Corner Cafe", "The Griddle"],
    nounWords: ["Cafe", "Coffee House", "Kitchen", "Brunch House"],
    dishPool: [
      { name: "Avocado Toast", description: "Sourdough, smashed avocado, chili flake.", price: [11, 15], spice: 0 },
      { name: "Croque Madame", description: "Ham and gruyere, fried egg.", price: [14, 18], spice: 0 },
      { name: "Buttermilk Pancakes", description: "Stack with maple butter.", price: [10, 14], spice: 0 },
    ],
    priceLevels: ["$", "$$"],
    hours: 2,
  },
  {
    cuisines: ["Dessert", "Bakery"],
    nameWords: ["Sweet", "Sugar & Spice", "Honey", "Blossom", "Milk & Sugar"],
    nounWords: ["Bakery", "Dessert Bar", "Patisserie", "Sweets"],
    dishPool: [
      { name: "Croissant", description: "Butter-laminated croissant.", price: [4, 6], spice: 0 },
      { name: "Matcha Soft Serve", description: "Ceremonial-grade matcha soft serve.", price: [6, 8], spice: 0 },
      { name: "Basque Cheesecake", description: "Burnt-top Basque cheesecake slice.", price: [6, 9], spice: 0 },
    ],
    priceLevels: ["$"],
    hours: 2,
  },
  {
    cuisines: ["Seafood"],
    nameWords: ["Blue Water", "Harbor", "Catch", "Tide", "Anchor", "Bay"],
    nounWords: ["Seafood Grille", "Fish House", "Oyster Bar", "Seafood Kitchen"],
    dishPool: [
      { name: "Miso Glazed Sea Bass", description: "Sweet miso-marinated sea bass.", price: [32, 44], spice: 0 },
      { name: "Fish Tacos", description: "Grilled catch with cabbage slaw.", price: [12, 16], spice: 1 },
      { name: "Garlic Butter Shrimp", description: "Sauteed shrimp in garlic butter.", price: [18, 24], spice: 0 },
    ],
    priceLevels: ["$$", "$$$"],
    hours: 1,
  },
  {
    cuisines: ["BBQ", "Steakhouse"],
    nameWords: ["Smokehouse", "Pit", "Iron", "Copper", "Ember", "Prime"],
    nounWords: ["BBQ", "Steakhouse", "Smokehouse", "Chophouse"],
    dishPool: [
      { name: "Brisket Plate", description: "14-hour smoked brisket.", price: [18, 24], spice: 0 },
      { name: "Dry-Aged Ribeye", description: "28-day dry-aged ribeye.", price: [48, 68], spice: 0 },
      { name: "Burnt Ends", description: "Caramelized brisket burnt ends.", price: [15, 19], spice: 1 },
    ],
    priceLevels: ["$$$", "$$$$"],
    hours: 1,
  },
  {
    cuisines: ["Mediterranean"],
    nameWords: ["Olive", "Cedar", "Aegean", "Zaytoon", "Levant"],
    nounWords: ["Mediterranean Grill", "Kitchen", "Bistro", "Table"],
    dishPool: [
      { name: "Chicken Shawarma Plate", description: "Marinated chicken, rice, salad.", price: [13, 17], spice: 1 },
      { name: "Falafel Wrap", description: "Crispy falafel, tahini, pickles.", price: [9, 12], spice: 0 },
      { name: "Hummus Trio", description: "Three hummus flavors with pita.", price: [10, 14], spice: 0 },
    ],
    priceLevels: ["$", "$$"],
    hours: 0,
  },
  {
    cuisines: ["Vegan"],
    nameWords: ["Rooted", "Sprout", "Green Table", "Verdant", "Harvest"],
    nounWords: ["Kitchen", "Cafe", "Plant Kitchen", "Eatery"],
    dishPool: [
      { name: "Impossible Burger", description: "Plant-based burger, vegan cheese.", price: [14, 18], spice: 0 },
      { name: "Buddha Bowl", description: "Grain bowl with roasted vegetables.", price: [13, 17], spice: 0 },
      { name: "Cashew Alfredo", description: "Creamy cashew-based pasta.", price: [15, 19], spice: 0 },
    ],
    priceLevels: ["$$"],
    hours: 0,
  },
];

const PRIORITY_POOL = ["must_try", "popular", "local_favorite", "safe_pick", "underrated", "best_value"] as const;

function makeSources(): MockSource[] {
  const googleCount = randInt(80, 3200);
  const yelpCount = Math.round(googleCount * randFloat(0.3, 0.7));
  return [
    { provider: "google", rating: randFloat(3.7, 4.8), ratingScale: 5, ratingCount: googleCount },
    { provider: "yelp", rating: randFloat(3.5, 4.6), ratingScale: 5, ratingCount: yelpCount },
  ];
}

function makeDishes(group: CuisineGroup): MockDish[] {
  const chosen = pickN(group.dishPool, Math.min(randInt(2, 3), group.dishPool.length));
  return chosen.map((d, i) => ({
    name: d.name,
    description: d.description,
    estimatedPrice: randFloat(d.price[0], d.price[1], 2),
    spiceLevel: d.spice,
    priority: i === 0 ? "must_try" : pick(PRIORITY_POOL),
    whyOrder: i === 0 ? "The dish this kitchen is known for." : "A regular favorite on repeat visits.",
  }));
}

function generate(count: number): MockRestaurantSeed[] {
  const results: MockRestaurantSeed[] = [];
  const usedIds = new Set<string>();
  const usedNames = new Set<string>();

  let attempts = 0;
  while (results.length < count && attempts < count * 6) {
    attempts++;
    const group = pick(GROUPS);
    const area = pick(NEIGHBORHOODS);
    const name = `${pick(group.nameWords)} ${pick(group.nounWords)}`;
    if (usedNames.has(`${name}|${area.neighborhood}`)) continue;
    usedNames.add(`${name}|${area.neighborhood}`);

    let id = slugify(`${name}-${area.city}`);
    if (usedIds.has(id)) id = `${id}-${results.length}`;
    usedIds.add(id);

    const latJitter = (rng() - 0.5) * 0.024;
    const lngJitter = (rng() - 0.5) * 0.024;

    results.push({
      id,
      name,
      latitude: Math.round((area.latitude + latJitter) * 10000) / 10000,
      longitude: Math.round((area.longitude + lngJitter) * 10000) / 10000,
      address: `${randInt(100, 9999)} ${pick(STREET_NAMES)}, ${area.city}, CA`,
      city: area.city,
      neighborhood: area.neighborhood,
      zip: area.zip,
      cuisines: group.cuisines,
      priceLevel: pick(group.priceLevels),
      phone: `(${randInt(213, 949)}) ${randInt(200, 999)}-${randInt(1000, 9999)}`,
      openingHours: HOURS_VARIANTS[group.hours],
      photoSeeds: [`bitemap-gen-${id}`],
      dishes: makeDishes(group),
      sources: makeSources(),
      popularityScore: randInt(35, 88),
    });
  }

  return results;
}

export const generatedRestaurants: MockRestaurantSeed[] = generate(260);
