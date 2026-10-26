import type { Channel, Collection } from '../types'

// Fictional CableEra channel identities. They are not affiliated with, or
// endorsed by, any real network.

export const CHANNELS: Channel[] = [
  {
    id: 'era-classics',
    number: '005',
    name: 'Era Classics',
    tagline: 'Vintage TV, around the clock',
    description: 'Public-domain cartoons and classic television you can watch right here. Every program on this channel plays in CableEra.',
    hue: 215,
    blockMin: 30,
    showIds: ['beverly-hillbillies', 'felix-the-cat', 'fleischer-superman', 'early-mickey', 'oswald', 'koko-the-clown'],
  },
  {
    id: 'saturday-morning',
    number: '012',
    name: 'Saturday Morning',
    tagline: 'Pour the cereal',
    description: 'Back-to-back cartoons in the Saturday-morning tradition. Vintage shorts play in CableEra; the rest are listings.',
    hue: 30,
    blockMin: 30,
    showIds: ['felix-the-cat', 'oswald', 'early-mickey', 'koko-the-clown', 'looney-tunes', 'tom-and-jerry', 'scooby-doo-where-are-you', 'flintstones', 'jetsons', 'recess', 'pepper-ann', 'doug', 'batman-tas', 'animaniacs'],
  },
  {
    id: 'after-school',
    number: '018',
    name: 'After School',
    tagline: 'Homework can wait',
    description: '2000s and early-2010s animation for the hours between the bus and dinner.',
    hue: 140,
    blockMin: 30,
    showIds: ['adventure-time', 'regular-show', 'amazing-world-of-gumball', 'phineas-and-ferb', 'gravity-falls', 'fairly-oddparents', 'jimmy-neutron', 'kids-next-door', 'fosters-home', 'chowder', 'flapjack', 'spongebob', 'penguins-of-madagascar', 'billy-and-mandy', 'teen-titans-go', 'steven-universe'],
  },
  {
    id: 'throwback-toons',
    number: '024',
    name: 'Throwback Toons',
    tagline: 'The 90s never left',
    description: '1990s and 2000s cartoons, from Nicktoons to Cartoon Cartoons.',
    hue: 290,
    blockMin: 30,
    showIds: ['rugrats', 'hey-arnold', 'rockos-modern-life', 'catdog', 'angry-beavers', 'aaahh-real-monsters', 'dexters-laboratory', 'johnny-bravo', 'cow-and-chicken', 'powerpuff-girls', 'ed-edd-n-eddy', 'courage', 'wild-thornberrys', 'rocket-power', 'tiny-toon-adventures', 'ren-and-stimpy'],
  },
  {
    id: 'teen-time',
    number: '031',
    name: 'Teen Time',
    tagline: 'Laugh track included',
    description: 'Teen sitcoms and family comedies from the 2000s and early 2010s.',
    hue: 330,
    blockMin: 30,
    showIds: ['thats-so-raven', 'lizzie-mcguire', 'even-stevens', 'hannah-montana', 'suite-life-zack-cody', 'drake-and-josh', 'zoey-101', 'neds-declassified', 'icarly', 'wizards-of-waverly-place', 'sonny-with-a-chance', 'victorious', 'good-luck-charlie', 'shake-it-up', 'austin-and-ally', 'big-time-rush', 'jessie', 'phil-of-the-future', 'suite-life-on-deck'],
  },
  {
    id: 'sitcom-central',
    number: '038',
    name: 'Sitcom Central',
    tagline: 'Comfort TV, all night',
    description: 'Classic and nostalgic sitcoms. Early Beverly Hillbillies episodes play in CableEra; the rest are listings.',
    hue: 45,
    blockMin: 30,
    showIds: ['beverly-hillbillies', 'fresh-prince', 'full-house', 'family-matters', 'boy-meets-world', 'step-by-step', 'home-improvement', 'friends', 'seinfeld', 'frasier', 'everybody-loves-raymond', 'king-of-queens', 'george-lopez', 'malcolm-in-the-middle', 'the-office-us', 'himym', 'i-love-lucy', 'andy-griffith'],
  },
  {
    id: 'adventure-zone',
    number: '044',
    name: 'Adventure Zone',
    tagline: 'Heroes on the hour',
    description: 'Action cartoons and animated adventures. Fleischer Superman shorts play in CableEra.',
    hue: 0,
    blockMin: 30,
    showIds: ['fleischer-superman', 'avatar-last-airbender', 'samurai-jack', 'justice-league', 'teen-titans', 'batman-tas', 'ben-10', 'danny-phantom', 'kim-possible', 'secret-saturdays', 'thundercats-2011', 'pokemon', 'digimon', 'yu-gi-oh'],
  },
  {
    id: 'preschool-memories',
    number: '052',
    name: 'Preschool Memories',
    tagline: 'Can you say "nostalgia"?',
    description: 'Nostalgic educational and preschool shows.',
    hue: 175,
    blockMin: 30,
    showIds: ['sesame-street', 'mister-rogers', 'arthur', 'magic-school-bus', 'clifford', 'dragon-tales', 'cyberchase', 'bear-big-blue-house', 'backyardigans', 'wonder-pets', 'curious-george', 'wordgirl'],
  },
  {
    id: 'retro-rewind',
    number: '060',
    name: 'Retro Rewind',
    tagline: 'Where animation began',
    description: 'Silent-era and early sound cartoons, from Gertie the Dinosaur to Steamboat Willie. Everything here plays in CableEra.',
    hue: 260,
    blockMin: 30,
    showIds: ['winsor-mccay', 'felix-the-cat', 'koko-the-clown', 'oswald', 'aesops-fables', 'early-mickey', 'silly-symphonies'],
  },
  {
    id: 'movie-night',
    number: '070',
    name: 'Movie Night',
    tagline: 'TV movies & specials',
    description: 'Made-for-TV movies and holiday specials. Listings only for now: none of these play in CableEra.',
    hue: 350,
    blockMin: 120,
    showIds: ['halloweentown', 'zenon', 'twitches', 'high-school-musical', 'camp-rock', 'charlie-brown-christmas', 'great-pumpkin', 'grinch-1966'],
  },
]

