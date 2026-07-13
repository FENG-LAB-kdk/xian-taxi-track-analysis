export interface TrackPoint {
  lng: number
  lat: number
  timestamp: string
  speed?: number
}

export interface VehicleTrack {
  plateNumber: string
  points: TrackPoint[]
}

const baseLng = 108.94
const baseLat = 34.27

function generateTimeSeries(startHour: number, count: number): string[] {
  const times: string[] = []
  const start = new Date('2026-07-10T00:00:00')
  start.setHours(startHour)
  
  for (let i = 0; i < count; i++) {
    const time = new Date(start.getTime() + i * 300000)
    times.push(time.toISOString())
  }
  return times
}

function generateTrackPoints(
  baseLngOffset: number,
  baseLatOffset: number,
  variance: number,
  count: number
): TrackPoint[] {
  const points: TrackPoint[] = []
  const times = generateTimeSeries(Math.floor(Math.random() * 24), count)
  
  let currentLng = baseLng + baseLngOffset
  let currentLat = baseLat + baseLatOffset
  
  for (let i = 0; i < count; i++) {
    currentLng += (Math.random() - 0.5) * variance
    currentLat += (Math.random() - 0.5) * variance
    
    points.push({
      lng: parseFloat(currentLng.toFixed(6)),
      lat: parseFloat(currentLat.toFixed(6)),
      timestamp: times[i],
      speed: parseFloat((Math.random() * 60 + 20).toFixed(1))
    })
  }
  return points
}

export const vehicleTracks: VehicleTrack[] = [
  {
    plateNumber: '陕A0007',
    points: generateTrackPoints(0.02, 0.01, 0.008, 35)
  },
  {
    plateNumber: '陕C12345',
    points: generateTrackPoints(-0.03, 0.02, 0.01, 28)
  },
  {
    plateNumber: '陕B56789',
    points: generateTrackPoints(0.01, -0.02, 0.009, 32)
  },
  {
    plateNumber: '陕A11111',
    points: generateTrackPoints(0.05, 0.03, 0.012, 40)
  },
  {
    plateNumber: '陕A22222',
    points: generateTrackPoints(-0.02, -0.01, 0.007, 30)
  },
  {
    plateNumber: '陕B11111',
    points: generateTrackPoints(0.04, -0.03, 0.011, 38)
  },
  {
    plateNumber: '陕B22222',
    points: generateTrackPoints(-0.04, 0.01, 0.008, 33)
  },
  {
    plateNumber: '陕C22222',
    points: generateTrackPoints(0.03, 0.02, 0.009, 36)
  },
  {
    plateNumber: '陕D11111',
    points: generateTrackPoints(-0.01, -0.03, 0.01, 31)
  },
  {
    plateNumber: '陕D22222',
    points: generateTrackPoints(0.06, -0.01, 0.013, 42)
  }
]

export const allPlateNumbers = vehicleTracks.map(v => v.plateNumber)

export function getTrackByPlate(plateNumber: string): TrackPoint[] {
  const vehicle = vehicleTracks.find(v => v.plateNumber === plateNumber)
  return vehicle ? vehicle.points : []
}

export function filterTrackByTime(
  points: TrackPoint[],
  startTime: string,
  endTime: string
): TrackPoint[] {
  return points.filter(p => p.timestamp >= startTime && p.timestamp <= endTime)
}

export function filterTrackBySpatial(
  points: TrackPoint[],
  bbox: [number, number, number, number]
): TrackPoint[] {
  const [minLng, minLat, maxLng, maxLat] = bbox
  return points.filter(
    p => p.lng >= minLng && p.lng <= maxLng && p.lat >= minLat && p.lat <= maxLat
  )
}
