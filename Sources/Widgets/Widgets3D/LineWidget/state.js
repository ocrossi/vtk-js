import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

const builder = vtkStateBuilder.createBuilder();

const linePosState = vtkStateBuilder
  .createBuilder()
  .addField({
    name: 'posOnLine',
    initialValue: 0,
  })
  .build();

builder.addStateFromInstance({
  name: 'positionOnLine',
  instance: linePosState,
});

builder
  .addStateFromMixin({
    labels: ['moveHandle'],
    mixins: ['origin', 'color', 'scale1', 'visible', 'shape'],
    name: 'moveHandle',
    initialValues: {
      scale1: 0,
      visible: true,
      origin: [],
      shape: 'sphere',
    },
  })
  .addStateFromMixin({
    labels: ['handle1'],
    mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator', 'shape'],
    name: 'handle1',
    initialValues: {
      scale1: 50,
      visible: true,
      origin: [],
      shape: '6pointsArrowHead',
    },
  })
  .addStateFromMixin({
    labels: ['handle2'],
    mixins: ['origin', 'color', 'scale1', 'visible', 'manipulator', 'shape'],
    name: 'handle2',
    initialValues: {
      scale1: 50,
      visible: true,
      origin: [],
      shape: 'sphere',
    },
  })
  .addStateFromMixin({
    labels: ['SVGtext'],
    mixins: ['origin', 'color', 'text', 'visible'],
    name: 'text',
    initialValues: {
      /* text is empty to set a text filed in the SVGLayer and to avoid
       * displaying text before positioning the handles */
      text: '',
      visible: false,
      origin: [0, 0, 0],
    },
  })
  .addField({ name: 'isDragging', initialValue: false })
  .addField({ name: 'nbHandles', initialValue: 0 })
  .addField({ name: 'handle1FaceCamera', initialValue: true })
  .addField({ name: 'handle2FaceCamera', initialValue: true })
  .build();

export default () => builder.build();
