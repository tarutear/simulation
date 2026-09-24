// Camera presets. The character is 1.78 m tall, hips at y ≈ 1.04 m, facing +Z
// with its left side toward +X.
export const CAMERA_PRESETS = {
  threeQuarter: { label: '3/4', pos: [2.3, 1.35, 2.9], target: [0, 0.92, 0] },
  front: { label: '정면', pos: [0, 1.15, 3.7], target: [0, 0.95, 0] },
  back: { label: '후면', pos: [0, 1.15, -3.7], target: [0, 0.95, 0] },
  left: { label: '좌측면', pos: [3.5, 1.05, 0.15], target: [0, 0.9, 0.05] },
  right: { label: '우측면', pos: [-3.5, 1.05, 0.15], target: [0, 0.9, 0.05] },
  lowerLeg: { label: '좌측 하퇴 확대', pos: [1.25, 0.6, 1.1], target: [0.1, 0.3, 0.06] },
}

export const HUD_PRESETS = ['front', 'left', 'back', 'right', 'threeQuarter']
