interface Point {
  x: number
  y: number
}

function distancePointToLine(p: Point, start: Point, end: Point): number {
  const A = p.x - start.x
  const B = p.y - start.y
  const C = end.x - start.x
  const D = end.y - start.y

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) {
    param = dot / lenSq
  }

  let xx: number
  let yy: number

  if (param < 0) {
    xx = start.x
    yy = start.y
  } else if (param > 1) {
    xx = end.x
    yy = end.y
  } else {
    xx = start.x + param * C
    yy = start.y + param * D
  }

  const dx = p.x - xx
  const dy = p.y - yy
  return Math.sqrt(dx * dx + dy * dy)
}

export function douglasPeucker(
  points: [number, number][],
  tolerance: number,
  start?: number,
  end?: number
): [number, number][] {
  if (points.length <= 2) {
    return [...points]
  }

  const s = start ?? 0
  const e = end ?? points.length - 1

  if (e - s <= 1) {
    return [points[s], points[e]]
  }

  let maxDist = 0
  let index = -1

  const startPoint: Point = { x: points[s][0], y: points[s][1] }
  const endPoint: Point = { x: points[e][0], y: points[e][1] }

  for (let i = s + 1; i < e; i++) {
    const currentPoint: Point = { x: points[i][0], y: points[i][1] }
    const dist = distancePointToLine(currentPoint, startPoint, endPoint)
    if (dist > maxDist) {
      maxDist = dist
      index = i
    }
  }

  if (maxDist > tolerance && index !== -1) {
    const left = douglasPeucker(points, tolerance, s, index)
    const right = douglasPeucker(points, tolerance, index, e)
    return [...left.slice(0, -1), ...right]
  } else {
    return [points[s], points[e]]
  }
}

export function simplifyTrack(points: [number, number][], tolerance: number): [number, number][] {
  if (points.length < 6) {
    return [...points]
  }
  const simplified = douglasPeucker(points, tolerance)
  if (simplified.length < 2) {
    return points.slice(0, 2)
  }
  return simplified
}
