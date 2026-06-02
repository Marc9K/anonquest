import {
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

// Require a 8px move before activating drag.
// No delay — drag only starts from the dedicated handle, so a
// time-based trigger would just cause phantom grabs on long clicks.
const activationConstraint = {
  distance: 8,
};

export const useConstrainedSensors = () =>
  useSensors(
    useSensor(MouseSensor, { activationConstraint }),
    useSensor(TouchSensor, { activationConstraint }),
    useSensor(PointerSensor, { activationConstraint })
  );
