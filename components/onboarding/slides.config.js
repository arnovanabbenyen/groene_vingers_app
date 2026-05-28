import { MapPin, UserCheck, Notebook } from 'phosphor-react-native';

export const ONBOARDING_SLIDES = [
  {
    id: 'find-spot',
    title: 'Vind jouw groene plek',
    subtitle: 'Kweek je eigen groenten in een privétuin dicht bij huis, gedeeld door iemand uit jouw buurt.',
    icon: MapPin,
    variant: 'green',
  },
  {
    id: 'connect-trust',
    title: 'Verbind met vertrouwen',
    subtitle: 'Chat met tuineigenaars, bekijk hun profiel en ratings. Alles verloopt veilig via het platform.',
    icon: UserCheck,
    variant: 'yellow',
  },
  {
    id: 'track-progress',
    title: 'Houd alles bij',
    subtitle: 'Documenteer je perceelbezoeken, noteer opvolgingen en volg je groei seizoen per seizoen.',
    icon: Notebook,
    variant: 'beige',
  },
];
