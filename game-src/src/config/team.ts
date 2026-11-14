// ─────────────────────────────────────────────────────────────────────────────
//  THE GOOD IN THE HOOD CREW
//  Edit this file to change names, looks, starting outfits or what people say.
//  After editing, run `npm run build` inside game-src/ and push.
// ─────────────────────────────────────────────────────────────────────────────

export type HairStyle =
  | 'shoulderSide' // shoulder length, side part
  | 'longWavy'     // long and wavy, middle part
  | 'bobSide'      // wavy bob, side part
  | 'ponytail'     // pulled back into a ponytail
  | 'short'
  | 'bun'
  | 'curly'
  | 'buzz'
  | 'fringeBob'    // shoulder length with a blunt fringe
  | 'fringeBack'   // pulled back with a wispy fringe
  | 'bald';

export type TopStyle = 'tee' | 'stripeLong' | 'layeredTee' | 'hoodie' | 'jumper' | 'shirt' | 'tieDye' | 'floral' | 'gith'; // gith = Good in the Hood tee
export type BottomStyle = 'skirt' | 'trousers' | 'shorts' | 'leggings';
export type LayerStyle = 'none' | 'apron' | 'hivis' | 'cardigan' | 'lanyard' | 'vest';
export type HatStyle = 'none' | 'beanie' | 'cap' | 'hairclip' | 'cowboy';

export interface Outfit {
  top: TopStyle;
  topColor: string;
  accentColor: string; // stripes, prints, under-sleeves
  bottom: BottomStyle;
  bottomColor: string;
  shoeColor: string;
  layer: LayerStyle;
  layerColor: string;
  hat: HatStyle;
  hatColor: string;
}

export interface Looks {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  freckles?: boolean;
  glasses?: string | null; // frame colour, or null for none
}

export interface Person {
  id: string;
  name: string;
  looks: Looks;
  outfit: Outfit;
  /** Where they hang out during a Work shift (see world/maps.ts for spot names). */
  workSpot: string;
  /** Things they say when you chat to them at work. */
  lines: string[];
}

const base: Outfit = {
  top: 'tee', topColor: '#ffffff', accentColor: '#7aa7d9',
  bottom: 'trousers', bottomColor: '#3c4a6b', shoeColor: '#f4f1ea',
  layer: 'none', layerColor: '#ef8a5b', hat: 'none', hatColor: '#c46b9a',
};

