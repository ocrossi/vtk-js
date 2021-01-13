import Constants from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/Constants';
import macro from 'vtk.js/Sources/macro';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math/';
import {
  calculateTextPosition,
  updateTextPosition,
  getNbHandles,
} from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/helper';

const { HandleRepresentationType } = Constants;
const MAX_POINTS = 2;

export default function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkLineWidgetProp');

  // const moveHandle = model.widgetState.getMoveHandle();
  const handle1 = model.widgetState.getHandle1();
  const handle2 = model.widgetState.getHandle2();
  const handle1FaceCamera = publicAPI.getWidgetState().getHandle1FaceCamera();
  const handle2FaceCamera = publicAPI.getWidgetState().getHandle2FaceCamera();
  const handleToHide = [false, false];

  model.nbHandles = 0;

  // --------------------------------------------------------------------------
  // Interactor event
  // --------------------------------------------------------------------------

  function ignoreKey(e) {
    return e.altKey || e.controlKey || e.shiftKey;
  }

  function updateCursor() {
    model.isDragging = true;
    model.openGLRenderWindow.setCursor('grabbing');
    model.interactor.requestAnimation(publicAPI);
  }

  // --------------------------------------------------------------------------
  // Text methods
  // --------------------------------------------------------------------------

  /*
   * check for handle 2 position in comparison to handle 1 position
   * and sets text offset to not overlap on the line representation
   */

  function getOffsetDirectionForTextPosition() {
    const pos1 = handle1.getOrigin();
    const pos2 = handle2.getOrigin();

    let dySign = 1;
    if (pos1[0] <= pos2[0]) {
      dySign = pos1[1] <= pos2[1] ? 1 : -1;
    } else {
      dySign = pos1[1] <= pos2[1] ? -1 : 1;
    }
    return dySign;
  }

  /*
   * place SVGText on line according to both handle positions
   * which purpose is to never have text representation overlapping
   * on PolyLine representation
   */
  publicAPI.placeText = () => {
    const dySign = getOffsetDirectionForTextPosition();
    const textPropsCp = { ...model.representations[3].getTextProps() };
    textPropsCp.dy = dySign * Math.abs(textPropsCp.dy);
    model.representations[3].setTextProps(textPropsCp);
    model.interactor.render();
  };

  publicAPI.setText = (text) => {
    model.widgetState.getText().setText(text);
    model.interactor.render();
  };

  // --------------------------------------------------------------------------
  // Handle positioning methods
  // --------------------------------------------------------------------------

  // Handle utilities ---------------------------------------------------------

  function computeDirectionWithTwoPoints(p1, p2) {
    const dir = [0, 0, 0];
    vtkMath.subtract(p1, p2, dir);
    return dir;
  }

  function isHandleOrientable(handleType) {
    return (
      handleType === HandleRepresentationType.CONE ||
      handleType === HandleRepresentationType.ARROWHEAD3 ||
      handleType === HandleRepresentationType.ARROWHEAD4 ||
      handleType === HandleRepresentationType.ARROWHEAD6
    );
  }

  function isOrientable() {
    return (
      isHandleOrientable(handle1.getShape()) ||
      isHandleOrientable(handle2.getShape())
    );
  }

  function computeMousePosition(p1, callData) {
    const worldMousePos = publicAPI.computeWorldToDisplay(
      model.renderer,
      p1[0],
      p1[1],
      p1[2]
    );
    const mousePos = publicAPI.computeDisplayToWorld(
      model.renderer,
      callData.position.x,
      callData.position.y,
      worldMousePos[2]
    );
    return mousePos;
  }

  publicAPI.isHandleGlyph2D = (handleShape) =>
    handleShape === HandleRepresentationType.ARROWHEAD3 ||
    handleShape === HandleRepresentationType.ARROWHEAD4 ||
    handleShape === HandleRepresentationType.ARROWHEAD6 ||
    handleShape === HandleRepresentationType.STAR ||
    handleShape === HandleRepresentationType.CIRCLE ||
    handleShape === HandleRepresentationType.VIEWFINDER ||
    handleShape === HandleRepresentationType.DISK;

  // Handle orientation & rotation ---------------------------------------------------------

  function orientFirstHandleBeforeSecondHandlePlacement(callData) {
    const handle1Origin = handle1.getOrigin();
    const mousePos = computeMousePosition(handle1Origin, callData);
    return computeDirectionWithTwoPoints(handle1Origin, mousePos);
  }

  function orientHandlesWithCompleteWidget(nb) {
    let dir = [0, 0, 0];
    const handle1Origin = handle1.getOrigin();
    const handle2Origin =
      nb !== 3
        ? handle2.getOrigin()
        : model.widgetState.getMoveHandle().getOrigin();
    dir = computeDirectionWithTwoPoints(handle1Origin, handle2Origin);
    if (nb === 2 || nb === 3) {
      vtkMath.multiplyScalar(dir, -1);
    }
    return dir;
  }

  function orientHandle(nb, direction) {
    if (
      (nb === 1 && handle1.getShape() === 'cone') ||
      ((nb === 2 || nb === 3) && handle2.getShape() === 'cone')
    ) {
      model.representations[nb - 1].getGlyph().setDirection(direction);
    } else {
      model.representations[nb - 1].setOrientation(direction);
    }
  }

  function updateHandleDirection(nb) {
    const direction = orientHandlesWithCompleteWidget(nb);
    orientHandle(nb, direction);
  }

  publicAPI.updateHandleDirections = () => {
    if (isHandleOrientable(handle1.getShape())) {
      updateHandleDirection(1);
    }
    if (isHandleOrientable(handle2.getShape())) {
      updateHandleDirection(2);
    }
  };

  publicAPI.rotateHandlesToFaceCamera = () => {
    if (
      handle1FaceCamera === true &&
      publicAPI.isHandleGlyph2D(handle1.getShape())
    ) {
      model.representations[0].setViewMatrix(
        Array.from(model.camera.getViewMatrix())
      );
    }
    if (
      handle2FaceCamera === true &&
      publicAPI.isHandleGlyph2D(handle2.getShape())
    ) {
      model.representations[1].setViewMatrix(
        Array.from(model.camera.getViewMatrix())
      );
    }
  };

  // Handles visibility ---------------------------------------------------------

  publicAPI.activateHandleVisibility = () => {
    if (handle1.getVisible() === false && handle1.getActive()) {
      handle1.setVisible(true);
      handleToHide[0] = true;
    }
    if (handle2.getVisible() === false && handle2.getActive()) {
      handle2.setVisible(true);
      handleToHide[1] = true;
    }
  };

  publicAPI.deactivateHandleVisibility = () => {
    if (handleToHide[0] === true) {
      handleToHide[0] = false;
      handle1.setVisible(false);
    }
    if (handleToHide[1] === true) {
      handleToHide[1] = false;
      handle2.setVisible(false);
    }
  };

  publicAPI.toggleMoveHandleVisibility = (visibility) => {
    model.representations[2].setVisibilityFlagArray([visibility, visibility]);
    model.widgetState.getMoveHandle().setVisible(visibility);
    model.representations[2].updateActorVisibility();
  };

  /*
   * Set actor visibility to true unless it is a NONE handle
   * and uses state visibility variable for the displayActor visibility to
   * allow pickable handles even when they are not displayed on screen
   */
  publicAPI.manageHandleVisibility = (handle, nb) => {
    const visibility = handle.getVisible();
    model.representations[nb - 1].setVisibilityFlagArray([
      visibility,
      handle.getShape() !== 'voidSphere',
    ]);
    handle.setVisible(visibility);
    model.representations[nb - 1].updateActorVisibility();
    if (nb === 1) {
      model.representations[nb].updateActorVisibility();
    }
    model.interactor.render();
  };

  // --------------------------------------------------------------------------

  publicAPI.placeHandle = (handle) => {
    const nb = getNbHandles(model);
    publicAPI.manageHandleVisibility(handle, nb);
    model.nbHandles = nb;
    handle.setOrigin(...model.widgetState.getMoveHandle().getOrigin());
    handle.setColor(model.widgetState.getMoveHandle().getColor());
    handle.setScale1(model.widgetState.getMoveHandle().getScale1());
    model.widgetState.getText().setText(model.text);
    model.widgetState.getText().setOrigin(calculateTextPosition(model));
  };

  // --------------------------------------------------------------------------
  // Left press: Select handle to drag
  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonPress = (e) => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable ||
      ignoreKey(e)
    ) {
      return macro.VOID;
    }
    if (
      model.activeState === model.widgetState.getMoveHandle() &&
      getNbHandles(model) === 1
    ) {
      publicAPI.placeHandle(handle1);
      model.activeState.setShape(handle2.getShape());
      handle2.setOrigin(...model.widgetState.getMoveHandle().getOrigin());
    } else if (
      model.activeState === model.widgetState.getMoveHandle() &&
      getNbHandles(model) === 2
    ) {
      publicAPI.placeHandle(handle2);
      publicAPI.updateHandleDirections();
      publicAPI.placeText();
      publicAPI.toggleMoveHandleVisibility(false);
    } else {
      updateCursor();
    }
    publicAPI.invokeStartInteractionEvent();
    return macro.EVENT_ABORT;
  };

  // --------------------------------------------------------------------------
  // Mouse move: Drag selected handle / Handle follow the mouse
  // --------------------------------------------------------------------------

  publicAPI.handleMouseMove = (callData) => {
    if (model.hasFocus && model.nbHandles === MAX_POINTS) {
      publicAPI.loseFocus();
      return macro.VOID;
    }
    if (
      model.pickable &&
      model.manipulator &&
      model.activeState &&
      model.activeState.getActive() &&
      !ignoreKey(callData)
    ) {
      const worldCoords = model.manipulator.handleEvent(
        callData,
        model.openGLRenderWindow
      );
      publicAPI.activateHandleVisibility();
      if (
        model.activeState === model.widgetState.getMoveHandle() ||
        model.isDragging
      ) {
        model.activeState.setOrigin(worldCoords);
        publicAPI.invokeInteractionEvent();
        if (model.isDragging) {
          updateTextPosition(model);
          publicAPI.placeText();
          if (isOrientable()) {
            publicAPI.updateHandleDirections();
          }
        } else if (
          model.nbHandles === 1 &&
          isHandleOrientable(handle1.getShape())
        ) {
          const direction = orientFirstHandleBeforeSecondHandlePlacement(
            callData
          );
          orientHandle(1, direction);
        }
        if (model.nbHandles === 1 && getNbHandles(model) === 2) {
          const direction = orientHandlesWithCompleteWidget(3);
          orientHandle(3, direction);
        }
        return macro.EVENT_ABORT;
      }
    }
    if (model.activeState && !model.activeState.getActive()) {
      publicAPI.deactivateHandleVisibility();
    }
    return macro.VOID;
  };

  // --------------------------------------------------------------------------
  // Left release: Finish drag / Create new handle
  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonRelease = () => {
    if (model.isDragging && model.pickable) {
      publicAPI.placeText();
      model.openGLRenderWindow.setCursor('pointer');
      model.widgetState.deactivate();
      model.interactor.cancelAnimation(publicAPI);
      publicAPI.invokeEndInteractionEvent();
    } else if (model.activeState !== model.widgetState.getMoveHandle()) {
      model.widgetState.deactivate();
    }
    if (
      (model.hasFocus && !model.activeState) ||
      (model.activeState && !model.activeState.getActive())
    ) {
      publicAPI.invokeEndInteractionEvent();
      model.widgetManager.enablePicking();
      model.interactor.render();
    }
    if (
      model.isDragging === false &&
      (!model.activeState || !model.activeState.getActive())
    ) {
      publicAPI.rotateHandlesToFaceCamera();
    }
    model.isDragging = false;
  };

  // --------------------------------------------------------------------------
  // Focus API - modeHandle follow mouse when widget has focus
  // --------------------------------------------------------------------------

  publicAPI.grabFocus = () => {
    if (!model.hasFocus && model.nbHandles < MAX_POINTS) {
      model.activeState = model.widgetState.getMoveHandle();
      model.activeState.setShape(handle1.getShape());
      model.activeState.setScale1(50);
      publicAPI.toggleMoveHandleVisibility(true);
      model.activeState.activate();
      model.interactor.requestAnimation(publicAPI);
      publicAPI.invokeStartInteractionEvent();
    }
    model.hasFocus = true;
  };

  // --------------------------------------------------------------------------

  publicAPI.loseFocus = () => {
    if (model.hasFocus) {
      model.interactor.cancelAnimation(publicAPI);
      publicAPI.invokeEndInteractionEvent();
    }
    model.widgetState.deactivate();
    model.widgetState.getMoveHandle().deactivate();
    model.activeState = null;
    model.hasFocus = false;
    model.widgetManager.enablePicking();
    model.interactor.render();
  };
}