export const getChannel = (id: string) => CHANNELS.find((c) => c.id === id)
export const getChannelByNumber = (n: string) => CHANNELS.find((c) => Number(c.number) === Number(n))

// Editorial collections. These are curated lists, not promises of availability.
export const COLLECTIONS: Collection[] = [
  {
    id: 'after-school-mode',
    kind: 'mode',
    title: 'After School',
    description: 'Drop your backpack. Animated comedies and teen sitcoms from the 2000s and early 2010s.',
    showIds: ['spongebob', 'fairly-oddparents', 'kids-next-door', 'fosters-home', 'phineas-and-ferb', 'thats-so-raven', 'drake-and-josh', 'icarly', 'hannah-montana', 'adventure-time', 'regular-show'],
  },
  {
    id: 'saturday-morning-mode',
    kind: 'mode',
    title: 'Saturday Morning',
    description: 'Back-to-back cartoons, pajamas required. Vintage shorts play right here.',
    showIds: ['felix-the-cat', 'oswald', 'early-mickey', 'koko-the-clown', 'looney-tunes', 'tom-and-jerry', 'scooby-doo-where-are-you', 'recess', 'pepper-ann', 'doug', 'animaniacs'],
  },
  {
    id: 'throwback-night',
    kind: 'mode',
    title: 'Throwback Night',
    description: 'Prime-time sitcoms, animated favorites and TV movies for after dinner.',
    showIds: ['beverly-hillbillies', 'fresh-prince', 'full-house', 'boy-meets-world', 'the-simpsons', 'friends', 'halloweentown', 'high-school-musical'],
  },
  {
    id: 'comfort-tv',
    kind: 'mode',
    title: 'Comfort TV',
    description: 'Familiar shows you can leave on in the background.',
    showIds: ['beverly-hillbillies', 'felix-the-cat', 'the-office-us', 'friends', 'spongebob', 'full-house', 'everybody-loves-raymond', 'king-of-queens', 'andy-griffith', 'i-love-lucy'],
  },
  { id: '2000s-cartoon-marathon', kind: 'marathon', title: '2000s Cartoon Marathon', description: 'The decade of Cartoon Cartoons and Nicktoons.', showIds: ['fairly-oddparents', 'danny-phantom', 'kids-next-door', 'kim-possible', 'jimmy-neutron', 'samurai-jack', 'teen-titans', 'billy-and-mandy', 'fosters-home', 'avatar-last-airbender', 'ben-10'] },
  { id: 'disney-channel-memories', kind: 'marathon', title: 'Disney Channel Memories', description: 'Sitcoms, cartoons and DCOMs from Disney Channel’s golden years.', showIds: ['thats-so-raven', 'lizzie-mcguire', 'even-stevens', 'kim-possible', 'proud-family', 'hannah-montana', 'suite-life-zack-cody', 'wizards-of-waverly-place', 'phineas-and-ferb', 'halloweentown', 'zenon', 'high-school-musical'] },
  { id: 'classic-nickelodeon', kind: 'marathon', title: 'Classic Nickelodeon', description: 'Slime-era favorites.', showIds: ['rugrats', 'doug', 'rockos-modern-life', 'ren-and-stimpy', 'aaahh-real-monsters', 'hey-arnold', 'catdog', 'angry-beavers', 'kenan-and-kel', 'all-that', 'are-you-afraid-of-the-dark'] },
  { id: 'cartoon-network-after-school', kind: 'marathon', title: 'Cartoon Network After School', description: 'Toonami-adjacent afternoons.', showIds: ['dexters-laboratory', 'johnny-bravo', 'cow-and-chicken', 'powerpuff-girls', 'ed-edd-n-eddy', 'courage', 'samurai-jack', 'kids-next-door', 'chowder', 'flapjack'] },
  { id: '90s-saturday-morning', kind: 'marathon', title: '1990s Saturday Morning', description: 'Network cartoon blocks from the 90s.', showIds: ['batman-tas', 'animaniacs', 'tiny-toon-adventures', 'recess', 'pepper-ann', 'doug', 'pokemon', 'digimon'] },
  { id: 'early-2010s-animation', kind: 'marathon', title: 'Early-2010s Animation', description: 'The weird, wonderful cartoon renaissance.', showIds: ['adventure-time', 'regular-show', 'amazing-world-of-gumball', 'gravity-falls', 'steven-universe', 'my-little-pony-fim', 'looney-tunes-show', 'thundercats-2011'] },
  { id: 'retro-sitcom-night', kind: 'marathon', title: 'Retro Sitcom Night', description: 'Laugh tracks from the 60s through the 90s.', showIds: ['beverly-hillbillies', 'i-love-lucy', 'andy-griffith', 'full-house', 'family-matters', 'step-by-step', 'home-improvement', 'seinfeld'] },
  { id: 'vintage-animation', kind: 'marathon', title: 'Vintage Animation', description: 'Silent shorts and the dawn of sound cartoons. All playable.', showIds: ['winsor-mccay', 'felix-the-cat', 'koko-the-clown', 'oswald', 'aesops-fables', 'early-mickey', 'silly-symphonies', 'fleischer-superman'] },
  { id: 'halloween-marathon', kind: 'marathon', title: 'Halloween Cartoon Marathon', description: 'Spooky shorts and specials.', showIds: ['silly-symphonies', 'early-mickey', 'great-pumpkin', 'halloweentown', 'twitches', 'courage', 'are-you-afraid-of-the-dark', 'scooby-doo-where-are-you'] },
  { id: 'holiday-memories', kind: 'marathon', title: 'Holiday Television Memories', description: 'Specials the whole family waited all year for.', showIds: ['charlie-brown-christmas', 'grinch-1966', 'great-pumpkin'] },
]

export const getCollection = (id: string) => COLLECTIONS.find((c) => c.id === id)