export const TEAM: Person[] = [
  {
    id: 'sian',
    name: 'Siân',
    looks: { skin: '#f2cbb0', hair: '#3a2720', hairStyle: 'shoulderSide' },
    outfit: { ...base, top: 'stripeLong', topColor: '#f3ead6', accentColor: '#2b2530', bottom: 'skirt', bottomColor: '#1f1c22', shoeColor: '#2b2530' },
    workSpot: 'kitchen',
    lines: [
      'Morning! The pumpkin tarts are calling our names.',
      'Pastry first, then pumpkin, then the greens. Teamwork makes the tart work!',
      'If you\'re free, the kitchen bench always needs another pair of hands.',
      'Every bag that goes out is someone\'s dinner tonight. That\'s pretty special.',
    ],
  },
  {
    id: 'amelie',
    name: 'Amelie',
    looks: { skin: '#f4cdb4', hair: '#b9824f', hairStyle: 'longWavy', freckles: true },
    outfit: { ...base, top: 'tieDye', topColor: '#f1f7f2', accentColor: '#9fdccb', bottom: 'trousers', bottomColor: '#cfd3c8', shoeColor: '#f4f1ea' },
    workSpot: 'shelves',
    lines: [
      'I\'ve been restocking the shelves. Tins on the left, cereal on the right!',
      'Did you check the order card? Some bags need two of something.',
      'Lavender lounge after shift? I\'ll bring the snacks.',
      'Group 2 has the most bags today, don\'t forget about them!',
    ],
  },
  {
    id: 'gabi',
    name: 'Gabi',
    looks: { skin: '#f3c9ae', hair: '#5b3a26', hairStyle: 'bobSide', glasses: '#b9a3e3' },
    outfit: { ...base, top: 'tee', topColor: '#fbfbfb', accentColor: '#6f8fc0', bottom: 'trousers', bottomColor: '#2f3550', layer: 'lanyard', layerColor: '#6b3fa0' },
    workSpot: 'crates',
    lines: [
      'Bag done? Pop it in the right group crate and you\'ll hear the ding!',
      'I made us a tracker once. Now it\'s a whole game. Funny how that works.',
      'You\'re doing amazing. Seriously.',
      'Pick-up bags go on the front counter. People come by to collect them.',
    ],
  },
  {
    id: 'issy',
    name: 'Issy',
    looks: { skin: '#f0c4a6', hair: '#3b2a22', hairStyle: 'ponytail', freckles: true },
    outfit: { ...base, top: 'tee', topColor: '#1f2433', accentColor: '#1f2433', bottom: 'shorts', bottomColor: '#e9a978', shoeColor: '#f4f1ea' },
    workSpot: 'yard',
    lines: [
      'Bowie is on official greeting duty today.',
      'The van leaves once groups 1 to 6B are all packed!',
      'Bowie says hi. Well, he says "woof", but it means hi.',
      'Need a hand loading? Just shout.',
    ],
  },
  {
    id: 'rachel',
    name: 'Rachel',
    looks: { skin: '#f3c8ad', hair: '#8a6143', hairStyle: 'ponytail' },
    outfit: { ...base, top: 'tee', topColor: '#c8323f', accentColor: '#c8323f', bottom: 'shorts', bottomColor: '#272a33', shoeColor: '#f4f1ea' },
    workSpot: 'counter',
    lines: [
      'I\'m on the front counter. Pick-up folks are always so lovely.',
      'A friendly hello is half of what we do here.',
      'Bread\'s on the end shelf if anyone asks!',
      'Let\'s smash this shift.',
    ],
  },
  {
    id: 'robert',
    name: 'Robert',
    looks: { skin: '#dba27c', hair: '#4a3b33', hairStyle: 'short' },
    outfit: { ...base, top: 'tee', topColor: '#3a3a40', accentColor: '#8fa3c9', bottom: 'trousers', bottomColor: '#1c1c22', shoeColor: '#1c1c22', layer: 'vest', layerColor: '#7b7d68', hat: 'cowboy', hatColor: '#1e1b20' },
    workSpot: 'van',
    lines: [
      'Howdy, partner! This van won\'t load itself.',
      'You like the hat? It sparkles in the sun. That\'s the point.',
      'All these pockets and I still can\'t find my sunnies.',
      'Pack \'em up, move \'em out!',
    ],
  },
  {
    id: 'cleo',
    name: 'Cleo',
    looks: { skin: '#f4ccb4', hair: '#8b6a4c', hairStyle: 'fringeBack', freckles: true },
    outfit: { ...base, top: 'floral', topColor: '#c9b6e8', accentColor: '#c8323f', bottom: 'trousers', bottomColor: '#3c4a6b' },
    workSpot: 'bags',
    lines: [
      'I\'m on bag duty! Grab a bag and pick a group.',
      'Do you like my jumper? It has pears on it.',
      'Every bag gets packed with care.',
      'Read the order card, then go shelf to shelf.',
    ],
  },
  {
    id: 'matilda',
    name: 'Matilda',
    looks: { skin: '#f5d2bf', hair: '#1d1719', hairStyle: 'fringeBob', freckles: true, glasses: '#e8798c' },
    outfit: { ...base, top: 'jumper', topColor: '#1f1c22', accentColor: '#d9ff3c', bottom: 'trousers', bottomColor: '#2f3550' },
    workSpot: 'board',
    lines: [
      'I\'m keeping an eye on the board. Look how many bags are done!',
      'Ding! That\'s my favourite sound.',
      'Good job! Keep going!',
      'When every group is full, we cheer. That\'s the rule.',
    ],
  },
  {
    id: 'marc',
    name: 'Marc',
    looks: { skin: '#e3b08e', hair: '#2a1f1b', hairStyle: 'ponytail' },
    outfit: { ...base, top: 'tee', topColor: '#a9abb0', accentColor: '#a9abb0', bottom: 'trousers', bottomColor: '#2b2d36', shoeColor: '#1c1c22', layer: 'cardigan', layerColor: '#1d1d24' },
    workSpot: 'aisle',
    lines: [
      'Restocking the middle aisle. Rice and pasta are full!',
      'Pro tip: carry the bag, not the shelf.',
      'I could go for a frozen yoghurt after this shift.',
      'Teamwork! *thumbs up*',
    ],
  },
  {
    id: 'marco',
    name: 'Marco',
    looks: { skin: '#d9a07e', hair: '#5a4034', hairStyle: 'bald' },
    outfit: { ...base, top: 'shirt', topColor: '#262a40', accentColor: '#262a40', bottom: 'trousers', bottomColor: '#c8a57c', shoeColor: '#6b4a33' },
    workSpot: 'door',
    lines: [
      'Welcome in! Make yourself at home.',
      'Every bag out the door makes a difference to somebody.',
      'You\'re a natural at this.',
      'When the van\'s gone, let\'s all have a cuppa.',
    ],
  },
  {
    id: 'harry',
    name: 'Harry',
    looks: { skin: '#f0c7aa', hair: '#3a2a22', hairStyle: 'buzz', glasses: '#1c1a1e' },
    outfit: { ...base, top: 'gith', topColor: '#1c1b21', accentColor: '#ef6b8f', bottom: 'trousers', bottomColor: '#2b2d36' },
    workSpot: 'kitchen2',
    lines: [
      'I\'m on pumpkin duty. One spoon per tart. Precisely.',
      'Gloves on! Kitchen rules.',
      'These tarts are going to be the best ones yet.',
      'Want to help? Grab a tray and get filling!',
    ],
  },
];

