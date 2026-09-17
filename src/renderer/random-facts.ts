import { btnRandomFact, randomFactDisplay } from './dom';

const USELESS_FACTS: readonly string[] = [
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
  'The first VHS tape ever rented was "Behind the Green Door" — nobody asked, but now you know.'
];

export function initRandomFacts(): void {
  btnRandomFact.addEventListener('click', () => {
    const fact = USELESS_FACTS[Math.floor(Math.random() * USELESS_FACTS.length)];
    randomFactDisplay.textContent = fact;
    randomFactDisplay.style.display = 'block';
  });
}
