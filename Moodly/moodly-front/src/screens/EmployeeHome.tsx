// Parcours employé : vérifie s'il a déjà répondu aujourd'hui,
// puis affiche la saisie (écran 2) ou le merci (écran 3).
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { api } from '../services/api';
import { colors } from '../theme';
import { MoodScreen } from './MoodScreen';
import { ThanksScreen } from './ThanksScreen';

type State = 'checking' | 'form' | 'thanks' | 'already';

export function EmployeeHome() {
  const [state, setState] = useState<State>('checking');

  useEffect(() => {
    api
      .hasAnsweredToday()
      .then((answered) => setState(answered ? 'already' : 'form'))
      .catch(() => setState('form'));
  }, []);

  if (state === 'checking') {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.purple} />
      </View>
    );
  }
  if (state === 'form') return <MoodScreen onDone={() => setState('thanks')} />;
  return <ThanksScreen alreadyAnswered={state === 'already'} />;
}