/** The dog! Follows you around in both modes. */
export const DOG = { name: 'Bowie' };

/** How many bags each group needs in one shift (the real tracker numbers, scaled down to fit a game shift). */
export const GROUPS: { id: string; label: string; bags: number }[] = [
  { id: '1', label: 'Group 1', bags: 2 },
  { id: '2', label: 'Group 2', bags: 3 },
  { id: '3', label: 'Group 3', bags: 2 },
  { id: '4', label: 'Group 4', bags: 2 },
  { id: '5', label: 'Group 5', bags: 2 },
  { id: '6A', label: 'Group 6A', bags: 2 },
  { id: '6B', label: 'Group 6B', bags: 2 },
  { id: 'pickup', label: 'Pick up Only', bags: 2 },
];

/** Options for making a brand-new volunteer. */
export const CUSTOM_SKINS = ['#fbe0cf', '#f2cbb0', '#e8b48f', '#c98d64', '#a86d47', '#7c4d32', '#5a3624'];
export const CUSTOM_HAIRS = ['#1f1814', '#3a2720', '#5b3a26', '#8a6143', '#b9824f', '#d9b075', '#e8d9b5', '#b8462d', '#9a9aa6', '#c46b9a', '#6c7fd1'];
export const HAIR_STYLES: HairStyle[] = ['shoulderSide', 'longWavy', 'bobSide', 'ponytail', 'short', 'bun', 'curly', 'buzz', 'fringeBob', 'fringeBack', 'bald'];

export const CLOTHES_COLOURS = [
  '#ffffff', '#f3ead6', '#1f1c22', '#1f2433', '#3c4a6b', '#6f8fc0', '#9fdccb', '#7cc48b',
  '#2f6b4f', '#f4d35e', '#ef8a5b', '#c8323f', '#e98fb0', '#b9a3e3', '#6b3fa0', '#8a6143',
  '#cfd3c8', '#e9a978', '#d9ff3c', '#ff9f1c',
];

export const DEFAULT_CUSTOM: Person = {
  id: 'custom', name: 'You',
  looks: { skin: '#e8b48f', hair: '#5b3a26', hairStyle: 'short' },
  outfit: { ...base, layer: 'apron', layerColor: '#7cc48b' },
  workSpot: '',
  lines: [],
};
