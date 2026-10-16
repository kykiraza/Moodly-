// Les animations du prototype (bob, fade-in, slide-in…) avec l'API Animated de React Native.
import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

/** Valeur qui va de 0 à 1 en boucle (ou une seule fois si loop = false). */
export function useAnim({ duration, delay = 0, loop = true, easing = Easing.inOut(Easing.ease) }) {
  const [v] = useState(() => new Animated.Value(0)); // créée une seule fois
  useEffect(() => {
    const one = Animated.timing(v, { toValue: 1, duration, easing, useNativeDriver: true });
    const anim = loop
      ? Animated.sequence([Animated.delay(delay), Animated.loop(one)])
      : Animated.sequence([Animated.delay(delay), one]);
    anim.start();
    return () => anim.stop();
  }, [v, duration, delay, loop, easing]);
  return v;
}

/** La mascotte qui flotte doucement (animation « bob » : 3,2 s). */
export function Bob({ children, style }) {
  const t = useAnim({ duration: 3200, easing: Easing.linear });
  const ease = { inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -4, -8, -4, 0] };
  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            { translateY: t.interpolate(ease) },
            { rotate: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-2deg', '2deg', '-2deg'] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Apparition (animate-in) : fondu + glissement optionnel.
 * from = 'right' (slide-in-from-right), 'bottom' (slide-in-from-bottom) ou null.
 */
export function FadeIn({ children, from = null, distance = 16, duration = 350, delay = 0, style }) {
  const t = useAnim({ duration, delay, loop: false, easing: Easing.out(Easing.cubic) });
  const shift = t.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] });
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: from === 'right' ? [{ translateX: shift }] : from === 'bottom' ? [{ translateY: shift }] : [],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
