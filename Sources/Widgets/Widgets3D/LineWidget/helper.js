import * as vtkMath from 'vtk.js/Sources/Common/Core/Math/';

export function calculateTextPosition(model) {
  const vector = [0, 0, 0];
  const handle1WorldPos = model.widgetState.getHandle1().getOrigin();
  const handle2WorldPos = model.widgetState.getHandle2().getOrigin();
  let statePositionOnLine = model.widgetState
    .getPositionOnLine()
    .getPosOnLine();
  statePositionOnLine = 1 - statePositionOnLine;
  vtkMath.subtract(handle1WorldPos, handle2WorldPos, vector);
  vtkMath.multiplyScalar(vector, statePositionOnLine);
  vtkMath.add(vector, handle2WorldPos, vector);
  return vector;
}

export function updateTextPosition(model) {
  const SVGTextState = model.widgetState.getText();
  SVGTextState.setOrigin(calculateTextPosition(model));
}

export function getNbHandles(model) {
  const handle1 = model.widgetState.getHandle1();
  const handle2 = model.widgetState.getHandle2();
  const moveHandle = model.widgetState.getMoveHandle();
  if (handle1.getOrigin().length !== 0 && handle2.getOrigin().length !== 0) {
    return 2;
  }
  if (
    handle1.getOrigin() === handle2.getOrigin() ||
    model.activeState === moveHandle
  )
    return 1;
  return 0;
}
