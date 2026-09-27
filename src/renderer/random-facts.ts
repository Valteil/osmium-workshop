import { btnRandomFact, randomFactDisplay } from './dom';
import { getJSON, setJSON } from './storage';

const USELESS_FACTS: readonly string[] = [
  // ---- Assorted ----
  'A group of flamingos is called a "flamboyance."',
  'Bananas are berries, but strawberries aren\'t.',
  'Honey never spoils — archaeologists have eaten 3,000-year-old honey found in Egyptian tombs.',
  'Octopuses have three hearts, and two of them stop beating when they swim.',
  'The Eiffel Tower can grow taller in summer — the iron expands by about 15cm in the heat.',
  'A single cloud can weigh more than a million pounds.',
  'Wombat poop is cube-shaped.',
  'The inventor of the frisbee was turned into a frisbee after he died — his ashes were molded into a disc.',
  'There are more possible chess games than atoms in the observable universe.',
  'Scotland\'s national animal is the unicorn.',
  'Sharks existed before trees.',
  'A day on Venus is longer than a year on Venus.',
  'The dot over a lowercase "i" or "j" has a name: it\'s called a "tittle."',
  'Cows have best friends and get stressed when separated from them.',
  'It is impossible for most people to lick their own elbow (but you probably just tried).',
  'The unicorn Grand Master emote in most gacha games costs more real money than a used car, and someone out there has bought it.',
  'In Genshin Impact, Paimon canonically eats an absurd, physically implausible amount of food for her size, and the game just never explains where it goes.',
  'The "Ohayo" bell sound in Animal Crossing has been remixed into more unofficial lo-fi tracks than most real songs.',
  'A "gacha" pull rate of 0.6% for the rarest item means you are statistically more likely to be struck by lightning this year than to pull it on your first try.',
  'The Kool-Aid Man cannot legally be stopped by any wall, according to decades of consistent in-universe evidence.',
  'Waluigi has never appeared in a single mainline Super Mario platformer, only spin-offs — and yet everyone insists he\'s a main character.',
  'The "This is fine" dog meme comes from a webcomic where, canonically, the dog does eventually stop being fine.',
  'Shrek (2001) grossed enough at the box office to buy a small country\'s worth of onions, hypothetically.',
  'A "skibidi" toilet has no vocal cords, yet it sings — this has never been explained and never will be.',
  'The Baby Shark song has been played enough times on YouTube to circle the Earth in seconds if each play were a meter.',
  'There is an official Guinness World Record for "most spoons balanced on a human face" and someone trains for it.',
  'The moon has moonquakes.',
  'Slugs have four noses.',
  'You share your birthday with at least 9 million other people on Earth, roughly.',
  'A "jiffy" is an actual unit of time — 1/100th of a second.',
  'The longest hiccuping spree recorded lasted 68 years.',
  'Peanuts are not nuts — they\'re legumes.',
  'A crocodile cannot stick its tongue out.',
  'Some cats are allergic to humans.',
  'The dot pattern on a strawberry\'s surface are its actual seeds, and each one is a separate fruit.',
  'Polar bears have black skin under their fur.',
  'A "smiley face" emoticon predates the internet by over a century — it appeared in an 1862 satirical magazine.',
  'The world\'s quietest room is so silent people start hearing their own heartbeat and blood flow within minutes.',
  'Rubber bands last longer when refrigerated.',
  'The average person walks past 36 murderers in their lifetime, according to one (extremely dubious) statistic that keeps getting reposted anyway.',
  'A "murder of crows" is a real term, and crows really do hold what looks like funerals for their dead.',
  'Hot water can freeze faster than cold water under the right conditions — nobody fully agrees on why.',
  'There\'s a species of jellyfish that is biologically immortal.',
  'The "@ " symbol has no official name in English — it\'s often just called "the at sign."',
  'A cluster of bananas is called a "hand," and each individual banana is a "finger."',
  'Tomato ketchup was sold as medicine in the 1830s.',
  'The QWERTY keyboard layout was designed to slow typists down, not speed them up.',
  'Space smells like seared steak, according to astronauts who describe the smell that lingers on their suits.',
  'An ostrich\'s eye is bigger than its brain.',
  'The first VHS tape ever rented was "Behind the Green Door" — nobody asked, but now you know.',

  // ---- Nature ----
  'Tardigrades have survived being exposed to the vacuum of space.',
  'Sloths can hold their breath for up to 40 minutes — longer than dolphins.',
  'Koala fingerprints are so similar to human ones that they could confuse a crime scene.',
  'About two-thirds of an octopus\'s neurons are in its arms, not its head.',
  'Sea otters hold hands while they sleep so they don\'t drift apart.',
  'Honeybees tell each other where the flowers are by dancing.',
  'Pando, a grove of quaking aspen in Utah, is a single organism with one shared root system.',
  'Axolotls can regrow limbs, parts of their heart, and even parts of their brain.',
  'A mantis shrimp punches so fast the water forms collapsing bubbles that give off a flash of light.',
  'Mantis shrimp have up to 16 types of color receptor. Humans have three.',
  'Hummingbirds are the only birds that can fly backwards.',
  'Owls can\'t move their eyes, so they turn their whole head instead — up to 270 degrees.',
  'Starfish have no brain and no blood.',
  'Butterflies taste with their feet.',
  'Elephants are one of the few mammals that can\'t jump.',
  'Male seahorses are the ones that get pregnant and give birth.',
  'Cats can\'t taste sweetness.',
  'Some bamboo species can grow almost a meter in a single day.',
  'A bolt of lightning is about five times hotter than the surface of the Sun.',
  'A pistol shrimp snaps its claw so hard the collapsing bubble briefly gets nearly as hot as the Sun\'s surface.',
  'A blue whale\'s heart weighs around 180 kg — about as much as two grown adults.',
  'Goats have rectangular pupils, which give them nearly panoramic vision.',
  'Flamingos are born grey; they turn pink from the pigments in their food.',
  'Crows can recognize individual human faces and hold a grudge for years.',
  'Dolphins sleep with one half of their brain at a time.',
  'Wood frogs freeze solid in winter — no heartbeat — and thaw back to life in spring.',
  'A Venus flytrap counts: two touches to snap shut, about five more to start digesting.',
  'Giraffes have the same number of neck vertebrae as humans: seven.',
  'A shrimp\'s heart is in its head.',
  'Roughly half the oxygen you breathe was made by ocean plankton.',
  'Horses can\'t vomit.',
  'Gentoo penguins court their partners by giving them the nicest pebble they can find.',
  'Rats laugh when they\'re tickled — it\'s just too high-pitched for us to hear.',
  'Bumblebees have been trained to roll tiny balls into a goal, and some seem to roll balls just for fun.',
  'Cows produce more milk when they listen to calm music.',
  'A snail can have around 14,000 teeth.',
  'Some turtles can breathe through their butts.',
  'Squirrels forget where they buried a lot of their nuts, which accidentally plants forests.',
  'An electric eel\'s shock can reach around 800 volts.',
  'Sunflowers were planted at Chernobyl and Fukushima to help pull radioactive material out of the soil.',

  // ---- Pop culture ----
  'Pac-Man\'s name comes from "paku paku," the Japanese sound for munching.',
  'Mario was originally called "Jumpman."',
  'Pikachu\'s name combines "pika" (a sparkle) and "chu" (a squeak).',
  'Rhydon is often said to be the first Pokémon ever designed.',
  'Nintendo was founded in 1889 — to make playing cards.',
  'Tetris was created in 1984 by Alexey Pajitnov at the Soviet Academy of Sciences.',
  'Minecraft is the best-selling video game of all time.',
  'The first video ever uploaded to YouTube was "Me at the zoo," 19 seconds about elephants.',
  'Link is the hero. Zelda is the princess. Yes, people still get this wrong.',
  'In Kirby\'s first game, the Game Boy box art in America showed him as white.',
  'The Konami Code: up, up, down, down, left, right, left, right, B, A.',
  'Toy Story (1995) was the first fully computer-animated feature film.',
  'Hatsune Miku\'s name roughly means "the first sound of the future."',
  'Doraemon has no ears because a robot mouse chewed them off.',
  'One Piece has sold over 500 million copies worldwide.',
  'Spirited Away was the first anime film to win the Oscar for Best Animated Feature.',
  '"Never Gonna Give You Up" came out in 1987, twenty years before anyone got Rickrolled.',
  'Gangnam Style was the first YouTube video to reach a billion views.',
  'Among Us came out in 2018 and was basically ignored until 2020.',
  'The Simpsons are yellow so they\'d stand out to someone flipping through channels.',
  'Darth Vader was played by David Prowse and voiced by James Earl Jones.',
  'Bulbasaur is #1 in the Pokédex, so every "gotta catch \'em all" technically starts with a seed.',
  'Viggo Mortensen broke two toes kicking an Uruk-hai helmet in The Two Towers, and they kept the take.',
  'Sonic the Hedgehog was designed partly to give Sega a mascot to rival Mario.',
  'The Nokia 3310 is so famously durable that "indestructible" became its main meme.',
  'Garfield\'s birthday is June 19, 1978, the day his comic strip debuted.',
  'Scooby-Doo\'s name came from the lyric "doo-be-doo-be-doo" in "Strangers in the Night."',
  'The Wilhelm scream sound effect has appeared in hundreds of films since the 1950s.',

  // ---- Gacha games ----
  '"Gacha" comes from gachapon, Japanese capsule-toy machines: "gacha" for the crank, "pon" for the capsule dropping out.',
  'Japan banned "kompu gacha" (collect a full set to win a prize) in 2012.',
  'China has required games to publish their gacha drop rates since 2017.',
  'In Genshin Impact, a 5-star is guaranteed by the 90th pull, and the odds start climbing sharply around pull 74.',
  'In Arknights, every pull after 50 without a 6-star adds 2% to the next pull\'s 6-star chance.',
  'In Granblue Fantasy, 300 draws on a banner let you "spark" (just pick) a character.',
  'Belgium ruled paid loot boxes illegal gambling in 2018, and several gacha games left the country.',
  'Big spenders in gacha games are called "whales," a term borrowed from casinos.',
  'Uma Musume\'s horse girls are named after real racehorses, and the owners had to give permission.',
  'Azur Lane\'s ship girls are named after real warships, mostly from World War II.',
  'miHoYo was founded in 2012 by three students from Shanghai Jiao Tong University.',
  'Genshin Impact reportedly made about a billion dollars in its first six months.',
  'Honkai: Star Rail launched in April 2023 and topped download charts in dozens of countries.',
  'Paimon is described in-game as "emergency food," and she has never forgiven anyone for it.',
  '"Pity" is the counter that guarantees a rare pull after enough misses — the game\'s way of apologizing.',
  'A "10-pull" is often cheaper per pull than ten singles, which is exactly the point.',
  'Players "reroll" by starting new accounts over and over until the first free pulls are good.',
  'Fate/Grand Order players call the random summoning "gacha hell" with no irony whatsoever.',
  'Every gacha player has a superstition about the "right" time to pull. None of them work.',
  'Blue Archive\'s students each carry a halo, and the game has lore reasons for all of them.',
  'The "50/50" in many gachas means your 5-star might not be the featured one — losing it guarantees the next.',
  'Some players track every pull they\'ve ever made in spreadsheets. Some of those spreadsheets are longer than this dataset.',
  'In most gachas, the most common thing you get from a pull is a weapon or item you\'ll never use.',
  'Gacha "dailies" are designed to take just long enough to become a habit.',

  // ---- Stable Diffusion ----
  'Stable Diffusion was first released in August 2022 by Stability AI, CompVis and Runway.',
  'Stable Diffusion 1.x was trained at 512×512. SDXL was trained at 1024×1024.',
  'Stable Diffusion doesn\'t draw pixels directly: it works in a "latent" space 8 times smaller on each side, then a VAE decodes it.',
  'A 512×512 image is a 64×64×4 latent while the model is working on it.',
  'The CLIP text encoder reads 77 tokens at a time, which is why long prompts get split into chunks.',
  'Stable Diffusion 1.x uses OpenAI\'s CLIP ViT-L/14 as its text encoder. SDXL uses two text encoders.',
  'A "negative prompt" works by replacing the empty prompt in classifier-free guidance with the things you don\'t want.',
  'The same seed with the same settings gives you the same image, give or take GPU nondeterminism.',
  '"Euler a" is an ancestral sampler: it adds fresh noise every step, so more steps keep changing the image instead of converging.',
  'LoRA started as a technique for fine-tuning large language models, from a 2021 Microsoft paper.',
  'Textual inversion doesn\'t change the model at all: it learns a new word embedding.',
  'DreamBooth came out of Google Research in 2022.',
  'ControlNet was released in February 2023 by Lvmin Zhang, who also made Fooocus and Forge.',
  'ComfyUI was released in January 2023 by a developer known as comfyanonymous.',
  'The .safetensors format exists because old .ckpt files were Python pickles that could run arbitrary code when loaded.',
  'Aspect-ratio bucketing, the thing that lets you train on non-square images, was popularized by NovelAI.',
  '"CLIP skip 2" became a default for anime models because NovelAI trained that way.',
  'The WD14 tagger was trained on Danbooru images and tags.',
  '"1girl" is one of the most-used tags on Danbooru, with millions of posts.',
  '"masterpiece, best quality" works on many anime models because those phrases were in their training captions.',
  'Pony Diffusion\'s "score_9, score_8_up" tags came from ranking its training images by quality.',
  'Kohya\'s sd-scripts is behind a huge share of the LoRAs people have trained.',
  'Hands are hard for diffusion models partly because hands look wildly different from every angle and are small in most images.',
  'A black image from SDXL in half precision usually means the VAE overflowed — there\'s a fixed "fp16" VAE for exactly that.',
  'Early Stable Diffusion models were trained on subsets of LAION-5B, a dataset of about 5.85 billion image-text pairs.',
  'Stable Diffusion 1.5 was published by Runway in October 2022.',
  'CFG scale 7 (or 7.5) became the default mostly by convention, not because it\'s special.',
  'A dataset of 20–50 good images is often enough for a character LoRA. That\'s why you\'re here tagging.',
  'Diffusion models learn to remove noise. Generating an image is just denoising pure static, one step at a time.',
  'Somewhere, right now, someone is writing "(masterpiece:1.4)" and hoping for the best.'
];

// Facts already shown, by text (so editing the list never shows a stale
// index). Draws come only from unseen facts; once every fact has been seen
// the cycle restarts, never opening with the one just shown.
const SEEN_KEY = 'dts-random-facts-seen';

function nextFact(): string {
  const all = new Set(USELESS_FACTS);
  let seen = getJSON<string[]>(SEEN_KEY, []).filter((f) => all.has(f));
  let pool = USELESS_FACTS.filter((f) => !seen.includes(f));
  if (!pool.length){
    const last = seen[seen.length - 1];
    seen = [];
    pool = USELESS_FACTS.filter((f) => f !== last);
  }
  const fact = pool[Math.floor(Math.random() * pool.length)];
  seen.push(fact);
  setJSON(SEEN_KEY, seen);
  return fact;
}

export function initRandomFacts(): void {
  btnRandomFact.addEventListener('click', () => {
    randomFactDisplay.textContent = nextFact();
    randomFactDisplay.style.display = 'block';
  });
}
