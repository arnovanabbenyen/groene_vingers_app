import { DropIcon, LeafIcon, PlantIcon, RecycleIcon, ShovelIcon, TreeIcon } from 'phosphor-react-native';
import { COLORS } from '../theme/tokens';

const ICON_MAP = [
  { test: (n) => n.includes('water'), Icon: DropIcon },
  { test: (n) => n.includes('shovel') || n.includes('materiaal') || n.includes('tools'), Icon: ShovelIcon },
  { test: (n) => n.includes('plant') || n.includes('zaden'), Icon: PlantIcon },
  { test: (n) => n.includes('compost') || n.includes('recycle'), Icon: RecycleIcon },
  { test: (n) => n.includes('boom') || n.includes('tree') || n.includes('bomen'), Icon: TreeIcon },
];

export default function AmenityIcon({ label, size = 13, color = COLORS.textSecondary, weight = 'regular' }) {
  const n = (label || '').toLowerCase();
  const match = ICON_MAP.find(({ test }) => test(n));
  const Icon = match ? match.Icon : LeafIcon;
  return <Icon size={size} color={color} weight={weight} />;
}
