import plugin from 'tailwindcss/plugin';
import { COLORS, createLabels } from './common';

export default plugin(
  function ({ matchUtilities, theme }) {
    matchUtilities(
      {
        'color-group': (value) => ({
          '--color-g-1': `var(--color-${value}-1)`,
          '--color-g-2': `var(--color-${value}-2)`,
          '--color-g-3': `var(--color-${value}-3)`,
          '--color-g-4': `var(--color-${value}-4)`,
          '--color-g-5': `var(--color-${value}-5)`,
          '--color-g-6': `var(--color-${value}-6)`,
          '--color-g-7': `var(--color-${value}-7)`,
          '--color-g-8': `var(--color-${value}-8)`,
          '--color-g-9': `var(--color-${value}-9)`,
          '--color-g-10': `var(--color-${value}-10)`,
          '--color-g-11': `var(--color-${value}-11)`,
          '--color-g-12': `var(--color-${value}-12)`
        })
      },
      {
        values: theme('groupColors')
      }
    );
  },
  {
    theme: {
      groupColors: createLabels(COLORS),
      extend: {
        colors: {
          'group-1': 'var(--color-g-1)',
          'group-2': 'var(--color-g-2)',
          'group-3': 'var(--color-g-3)',
          'group-4': 'var(--color-g-4)',
          'group-5': 'var(--color-g-5)',
          'group-6': 'var(--color-g-6)',
          'group-7': 'var(--color-g-7)',
          'group-8': 'var(--color-g-8)',
          'group-9': 'var(--color-g-9)',
          'group-10': 'var(--color-g-10)',
          'group-11': 'var(--color-g-11)',
          'group-12': 'var(--color-g-12)'
        }
      }
    }
  }
);