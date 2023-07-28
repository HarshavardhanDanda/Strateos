import _ from 'lodash';

const Hazards = [
  {
    queryTerm: 'unknown',
    display: 'Unknown',
    color: 'grey'
  },
  {
    queryTerm: 'flammable',
    display: 'Flammable',
    color: 'red'
  },
  {
    queryTerm: 'oxidizer',
    display: 'Oxidizer',
    color: 'brown'
  },
  {
    queryTerm: 'strong_acid',
    display: 'Strong acid',
    color: 'orange'
  },
  {
    queryTerm: 'water_reactive_nucleophile',
    display: 'Water reactive nucleophile',
    color: 'green'
  },
  {
    queryTerm: 'water_reactive_electrophile',
    display: 'Water reactive electrophile',
    color: 'pink'
  },
  {
    queryTerm: 'general',
    display: 'General (not water reactive)',
    color: 'blue'
  },
  {
    queryTerm: 'peroxide_former',
    display: 'Peroxide former',
    color: 'black'
  },
  {
    queryTerm: 'strong_base',
    display: 'Strong base',
    color: 'purple'
  }
];

export const getHazardsFromCompound = compound => {
  return Hazards.map(hazard => hazard.queryTerm).filter(queryTerm => compound.get(queryTerm));
};

export const readableHazards = flags => {
  const hazards = Hazards.filter(h => flags.includes(h.queryTerm)).map(h => h.display);
  return hazards.length ? _.capitalize(hazards.join(', ').toLowerCase()) : 'N/A';
};

export default Hazards;
