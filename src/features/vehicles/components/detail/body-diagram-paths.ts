export type ViewDirection = 'front' | 'rear' | 'left' | 'right' | 'top'

/** Maps panel key to its SVG path 'd' attribute for each view direction */
export type PanelPath = {
  panelKey: string
  d: string // SVG path data
}

/**
 * SVG path data for a simplified sedan silhouette.
 * Coordinate system: viewBox="0 0 400 300"
 * Schematic style (insurance-diagram-like), not photorealistic.
 */
export const VIEW_PATHS: Record<ViewDirection, PanelPath[]> = {
  // Top-down view: car facing up (front at top)
  top: [
    // Hood (front center)
    { panelKey: 'hood', d: 'M150,20 L250,20 Q260,20 260,30 L260,80 L140,80 L140,30 Q140,20 150,20 Z' },
    // Front bumper (very top strip)
    { panelKey: 'frontBumper', d: 'M140,8 L260,8 Q268,8 268,16 L268,24 L132,24 L132,16 Q132,8 140,8 Z' },
    // Front left fender
    { panelKey: 'frontLeftFender', d: 'M100,24 L138,24 L138,100 L100,100 Q90,100 90,90 L90,34 Q90,24 100,24 Z' },
    // Front right fender
    { panelKey: 'frontRightFender', d: 'M262,24 L300,24 Q310,24 310,34 L310,90 Q310,100 300,100 L262,100 L262,24 Z' },
    // Roof (center large panel)
    { panelKey: 'roof', d: 'M120,102 L280,102 L280,198 L120,198 Z' },
    // Front left door
    { panelKey: 'frontLeftDoor', d: 'M90,102 L118,102 L118,150 L90,150 Z' },
    // Front right door
    { panelKey: 'frontRightDoor', d: 'M282,102 L310,102 L310,150 L282,150 Z' },
    // Rear left door
    { panelKey: 'rearLeftDoor', d: 'M90,152 L118,152 L118,198 L90,198 Z' },
    // Rear right door
    { panelKey: 'rearRightDoor', d: 'M282,152 L310,152 L310,198 L282,198 Z' },
    // Rear left fender
    { panelKey: 'rearLeftFender', d: 'M90,200 Q90,200 90,210 L90,266 Q90,276 100,276 L138,276 L138,200 L90,200 Z' },
    // Rear right fender
    { panelKey: 'rearRightFender', d: 'M262,200 L310,200 L310,266 Q310,276 300,276 L262,276 L262,200 Z' },
    // Trunk (rear center)
    { panelKey: 'trunk', d: 'M140,200 L260,200 L260,270 L140,270 Z' },
    // Rear bumper (very bottom strip)
    { panelKey: 'rearBumper', d: 'M132,272 L268,272 L268,284 Q268,292 260,292 L140,292 Q132,292 132,284 L132,272 Z' },
  ],

  // Front view: facing the viewer
  front: [
    // Hood (center top)
    { panelKey: 'hood', d: 'M100,60 L300,60 L300,140 L100,140 Z' },
    // Front bumper (bottom)
    { panelKey: 'frontBumper', d: 'M80,142 L320,142 Q330,142 330,152 L330,200 Q330,210 320,210 L80,210 Q70,210 70,200 L70,152 Q70,142 80,142 Z' },
    // Front left fender (left side)
    { panelKey: 'frontLeftFender', d: 'M50,60 L98,60 L98,140 L50,140 Q40,140 40,130 L40,70 Q40,60 50,60 Z' },
    // Front right fender (right side)
    { panelKey: 'frontRightFender', d: 'M302,60 L350,60 Q360,60 360,70 L360,130 Q360,140 350,140 L302,140 L302,60 Z' },
  ],

  // Rear view: facing away from viewer
  rear: [
    // Trunk (center top)
    { panelKey: 'trunk', d: 'M100,60 L300,60 L300,140 L100,140 Z' },
    // Rear bumper (bottom)
    { panelKey: 'rearBumper', d: 'M80,142 L320,142 Q330,142 330,152 L330,200 Q330,210 320,210 L80,210 Q70,210 70,200 L70,152 Q70,142 80,142 Z' },
    // Rear left fender (left side -- mirrored because rear view)
    { panelKey: 'rearLeftFender', d: 'M302,60 L350,60 Q360,60 360,70 L360,130 Q360,140 350,140 L302,140 L302,60 Z' },
    // Rear right fender (right side)
    { panelKey: 'rearRightFender', d: 'M50,60 L98,60 L98,140 L50,140 Q40,140 40,130 L40,70 Q40,60 50,60 Z' },
  ],

  // Left side view: car facing left
  left: [
    // Front left fender (front)
    { panelKey: 'frontLeftFender', d: 'M30,120 L100,100 L100,200 L30,200 Q20,200 20,190 L20,130 Q20,120 30,120 Z' },
    // Front left door
    { panelKey: 'frontLeftDoor', d: 'M102,90 L190,70 L190,200 L102,200 Z' },
    // Rear left door
    { panelKey: 'rearLeftDoor', d: 'M192,70 L280,90 L280,200 L192,200 Z' },
    // Rear left fender (rear)
    { panelKey: 'rearLeftFender', d: 'M282,100 L370,120 Q380,120 380,130 L380,190 Q380,200 370,200 L282,200 Z' },
    // Left rocker panel (bottom strip)
    { panelKey: 'leftRocker', d: 'M30,202 L370,202 L370,230 Q370,240 360,240 L40,240 Q30,240 30,230 Z' },
  ],

  // Right side view: car facing right
  right: [
    // Front right fender (front -- right side, car faces right)
    { panelKey: 'frontRightFender', d: 'M282,100 L370,120 Q380,120 380,130 L380,190 Q380,200 370,200 L282,200 Z' },
    // Front right door
    { panelKey: 'frontRightDoor', d: 'M192,70 L280,90 L280,200 L192,200 Z' },
    // Rear right door
    { panelKey: 'rearRightDoor', d: 'M102,90 L190,70 L190,200 L102,200 Z' },
    // Rear right fender (rear)
    { panelKey: 'rearRightFender', d: 'M30,120 L100,100 L100,200 L30,200 Q20,200 20,190 L20,130 Q20,120 30,120 Z' },
    // Right rocker panel (bottom strip)
    { panelKey: 'rightRocker', d: 'M30,202 L370,202 L370,230 Q370,240 360,240 L40,240 Q30,240 30,230 Z' },
  ],
}

/** Korean labels for view direction selector */
export const VIEW_LABELS: Record<ViewDirection, string> = {
  front: '전면',
  rear: '후면',
  left: '좌측',
  right: '우측',
  top: '상면',
}
