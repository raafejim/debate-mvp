import type { Card } from "./types";

export const CARDS: Card[] = [
  { id: "c01", statement: "Healthcare should be free for everyone" },
  { id: "c02", statement: "Social media does more harm than good" },
  { id: "c03", statement: "AI will eventually replace most human jobs" },
  { id: "c04", statement: "Higher education should be free" },
  { id: "c05", statement: "Voting should be mandatory" },
  { id: "c06", statement: "The minimum wage should be doubled" },
  { id: "c07", statement: "The death penalty should be abolished" },
  { id: "c08", statement: "Recreational drug use should be legalized" },
  { id: "c09", statement: "Billionaires should not exist" },
  { id: "c10", statement: "Climate change requires immediate, radical government action" },
  { id: "c11", statement: "Nuclear power is essential to fighting climate change" },
  { id: "c12", statement: "Social media users should be required to verify their real identity" },
  { id: "c13", statement: "Universal basic income should be implemented" },
  { id: "c14", statement: "Private schools should be banned" },
  { id: "c15", statement: "Organized religion does more harm than good" },
  { id: "c16", statement: "Eating meat is morally wrong" },
  { id: "c17", statement: "Genetic engineering of human embryos should be permitted" },
  { id: "c18", statement: "Cryptocurrency is the future of money" },
  { id: "c19", statement: "Remote work should be the default for office jobs" },
  { id: "c20", statement: "People under 18 should be allowed to vote" },
  { id: "c21", statement: "Tipping culture should end" },
  { id: "c22", statement: "Standardized testing should be eliminated" },
  { id: "c23", statement: "Privacy matters more than security" },
  { id: "c24", statement: "Self-driving cars should fully replace human drivers" },
  { id: "c25", statement: "The four-day work week should be the standard" },
  { id: "c26", statement: "Extreme wealth should be redistributed by the state" },
  { id: "c27", statement: "Free will is an illusion" },
  { id: "c28", statement: "Censorship is sometimes justified" },
  { id: "c29", statement: "Tech companies have too much power" },
  { id: "c30", statement: "Public transportation should be free" },
  { id: "c31", statement: "Recreational hunting should be banned" },
  { id: "c32", statement: "Single-use plastic should be banned globally" },
  { id: "c33", statement: "The internet should be regulated like a public utility" },
  { id: "c34", statement: "Mandatory national service is a good idea" },
  { id: "c35", statement: "Marriage is an outdated institution" },
  { id: "c36", statement: "Parents have a right to read their child's text messages" },
  { id: "c37", statement: "Pineapple belongs on pizza" },
  { id: "c38", statement: "Cats are better than dogs" },
  { id: "c39", statement: "Online learning is just as effective as in-person" },
  { id: "c40", statement: "Governments should subsidize plant-based foods" },
  { id: "c41", statement: "Owning a firearm is a fundamental right" },
  { id: "c42", statement: "Public schools should require uniforms" },
  { id: "c43", statement: "Zoos should be abolished" },
  { id: "c44", statement: "Reality TV is degrading society" },
  { id: "c45", statement: "Books are better than their movie adaptations" },
  { id: "c46", statement: "Intelligent alien life exists somewhere in the universe" },
  { id: "c47", statement: "Social media should be banned for users under 16" },
  { id: "c48", statement: "Space exploration is worth the cost" },
  { id: "c49", statement: "A hot dog is a sandwich" },
  { id: "c50", statement: "Money can buy happiness" },
];

export function shuffledDeck(): Card[] {
  const deck = [...CARDS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
