/**
 * Player Character Sprite Patterns
 * 8×8 tile patterns for the main character
 */

/**
 * Player Head - Facing Right
 * Tile Index: 0
 */
export const PLAYER_HEAD_RIGHT = [
  '00011100',
  '00122210',
  '01233321',
  '12333321',
  '12333321',
  '01233321',
  '00122210',
  '00011100'
]

/**
 * Player Head - Facing Left
 * Tile Index: 1
 */
export const PLAYER_HEAD_LEFT = [
  '00111000',
  '01222100',
  '12333210',
  '12333321',
  '12333321',
  '12333210',
  '01222100',
  '00111000'
]

/**
 * Player Body Top - Standing
 * Tile Index: 2
 */
export const PLAYER_BODY_TOP = [
  '00111100',
  '01233210',
  '12333321',
  '12333321',
  '12333321',
  '12333321',
  '01233210',
  '00111100'
]

/**
 * Player Body Bottom - Standing
 * Tile Index: 3
 */
export const PLAYER_BODY_BOTTOM = [
  '00111100',
  '01222210',
  '12222221',
  '12222221',
  '01222210',
  '00111100',
  '00100100',
  '00100100'
]

/**
 * Player Body Bottom - Walking Frame 1
 * Tile Index: 4
 */
export const PLAYER_WALK_1 = [
  '00111100',
  '01222210',
  '12222221',
  '12222221',
  '01222210',
  '00111100',
  '01000000',
  '01000010'
]

/**
 * Player Body Bottom - Walking Frame 2
 * Tile Index: 5
 */
export const PLAYER_WALK_2 = [
  '00111100',
  '01222210',
  '12222221',
  '12222221',
  '01222210',
  '00111100',
  '00000100',
  '01000100'
]

/**
 * Player Arm - Extended (attacking/interacting)
 * Tile Index: 6
 */
export const PLAYER_ARM_EXTENDED = [
  '00000001',
  '00000011',
  '00000112',
  '00001122',
  '00011222',
  '00112220',
  '01122200',
  '00000000'
]

/**
 * Complete player meta-sprite definitions
 */
export const PLAYER_STANDING_RIGHT = {
  width: 2,
  height: 2,
  frames: [{
    sprites: [
      { offsetX: 0, offsetY: 0, tileIndex: 0 },  // Head (right)
      { offsetX: 8, offsetY: 0, tileIndex: 2 },  // Body top
      { offsetX: 0, offsetY: 8, tileIndex: 2 },  // Body mid
      { offsetX: 8, offsetY: 8, tileIndex: 3 }   // Body bottom (standing)
    ]
  }]
}

export const PLAYER_WALKING_RIGHT = {
  width: 2,
  height: 2,
  frames: [
    // Frame 1
    {
      sprites: [
        { offsetX: 0, offsetY: 0, tileIndex: 0 },
        { offsetX: 8, offsetY: 0, tileIndex: 2 },
        { offsetX: 0, offsetY: 8, tileIndex: 2 },
        { offsetX: 8, offsetY: 8, tileIndex: 4 }  // Walk frame 1
      ]
    },
    // Frame 2
    {
      sprites: [
        { offsetX: 0, offsetY: 0, tileIndex: 0 },
        { offsetX: 8, offsetY: 0, tileIndex: 2 },
        { offsetX: 0, offsetY: 8, tileIndex: 2 },
        { offsetX: 8, offsetY: 8, tileIndex: 5 }  // Walk frame 2
      ]
    }
  ]
}

export const PLAYER_STANDING_LEFT = {
  width: 2,
  height: 2,
  frames: [{
    sprites: [
      { offsetX: 0, offsetY: 0, tileIndex: 1 },  // Head (left)
      { offsetX: 8, offsetY: 0, tileIndex: 2 },
      { offsetX: 0, offsetY: 8, tileIndex: 2 },
      { offsetX: 8, offsetY: 8, tileIndex: 3 }
    ]
  }]
}

export const PLAYER_WALKING_LEFT = {
  width: 2,
  height: 2,
  frames: [
    {
      sprites: [
        { offsetX: 0, offsetY: 0, tileIndex: 1 },
        { offsetX: 8, offsetY: 0, tileIndex: 2 },
        { offsetX: 0, offsetY: 8, tileIndex: 2 },
        { offsetX: 8, offsetY: 8, tileIndex: 4 }
      ]
    },
    {
      sprites: [
        { offsetX: 0, offsetY: 0, tileIndex: 1 },
        { offsetX: 8, offsetY: 0, tileIndex: 2 },
        { offsetX: 0, offsetY: 8, tileIndex: 2 },
        { offsetX: 8, offsetY: 8, tileIndex: 5 }
      ]
    }
  ]
}

/**
 * All player sprite patterns in order
 */
export const ALL_PLAYER_PATTERNS = [
  PLAYER_HEAD_RIGHT,      // 0
  PLAYER_HEAD_LEFT,       // 1
  PLAYER_BODY_TOP,        // 2
  PLAYER_BODY_BOTTOM,     // 3
  PLAYER_WALK_1,          // 4
  PLAYER_WALK_2,          // 5
  PLAYER_ARM_EXTENDED     // 6
]
