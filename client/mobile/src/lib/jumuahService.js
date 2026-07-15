// client\mobile\src\lib\jumuahService.js

import { adaptJumuahSlots } from "./adapters";
import { getCurrentTimeHHmm } from "./dateUtils";
import { fetchPublicJumuah } from "./endpoints";
import { getUserLocation } from "./location";

export async function getUpcomingJumuahSlots(locationContext, limit = null) {


  const params = {
    currentTime: getCurrentTimeHHmm(),
    onlyUpcoming: true,
  };

  if (locationContext?.type === "gps") {
    params.latitude = locationContext.latitude;
    params.longitude = locationContext.longitude;
    params.radiusKm = 25;
  } else if (locationContext?.type === "manual") {
    params.cityId = locationContext.cityId;
     if (locationContext.areaId) {
      params.areaId = locationContext.areaId;
    }
  } else {
    // No location set yet — still call API, will return unfiltered or empty
  }

  if (limit) {
    params.limit = limit;
  }

  const res = await fetchPublicJumuah(params);
  const slots = adaptJumuahSlots(res.data || []);
  return limit ? slots.slice(0, limit) : slots;
}
// import { adaptJumuahSlots } from "./adapters";
// import { getCurrentTimeHHmm } from "./dateUtils";
// import { fetchPublicJumuah } from "./endpoints";
// import { getUserLocation } from "./location";

// export async function getUpcomingJumuahSlots() {
// const location = await getUserLocation();

//       const params = {
//         currentTime: getCurrentTimeHHmm(),
//         onlyUpcoming: true,
//       };
//       if (location) {
//         params.latitude = location.latitude;
//         params.longitude = location.longitude;
//         params.radiusKm = 25;
//       }

//       const res = await fetchPublicJumuah(params);
//       return  adaptJumuahSlots(res.data || []);
// }