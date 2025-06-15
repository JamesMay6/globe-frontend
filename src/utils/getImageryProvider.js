// src/utils/getImageryProvider.js
import * as Cesium from "cesium";
import { MAPBOX_TOKEN } from "../config/config";

export async function getImageryProvider(key) {
  switch (key) {
    case 1: // Bing Aerial
      return await Cesium.IonImageryProvider.fromAssetId(2);
    case 2: // Sentinel-2
      return await Cesium.IonImageryProvider.fromAssetId(3954);
    case 3: // Mapbox Satellite
      return new Cesium.UrlTemplateImageryProvider({
        url: `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.jpg90?access_token=${MAPBOX_TOKEN}`,
        maximumLevel: 19,
        credit: '© Mapbox © OpenStreetMap',
      });
    default:
      throw new Error(`Unsupported IMAGERY_PROVIDER_KEY: ${key}`);
  }
}
