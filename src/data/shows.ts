import type { Audience, ContentRights, Era, Genre, Show } from '../types'

// Editorial catalog. The copyrighted titles here are a wishlist of shows people
// grew up with: CableEra shows their metadata but does not stream them, and no
// provider link is listed until someone verifies one (see providerLinks).

const COPYRIGHTED: ContentRights = {
  status: 'copyrighted',
  basis: 'Copyrighted series. CableEra does not host or stream it. Watching requires an authorized provider.',
  territory: 'US',
}

const PD_EXPIRED: ContentRights = {
  status: 'public-domain-expired',
  basis:
    'Published in 1930 or earlier, so its US copyright term has expired. Character names and likenesses may still be protected as trademarks.',
  territory: 'US',
}

function hueFor(id: string): number {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

type Row = [
  id: string,
  title: string,
  start: number,
  end: number | null,
  network: string,
  era: Era,
  genres: Genre[],
  audience: Audience,
  runtimeMin: number,
  description: string,
]

function make(rows: Row[], rights: ContentRights = COPYRIGHTED): Show[] {
  return rows.map(([id, title, startYear, endYear, network, era, genres, audience, runtimeMin, description]) => ({
    id,
    title,
    startYear,
    endYear,
    network,
    era,
    genres,
    audience,
    runtimeMin,
    description,
    rights,
    providerLinks: [],
    hue: hueFor(id),
  }))
}

const early2010s: Row[] = [
  ['adventure-time', 'Adventure Time', 2010, 2018, 'Cartoon Network', 'early-2010s', ['animation', 'adventure', 'comedy'], 'kids', 11, 'Finn the human and Jake the dog roam the post-apocalyptic Land of Ooo.'],
  ['regular-show', 'Regular Show', 2010, 2017, 'Cartoon Network', 'early-2010s', ['animation', 'comedy'], 'kids', 11, 'Groundskeepers Mordecai and Rigby turn every slacker shortcut into a cosmic disaster.'],
  ['amazing-world-of-gumball', 'The Amazing World of Gumball', 2011, 2019, 'Cartoon Network', 'early-2010s', ['animation', 'comedy', 'family'], 'kids', 11, 'A blue cat and his goldfish brother survive school and family life in mixed-media Elmore.'],
  ['my-little-pony-fim', 'My Little Pony: Friendship Is Magic', 2010, 2019, 'The Hub', 'early-2010s', ['animation', 'adventure', 'family'], 'kids', 22, 'Twilight Sparkle and her friends learn that friendship is a kind of magic in Equestria.'],
  ['steven-universe', 'Steven Universe', 2013, 2019, 'Cartoon Network', 'early-2010s', ['animation', 'adventure', 'sci-fi'], 'kids', 11, 'A half-Gem boy grows up alongside the Crystal Gems, guardians of Beach City.'],
  ['teen-titans-go', 'Teen Titans Go!', 2013, null, 'Cartoon Network', 'early-2010s', ['animation', 'comedy', 'superhero'], 'kids', 11, 'The Titans spend more time on pizza and pranks than on saving the world.'],
  ['gravity-falls', 'Gravity Falls', 2012, 2016, 'Disney Channel', 'early-2010s', ['animation', 'adventure', 'comedy'], 'kids', 22, 'Twins Dipper and Mabel spend a summer uncovering the mysteries of a strange Oregon town.'],
  ['pokemon-black-white', 'Pokémon: Black & White', 2010, 2013, 'TV Tokyo / Cartoon Network (US)', 'early-2010s', ['animation', 'anime', 'adventure'], 'kids', 22, 'Ash heads to the Unova region for a fresh start with new Pokémon and rivals.'],
  ['looney-tunes-show', 'The Looney Tunes Show', 2011, 2014, 'Cartoon Network', 'early-2010s', ['animation', 'comedy', 'sitcom'], 'kids', 22, 'Bugs and Daffy share a suburban house in a sitcom take on the classic characters.'],
  ['thundercats-2011', 'ThunderCats (2011)', 2011, 2012, 'Cartoon Network', 'early-2010s', ['animation', 'action', 'adventure'], 'kids', 22, 'Young Lion-O leads the ThunderCats against Mumm-Ra in a reimagined Third Earth.'],
  ['good-luck-charlie', 'Good Luck Charlie', 2010, 2014, 'Disney Channel', 'early-2010s', ['sitcom', 'family'], 'family', 22, 'Teddy records video diaries of advice for her baby sister Charlie.'],
  ['shake-it-up', 'Shake It Up', 2010, 2013, 'Disney Channel', 'early-2010s', ['sitcom', 'teen'], 'family', 22, 'Best friends CeCe and Rocky land spots as dancers on a Chicago TV show.'],
  ['jessie', 'Jessie', 2011, 2015, 'Disney Channel', 'early-2010s', ['sitcom', 'family'], 'family', 22, 'A Texas girl moves to New York and becomes a nanny to four kids in a penthouse.'],
  ['austin-and-ally', 'Austin & Ally', 2011, 2016, 'Disney Channel', 'early-2010s', ['sitcom', 'teen'], 'family', 22, 'A rising pop star and a stage-shy songwriter team up to make music.'],
  ['victorious', 'Victorious', 2010, 2013, 'Nickelodeon', 'early-2010s', ['sitcom', 'teen'], 'family', 22, 'Tori Vega enrolls at Hollywood Arts, a high school for performers.'],
  ['big-time-rush', 'Big Time Rush', 2009, 2013, 'Nickelodeon', 'early-2010s', ['sitcom', 'teen'], 'family', 22, 'Four hockey players from Minnesota move to Los Angeles to form a boy band.'],
  ['suite-life-on-deck', 'The Suite Life on Deck', 2008, 2011, 'Disney Channel', 'early-2010s', ['sitcom', 'teen'], 'family', 22, 'Zack and Cody head to sea on the SS Tipton cruise ship.'],
  ['phineas-and-ferb', 'Phineas and Ferb', 2007, 2015, 'Disney Channel', 'early-2010s', ['animation', 'comedy', 'family'], 'kids', 11, 'Two stepbrothers fill all 104 days of summer vacation with impossible projects.'],
]

const late2000s: Row[] = [
  ['spongebob', 'SpongeBob SquarePants', 1999, null, 'Nickelodeon', 'late-2000s', ['animation', 'comedy'], 'kids', 11, 'An optimistic sea sponge flips Krabby Patties in the town of Bikini Bottom.'],
  ['avatar-last-airbender', 'Avatar: The Last Airbender', 2005, 2008, 'Nickelodeon', 'late-2000s', ['animation', 'adventure', 'action'], 'kids', 23, 'Aang, the last Airbender, must master all four elements to end a hundred-year war.'],
  ['fairly-oddparents', 'The Fairly OddParents', 2001, 2017, 'Nickelodeon', 'late-2000s', ['animation', 'comedy'], 'kids', 11, 'Timmy Turner’s fairy godparents grant wishes that rarely go to plan.'],
  ['danny-phantom', 'Danny Phantom', 2004, 2007, 'Nickelodeon', 'late-2000s', ['animation', 'action', 'superhero'], 'kids', 22, 'After a lab accident, a teenager becomes half-ghost and defends his town.'],
  ['billy-and-mandy', 'The Grim Adventures of Billy & Mandy', 2003, 2007, 'Cartoon Network', 'late-2000s', ['animation', 'comedy'], 'kids', 11, 'Two kids win the Grim Reaper as their best friend in a game of limbo.'],
  ['fosters-home', 'Foster’s Home for Imaginary Friends', 2004, 2009, 'Cartoon Network', 'late-2000s', ['animation', 'comedy', 'family'], 'kids', 22, 'Mac visits Bloo at a group home for imaginary friends their kids outgrew.'],
  ['camp-lazlo', 'Camp Lazlo', 2005, 2008, 'Cartoon Network', 'late-2000s', ['animation', 'comedy'], 'kids', 11, 'A free-spirited monkey brings chaos to Camp Kidney.'],
  ['chowder', 'Chowder', 2007, 2010, 'Cartoon Network', 'late-2000s', ['animation', 'comedy'], 'kids', 11, 'A hungry apprentice chef learns the trade in Marzipan City.'],
  ['flapjack', 'The Marvelous Misadventures of Flapjack', 2008, 2010, 'Cartoon Network', 'late-2000s', ['animation', 'adventure', 'comedy'], 'kids', 11, 'A boy raised by a whale searches for Candied Island with a scurvy captain.'],
  ['ben-10', 'Ben 10', 2005, 2008, 'Cartoon Network', 'late-2000s', ['animation', 'action', 'sci-fi'], 'kids', 22, 'Ten-year-old Ben finds the Omnitrix, a watch that turns him into aliens.'],
  ['secret-saturdays', 'The Secret Saturdays', 2008, 2010, 'Cartoon Network', 'late-2000s', ['animation', 'action', 'adventure'], 'kids', 22, 'A family of cryptozoologists protects hidden creatures from discovery.'],
  ['total-drama-island', 'Total Drama Island', 2007, 2008, 'Teletoon / Cartoon Network (US)', 'late-2000s', ['animation', 'comedy', 'teen'], 'teen', 22, 'Teens compete in a reality show parody set at a run-down summer camp.'],
  ['penguins-of-madagascar', 'The Penguins of Madagascar', 2008, 2015, 'Nickelodeon', 'late-2000s', ['animation', 'comedy', 'action'], 'kids', 11, 'Four commando penguins run covert missions from the Central Park Zoo.'],
  ['curious-george', 'Curious George', 2006, null, 'PBS Kids', 'late-2000s', ['animation', 'preschool', 'educational'], 'preschool', 12, 'A curious little monkey explores science and the city with the Man with the Yellow Hat.'],
  ['wordgirl', 'WordGirl', 2007, 2015, 'PBS Kids', 'late-2000s', ['animation', 'educational', 'superhero'], 'kids', 11, 'A superhero with a huge vocabulary battles villains in Fair City.'],
  ['backyardigans', 'The Backyardigans', 2004, 2013, 'Nick Jr.', 'late-2000s', ['animation', 'preschool'], 'preschool', 22, 'Five friends turn their backyard into musical adventures.'],
  ['wonder-pets', 'Wonder Pets!', 2006, 2016, 'Nick Jr.', 'late-2000s', ['animation', 'preschool'], 'preschool', 11, 'Classroom pets team up to rescue baby animals in trouble.'],
  ['icarly', 'iCarly', 2007, 2012, 'Nickelodeon', 'late-2000s', ['sitcom', 'teen'], 'family', 22, 'Carly, Sam and Freddie run a hit web show from a Seattle loft.'],
  ['wizards-of-waverly-place', 'Wizards of Waverly Place', 2007, 2012, 'Disney Channel', 'late-2000s', ['sitcom', 'teen', 'family'], 'family', 22, 'The Russo siblings train as wizards while living above their family sub shop.'],
  ['hannah-montana', 'Hannah Montana', 2006, 2011, 'Disney Channel', 'late-2000s', ['sitcom', 'teen'], 'family', 22, 'Miley Stewart lives a double life as an ordinary teen and a pop star.'],
  ['suite-life-zack-cody', 'The Suite Life of Zack & Cody', 2005, 2008, 'Disney Channel', 'late-2000s', ['sitcom', 'family'], 'family', 22, 'Twin brothers grow up inside Boston’s Tipton Hotel.'],
  ['drake-and-josh', 'Drake & Josh', 2004, 2007, 'Nickelodeon', 'late-2000s', ['sitcom', 'teen'], 'family', 22, 'Two very different stepbrothers learn to share a room and a family.'],
  ['zoey-101', 'Zoey 101', 2005, 2008, 'Nickelodeon', 'late-2000s', ['sitcom', 'teen'], 'family', 22, 'Zoey joins the first class of girls at Pacific Coast Academy.'],
  ['neds-declassified', 'Ned’s Declassified School Survival Guide', 2004, 2007, 'Nickelodeon', 'late-2000s', ['sitcom', 'teen'], 'family', 22, 'Ned shares tips for surviving middle school, with mixed results.'],
  ['sonny-with-a-chance', 'Sonny with a Chance', 2009, 2011, 'Disney Channel', 'late-2000s', ['sitcom', 'teen'], 'family', 22, 'A Wisconsin teen joins the cast of a Hollywood sketch-comedy show.'],
  ['big-bang-theory', 'The Big Bang Theory', 2007, 2019, 'CBS', 'late-2000s', ['sitcom', 'comedy'], 'adult', 22, 'Physicist roommates and their friends navigate science, comics and dating.'],
  ['the-office-us', 'The Office (US)', 2005, 2013, 'NBC', 'late-2000s', ['sitcom', 'comedy'], 'adult', 22, 'A documentary crew follows the employees of Dunder Mifflin Scranton.'],
  ['himym', 'How I Met Your Mother', 2005, 2014, 'CBS', 'late-2000s', ['sitcom', 'comedy'], 'adult', 22, 'Ted tells his kids the long story of how he met their mother.'],
  ['everybody-hates-chris', 'Everybody Hates Chris', 2005, 2009, 'UPN / The CW', 'late-2000s', ['sitcom', 'family'], 'family', 22, 'Chris Rock narrates his teenage years in 1980s Brooklyn.'],
]

const early2000s: Row[] = [
  ['rocket-power', 'Rocket Power', 1999, 2004, 'Nickelodeon', 'early-2000s', ['animation', 'adventure'], 'kids', 22, 'Four friends skate, surf and bike their way through Ocean Shores.'],
  ['powerpuff-girls', 'The Powerpuff Girls', 1998, 2005, 'Cartoon Network', 'early-2000s', ['animation', 'action', 'superhero'], 'kids', 22, 'Blossom, Bubbles and Buttercup save Townsville before bedtime.'],
  ['ed-edd-n-eddy', 'Ed, Edd n Eddy', 1999, 2009, 'Cartoon Network', 'early-2000s', ['animation', 'comedy'], 'kids', 22, 'Three boys scheme to scam their neighbors out of quarters for jawbreakers.'],
  ['courage', 'Courage the Cowardly Dog', 1999, 2002, 'Cartoon Network', 'early-2000s', ['animation', 'comedy'], 'kids', 22, 'A timid dog protects his elderly owners from the supernatural in Nowhere, Kansas.'],
  ['kids-next-door', 'Codename: Kids Next Door', 2002, 2008, 'Cartoon Network', 'early-2000s', ['animation', 'action', 'comedy'], 'kids', 22, 'Five kids run a treehouse operation against adult tyranny.'],
  ['kim-possible', 'Kim Possible', 2002, 2007, 'Disney Channel', 'early-2000s', ['animation', 'action', 'teen'], 'kids', 22, 'A high-school cheerleader saves the world with her friend Ron and his mole rat.'],
  ['proud-family', 'The Proud Family', 2001, 2005, 'Disney Channel', 'early-2000s', ['animation', 'family', 'comedy'], 'kids', 22, 'Penny Proud navigates teen life alongside her loud, loving family.'],
  ['jimmy-neutron', 'The Adventures of Jimmy Neutron, Boy Genius', 2002, 2006, 'Nickelodeon', 'early-2000s', ['animation', 'sci-fi', 'comedy'], 'kids', 22, 'A boy genius’s inventions keep backfiring on the town of Retroville.'],
  ['whats-new-scooby-doo', 'What’s New, Scooby-Doo?', 2002, 2006, 'Kids’ WB', 'early-2000s', ['animation', 'comedy', 'adventure'], 'kids', 22, 'Mystery Inc. returns to unmask villains in a modernized revival.'],
  ['samurai-jack', 'Samurai Jack', 2001, 2004, 'Cartoon Network', 'early-2000s', ['animation', 'action', 'adventure'], 'kids', 22, 'A samurai flung into the future searches for a way home to defeat Aku.'],
  ['justice-league', 'Justice League', 2001, 2004, 'Cartoon Network', 'early-2000s', ['animation', 'action', 'superhero'], 'kids', 22, 'Superman, Batman, Wonder Woman and allies face threats too big for any one hero.'],
  ['teen-titans', 'Teen Titans', 2003, 2006, 'Cartoon Network', 'early-2000s', ['animation', 'action', 'superhero'], 'kids', 22, 'Robin leads a team of young heroes from a T-shaped tower in Jump City.'],
  ['yu-gi-oh', 'Yu-Gi-Oh!', 2000, 2006, 'TV Tokyo / Kids’ WB (US)', 'early-2000s', ['animation', 'anime', 'adventure'], 'kids', 22, 'Yugi and the spirit of the Millennium Puzzle duel with monster cards.'],
  ['clifford', 'Clifford the Big Red Dog', 2000, 2003, 'PBS Kids', 'early-2000s', ['animation', 'preschool', 'educational'], 'preschool', 22, 'Emily Elizabeth and her giant red dog learn lessons on Birdwell Island.'],
  ['dragon-tales', 'Dragon Tales', 1999, 2005, 'PBS Kids', 'early-2000s', ['animation', 'preschool', 'educational'], 'preschool', 22, 'Two siblings visit Dragon Land with a magic dragon scale.'],
  ['cyberchase', 'Cyberchase', 2002, null, 'PBS Kids', 'early-2000s', ['animation', 'educational', 'adventure'], 'kids', 22, 'Three kids use math to stop the Hacker in Cyberspace.'],
  ['bear-big-blue-house', 'Bear in the Big Blue House', 1997, 2006, 'Disney Channel (Playhouse Disney)', 'early-2000s', ['preschool', 'family'], 'preschool', 22, 'A friendly Muppet bear welcomes viewers and friends into his blue house.'],
  ['thats-so-raven', 'That’s So Raven', 2003, 2007, 'Disney Channel', 'early-2000s', ['sitcom', 'teen', 'family'], 'family', 22, 'A psychic teenager’s visions of the future cause more trouble than they solve.'],
  ['lizzie-mcguire', 'Lizzie McGuire', 2001, 2004, 'Disney Channel', 'early-2000s', ['sitcom', 'teen'], 'family', 22, 'An animated alter ego narrates Lizzie’s middle-school ups and downs.'],
  ['even-stevens', 'Even Stevens', 2000, 2003, 'Disney Channel', 'early-2000s', ['sitcom', 'family'], 'family', 22, 'Louis Stevens brings chaos to an overachieving suburban family.'],
  ['phil-of-the-future', 'Phil of the Future', 2004, 2006, 'Disney Channel', 'early-2000s', ['sitcom', 'sci-fi', 'family'], 'family', 22, 'A family from 2121 gets stranded in the present after a time-machine breakdown.'],
  ['eight-simple-rules', '8 Simple Rules', 2002, 2005, 'ABC', 'early-2000s', ['sitcom', 'family'], 'family', 22, 'A protective father lays down rules for his teenage daughters.'],
  ['george-lopez', 'George Lopez', 2002, 2007, 'ABC', 'early-2000s', ['sitcom', 'family'], 'family', 22, 'A factory manager juggles work, family and his mother in Los Angeles.'],
  ['malcolm-in-the-middle', 'Malcolm in the Middle', 2000, 2006, 'Fox', 'early-2000s', ['sitcom', 'family'], 'family', 22, 'A gifted kid breaks the fourth wall to describe his chaotic family.'],
  ['everybody-loves-raymond', 'Everybody Loves Raymond', 1996, 2005, 'CBS', 'early-2000s', ['sitcom', 'family'], 'family', 22, 'A sportswriter’s parents live across the street, and drop in constantly.'],
  ['king-of-queens', 'The King of Queens', 1998, 2007, 'CBS', 'early-2000s', ['sitcom', 'comedy'], 'adult', 22, 'A delivery driver and his wife share their Queens home with her father.'],
  ['friends', 'Friends', 1994, 2004, 'NBC', 'early-2000s', ['sitcom', 'comedy'], 'adult', 22, 'Six friends in Manhattan, a lot of coffee and one orange couch.'],
]

const nineties: Row[] = [
  ['rugrats', 'Rugrats', 1991, 2004, 'Nickelodeon', '1990s', ['animation', 'comedy', 'family'], 'kids', 22, 'Tommy Pickles and the babies see the grown-up world as one big adventure.'],
  ['hey-arnold', 'Hey Arnold!', 1996, 2004, 'Nickelodeon', '1990s', ['animation', 'comedy', 'family'], 'kids', 22, 'A football-headed fourth-grader helps neighbors in the city of Hillwood.'],
  ['wild-thornberrys', 'The Wild Thornberrys', 1998, 2004, 'Nickelodeon', '1990s', ['animation', 'adventure', 'family'], 'kids', 22, 'Eliza can talk to animals while traveling with her nature-documentary family.'],
  ['doug', 'Doug', 1991, 1999, 'Nickelodeon / ABC', '1990s', ['animation', 'family'], 'kids', 22, 'Doug Funnie writes his worries, crushes and daydreams in his journal.'],
  ['rockos-modern-life', 'Rocko’s Modern Life', 1993, 1996, 'Nickelodeon', '1990s', ['animation', 'comedy'], 'kids', 22, 'An Australian wallaby struggles with the absurdities of O-Town.'],
  ['ren-and-stimpy', 'The Ren & Stimpy Show', 1991, 1995, 'Nickelodeon', '1990s', ['animation', 'comedy'], 'teen', 22, 'A volatile chihuahua and a dim cat in gleefully gross misadventures.'],
  ['aaahh-real-monsters', 'Aaahh!!! Real Monsters', 1994, 1997, 'Nickelodeon', '1990s', ['animation', 'comedy'], 'kids', 22, 'Three young monsters train to scare humans at a school under the city dump.'],
  ['catdog', 'CatDog', 1998, 2005, 'Nickelodeon', '1990s', ['animation', 'comedy'], 'kids', 22, 'Conjoined brothers, one cat and one dog, share a body and nothing else.'],
  ['angry-beavers', 'The Angry Beavers', 1997, 2001, 'Nickelodeon', '1990s', ['animation', 'comedy'], 'kids', 22, 'Beaver brothers Norbert and Daggett leave home for bachelor life.'],
  ['dexters-laboratory', 'Dexter’s Laboratory', 1996, 2003, 'Cartoon Network', '1990s', ['animation', 'sci-fi', 'comedy'], 'kids', 22, 'A boy genius hides a secret lab from everyone but his sister Dee Dee.'],
  ['johnny-bravo', 'Johnny Bravo', 1997, 2004, 'Cartoon Network', '1990s', ['animation', 'comedy'], 'kids', 22, 'A pompadoured muscle man strikes out with women, every time.'],
  ['cow-and-chicken', 'Cow and Chicken', 1997, 1999, 'Cartoon Network', '1990s', ['animation', 'comedy'], 'kids', 22, 'A cow and a chicken are siblings, and the Red Guy is always around.'],
  ['pokemon', 'Pokémon', 1997, null, 'TV Tokyo / Kids’ WB (US)', '1990s', ['animation', 'anime', 'adventure'], 'kids', 22, 'Ash Ketchum sets out with Pikachu to become a Pokémon Master.'],
  ['digimon', 'Digimon: Digital Monsters', 1999, 2003, 'Fuji TV / Fox Kids (US)', '1990s', ['animation', 'anime', 'adventure'], 'kids', 22, 'Seven kids at summer camp are pulled into the Digital World.'],
  ['batman-tas', 'Batman: The Animated Series', 1992, 1995, 'Fox Kids', '1990s', ['animation', 'action', 'superhero'], 'kids', 22, 'A noir-tinged Batman protects Gotham City.'],
  ['animaniacs', 'Animaniacs', 1993, 1998, 'Fox Kids / Kids’ WB', '1990s', ['animation', 'comedy', 'variety'], 'kids', 22, 'The Warner siblings escape the studio water tower for zany sketch comedy.'],
  ['tiny-toon-adventures', 'Tiny Toon Adventures', 1990, 1992, 'Syndication / Fox Kids', '1990s', ['animation', 'comedy'], 'kids', 22, 'Young toons study comedy under the Looney Tunes at Acme Looniversity.'],
  ['the-simpsons', 'The Simpsons', 1989, null, 'Fox', '1990s', ['animation', 'comedy', 'sitcom'], 'teen', 22, 'America’s favorite animated family in the town of Springfield.'],
  ['recess', 'Recess', 1997, 2001, 'ABC (One Saturday Morning)', '1990s', ['animation', 'comedy'], 'kids', 22, 'T.J. and his friends rule the playground at Third Street School.'],
  ['pepper-ann', 'Pepper Ann', 1997, 2000, 'ABC (One Saturday Morning)', '1990s', ['animation', 'comedy'], 'kids', 22, 'A 12-year-old daydreamer navigates seventh grade.'],
  ['arthur', 'Arthur', 1996, 2022, 'PBS Kids', '1990s', ['animation', 'educational', 'family'], 'kids', 22, 'Arthur the aardvark and his friends grow up in Elwood City.'],
  ['magic-school-bus', 'The Magic School Bus', 1994, 1997, 'PBS', '1990s', ['animation', 'educational', 'adventure'], 'kids', 22, 'Ms. Frizzle takes her class on field trips through the human body and beyond.'],
  ['boy-meets-world', 'Boy Meets World', 1993, 2000, 'ABC', '1990s', ['sitcom', 'family'], 'family', 22, 'Cory Matthews grows up under the watchful eye of his teacher Mr. Feeny.'],
  ['family-matters', 'Family Matters', 1989, 1998, 'ABC / CBS', '1990s', ['sitcom', 'family'], 'family', 22, 'The Winslows of Chicago, and their neighbor Steve Urkel.'],
  ['sabrina', 'Sabrina the Teenage Witch', 1996, 2003, 'ABC / The WB', '1990s', ['sitcom', 'family', 'teen'], 'family', 22, 'A teen discovers she’s a witch and lives with her aunts and a talking cat.'],
  ['full-house', 'Full House', 1987, 1995, 'ABC', '1990s', ['sitcom', 'family'], 'family', 22, 'A widowed dad raises three daughters with help from his brother-in-law and best friend.'],
  ['step-by-step', 'Step by Step', 1991, 1998, 'ABC / CBS', '1990s', ['sitcom', 'family'], 'family', 22, 'Two single parents marry and blend their families.'],
  ['sister-sister', 'Sister, Sister', 1994, 1999, 'ABC / The WB', '1990s', ['sitcom', 'family', 'teen'], 'family', 22, 'Twins separated at birth reunite by chance at a mall.'],
  ['kenan-and-kel', 'Kenan & Kel', 1996, 2000, 'Nickelodeon', '1990s', ['sitcom', 'comedy'], 'family', 22, 'Two Chicago friends, one scheme, and a lot of orange soda.'],
  ['all-that', 'All That', 1994, 2005, 'Nickelodeon', '1990s', ['variety', 'comedy'], 'family', 22, 'A kid-led sketch-comedy show with musical guests.'],
  ['are-you-afraid-of-the-dark', 'Are You Afraid of the Dark?', 1990, 2000, 'YTV / Nickelodeon', '1990s', ['anthology', 'teen'], 'family', 22, 'The Midnight Society tells scary stories around a campfire.'],
  ['fresh-prince', 'The Fresh Prince of Bel-Air', 1990, 1996, 'NBC', '1990s', ['sitcom', 'family'], 'family', 22, 'A street-smart teen from West Philadelphia moves in with his rich relatives.'],
  ['home-improvement', 'Home Improvement', 1991, 1999, 'ABC', '1990s', ['sitcom', 'family'], 'family', 22, 'A home-improvement TV host can’t fix his own problems.'],
  ['seinfeld', 'Seinfeld', 1989, 1998, 'NBC', '1990s', ['sitcom', 'comedy'], 'adult', 22, 'A show about nothing, set in Manhattan.'],
  ['frasier', 'Frasier', 1993, 2004, 'NBC', '1990s', ['sitcom', 'comedy'], 'adult', 22, 'A radio psychiatrist moves back to Seattle and in with his father.'],
]

const classicCopyrighted: Row[] = [
  ['looney-tunes', 'Looney Tunes', 1930, null, 'Warner Bros. (theatrical)', 'classic', ['animation', 'comedy'], 'kids', 7, 'Bugs Bunny, Daffy Duck and friends in classic theatrical shorts.'],
  ['tom-and-jerry', 'Tom and Jerry', 1940, null, 'MGM (theatrical)', 'classic', ['animation', 'comedy'], 'kids', 7, 'A cat and mouse in an endless, slapstick rivalry.'],
  ['flintstones', 'The Flintstones', 1960, 1966, 'ABC', 'classic', ['animation', 'sitcom', 'family'], 'family', 25, 'A modern Stone Age family in the town of Bedrock.'],
  ['jetsons', 'The Jetsons', 1962, 1963, 'ABC', 'classic', ['animation', 'sitcom', 'sci-fi'], 'family', 25, 'A space-age family with flying cars and a robot maid.'],
  ['scooby-doo-where-are-you', 'Scooby-Doo, Where Are You!', 1969, 1970, 'CBS', 'classic', ['animation', 'comedy', 'adventure'], 'kids', 22, 'Four teens and a Great Dane solve mysteries in the Mystery Machine.'],
  ['sesame-street', 'Sesame Street', 1969, null, 'NET / PBS', 'classic', ['preschool', 'educational'], 'preschool', 55, 'Muppets and neighbors teach letters, numbers and kindness.'],
  ['mister-rogers', 'Mister Rogers’ Neighborhood', 1968, 2001, 'PBS', 'classic', ['preschool', 'educational'], 'preschool', 28, 'Fred Rogers invites children to talk about feelings and visit the Neighborhood of Make-Believe.'],
  ['andy-griffith', 'The Andy Griffith Show', 1960, 1968, 'CBS', 'classic', ['sitcom', 'family'], 'family', 25, 'Sheriff Andy Taylor keeps the peace in Mayberry, North Carolina.'],
  ['i-love-lucy', 'I Love Lucy', 1951, 1957, 'CBS', 'classic', ['sitcom', 'comedy'], 'family', 25, 'Lucy Ricardo schemes to break into her bandleader husband’s act.'],
  ['twilight-zone', 'The Twilight Zone', 1959, 1964, 'CBS', 'classic', ['anthology', 'sci-fi'], 'adult', 25, 'Rod Serling guides viewers into stories of the strange and uncanny.'],
]

// TV movies and specials for Movie Night and the holiday collections.
const moviesAndSpecials: Row[] = [
  ['halloweentown', 'Halloweentown', 1998, null, 'Disney Channel', '1990s', ['movie', 'family', 'holiday'], 'family', 84, 'Marnie learns she’s a witch and visits a town where Halloween never ends.'],
  ['zenon', 'Zenon: Girl of the 21st Century', 1999, null, 'Disney Channel', '1990s', ['movie', 'sci-fi', 'family'], 'family', 97, 'A teen growing up on a 2049 space station gets sent to Earth.'],
  ['twitches', 'Twitches', 2005, null, 'Disney Channel', 'late-2000s', ['movie', 'family', 'holiday'], 'family', 89, 'Twins separated at birth discover they are witches on their 21st birthday.'],
  ['high-school-musical', 'High School Musical', 2006, null, 'Disney Channel', 'late-2000s', ['movie', 'teen'], 'family', 98, 'A basketball star and a brainy newcomer audition for the school musical.'],
  ['camp-rock', 'Camp Rock', 2008, null, 'Disney Channel', 'late-2000s', ['movie', 'teen'], 'family', 94, 'A girl with big music dreams lands a spot at a summer music camp.'],
  ['charlie-brown-christmas', 'A Charlie Brown Christmas', 1965, null, 'CBS', 'classic', ['animation', 'holiday', 'family'], 'family', 25, 'Charlie Brown searches for the true meaning of Christmas.'],
  ['great-pumpkin', 'It’s the Great Pumpkin, Charlie Brown', 1966, null, 'CBS', 'classic', ['animation', 'holiday', 'family'], 'family', 25, 'Linus waits all Halloween night in the pumpkin patch.'],
  ['grinch-1966', 'How the Grinch Stole Christmas!', 1966, null, 'CBS', 'classic', ['animation', 'holiday', 'family'], 'family', 26, 'A grumpy recluse plots to steal Christmas from Whoville.'],
]

// Public-domain series with verified, playable media (see media.generated.json).
const publicDomain: Show[] = [
  ...make(
    [
      ['felix-the-cat', 'Felix the Cat', 1919, 1930, 'Pat Sullivan Studio (theatrical)', 'classic', ['animation', 'comedy', 'silent'], 'kids', 7, 'Otto Messmer’s black cat was the first animated superstar, walking off his troubles in surreal silent shorts.'],
      ['early-mickey', 'Mickey Mouse: The 1928–29 Shorts', 1928, 1929, 'Walt Disney Studio (theatrical)', 'classic', ['animation', 'comedy'], 'kids', 7, 'Mickey’s earliest cartoons, including Steamboat Willie, which entered the US public domain in 2024.'],
      ['silly-symphonies', 'Silly Symphonies', 1929, 1929, 'Walt Disney Studio (theatrical)', 'classic', ['animation'], 'kids', 6, 'Disney’s musical shorts. The Skeleton Dance (1929) is the series’ first entry.'],
      ['aesops-fables', 'Aesop’s Film Fables', 1928, 1928, 'Van Beuren Studios (theatrical)', 'classic', ['animation', 'comedy'], 'kids', 7, 'Paul Terry and Van Beuren’s barnyard cartoons, among the first with synchronized sound.'],
      ['winsor-mccay', 'Winsor McCay’s Gertie', 1914, 1921, 'Winsor McCay (theatrical)', 'classic', ['animation', 'silent'], 'family', 12, 'Gertie the Dinosaur, one of the earliest animated characters with a real personality.'],
      ['oswald', 'Oswald the Lucky Rabbit', 1927, 1930, 'Universal Pictures (theatrical)', 'classic', ['animation', 'comedy', 'silent'], 'kids', 6, 'The rabbit Walt Disney created before Mickey, later continued by Walter Lantz.'],
      ['koko-the-clown', 'Koko the Clown', 1922, 1928, 'Fleischer Studios (theatrical)', 'classic', ['animation', 'comedy', 'silent'], 'kids', 7, 'Max Fleischer’s clown climbs out of the inkwell to cause trouble in the real world.'],
    ],
    PD_EXPIRED,
  ),
  ...make(
    [['fleischer-superman', 'Superman (Fleischer Studios)', 1941, 1943, 'Paramount Pictures (theatrical)', 'classic', ['animation', 'action', 'superhero'], 'kids', 8, 'The lush, art-deco Superman shorts that defined animated action for decades.']],
    {
      status: 'public-domain-not-renewed',
      basis:
        'Wikimedia Commons lists these Paramount shorts as public domain in the US because their copyrights were not renewed. Superman remains a DC trademark.',
      territory: 'US',
    },
  ),
  ...make(
    [['beverly-hillbillies', 'The Beverly Hillbillies', 1962, 1971, 'CBS', 'classic', ['sitcom', 'family', 'comedy'], 'family', 25, 'The Clampetts strike oil and move to Beverly Hills.']],
    {
      status: 'public-domain-not-renewed',
      basis:
        'Wikimedia Commons lists these early episodes as public domain in the US because their copyrights were not renewed. This does not cover every episode of the series.',
      territory: 'US',
    },
  ),
]

export const SHOWS: Show[] = [
  ...make(early2010s),
  ...make(late2000s),
  ...make(early2000s),
  ...make(nineties),
  ...make(classicCopyrighted),
  ...make(moviesAndSpecials),
  ...publicDomain,
]
