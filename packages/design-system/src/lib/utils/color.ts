import type { COLORS } from '$lib/styles/plugins/common';

export { COLORS } from '$lib/styles/plugins/common';

export type Colors = (typeof COLORS)[number];

export function getColorGroupClass(color: string) {
  switch (color) {
    case 'primary':
      return 'color-group-primary';
    case 'neutral':
      return 'color-group-neutral';
    case 'danger':
      return 'color-group-danger';
    case 'success':
      return 'color-group-success';
    case 'warning':
      return 'color-group-warning';
    case 'blue':
      return 'color-group-blue';
    case 'gray':
      return 'color-group-gray';
    case 'green':
      return 'color-group-green';
    case 'magenta':
      return 'color-group-magenta';
    case 'orange':
      return 'color-group-orange';
    case 'pink':
      return 'color-group-pink';
    case 'red':
      return 'color-group-red';
    case 'violet':
      return 'color-group-violet';
    case 'yellow':
      return 'color-group-yellow';
    default:
      return 'color-group-neutral';
  }
}

export function getGroupBg(num: number) {
  switch (num) {
    case 1:
      return 'bg-group-1';
    case 2:
      return 'bg-group-2';
    case 3:
      return 'bg-group-3';
    case 4:
      return 'bg-group-4';
    case 5:
      return 'bg-group-5';
    case 6:
      return 'bg-group-6';
    case 7:
      return 'bg-group-7';
    case 8:
      return 'bg-group-8';
    case 9:
      return 'bg-group-9';
    case 10:
      return 'bg-group-10';
    case 11:
      return 'bg-group-11';
    case 12:
      return 'bg-group-12';
    default:
      return 'bg-group-1';
  }
}
