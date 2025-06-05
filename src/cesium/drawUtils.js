import * as Cesium from "cesium";

export const drawDeletedCell = (viewer, lat, lon) => {
  const cellWidth = 0.001;
  const padding = 0.00005;
  const rect = Cesium.Rectangle.fromDegrees(
    lon - padding,
    lat - padding,
    lon + cellWidth + padding,
    lat + cellWidth + padding
  );
  viewer.entities.add({
    rectangle: {
      coordinates: rect,
      material: Cesium.Color.BLACK.withAlpha(1.0),
      classificationType: Cesium.ClassificationType.BOTH,
    },
  });
};