import { BellSlashIcon } from 'phosphor-react-native';
import { COLORS } from '../theme/tokens';
import EmptyState from '../common/EmptyState';

export default function NotificationEmptyState() {
  return (
    <EmptyState
      icon={BellSlashIcon}
      iconSize={52}
      iconColor={COLORS.negative}
      iconBgColor={COLORS.negativeSoft}
      title="Hier is het nog stil"
      body="Nieuwe meldingen verschijnen hier zodra er iets verandert."
    />
  );
}
