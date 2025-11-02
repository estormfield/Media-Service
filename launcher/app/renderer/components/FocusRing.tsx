import type { FC } from 'react';

interface FocusRingProps {
  visible: boolean;
}

export const FocusRing: FC<FocusRingProps> = ({ visible }) => {
  return <div className={visible ? 'focus-ring focus-ring--visible' : 'focus-ring'} aria-hidden />;
};
