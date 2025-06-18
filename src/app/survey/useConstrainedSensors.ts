import {
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

const activationConstraint = {
  distance: 8,
  delay: 1000,
};

export const useConstrainedSensors = () =>
  useSensors(
    useSensor(MouseSensor, {
      activationConstraint,
    }),
    useSensor(TouchSensor, {
      activationConstraint,
    }),
    useSensor(PointerSensor, {
      activationConstraint,
    })
  );
