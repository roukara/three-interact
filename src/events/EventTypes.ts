export type InteractEventType =
  | 'click'
  | 'dblclick'
  | 'drag'
  | 'dragstart'
  | 'dragend'
  | 'pointerdown'
  | 'pointerup'
  | 'pointermove'
  | 'pointerenter'
  | 'pointerleave'
  | 'wheel';

import { InteractEvent } from './InteractEvent'
export type InteractEventHandler = (event: InteractEvent) => void;

export interface PointerHandlers {
  enter?: InteractEventHandler;
  leave?: InteractEventHandler;
  move?: InteractEventHandler;
}
